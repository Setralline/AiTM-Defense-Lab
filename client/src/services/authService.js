import axios from '../api/axios';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

/**
 * ------------------------------------------------------------------
 * AUTHENTICATION SERVICE LAYER
 * ------------------------------------------------------------------
 * This service acts as the orchestration engine for the Phishing Defense Lab.
 * It manages the complex "Hybrid Architecture" by bridging:
 * 1. Legacy Cookie-based Authentication (Level 1)
 * 2. Modern Token-based Authentication (Level 2, 3, 4)
 * 3. Hardware-Bound FIDO2 Authentication (Level 5)
 * 4. Active Session Revocation & Admin Operations
 */

const authService = {

  // =========================================================================
  // 0. SESSION LIFECYCLE & STATE MANAGEMENT
  // =========================================================================

  /**
   * Retrieves the current user's profile to validate session integrity.
   * * Strategy:
   * - Checks for JWT in local storage (Level 2-5).
   * - Relies on automated browser cookie transmission for Level 1.
   */
  getCurrentUser: async () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

    // Conditional Header Injection:
    // Only attach 'Authorization' header if a token exists.
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};

    const response = await axios.get('/auth/me', config);
    return response.data;
  },

  /**
   * Active Session Revocation (The Kill Switch).
   * * Security Protocol:
   * 1. Attempts to notify the backend to blacklist the session.
   * 2. GUARANTEES client-side cleanup via the 'finally' block.
   */
  logout: async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      // Trigger server-side blacklisting
      await axios.post('/auth/logout', {}, config);
    } catch (err) {
      console.warn('[Security] Backend revocation unreachable. Proceeding with local purge.', err.message);
    } finally {
      // Mandatory State Cleanup (Defense in Depth)
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');

      // Hard Redirect to ensure clean application state
      window.location.href = '/login';
    }
  },

  // =========================================================================
  // 1. AUTHENTICATION STRATEGIES (Hybrid Tiers)
  // =========================================================================

  /**
   * LEVEL 1: Legacy Simulation (Cookie/Form-Based).
   */
  loginLevel1: async (formData) => {
    // formData is expected to be a URLSearchParams object here
    const response = await axios.post('/auth/level1', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data;
  },

  /**
   * UNIFIED MODERN LOGIN (Levels 2, 3, 4).
   * * Technical Note:
   * Supports protocol versioning ('v2' vs 'v3') to target different defense mechanisms.
   */
  loginModern: async (email, password, version = 'v2') => {
    // Determine endpoint: v3 goes to /auth/level3, others to /auth/level2
    const endpoint = `/auth/level${version === 'v3' ? '3' : '2'}`;

    try {
      const response = await axios.post(endpoint, { email, password });

      // Default persistence
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }

      return response.data;
    } catch (error) {
      // Special handling for Lab 3 Defense (403 Forbidden)
      if (error.response && error.response.status === 403) {
        throw {
          message: `🛡️ SECURITY BLOCKED: ${error.response.data.message}`,
          status: 403
        };
      }

      throw error.response ? error.response.data : { message: 'Login Failed' };
    }
  },

  /**
   * LEVEL 2: Modern Simulation (Wrapper for backward compatibility).
   */
  loginLevel2: async (data) => {
    return authService.loginModern(data.email, data.password, 'v2').then(res => {
      if (res.success && res.token) {
        const storage = data.rememberMe ? localStorage : sessionStorage;
        if (!data.rememberMe) localStorage.removeItem('auth_token');
        storage.setItem('auth_token', res.token);
      }
      return res;
    });
  },

  /**
   * LEVEL 5: FIDO2 / WEBAUTHN (Hardware Defense).
   * * Technical Note:
   * Uses @simplewebauthn/browser to interact with the authenticator.
   * Credentials are bound to origin, making them phishing-proof.
   */

  /**
   * Step 1: Password Verification (Pre-FIDO check)
   * Checks credentials and determines if a hardware key is required.
   */
  fidoLoginWithPassword: async (email, password) => {
    try {
      const response = await axios.post('/auth/fido/login-pwd', { email, password });

      // If user has no key, backend logs them in directly
      if (response.data.status === 'success' && response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }

      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Password Check Failed' };
    }
  },



  fidoLogin: async (email) => {
    try {
      const optsRes = await axios.post('/auth/fido/login/start', { email });

      // ✅ تأكد من تمرير optsRes.data مباشرة ككائن خيارات
      const assertResp = await startAuthentication(optsRes.data);

      const verifyRes = await axios.post('/auth/fido/login/finish', {
        email,
        data: assertResp
      });

      return verifyRes.data;
    } catch (error) {
      console.error("FIDO Authentication Flow Failed:", error);
      throw error;
    }
  },

  fidoRegister: async (email) => {
    try {
      const optsRes = await axios.post('/auth/fido/register/start', { email });
      
      // ✅ التأكد من تمرير البيانات مباشرة (بدون تغليف إضافي)
      const attResp = await startRegistration(optsRes.data);

      const verifyRes = await axios.post('/auth/fido/register/finish', {
        email,
        data: attResp
      });

      return verifyRes.data;
    } catch (error) {
      console.error("FIDO Registration Error:", error);
      throw error;
    }
  },

  fidoDisable: async (email) => {
    const response = await axios.post('/auth/fido/disable', { email });
    return response.data;
  },

  // =========================================================================
  // 2. MULTI-FACTOR AUTHENTICATION (MFA)
  // =========================================================================

  verifyMfa: async (data) => {
    const response = await axios.post('/auth/mfa/verify', data);
    return response.data;
  },

  enableMFA: async (data) => {
    const response = await axios.post('/auth/mfa/enable', data);
    return response.data;
  },

  disableMFA: async (data) => {
    const response = await axios.post('/auth/mfa/disable', data);
    return response.data;
  },

  // =========================================================================
  // 3. ADMINISTRATIVE GATEWAY
  // =========================================================================

  loginAdmin: async (credentials) => {
    const response = await axios.post('/auth/admin/login', credentials);
    return response.data;
  },

  /**
   * Retrieve all operatives from the laboratory database.
   */
  getAllUsers: async () => {
    const response = await axios.get('/auth/admin/users');
    return response.data;
  },

  /**
   * Provision a new operative account with secure hashing.
   */
  createUser: async (userData) => {
    const response = await axios.post('/auth/admin/users', userData);
    return response.data;
  },

  /**
   * Permanent deletion of a user account.
   */
  deleteUser: async (userId) => {
    const response = await axios.delete(`/auth/admin/users/${userId}`);
    return response.data;
  }
};

export default authService;