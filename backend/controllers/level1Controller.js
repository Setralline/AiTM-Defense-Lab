const bcrypt = require('bcryptjs'); // For password hashing
const pool = require('../config/db');
const { generateToken } = require('../utils/helpers');

/**
 * Level 1 Login: Legacy/Cookie Approach
 * Sets an HttpOnly cookie upon successful authentication.
 */
exports.loginLevel1 = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    // 1. Check if user exists
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      // Use generic error message to prevent User Enumeration
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 2. Validate Password (Hash Comparison)
    // NOTE: Ensure your DB has hashed passwords. For testing "password123", hash it first.
    // If using plain text for lab demo only, use: if (user.password !== password)
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Convert rememberMe string/boolean to boolean
    const isRemembered = rememberMe === 'true' || rememberMe === true;

    // 4. Generate Token
    const token = generateToken(user, isRemembered);

    // 5. Check if MFA is enabled
    if (user.mfa_secret) {
      return res.json({ 
        mfa_required: true, 
        temp_token: token // In a real app, use a short-lived temporary token here
      });
    }

    // 6. Set Secure Cookie
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    const oneHour = 60 * 60 * 1000;
    
    res.cookie('session_id', token, {
      httpOnly: true, // Prevent XSS theft
      secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in prod
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // CSRF protection
      maxAge: isRemembered ? oneYear : oneHour
    });

    // 7. Respond with User Data (No sensitive info)
    res.json({ 
      success: true, 
      user: { id: user.id, name: user.name, email: user.email, mfa_secret: user.mfa_secret } 
    });

  } catch (err) {
    console.error('Level 1 Login Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};