const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const pool = require('../config/db');

/**
 * Generates a new 2FA Secret and QR Code for the user.
 */
exports.enableMFA = async (req, res) => {
  const { email } = req.body;
  
  try {
    const secret = speakeasy.generateSecret({
      name: `CyberLab (${email})`
    });

    // Save secret temporarily or permanently to DB
    const result = await pool.query(
      'UPDATE users SET mfa_secret = $1 WHERE email = $2 RETURNING email', 
      [secret.base32, email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) return res.status(500).json({ message: 'QR Generation failed' });
      res.json({ success: true, secret: secret.base32, qrCode: data_url });
    });

  } catch (err) {
    console.error('MFA Enable Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Verifies the TOTP code provided by the user.
 */
exports.verifyMfa = async (req, res) => {
  const { email, code } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !user.mfa_secret) {
      return res.status(400).json({ message: 'MFA is not enabled for this user' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: code,
      window: 1 // Allow 30-second clock drift
    });

    if (verified) {
      res.json({ success: true, message: 'Verified', user });
    } else {
      res.status(401).json({ success: false, message: 'Invalid 2FA Code' });
    }

  } catch (err) {
    console.error('MFA Verify Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Disables MFA for the user.
 */
exports.disableMFA = async (req, res) => {
  const { email } = req.body;
  try {
    await pool.query('UPDATE users SET mfa_secret = NULL WHERE email = $1', [email]);
    res.json({ success: true, message: 'MFA Disabled' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};