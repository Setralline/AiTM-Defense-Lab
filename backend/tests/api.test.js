const request = require('supertest');
const app = require('../server');
const pool = require('../config/db');
const { createInitialAdmin } = require('../config/initDb'); 
const speakeasy = require('speakeasy'); // Required to generate valid MFA codes for testing

/**
 * ---------------------------------------------------------------------------
 * COMPREHENSIVE API INTEGRATION TEST SUITE
 * ---------------------------------------------------------------------------
 * Validates all authentication levels, security defenses, and admin operations.
 * Ensures the "Victim" environment behaves correctly across all lab scenarios.
 */
describe('Phishing Defense Lab API Tests', () => {

  let adminToken; // To store JWT for authenticated requests
  let testUserId;

  // 1. SETUP: Prepare Database
  beforeAll(async () => {
    try {
      await createInitialAdmin();
    } catch (error) {
      console.error("Test Setup Error:", error);
    }
  });

  // 2. TEARDOWN: Close Connections
  afterAll(async () => {
    await pool.end();
  });

  // =========================================================================
  // ADMIN AUTHENTICATION & SESSION MANAGEMENT
  // =========================================================================

  it('POST /auth/admin/login - Admin Authentication Success', async () => {
    const res = await request(app)
      .post('/auth/admin/login')
      .send({ email: 'admin@lab.com', password: 'lab123' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'admin@lab.com');
    
    // Save token for subsequent tests
    adminToken = res.body.token;
  });

  it('GET /auth/me - Verify Session Token', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.user.email).toEqual('admin@lab.com');
  });

  // =========================================================================
  // LAB LEVEL 1 & 2 (BASIC & JWT AUTH)
  // =========================================================================

  it('POST /auth/level1 - Legacy Cookie Auth', async () => {
    const res = await request(app)
      .post('/auth/level1')
      .send({ email: 'admin@lab.com', password: 'lab123' });

    expect(res.statusCode).toEqual(200);
    expect(res.headers['set-cookie']).toBeDefined(); // Should set HttpOnly Cookie
  });

  it('POST /auth/level2 - Modern JWT Auth', async () => {
    const res = await request(app)
      .post('/auth/level2')
      .send({ email: 'admin@lab.com', password: 'lab123', rememberMe: true });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.isRemembered).toBe(true);
  });

  // =========================================================================
  // LAB LEVEL 3 (PROXY DETECTION)
  // =========================================================================

  it('POST /auth/level3 - Block Suspicious Host Header', async () => {
    const res = await request(app)
      .post('/auth/level3')
      .set('Host', 'evil-proxy.com') // Simulate Attack
      .send({ email: 'admin@lab.com', password: 'lab123' });

    expect(res.statusCode).toEqual(403); // Access Denied
    
    // [FIX] Updated to match the actual middleware message from detectProxy.js
    expect(res.body.message).toMatch(/Access Denied/);
  });

  it('POST /auth/level3 - Allow Valid Host', async () => {
    const res = await request(app)
      .post('/auth/level3')
      .set('Host', 'localhost:5000') // Valid Host
      .send({ email: 'admin@lab.com', password: 'lab123' });

    expect(res.statusCode).toEqual(200);
  });

  // =========================================================================
  // MFA OPERATIONS
  // =========================================================================

  let mfaSecret;

  it('POST /auth/mfa/enable - Enable MFA for User', async () => {
    const res = await request(app)
      .post('/auth/mfa/enable')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'admin@lab.com' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('secret');
    expect(res.body).toHaveProperty('qrCode');
    mfaSecret = res.body.secret;
  });

  it('POST /auth/mfa/verify - Verify Valid TOTP Code', async () => {
    // Generate a valid code using the secret we just got
    const code = speakeasy.totp({
      secret: mfaSecret,
      encoding: 'base32'
    });

    const res = await request(app)
      .post('/auth/mfa/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'admin@lab.com', code });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /auth/mfa/disable - Disable MFA', async () => {
    const res = await request(app)
      .post('/auth/mfa/disable')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'admin@lab.com' });

    expect(res.statusCode).toEqual(200);
  });

  // =========================================================================
  // FIDO2 / WEBAUTHN FLOWS
  // =========================================================================

  it('POST /auth/fido/login-pwd - FIDO Handshake (Init)', async () => {
    const res = await request(app)
      .post('/auth/fido/login-pwd')
      .send({ email: 'admin@lab.com', password: 'lab123' });

    // Should return success because admin doesn't have FIDO enabled yet
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('success');
  });

  it('POST /auth/fido/register/start - Start Registration', async () => {
    const res = await request(app)
      .post('/auth/fido/register/start')
      .send({ email: 'admin@lab.com' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('challenge'); // Critical for FIDO
  });

  // =========================================================================
  // ADMIN USER MANAGEMENT
  // =========================================================================

  it('POST /auth/admin/users - Create New User', async () => {
    const res = await request(app)
      .post('/auth/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ 
        name: 'Test Target', 
        email: 'target@test.com', 
        password: 'password123',
        isAdmin: false 
      });

    expect(res.statusCode).toEqual(201);
    testUserId = res.body.user.id;
  });

  it('GET /auth/admin/users - List Users', async () => {
    const res = await request(app)
      .get('/auth/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.users.length).toBeGreaterThan(0);
  });

  it('DELETE /auth/admin/users/:id - Delete User', async () => {
    const res = await request(app)
      .delete(`/auth/admin/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
  });

  // =========================================================================
  // LOGOUT & BLACKLIST
  // =========================================================================

  it('POST /auth/logout - Revoke Session', async () => {
    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
  });

  it('GET /auth/me - Ensure Token is Blacklisted', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${adminToken}`); // Use old token

    // Should be rejected by checkBlacklist middleware
    expect(res.statusCode).toEqual(401); 
  });

});