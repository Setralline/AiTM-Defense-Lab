const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const { generateToken, authenticateUser } = require('../utils/helpers');

/**
 * ------------------------------------------------------------------
 * AUTH CONTROLLER (Refactored & Secure)
 * ------------------------------------------------------------------
 * Handles Administrative login, Session validation, and User Management.
 * Uses centralized helpers for consistent security logic.
 */

/**
 * ADMIN LOGIN
 * Authenticates an admin and issues a session token.
 */
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  // 1. Input Validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Credentials required' });
  }

  try {
    // 2. Centralized Authentication (Checks User existence & Password hash)
    const user = await authenticateUser(email, password);

    // 3. Authorization Check (RBAC: Admin Only)
    if (!user.is_admin) {
      console.warn(`[Security] Unauthorized Admin Access Attempt: ${email}`);
      return res.status(403).json({ message: 'Access Denied: Insufficient Privileges' });
    }

    // 4. Generate Standardized Token
    const token = generateToken(user);

    // 5. Return Success Response
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (err) {
    // Handle "Invalid credentials" explicitly to avoid generic 500 errors
    if (err.message === 'Invalid credentials') {
      return res.status(401).json({ message: err.message });
    }
    console.error('Admin Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET CURRENT USER
 * Validates the incoming session token and returns the user profile.
 * Used by the frontend to restore session state on reload.
 */
exports.getCurrentUser = async (req, res) => {
  try {
    // 1. Extract Token (Support Header 'Bearer' or Cookie)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1] || req.cookies?.session_id;

    if (!token) {
      return res.status(401).json({ message: 'No session token found' });
    }

    // 2. Verify Token Signature
    const decoded = jwt.verify(token, config.security.jwtSecret);
    const userId = decoded.id || decoded.userId; // Support legacy & new payloads

    // 3. Fetch User from DB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User account no longer exists' });
    }

    // 4. Sanitize Response (Remove sensitive secrets)
    delete user.password;
    delete user.current_challenge;

    res.json({ success: true, user });

  } catch (err) {
    // JWT verification failed (expired or invalid signature)
    res.status(401).json({ message: 'Session expired or invalid' });
  }
};

// =========================================================================
// USER MANAGEMENT (CRUD)
// =========================================================================

/**
 * LIST ALL USERS
 * Admin-only endpoint to view registered users.
 */
exports.listUsers = async (req, res) => {
  try {
    // Note: Direct pool access is acceptable for simple reads, 
    // but moving this to User.findAll() in the model is also a good practice.
    const pool = require('../config/db');
    const result = await pool.query('SELECT id, name, email, has_fido, is_admin FROM users ORDER BY id DESC');
    res.json({ users: result.rows });
  } catch (err) {
    console.error('List Users Error:', err);
    res.status(500).json({ message: 'Failed to retrieve users' });
  }
};

/**
 * CREATE NEW USER
 * Admin endpoint to provision new accounts manually.
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;

    // [FIX] Password Complexity Check
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }
    // Optional: Add regex for numbers/special chars if you want stricter rules
    // if (!/[0-9]/.test(password)) return res.status(400).json({ message: 'Password must contain a number.' });

    // 1. Hash the password before storage
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 2. Create via Model
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isAdmin: isAdmin || false
    });

    res.status(201).json({ success: true, user });

  } catch (err) {
    console.error('Create User Error:', err);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

/**
 * DELETE USER
 * Admin endpoint to remove accounts.
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.delete(id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete User Error:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};