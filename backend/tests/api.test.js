const request = require('supertest');
const app = require('../server');
const pool = require('../config/db'); // Needed to close the connection after tests

/**
 * Authentication API Security & Integration Tests
 * * This suite validates the core security mechanisms of the Phishing Defense Lab.
 * It ensures that our "Victim" environment behaves correctly before we start attacking it.
 */
describe('Authentication API Security Checks', () => {
  
  // CLEANUP: Close the database connection once all tests are done.
  // This fixes the "Jest did not exit" warning.
  afterAll(async () => {
    await pool.end();
  });

  /**
   * Test Case 1: Administrative Access
   * Verifies that the lab admin can authenticate to manage the dashboard.
   */
  it('POST /auth/admin/login - should successfully authenticate the Admin', async () => {
    const res = await request(app)
      .post('/auth/admin/login')
      .send({
        email: 'admin@lab.com',
        password: 'lab123'
      });

    // We expect a 200 OK and a success flag
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
  });

  /**
   * Test Case 2: Legacy Authentication (Level 1)
   * Simulates a traditional web app login. It shouldn't fail (404) or crash.
   * Note: This level relies on Cookies, which Supertest handles differently, 
   * but a 200 OK confirms the endpoint is active.
   */
  it('POST /auth/level1 - should process the Legacy Login request', async () => {
    const res = await request(app)
      .post('/auth/level1')
      .send({
        email: 'admin@lab.com',
        password: 'lab123'
      });

    expect(res.statusCode).toEqual(200);
  });

  /**
   * Test Case 3: Modern Authentication (Level 2)
   * CRITICAL: This verifies that the API returns a raw JSON Web Token (JWT).
   * We need this token to exist so we can try to steal it later with Evilginx.
   */
  it('POST /auth/level2 - should return a JWT structure for Modern Auth', async () => {
    const res = await request(app)
      .post('/auth/level2')
      .send({
        email: 'admin@lab.com',
        password: 'lab123',
        rememberMe: false
      });

    expect(res.statusCode).toEqual(200);
    // The presence of 'token' confirms the vulnerability surface exists
    expect(res.body).toHaveProperty('token');
  });

  /**
   * Test Case 4: Access Control (Authorization)
   * Verifies that sensitive endpoints are actually protected.
   * Trying to fetch user data without a cookie/token should be rejected.
   */
  it('GET /auth/me - should deny access without credentials (401 Unauthorized)', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.statusCode).toEqual(401); 
  });

  /**
   * Test Case 5: Error Handling
   * Ensures the server correctly identifies non-existent resources.
   */
  it('GET /auth/unknown-route - should return 404 for invalid paths', async () => {
    const res = await request(app).get('/auth/does-not-exist');
    expect(res.statusCode).toEqual(404);
  });

});