const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generateToken, revokeSession } = require('../utils/helpers');

/**
 * Level 2 Login: Modern/Token Approach
 * Authenticates user and returns a JWT for client-side storage (LocalStorage).
 */
exports.loginLevel2 = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    // 1. Verify user existence
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // 2. Validate password via cryptographic hash comparison
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // 3. Generate token with conditional expiration (stateless JWT)
    const isRemembered = rememberMe === true;
    const token = generateToken(user, isRemembered);

    // 4. Handle MFA if enabled for the user
    if (user.mfa_secret) {
      return res.json({ mfa_required: true, temp_token: token });
    }

    // 5. Success response: The frontend must handle storage of the returned token
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

/**
 * Level 2 Termination: Revokes the Stateless JWT
 * Calls the centralized revocation helper to blacklist the token signature.
 */
exports.logoutLevel2 = async (req, res) => {
  try {
    // 1. Extract JWT from Authorization header (Bearer <token>)
    const token = req.headers.authorization?.split(' ')[1];

    // 2. Use centralized security helper to blacklist the token in the DB
    // This transforms the stateless JWT into a revocable asset, neutralizing replay attacks.
    const revoked = await revokeSession(token);

    if (revoked) {
      res.json({ success: true, message: 'Level 2 Session terminated and JWT revoked on server.' });
    } else {
      res.status(400).json({ success: false, message: 'No valid token provided for revocation.' });
    }

  } catch (err) {
    console.error('Logout Level 2 Error:', err);
    res.status(500).json({ message: 'Failed to revoke token' });
  }
};