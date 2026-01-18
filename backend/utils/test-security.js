const axios = require('axios');

/**
 * ------------------------------------------------------------------
 * SECURITY VERIFICATION SCRIPT: LEVEL 1 (AiTM Defense)
 * ------------------------------------------------------------------
 * Purpose: Verification of Cookie Replay Attack Mitigation.
 * Logic: Proves that the server correctly rejects a valid session cookie 
 * if the session has been previously terminated (blacklisted) server-side.
 * * Author: Osamah Amer (Thesis Lab 2026)
 */

const BASE_URL = 'http://localhost:5000/auth';

// Test Credentials (Admin)
const TEST_USER = {
  email: 'admin@lab.com',
  password: 'lab123'
};

async function runLevel1SecurityTest() {
  try {
    console.log('\n=======================================================');
    console.log('🛡️  STARTING LEVEL 1 SECURITY TEST (COOKIE BLACKLIST)');
    console.log('=======================================================\n');

    // ---------------------------------------------------------
    // STEP 1: LOGIN (Simulate Session Hijacking)
    // ---------------------------------------------------------
    console.log('\x1b[36m[STEP 1]\x1b[0m Initializing Level 1 Login...');
    
    const loginRes = await axios.post(`${BASE_URL}/level1`, TEST_USER);
    
    // Capture the HttpOnly cookie (simulating an AiTM proxy stealing it)
    const cookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : null;
    
    if (!cookie) {
      throw new Error('Critical: No Session Cookie received from Level 1 login.');
    }
    console.log('\x1b[32m[SUCCESS]\x1b[0m Session Created. Cookie Captured (Simulating Theft).');

    // ---------------------------------------------------------
    // STEP 2: VERIFY ACTIVE SESSION
    // ---------------------------------------------------------
    console.log('\n\x1b[36m[STEP 2]\x1b[0m Verifying session validity before revocation...');
    
    // Use the captured cookie to access a protected route
    const meRes = await axios.get(`${BASE_URL}/me`, { headers: { Cookie: cookie } });
    console.log(`\x1b[32m[SUCCESS]\x1b[0m Access Granted for User: ${meRes.data.user.email}`);

    // ---------------------------------------------------------
    // STEP 3: TERMINATE SESSION (Revocation)
    // ---------------------------------------------------------
    console.log('\n\x1b[36m[STEP 3]\x1b[0m Triggering Session Termination (Logout)...');
    
    // Call logout to add the session ID to the server-side blacklist
    await axios.post(`${BASE_URL}/logout`, {}, { headers: { Cookie: cookie } });
    console.log('\x1b[32m[SUCCESS]\x1b[0m Termination Successful: Token added to Blacklist.');

    // ---------------------------------------------------------
    // STEP 4: REPLAY ATTACK (The Verification)
    // ---------------------------------------------------------
    console.log('\n\x1b[36m[STEP 4]\x1b[0m Attempting Replay Attack with Stolen Cookie...');
    
    try {
      // Attempt to reuse the now-revoked cookie
      await axios.get(`${BASE_URL}/me`, { headers: { Cookie: cookie } });
      
      // If we reach here, the server FAILED to block the request
      console.log('\x1b[31m[FAILED]\x1b[0m 🚨 CRITICAL VULNERABILITY: Server accepted a blacklisted cookie!');
      process.exit(1);

    } catch (err) {
      if (err.response && err.response.status === 401) {
        // 401 Unauthorized is the EXPECTED result
        console.log('\x1b[32m[PASSED]\x1b[0m ✅ Attack Blocked! Server returned 401 Unauthorized.');
        console.log('\x1b[33m[INFO]\x1b[0m Middleware "checkBlacklist" correctly identified the revoked session.');
      } else {
        console.log(`\x1b[31m[ERROR]\x1b[0m Unexpected Status Code: ${err.response?.status}`);
      }
    }

    console.log('\n=======================================================');

  } catch (err) {
    console.error('\n\x1b[31m[TEST ERROR]\x1b[0m Execution failed:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('Hint: Is the backend server running on port 5000?');
    }
  }
}

// Execute
runLevel1SecurityTest();