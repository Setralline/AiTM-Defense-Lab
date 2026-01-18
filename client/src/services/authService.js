import axios from '../api/axios';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

/**
 * ------------------------------------------------------------------
 * AUTHENTICATION SERVICE (Client-Side)
 * ------------------------------------------------------------------
 * Centralizes all identity management logic, including:
 * 1. HTTP calls to backend endpoints.
 * 2. Token storage strategy (Session vs Local Storage).
 * 3. FIDO2/WebAuthn ceremonies.
 * 4. MFA verification flows.
 */
const authService = {

  // =========================================================================
  // 0. TOKEN PERSISTENCE ENGINE
  // =========================================================================

  /**
   * Internal helper to handle token storage based on user preference.
   * Ensures no conflicts between SessionStorage and LocalStorage.
   * @param {string} token - The JWT received from the server.
   * @param {boolean} rememberMe - If true, persists across browser restarts.
   */
  _handlePersistence: (token, rememberMe) => {
    if (!token) return;
    
    // 1. Clean up potential conflicts first (ensure single source of truth)
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');

    // 2. Store based on user preference
    if (rememberMe) {
      localStorage.setItem('auth_token', token);
    } else {
      sessionStorage.setItem('auth_token', token);
    }
  },

  /**
   * Retrieves the current user session from the backend.
   * Used to hydrate the application state on page reload.
   */
  getCurrentUser: async () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    // Only attach header if token exists
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    
    const response = await axios.get('/auth/me', config);
    return response.data;
  },

  /**
   * Universal Logout: Clears both server-side blacklist and client-side storage.
   */
  logout: async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      // Notify backend to blacklist the token
      await axios.post('/auth/logout', {}, config);
    } catch (err) {
      console.warn('Backend logout warning (network or token issue), proceeding to local cleanup.');
    } finally {
      // Always clean up local state
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      window.location.reload();
    }
  },

  // =========================================================================
  // 1. STANDARD AUTHENTICATION (Levels 1, 2, 3, 4)
  // =========================================================================

  /**
   * Level 1: Legacy Login (Cookie-based).
   * Note: The browser automatically handles HttpOnly cookie persistence.
   */
  loginLevel1: async (formData) => {
    return await axios.post('/auth/level1', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(res => res.data);
  },

  /**
   * Core logic for Levels 2, 3, and 4 (JWT-based).
   * @param {string} email 
   * @param {string} password 
   * @param {string} version - Determines the endpoint (v2 for Level 2/4, v3 for Level 3)
   * @param {boolean} rememberMe - Critical for persistence
   */
  loginModern: async (email, password, version = 'v2', rememberMe = false) => {
    const endpoint = `/auth/level${version === 'v3' ? '3' : '2'}`;
    
    // Send 'rememberMe' to backend so it sets correct JWT expiry (e.g., 1 year vs 1 hour)
    const response = await axios.post(endpoint, { email, password, rememberMe });

    // If login is successful immediately (no MFA), save the token
    if (response.data.token) {
      authService._handlePersistence(response.data.token, rememberMe);
    }
    
    return response.data;
  },

  // Proxy wrapper for Level 2 components
  loginLevel2: async (data) => {
    return authService.loginModern(data.email, data.password, 'v2', data.rememberMe);
  },

  // =========================================================================
  // 2. LEVEL 5: FIDO2 / WEBAUTHN (Hardware Security)
  // =========================================================================

  /**
   * Step 1: Password Verification (Hybrid Flow)
   */
  fidoLoginWithPassword: async (email, password, rememberMe = false) => {
    const res = await axios.post('/auth/fido/login-pwd', { email, password });
    
    // If user has no FIDO key yet, they get a token immediately
    if (res.data.token) {
      authService._handlePersistence(res.data.token, rememberMe);
    }
    return { ...res.data, rememberMe };
  },

  /**
   * Registration Ceremony (Enrollment)
   */
  fidoRegister: async (email, rememberMe = false) => {
    // 1. Get challenge options
    const optsRes = await axios.post('/auth/fido/register/start', { email });
    // 2. Sign with authenticator
    const attResp = await startRegistration({ optionsJSON: optsRes.data });
    // 3. Verify on server
    const verifyRes = await axios.post('/auth/fido/register/finish', { email, data: attResp });
    
    if (verifyRes.data.token) {
      authService._handlePersistence(verifyRes.data.token, rememberMe);
    }
    return verifyRes.data;
  },

  /**
   * Authentication Ceremony (Login)
   */
  fidoLogin: async (email, rememberMe = false) => {
    const optsRes = await axios.post('/auth/fido/login/start', { email });
    const assertResp = await startAuthentication({ optionsJSON: optsRes.data });
    const verifyRes = await axios.post('/auth/fido/login/finish', { email, data: assertResp });
    
    if (verifyRes.data.token) {
      authService._handlePersistence(verifyRes.data.token, rememberMe);
    }
    return verifyRes.data;
  },

  fidoDisable: async (email) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return axios.post('/auth/fido/disable', { email }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data);
  },

  // =========================================================================
  // 3. MULTI-FACTOR AUTHENTICATION (MFA)
  // =========================================================================

  verifyMfa: async (data) => {
    const res = await axios.post('/auth/mfa/verify', data);
    
    // Critical: Save token upon successful MFA verification
    if (res.data.token) {
      authService._handlePersistence(res.data.token, data.rememberMe);
    }
    
    return res.data;
  },

  enableMFA: (data) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return axios.post('/auth/mfa/enable', data, { 
      headers: { Authorization: `Bearer ${token}` } 
    }).then(res => res.data);
  },

  disableMFA: (data) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return axios.post('/auth/mfa/disable', data, { 
      headers: { Authorization: `Bearer ${token}` } 
    }).then(res => res.data);
  },

  // =========================================================================
  // 4. ADMINISTRATIVE OPERATIONS
  // =========================================================================

  loginAdmin: (creds) => axios.post('/auth/admin/login', creds).then(res => {
    if (res.data.token) {
      localStorage.setItem('auth_token', res.data.token); // Admins always persist
    }
    return res.data;
  }),

  getAllUsers: () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return axios.get('/auth/admin/users', { 
      headers: { Authorization: `Bearer ${token}` } 
    }).then(res => res.data);
  },
  
  createUser: (data) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return axios.post('/auth/admin/users', data, { 
      headers: { Authorization: `Bearer ${token}` } 
    }).then(res => res.data);
  },
  
  deleteUser: (id) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return axios.delete(`/auth/admin/users/${id}`, { 
      headers: { Authorization: `Bearer ${token}` } 
    }).then(res => res.data);
  }
};

export default authService;