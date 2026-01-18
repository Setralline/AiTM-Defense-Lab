const Blacklist = require('../models/Blacklist');
/**
 * Security Middleware: Session Revocation Check
 * Uses the Blacklist model to validate tokens.
 * Prevents access if the token (JWT/SessionID) has been explicitly revoked.
 */
const checkBlacklist = async (req, res, next) => {
  try {
    // 1. Extract Token from Cookie or Header
    const token = req.cookies.session_id || req.headers.authorization?.split(' ')[1];

    // If no token exists, pass to the next auth middleware to handle (e.g., return 401)
    if (!token) {
      return next();
    }

    // 2. Check Blacklist via Model
    const isRevoked = await Blacklist.isRevoked(token);

    if (isRevoked) {
      console.warn(`[Security] Blocked access with revoked token.`);

      // Clear cookie if present
      res.clearCookie('session_id', { path: '/' });

      return res.status(401).json({
        message: 'Session terminated. Please login again.'
      });
    }

    // 3. Token is clean, proceed
    next();
  } catch (err) {
    console.error('CRITICAL: Blacklist Check Error:', err.message);
    res.status(500).json({ message: 'Security check failed' });
  }
};

module.exports = checkBlacklist;