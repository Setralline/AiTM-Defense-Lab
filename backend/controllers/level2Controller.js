const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generateToken } = require('../utils/helpers');

/**
 * Level 2 Login: Modern/Token Approach
 * Returns a JWT in the response body. Frontend handles storage.
 */
exports.loginLevel2 = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isRemembered = rememberMe === true;
    const token = generateToken(user, isRemembered);

    if (user.mfa_secret) {
      return res.json({ mfa_required: true, temp_token: token });
    }

    res.json({ 
      success: true, 
      token: token,
      isRemembered: isRemembered,
      user: { id: user.id, name: user.name, email: user.email, mfa_secret: user.mfa_secret } 
    });

  } catch (err) {
    console.error('Level 2 Login Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};