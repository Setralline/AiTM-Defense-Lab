const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generateToken, revokeSession } = require('../utils/helpers');

/**
 * Level 1 Login: Legacy/Cookie Approach
 * Authenticates user and sets an HttpOnly session cookie.
 */
exports.loginLevel1 = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    // 1. Verify user existence
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 2. Validate password via hash comparison
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Normalize rememberMe value to boolean
    const isRemembered = rememberMe === 'true' || rememberMe === true;

    // 4. Generate authentication token using central helper
    const token = generateToken(user, isRemembered);

    // 5. Handle Multi-Factor Authentication (MFA) if enabled
    if (user.mfa_secret) {
      return res.json({ 
        mfa_required: true, 
        temp_token: token 
      });
    }

    // 6. Define cookie duration (1 year vs 1 hour)
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    const oneHour = 60 * 60 * 1000;
    
    // 7. Set secure HttpOnly cookie to mitigate XSS
    res.cookie('session_id', token, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: isRemembered ? oneYear : oneHour,
      path: '/' 
    });

    // 8. Send success response with profile data
    res.json({ 
      success: true, 
      user: { id: user.id, name: user.name, email: user.email, mfa_secret: user.mfa_secret } 
    });

  } catch (err) {
    console.error('Level 1 Login Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Universal Logout (Covers Level 1 & Level 2)
 * Utilizes the centralized revokeSession helper to blacklist tokens.
 */
exports.logout = async (req, res) => {
  try {
    // 1. Capture token from either Cookie or Authorization Header
    const token = req.cookies.session_id || req.headers.authorization?.split(' ')[1];

    // 2. Use the centralized helper to revoke the session in DB
    // This protects against Replay Attacks by ensuring the token cannot be reused.
    await revokeSession(token);

    // 3. Instructs browser to delete the Level 1 cookie
    res.clearCookie('session_id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/' 
    });

    res.json({ 
      success: true, 
      message: 'Session globally revoked and local state cleared.' 
    });
  } catch (err) {
    console.error('Logout Error:', err);
    res.status(500).json({ message: 'Failed to fully terminate session' });
  }
};