const { generateToken, authenticateUser, revokeSession } = require('../utils/helpers');

/**
 * LEVEL 1: COOKIE AUTH
 */
exports.loginLevel1 = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    // 1. Centralized Auth Check
    const user = await authenticateUser(email, password);

    // 2. Generate Token
    const isRemembered = rememberMe === 'true' || rememberMe === true;
    const token = generateToken(user, isRemembered);

    // 3. MFA Check
    if (user.mfa_secret) {
      return res.json({ mfa_required: true, temp_token: token });
    }

    // 4. Set HttpOnly Cookie
    const maxAge = isRemembered ? 365 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000;

    res.cookie('session_id', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge,
      path: '/'
    });

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, mfa_secret: user.mfa_secret }
    });

  } catch (err) {
    if (err.message === 'Invalid credentials') return res.status(401).json({ message: err.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.cookies.session_id || req.headers.authorization?.split(' ')[1];
    await revokeSession(token);

    res.clearCookie('session_id', { path: '/' });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ message: 'Logout failed' });
  }
};