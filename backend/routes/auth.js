const express = require('express');
const router = express.Router();

// Import controllers for various authentication levels and operations
const authController = require('../controllers/authController');
const level1Controller = require('../controllers/level1Controller');
const level2Controller = require('../controllers/level2Controller');
const mfaController = require('../controllers/mfaController');

// ==========================================
// SESSION & IDENTITY ROUTES
// ==========================================

/**
 * Check Current Identity
 * Validates the existing session for both Level 1 and Level 2.
 */
router.get('/me', authController.getCurrentUser);


// ==========================================
// AUTHENTICATION STRATEGIES
// ==========================================

/**
 * Level 1: Legacy Authentication
 * Uses HttpOnly Cookies for session management.
 */
router.post('/level1', level1Controller.loginLevel1);

/**
 * Level 2: Modern Authentication
 * Uses JWT Tokens for stateless authentication.
 */
router.post('/level2', level2Controller.loginLevel2);


// ==========================================
// MULTI-FACTOR AUTHENTICATION (MFA)
// ==========================================

router.post('/mfa/enable', mfaController.enableMFA);
router.post('/mfa/verify', mfaController.verifyMfa);
router.post('/mfa/disable', mfaController.disableMFA);


// ==========================================
// ADMINISTRATIVE OPERATIONS (NEW)
// ==========================================

/**
 * Operative Management
 * These routes allow provisioning and termination of lab users.
 */

router.post('/admin/login', authController.adminLogin);     // Admin Authentication Route
router.get('/admin/users', authController.listUsers);       // Fetch all users
router.post('/admin/users', authController.createUser);      // Create a new user
router.delete('/admin/users/:id', authController.deleteUser); // Delete user by ID


module.exports = router;