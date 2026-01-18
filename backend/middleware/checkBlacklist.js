const fs = require('fs');
const path = require('path');
const Blacklist = require('../models/Blacklist');

/**
 * ------------------------------------------------------------------
 * SECURITY MIDDLEWARE: SESSION REVOCATION CHECK & AUDIT
 * ------------------------------------------------------------------
 * Blocks revoked tokens and generates forensic reports in '/logs'.
 */
const checkBlacklist = async (req, res, next) => {
  try {
    const token = req.cookies.session_id || req.headers.authorization?.split(' ')[1];

    if (!token) return next();

    const isRevoked = await Blacklist.isRevoked(token);

    if (isRevoked) {
      // --- FORENSIC LOGGING START ---
      const timestamp = new Date().toISOString();
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
      const country = req.headers['cf-ipcountry'] || req.headers['x-country-code'] || 'Unknown/Local';
      const userAgent = req.get('User-Agent') || 'Unknown';
      
      console.warn(`[Security] 🚨 BLOCKED: Access attempt with revoked token from IP: ${ip}`);

      const reportEntry = `
[${timestamp}] SECURITY INCIDENT: REVOKED TOKEN USAGE
-----------------------------------------------------
IP Address  : ${ip}
Country     : ${country}
User-Agent  : ${userAgent}
Request     : ${req.method} ${req.originalUrl}
Token       : ${token}
Action      : BLOCKED & COOKIE CLEARED
-----------------------------------------------------\n`;

      // Define Log Directory: backend/logs
      const logsDir = path.join(__dirname, '../logs');

      // Ensure 'logs' directory exists
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Path: backend/logs/blocked_attempts.txt
      const reportPath = path.join(logsDir, 'blocked_attempts.txt');

      fs.appendFile(reportPath, reportEntry, (err) => {
        if (err) console.error('[Audit] Failed to write security report:', err);
      });
      // --- FORENSIC LOGGING END ---

      res.clearCookie('session_id', { path: '/' });
      return res.status(401).json({
        error: 'Security Alert',
        message: 'Session terminated by security policy. Access logged.'
      });
    }

    next();
  } catch (err) {
    console.error('CRITICAL: Blacklist Check Error:', err.message);
    res.status(500).json({ message: 'Security check failed' });
  }
};

module.exports = checkBlacklist;