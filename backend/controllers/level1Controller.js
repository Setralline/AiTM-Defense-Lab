const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generateToken } = require('../utils/helpers');

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

    // 4. Generate authentication token
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
    
    // 7. Set secure HttpOnly cookie
    res.cookie('session_id', token, {
      httpOnly: true, // Mitigates XSS by hiding cookie from JavaScript
      secure: process.env.NODE_ENV === 'production', 
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: isRemembered ? oneYear : oneHour,
      path: '/' // Must match the logout path for successful deletion
    });

    // 8. Send success response with non-sensitive user profile
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
 * Terminate Session (Logout)
 * Clears the session_id cookie from the browser.
 */
exports.logout = async (req, res) => {
  try {
    // Instructs browser to delete the cookie by setting an expired date
    res.clearCookie('session_id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/' // Must match the path used during cookie creation
    });

    res.json({ success: true, message: 'Session terminated and cookie cleared' });
  } catch (err) {
    console.error('Logout Error:', err);
    res.status(500).json({ message: 'Failed to terminate session' });
  }
};