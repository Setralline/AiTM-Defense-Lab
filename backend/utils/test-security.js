const axios = require('axios');

/**
 * Security Verification Script: AiTM Replay Attack Mitigation
 * Author: Osamah Amer (Thesis Lab 2026)
 */

const BASE_URL = 'http://localhost:5000/auth';
const TEST_USER = {
  email: 'admin@lab.com',
  password: 'lab123'
};

async function runSecurityTest() {
  try {
    console.log('\n\x1b[36m[STEP 1]\x1b[0m Initializing Login...');
    
    // 1. Simulate Login to get a session
    const loginRes = await axios.post(`${BASE_URL}/level1`, TEST_USER);
    const cookie = loginRes.headers['set-cookie'][0];
    console.log('\x1b[32m[+]\x1b[0m Session Created. Cookie Captured (Simulating AiTM Theft).');

    // 2. Verify Session is active
    console.log('\n\x1b[36m[STEP 2]\x1b[0m Verifying Active Session...');
    await axios.get(`${BASE_URL}/me`, { headers: { Cookie: cookie } });
    console.log('\x1b[32m[+]\x1b[0m Access Granted: Session is valid.');

    // 3. Trigger Termination (Logout)
    console.log('\n\x1b[36m[STEP 3]\x1b[0m Triggering Session Termination...');
    await axios.post(`${BASE_URL}/logout`, {}, { headers: { Cookie: cookie } });
    console.log('\x1b[32m[+]\x1b[0m Termination Successful: Token added to Blacklist.');

    // 4. Attempt Replay Attack (The Critical Test)
    console.log('\n\x1b[36m[STEP 4]\x1b[0m Attempting Replay Attack with Stolen Cookie...');
    try {
      await axios.get(`${BASE_URL}/me`, { headers: { Cookie: cookie } });
      console.log('\x1b[31m[!]\x1b[0m FAILURE: Server accepted a blacklisted token!');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('\x1b[32m[SUCCESS]\x1b[0m Attack Blocked! Server returned 401 Unauthorized.');
        console.log('\x1b[33m[RESULT]\x1b[0m Blacklist Middleware is working perfectly.');
      } else {
        console.log('\x1b[31m[!]\x1b[0m ERROR: Unexpected response:', err.message);
      }
    }

  } catch (err) {
    console.error('\x1b[31m[!]\x1b[0m TEST FAILED: Check if your server is running.', err.message);
  }
}

runSecurityTest();