const axios = require('axios');

/**
 * ------------------------------------------------------------------
 * SECURITY VERIFICATION SCRIPT: LEVEL 2
 * ------------------------------------------------------------------
 * Purpose: Verification of JWT Replay Attack Mitigation.
 * Logic: Proves that the server correctly rejects a valid-signature JWT 
 * if it has been previously revoked (blacklisted) via logout.
 * * Author: Osamah Amer (Thesis Lab 2026)
 */

const BASE_URL = 'http://localhost:5000/auth';

// Test Credentials (Admin)
const TEST_USER = {
  email: 'admin@lab.com',
  password: 'lab123'
};

async function runLevel2SecurityTest() {
  try {
    console.log('\n=======================================================');
    console.log('🛡️  STARTING LEVEL 2 SECURITY TEST (JWT BLACKLIST)');
    console.log('=======================================================\n');

    // ---------------------------------------------------------
    // STEP 1: LOGIN (Simulate Token Issuance/Theft)
    // ---------------------------------------------------------
    console.log('\x1b[36m[STEP 1]\x1b[0m Simulating Level 2 Login...');
    const loginRes = await axios.post(`${BASE_URL}/level2`, TEST_USER);
    const jwtToken = loginRes.data.token;
    
    if (!jwtToken) {
      throw new Error('Critical: No JWT received from Level 2 login.');
    }
    console.log('\x1b[32m[SUCCESS]\x1b[0m JWT Captured. Token acquired.');

    // ---------------------------------------------------------
    // STEP 2: VERIFY ACTIVE SESSION
    // ---------------------------------------------------------
    console.log('\n\x1b[36m[STEP 2]\x1b[0m Verifying token validity before revocation...');
    const config = { headers: { Authorization: `Bearer ${jwtToken}` } };
    
    const meRes = await axios.get(`${BASE_URL}/me`, config);
    console.log(`\x1b[32m[SUCCESS]\x1b[0m Access Granted for User: ${meRes.data.user.email}`);

    // ---------------------------------------------------------
    // STEP 3: TERMINATE SESSION (Revocation)
    // ---------------------------------------------------------
    console.log('\n\x1b[36m[STEP 3]\x1b[0m Triggering Logout (Adding Token to Blacklist)...');
    await axios.post(`${BASE_URL}/logout`, {}, config);
    console.log('\x1b[32m[SUCCESS]\x1b[0m Logout executed. Token should now be invalidated.');

    // ---------------------------------------------------------
    // STEP 4: REPLAY ATTACK (The Verification)
    // ---------------------------------------------------------
    console.log('\n\x1b[36m[STEP 4]\x1b[0m Executing Replay Attack with Revoked Token...');
    try {
      // Attempt to access a protected route with the blacklisted token
      await axios.get(`${BASE_URL}/me`, config);
      
      // If we reach here, the server FAILED to block the request
      console.log('\x1b[31m[FAILED]\x1b[0m 🚨 CRITICAL VULNERABILITY: Server accepted a blacklisted token!');
      process.exit(1);

    } catch (err) {
      if (err.response && err.response.status === 401) {
        // 401 Unauthorized is the EXPECTED result
        console.log('\x1b[32m[PASSED]\x1b[0m Attack Blocked! Server returned 401 Unauthorized.');
        console.log('\x1b[33m[INFO]\x1b[0m Middleware "checkBlacklist" is functioning correctly.');
      } else {
        console.log(`\x1b[31m[ERROR]\x1b[0m Unexpected Status Code: ${err.response?.status}`);
      }
    }

    console.log('\n=======================================================');

  } catch (err) {
    console.error('\n\x1b[31m[TEST ERROR]\x1b[0m Execution failed:', err.message);
  }
}

// Execute
runLevel2SecurityTest();