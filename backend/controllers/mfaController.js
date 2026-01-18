const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');

exports.enableMFA = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findByEmail(email);
    const secret = speakeasy.generateSecret({ name: `CyberLab (${email})` });
    await User.updateMfaSecret(user.id, secret.base32);
    const qrImage = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ success: true, secret: secret.base32, qrCode: qrImage });
  } catch (err) { res.status(500).json({ message: 'Failed' }); }
};

exports.verifyMfa = async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await User.findByEmail(email);
    if (!user.mfa_secret) return res.status(400).json({ message: 'MFA not active' });

    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: code
    });

    if (verified) res.json({ success: true, user });
    else res.status(400).json({ message: 'Invalid code' });
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};

exports.disableMFA = async (req, res) => {
  try {
    const user = await User.findByEmail(req.body.email);
    await User.updateMfaSecret(user.id, null);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};