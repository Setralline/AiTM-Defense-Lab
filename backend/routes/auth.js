const express = require('express');
const router = express.Router();

// =========================================================================
// Middleware Imports
// =========================================================================

// Security middleware to intercept and block revoked tokens
const checkBlacklist = require('../middleware/checkBlacklist');

// Security middleware for Lab 3 to detect and block proxy anomalies
const detectProxy = require('../middleware/detectProxy');

// =========================================================================
// Controller Imports
// =========================================================================

const authController = require('../controllers/authController');
const level1Controller = require('../controllers/level1Controller');
const level2Controller = require('../controllers/level2Controller');
const mfaController = require('../controllers/mfaController');
const fidoController = require('../controllers/fidoController'); 

// =========================================================================
// 1. Session & Identity Routes
// =========================================================================

/**
 * Identity Verification Route
 * Crucial endpoint protected by checkBlacklist to prevent 
 * attackers from using stolen or revoked session identifiers.
 */
router.get('/me', checkBlacklist, authController.getCurrentUser);

/**
 * Universal Logout Sequence
 * Revokes the current session (Cookie or JWT) via the blacklist
 * and clears client-side state.
 */
router.post('/logout', level1Controller.logout);

// =========================================================================
// 2. Authentication Strategies (Lab Levels)
// =========================================================================

/**
 * Tier 1: Legacy Cookie-Based Authentication
 * Vulnerable to CSRF/XSS if not properly secured (demonstration purpose).
 */
router.post('/level1', level1Controller.loginLevel1);

/**
 * Tier 2: Modern JWT-Based Authentication
 * Returns a JSON payload for client-side storage (LocalStorage).
 * Also serves as the base for Tier 4 (Client-Side Defense).
 */
router.post('/level2', level2Controller.loginLevel2);

/**
 * Tier 3: Server-Side Defense (Header Analysis)
 * Wraps the standard JWT login with the `detectProxy` middleware 
 * to block requests from unauthorized origins/proxies.
 */
router.post('/level3', detectProxy, level2Controller.loginLevel2);

// =========================================================================
// 3. FIDO2 / WebAuthn Routes (Tier 5 Defense)
// =========================================================================

// Step 1: Initial Password Verification (Before FIDO Challenge)
router.post('/fido/login-pwd', fidoController.loginWithPassword);

// Registration Ceremony (Enrollment)
router.post('/fido/register/start', fidoController.registerStart);
router.post('/fido/register/finish', fidoController.registerFinish);

// Authentication Ceremony (Login with Hardware Key)
router.post('/fido/login/start', fidoController.loginStart);
router.post('/fido/login/finish', fidoController.loginFinish);

// Management
router.post('/fido/disable', fidoController.disableKey);

// =========================================================================
// 4. Multi-Factor Authentication (MFA)
// =========================================================================

/**
 * MFA Operations
 * All MFA changes are strictly protected by `checkBlacklist` 
 * to ensure the request comes from a valid, active session.
 */
router.post('/mfa/enable', checkBlacklist, mfaController.enableMFA);
router.post('/mfa/verify', checkBlacklist, mfaController.verifyMfa);
router.post('/mfa/disable', checkBlacklist, mfaController.disableMFA);

// =========================================================================
// 5. Administrative Operations
// =========================================================================

/**
 * Admin Panel Routes
 * Restricted endpoints for user management.
 */
router.post('/admin/login', authController.adminLogin);
router.get('/admin/users', checkBlacklist, authController.listUsers);
router.post('/admin/users', checkBlacklist, authController.createUser);
router.delete('/admin/users/:id', checkBlacklist, authController.deleteUser);

module.exports = router;