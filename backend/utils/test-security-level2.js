const axios = require('axios');

/**
 * Security Verification Script: Level 2 JWT Replay Attack Mitigation
 * Purpose: To prove that stolen JWTs are invalidated server-side after logout.
 * Author: Osamah Amer (Thesis Lab 2026)
 */

const BASE_URL = 'http://localhost:5000/auth';
const TEST_USER = {
  email: 'admin@lab.com',
  password: 'lab123'
};

async function runLevel2SecurityTest() {
  try {
    console.log('\n\x1b[36m[STEP 1]\x1b[0m Initializing Level 2 Login...');
    
    // 1. Simulate Level 2 Login (JWT is returned in the response body)
    const loginRes = await axios.post(`${BASE_URL}/level2`, TEST_USER);
    const jwtToken = loginRes.data.token;
    
    if (!jwtToken) {
      throw new Error('JWT Token not received. Check Level 2 controller.');
    }
    console.log('\x1b[32m[+]\x1b[0m JWT Captured: Simulating stolen token from LocalStorage.');

    // 2. Verify Session is active using Authorization Header
    console.log('\n\x1b[36m[STEP 2]\x1b[0m Verifying Active JWT Session...');
    const config = { headers: { Authorization: `Bearer ${jwtToken}` } };
    
    const meRes = await axios.get(`${BASE_URL}/me`, config);
    console.log('\x1b[32m[+]\x1b[0m Access Granted: Token is valid for user:', meRes.data.user.email);

    // 3. Trigger Termination (Logout) - This should blacklist the JWT
    console.log('\n\x1b[36m[STEP 3]\x1b[0m Triggering Session Termination (Revocation)...');
    await axios.post(`${BASE_URL}/logout`, {}, config);
    console.log('\x1b[32m[+]\x1b[0m Termination Successful: JWT added to Server-Side Blacklist.');

    // 4. Attempt Replay Attack (The "Golden" Test)
    console.log('\n\x1b[36m[STEP 4]\x1b[0m Attempting Replay Attack with Revoked JWT...');
    try {
      await axios.get(`${BASE_URL}/me`, config);
      console.log('\x1b[31m[!]\x1b[0m FAILURE: Server accepted a blacklisted JWT! Security breach.');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('\x1b[32m[SUCCESS]\x1b[0m Attack Blocked! Server returned 401 Unauthorized.');
        console.log('\x1b[33m[RESULT]\x1b[0m JWT Blacklisting Middleware is functioning correctly.');
      } else {
        console.log('\x1b[31m[!]\x1b[0m ERROR: Unexpected response status:', err.response?.status);
      }
    }

  } catch (err) {
    console.error('\x1b[31m[!]\x1b[0m TEST FAILED:', err.message);
  }
}

runLevel2SecurityTest();