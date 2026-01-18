const fs = require('fs');
const path = require('path');
const Blacklist = require('../models/Blacklist');

/**
 * ------------------------------------------------------------------
 * SECURITY MIDDLEWARE: SESSION REVOCATION CHECK & AUDIT
 * ------------------------------------------------------------------
 * 1. Validates tokens against the Blacklist database.
 * 2. Blocks access if the token is revoked.
 * 3. LOGGING: Generates a forensic report of the blocked attempt 
 * (IP, User-Agent, Timestamp) for security analysis.
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
      // --- FORENSIC LOGGING START ---
      const timestamp = new Date().toISOString();
      
      // Get IP Address (Handle proxies/load balancers)
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
      
      // Get Country (Simulated detection via common headers like Cloudflare)
      // In a real prod env behind WAF, this header contains the 2-letter country code.
      const country = req.headers['cf-ipcountry'] || req.headers['x-country-code'] || 'Unknown/Local';
      
      const userAgent = req.get('User-Agent') || 'Unknown';
      const method = req.method;
      const url = req.originalUrl;

      console.warn(`[Security] 🚨 BLOCKED: Access attempt with revoked token from IP: ${ip}`);

      // Prepare the Report Entry
      const reportEntry = `
[${timestamp}] SECURITY INCIDENT: REVOKED TOKEN USAGE
-----------------------------------------------------
IP Address  : ${ip}
Country     : ${country}
User-Agent  : ${userAgent}
Request     : ${method} ${url}
Token       : ${token}
Action      : BLOCKED & COOKIE CLEARED
-----------------------------------------------------\n`;

      // Define Report File Path (backend/blocked_attempts.txt)
      const reportPath = path.join(__dirname, '../blocked_attempts.txt');

      // Append to Report File asynchronously
      fs.appendFile(reportPath, reportEntry, (err) => {
        if (err) console.error('[Audit] Failed to write security report:', err);
      });
      // --- FORENSIC LOGGING END ---

      // 3. Active Defense: Clear the invalid cookie immediately
      res.clearCookie('session_id', { path: '/' });

      return res.status(401).json({
        error: 'Security Alert',
        message: 'Session terminated by security policy. Access logged.'
      });
    }

    // 4. Token is clean, proceed
    next();

  } catch (err) {
    console.error('CRITICAL: Blacklist Check Error:', err.message);
    // Fail closed (secure default)
    res.status(500).json({ message: 'Security check failed' });
  }
};

module.exports = checkBlacklist;