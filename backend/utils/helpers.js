const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const pool = require('../config/db');
const User = require('../models/User');

/**
 * ------------------------------------------------------------------
 * SECURITY HELPER FUNCTIONS
 * ------------------------------------------------------------------
 * Centralizes critical security logic (Auth, Tokens, Revocation).
 */

/**
 * GENERATE JWT TOKEN
 * Creates a standardized JSON Web Token.
 * @param {Object} user - The user object.
 * @param {boolean} [isRemembered=false] - If true, extends expiration to 1 year.
 */
const generateToken = (user, isRemembered = false) => {
  return jwt.sign(
    {
      id: user.id,
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin
    },
    config.security.jwtSecret,
    { expiresIn: isRemembered ? '1y' : config.security.jwtExpiresIn }
  );
};

/**
 * AUTHENTICATE USER HELPER
 * Verifies email and password hash.
 */
const authenticateUser = async (email, password) => {
  const user = await User.findByEmail(email);
  if (!user) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');

  return user;
};

/**
 * REVOKE SESSION HELPER (Organized Logging)
 * - Invalidates session in DB.
 * - Creates 'logs' folder if missing.
 * - Saves full token to 'backend/logs/terminated.txt'.
 */
const revokeSession = async (token) => {
  if (!token) return false;

  try {
    // 1. Set Default Expiration (24h)
    let expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      expiresAt = new Date(decoded.exp * 1000);
    }

    // 2. Insert into Database
    const query = `
      INSERT INTO token_blacklist (token, expires_at)
      VALUES ($1, $2)
      ON CONFLICT (token) DO NOTHING
    `;
    await pool.query(query, [token, expiresAt]);

    // 3. LOG TO FILE (Organized in /logs folder)
    const logsDir = path.join(__dirname, '../logs');

    // Ensure 'logs' directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();

    // MODIFIED: Log the FULL token (No truncation) for POC demonstration
    const logMessage = `[${timestamp}] SESSION TERMINATED | Token: ${token} | Expires: ${expiresAt.toISOString()}\n`;

    // Path: backend/logs/terminated.txt
    const logFilePath = path.join(logsDir, 'terminated.txt');

    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) console.error('[Logger] Failed to write to logs/terminated.txt:', err);
    });

    console.log(`[Security] 🚫 Session Terminated. Logged to /logs/terminated.txt`);
    return true;

  } catch (err) {
    console.error('[Helper] Revocation Error:', err.message);
    // Return false but don't crash, allowing the client to continue logout flow
    return false;
  }
};

/**
 * CHECK BLACKLIST HELPER
 * Used by middleware to block revoked tokens.
 */
const isBlacklisted = async (token) => {
  if (!token) return false;
  try {
    const result = await pool.query('SELECT 1 FROM token_blacklist WHERE token = $1', [token]);
    return result.rowCount > 0;
  } catch (err) {
    console.error('[Helper] Blacklist Check Error:', err.message);
    return false;
  }
};

/**
 * GET SECURITY CONFIG HELPER
 * Returns strictly defined environment variables to defeat Evilginx spoofing.
 * Prioritizes RP_ID from .env as the absolute source of truth.
 */
const getSecurityConfig = () => {
  // 1. Source of Truth: The RP_ID from .env (set via setup.sh)
  // This bypasses any headers that Evilginx might have spoofed.
  const trueDomain = process.env.RP_ID;

  // 2. Safety Fallback: Use localhost if env is missing (development)
  const validDomain = trueDomain || process.env.ALLOWED_HOSTS?.split(',')[0] || 'localhost';

  return {
    allowedDomain: validDomain,
    rpId: validDomain
  };
};

module.exports = { generateToken, authenticateUser, revokeSession, isBlacklisted, getSecurityConfig };