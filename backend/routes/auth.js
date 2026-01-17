const express = require('express');
const router = express.Router();

// Security middleware to intercept and block revoked tokens
const checkBlacklist = require('../middleware/checkBlacklist');
// Security middleware for Lab 3 to detect proxy anomalies
const detectProxy = require('../middleware/detectProxy');

// Controller modules for different authentication tiers
const authController = require('../controllers/authController');
const level1Controller = require('../controllers/level1Controller');
const level2Controller = require('../controllers/level2Controller');
const mfaController = require('../controllers/mfaController');

// ==========================================
// SESSION & IDENTITY ROUTES
// ==========================================

/**
 * Identity Verification Route
 * Crucial endpoint protected by checkBlacklist to prevent 
 * attackers from using stolen or revoked session identifiers.
 */
router.get('/me', checkBlacklist, authController.getCurrentUser);

/**
 * Universal Logout Sequence
 * Routes to level1Controller to clear HttpOnly cookies 
 * and populate the database blacklist for JWT invalidation.
 */
router.post('/logout', level1Controller.logout);

// ==========================================
// AUTHENTICATION STRATEGIES
// ==========================================

/**
 * Tier 1: Legacy Cookie-Based Authentication
 */
router.post('/level1', level1Controller.loginLevel1);

/**
 * Tier 2: Modern JWT-Based Authentication (JSON Payload)
 * Note: This endpoint is also used by Tier 4 (Client-Side Defense)
 */
router.post('/level2', level2Controller.loginLevel2);

/**
 * Tier 3: Server-Side Defense (Header Analysis)
 * Protected by detectProxy middleware to block unauthorized proxies.
 */
router.post('/level3', detectProxy, level2Controller.loginLevel2);

// ==========================================
// MULTI-FACTOR AUTHENTICATION (MFA)
// ==========================================

/**
 * MFA Management Operations
 * Protected by blacklist checks to ensure operations are 
 * performed within a trusted, non-revoked session.
 */
router.post('/mfa/enable', checkBlacklist, mfaController.enableMFA);
router.post('/mfa/verify', checkBlacklist, mfaController.verifyMfa);
router.post('/mfa/disable', checkBlacklist, mfaController.disableMFA);

// ==========================================
// ADMINISTRATIVE OPERATIONS
// ==========================================

/**
 * Laboratory Administration Gateway
 * Ensures all admin-level queries are verified against the revocation list.
 */
router.post('/admin/login', authController.adminLogin);
router.get('/admin/users', checkBlacklist, authController.listUsers);
router.post('/admin/users', checkBlacklist, authController.createUser);
router.delete('/admin/users/:id', checkBlacklist, authController.deleteUser);

module.exports = router;