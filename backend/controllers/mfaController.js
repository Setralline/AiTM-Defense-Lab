const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const { generateToken } = require('../utils/helpers');

exports.enableMFA = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findByEmail(email);
    const secret = speakeasy.generateSecret({ name: `CyberLab (${email})` });

    // Save secret to DB
    await User.updateMfaSecret(user.id, secret.base32);

    // Generate QR
    const qrImage = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ success: true, secret: secret.base32, qrCode: qrImage });
  } catch (err) { res.status(500).json({ message: 'MFA Setup Failed' }); }
};

exports.verifyMfa = async (req, res) => {
  // [FIX] Extract isCookieAuth and rememberMe
  const { email, code, isCookieAuth, rememberMe } = req.body;
  
  try {
    const user = await User.findByEmail(email);
    if (!user.mfa_secret) return res.status(400).json({ message: 'MFA not active' });

    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: code
    });

    if (verified) {
      // Generate token (respect rememberMe for internal expiry)
      const token = generateToken(user, rememberMe);

      // [FIX] Branch Logic: Cookie vs Token
      if (isCookieAuth) {
        // ------------------------------------------------
        // OPTION A: LEVEL 1 (Cookie Mode)
        // ------------------------------------------------
        // Set HttpOnly Cookie (Same logic as level1Controller)
        const maxAge = rememberMe ? 365 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
        
        res.cookie('session_id', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
          maxAge,
          path: '/'
        });

        // IMPORTANT: Do NOT return 'token' property. 
        // This prevents the frontend authService from saving it to localStorage.
        res.json({ success: true, user });

      } else {
        // ------------------------------------------------
        // OPTION B: LEVEL 2-5 (Token Mode)
        // ------------------------------------------------
        // Return token in body for localStorage/sessionStorage
        res.json({ success: true, token, user });
      }

    } else {
      res.status(400).json({ message: 'Invalid 2FA Code' });
    }
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Verification Error' }); 
  }
};

exports.disableMFA = async (req, res) => {
  try {
    const user = await User.findByEmail(req.body.email);
    await User.updateMfaSecret(user.id, null);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: 'Error disabling MFA' }); }
};