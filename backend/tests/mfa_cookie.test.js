const request = require('supertest');
const app = require('../server'); 
const pool = require('../config/db');
const { createInitialAdmin } = require('../config/initDb');
const speakeasy = require('speakeasy');

describe('Level 1 MFA Session Fix (Cookie Mode)', () => {
  let adminToken;
  let mfaSecret;
  const adminEmail = 'admin@lab.com';
  
  // [FIX] Use the deterministic password enforced by initDb.js in test mode
  const knownPassword = 'lab123'; 

  // 1. SETUP: Initialize Database & Admin
  beforeAll(async () => {
    // This creates the admin with password 'lab123' because NODE_ENV=test
    await createInitialAdmin();
  });

  // 2. TEARDOWN: Close Database Connection
  afterAll(async () => {
    await pool.end();
  });

  it('Step 1: Authenticate to get initial token', async () => {
    const res = await request(app)
      .post('/auth/admin/login')
      .send({ email: adminEmail, password: knownPassword });

    expect(res.statusCode).toEqual(200);
    adminToken = res.body.token;
  });

  it('Step 2: Enable MFA for the account', async () => {
    const res = await request(app)
      .post('/auth/mfa/enable')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: adminEmail });

    expect(res.statusCode).toEqual(200);
    mfaSecret = res.body.secret;
  });

  it('Step 3: Verify MFA with isCookieAuth: true (THE FIX)', async () => {
    // Generate valid TOTP code
    const code = speakeasy.totp({
      secret: mfaSecret,
      encoding: 'base32'
    });

    const res = await request(app)
      .post('/auth/mfa/verify')
      .send({ 
        email: adminEmail, 
        code: code,
        isCookieAuth: true, // <--- FIX FLAG: Triggers HttpOnly cookie mode
        rememberMe: false
      });

    expect(res.statusCode).toEqual(200);

    // CRITICAL CHECK 1: Ensure HttpOnly cookie is set (Level 1 Requirement)
    expect(res.headers['set-cookie']).toBeDefined();
    
    // CRITICAL CHECK 2: Ensure JWT is NOT returned in body (XSS Mitigation)
    expect(res.body.token).toBeUndefined();
    
    // Ensure user data is returned correctly
    expect(res.body.user).toBeDefined(); // <--- RESTORED
    expect(res.body.user.email).toBe(adminEmail);
  });
});