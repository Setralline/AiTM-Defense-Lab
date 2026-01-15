const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Generates a JSON Web Token (JWT) for a user.
 * @param {Object} user - The user object from the database.
 * @param {boolean} rememberMe - Determines the expiration time.
 * @returns {string} Signed JWT.
 */
const generateToken = (user, rememberMe) => {
  // Logic: "Remember Me" grants a long-lived token (365 days), otherwise standard session (1 hour)
  const expiresIn = rememberMe ? '365d' : '1h'; 
  
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Revokes a session token by adding its unique signature to the database blacklist.
 * This is the primary defense mechanism against stolen/intercepted JWTs and Cookies.
 * It transforms stateless authentication into a revocable hybrid system.
 * * @param {string} token - The JWT or Session ID to be invalidated.
 * @returns {Promise<boolean>} - Returns true if successfully blacklisted.
 */
const revokeSession = async (token) => {
  if (!token) return false;
  
  try {
    // We store the revoked token in the 'token_blacklist' table.
    // The 'expires_at' ensures the database doesn't grow infinitely by only 
    // keeping the token until its natural expiration window (e.g., 24h).
    await pool.query(
      'INSERT INTO token_blacklist (token, expires_at) VALUES ($1, NOW() + INTERVAL \'24 hours\')',
      [token]
    );
    
    console.log(`[SECURITY] Session identifier successfully added to blacklist.`);
    return true;
  } catch (err) {
    // Unique constraint violation (code 23505) means the token is already blacklisted
    if (err.code === '23505') {
      return true; 
    }
    console.error('CRITICAL: Failed to blacklist session token:', err.message);
    return false;
  }
};

module.exports = { 
  generateToken,
  revokeSession 
};