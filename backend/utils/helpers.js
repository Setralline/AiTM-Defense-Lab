const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const pool = require('../config/db'); // Use direct DB pool for the Blacklist fix
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
      userId: user.id, // For FIDO/WebAuthn compatibility
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
  
  if (!user) {
    throw new Error('Invalid credentials'); 
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
};

/**
 * REVOKE SESSION HELPER (With Full Token Logging)
 * Invalidates a session by adding the token to the database blacklist
 * AND logging the FULL token to 'terminated.txt' for audit/demo purposes.
 */
const revokeSession = async (token) => {
  // Safety check
  if (!token) return false;

  try {
    // 1. Set Default Expiration (24 Hours from now)
    // This ensures the DB never receives a NULL value.
    let expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 2. Try to extract real expiration from JWT
    const decoded = jwt.decode(token);
    
    // If it is a valid JWT and has an 'exp' field, use it
    if (decoded && decoded.exp) {
      expiresAt = new Date(decoded.exp * 1000);
    }

    // 3. Insert into Database directly
    // Using ON CONFLICT to handle duplicate logout attempts gracefully
    const query = `
      INSERT INTO token_blacklist (token, expires_at)
      VALUES ($1, $2)
      ON CONFLICT (token) DO NOTHING
    `;
    
    await pool.query(query, [token, expiresAt]);

    // 4. LOG TO FILE (terminated.txt)
    const timestamp = new Date().toISOString();
    
    // MODIFIED: Log the FULL token (No truncation) for POC demonstration
    const logMessage = `[${timestamp}] SESSION TERMINATED | Token: ${token} | Expires: ${expiresAt.toISOString()}\n`;

    // Define path: backend/terminated.txt
    const logFilePath = path.join(__dirname, '../terminated.txt');

    // Append to file asynchronously
    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) console.error('[Logger] Failed to write to terminated.txt:', err);
    });

    // Console Log for immediate feedback
    console.log(`[Security] 🚫 Session Terminated. Full token logged to file.`);

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
    const result = await pool.query(
      'SELECT 1 FROM token_blacklist WHERE token = $1',
      [token]
    );
    return result.rowCount > 0;
  } catch (err) {
    console.error('[Helper] Blacklist Check Error:', err.message);
    return false;
  }
};

module.exports = { 
  generateToken, 
  authenticateUser, 
  revokeSession,
  isBlacklisted 
};