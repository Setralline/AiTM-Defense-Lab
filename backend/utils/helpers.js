const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const User = require('../models/User');
const Blacklist = require('../models/Blacklist'); 

/**
 * ------------------------------------------------------------------
 * SECURITY HELPER FUNCTIONS
 * ------------------------------------------------------------------
 * Centralizes critical security logic (Auth, Tokens, Revocation) 
 * to ensure consistency across all controllers.
 */

/**
 * GENERATE JWT TOKEN
 * Creates a standardized JSON Web Token with a consistent payload.
 * Supports both legacy ID and FIDO 'userId' for compatibility.
 * * @param {Object} user - The user object from the database.
 * @param {boolean} [isRemembered=false] - If true, extends expiration to 1 year.
 * @returns {string} - The signed JWT string.
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
 * Centralizes the login process: 
 * 1. Fetches user by email.
 * 2. Verifies existence.
 * 3. Compares password hashes.
 * * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>} - The user object if successful.
 * @throws {Error} - Throws 'Invalid credentials' on failure.
 */
const authenticateUser = async (email, password) => {
  const user = await User.findByEmail(email);
  
  if (!user) {
    // Return generic error to prevent User Enumeration attacks
    throw new Error('Invalid credentials'); 
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
};

/**
 * REVOKE SESSION HELPER
 * Invalidates a session by adding the token to the database blacklist.
 * * @param {string} token - The JWT or Session ID to revoke.
 * @returns {Promise<boolean>} - True if successful, false otherwise.
 */
const revokeSession = async (token) => {
  if (!token) return false;
  try {
    // Use the Blacklist model to persist the revoked token
    await Blacklist.add(token);
    return true;
  } catch (err) {
    console.error('Revocation Error:', err.message);
    return false;
  }
};

module.exports = { generateToken, authenticateUser, revokeSession };