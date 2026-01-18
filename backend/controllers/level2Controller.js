const { generateToken, authenticateUser, revokeSession } = require('../utils/helpers');

/**
 * LEVEL 2: TOKEN AUTH (Stateless JWT)
 */
exports.loginLevel2 = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    // 1. Centralized Auth Check
    const user = await authenticateUser(email, password);

    // 2. Generate Token
    const isRemembered = rememberMe === true;
    const token = generateToken(user, isRemembered);

    // 3. MFA Check
    if (user.mfa_secret) {
      return res.json({ mfa_required: true, temp_token: token });
    }

    // 4. Return Token Payload
    res.json({
      success: true,
      token,
      isRemembered,
      user: { id: user.id, name: user.name, email: user.email, mfa_secret: user.mfa_secret }
    });

  } catch (err) {
    if (err.message === 'Invalid credentials') return res.status(401).json({ message: err.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.logoutLevel2 = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const revoked = await revokeSession(token);

    if (revoked) res.json({ success: true, message: 'Token revoked' });
    else res.status(400).json({ success: false, message: 'Invalid token' });

  } catch (err) {
    res.status(500).json({ message: 'Logout error' });
  }
};