const pool = require('../config/db');

/**
 * Security Middleware: Session Revocation Check
 * Validates incoming credentials against the token_blacklist to prevent 
 * session replay attacks after a 'Terminate Session' command.
 */
const checkBlacklist = async (req, res, next) => {
  try {
    // 1. Extract credentials from Cookie (Level 1) or Auth Header (Level 2)
    const token = req.cookies.session_id || req.headers.authorization?.split(' ')[1];

    if (!token) {
      // If no token exists, we proceed to allow the main auth middleware 
      // to handle the 'Unauthorized' response.
      return next();
    }

    // 2. Query the database for revoked status
    const result = await pool.query(
      'SELECT id FROM token_blacklist WHERE token = $1', 
      [token]
    );

    // 3. Deny access if the session identifier is blacklisted
    if (result.rows.length > 0) {
      console.warn(`[!] SECURITY ALERT: Revoked session access attempt.`);
      
      // Instruct client to clear local state by returning 401
      return res.status(401).json({ 
        message: 'This session has been terminated for security. Please re-authenticate.' 
  });
}

    // 4. Session is valid; continue to the protected controller logic
    next();
  } catch (err) {
    console.error('CRITICAL: Blacklist check failure:', err.message);
    res.status(500).json({ message: 'Internal security synchronization error' });
  }
};

module.exports = checkBlacklist;