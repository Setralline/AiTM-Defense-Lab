import axios from '../api/axios';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

/**
 * ------------------------------------------------------------------
 * AUTHENTICATION SERVICE LAYER (STABILIZED v2026)
 * ------------------------------------------------------------------
 * Orchestrates session management across all labs (Legacy to FIDO2).
 * Logic: Supports 1-Year persistence (localStorage) or Session-only (sessionStorage).
 */
const authService = {

  // =========================================================================
  // 0. TOKEN & PERSISTENCE HELPERS
  // =========================================================================

  /**
   * Strategically persists the JWT based on the 'Remember Me' preference.
   */
  _handlePersistence: (token, rememberMe) => {
    if (!token) return;
    
    // Clear both to prevent collision between session types
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');

    if (rememberMe) {
      localStorage.setItem('auth_token', token); // Persistent (1-Year)
    } else {
      sessionStorage.setItem('auth_token', token); // Session (Survives Refresh, dies on Tab Close)
    }
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await axios.get('/auth/me', config);
    return response.data;
  },

  /**
   * Full session termination.
   * ✅ FIX: Reload current location instead of hardcoding a redirect to Level 5.
   */
  logout: async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.post('/auth/logout', {}, config);
    } catch (err) {
      console.warn('[Security] Backend session revocation unreachable.');
    } finally {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      // Reload current path to reset React state without jumping to another level
      window.location.reload();
    }
  },

  // =========================================================================
  // 1. HYBRID AUTHENTICATION STRATEGIES (LEVELS 1-4)
  // =========================================================================

  loginLevel1: async (formData) => {
    return await axios.post('/auth/level1', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(res => res.data);
  },

  loginModern: async (email, password, version = 'v2', rememberMe = false) => {
    const endpoint = `/auth/level${version === 'v3' ? '3' : '2'}`;
    const response = await axios.post(endpoint, { email, password });
    if (response.data.token) {
      authService._handlePersistence(response.data.token, rememberMe);
    }
    return response.data;
  },

  loginLevel2: async (data) => {
    // Explicitly reference authService to avoid "intermediate value" errors
    return authService.loginModern(data.email, data.password, 'v2', data.rememberMe);
  },

  // =========================================================================
  // 2. LEVEL 5: FIDO2 / WEBAUTHN ORCHESTRATION
  // =========================================================================

  fidoLoginWithPassword: async (email, password, rememberMe) => {
    return await axios.post('/auth/fido/login-pwd', { email, password }).then(res => {
      if (res.data.token) authService._handlePersistence(res.data.token, rememberMe);
      return res.data;
    });
  },

  fidoRegister: async (email, rememberMe) => {
    const optsRes = await axios.post('/auth/fido/register/start', { email });
    const attResp = await startRegistration({ optionsJSON: optsRes.data });
    const verifyRes = await axios.post('/auth/fido/register/finish', { email, data: attResp });
    
    // ✅ FIX: Persist token after hardware enrollment to keep user logged in on refresh
    if (verifyRes.data.token) authService._handlePersistence(verifyRes.data.token, rememberMe);
    return verifyRes.data;
  },

  fidoLogin: async (email, rememberMe) => {
    const optsRes = await axios.post('/auth/fido/login/start', { email });
    const assertResp = await startAuthentication({ optionsJSON: optsRes.data });
    const verifyRes = await axios.post('/auth/fido/login/finish', { email, data: assertResp });
    
    // ✅ FIX: Persist token after hardware verification
    if (verifyRes.data.token) authService._handlePersistence(verifyRes.data.token, rememberMe);
    return verifyRes.data;
  },

  fidoDisable: async (email) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return axios.post('/auth/fido/disable', { email }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data);
  },

  // =========================================================================
  // 3. MFA & ADMINISTRATIVE GATEWAY
  // =========================================================================

  verifyMfa: async (data) => {
    return await axios.post('/auth/mfa/verify', data).then(res => {
      if (res.data.token) authService._handlePersistence(res.data.token, data.rememberMe);
      return res.data;
    });
  },

  enableMFA: (data) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    // ✅ FIX: Send Bearer token to authorize MFA generation
    return axios.post('/auth/mfa/enable', data, { 
      headers: { Authorization: `Bearer ${token}` } 
    }).then(res => res.data);
  },

  disableMFA: (data) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    // ✅ FIX: Send Bearer token to authorize MFA removal
    return axios.post('/auth/mfa/disable', data, { 
      headers: { Authorization: `Bearer ${token}` } 
    }).then(res => res.data);
  },

  loginAdmin: (creds) => axios.post('/auth/admin/login', creds).then(res => {
    if (res.data.token) localStorage.setItem('auth_token', res.data.token);
    return res.data;
  }),

  // ✅ ADDED: Headers for Directory management
  getAllUsers: () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return axios.get('/auth/admin/users', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);
  },
  
  createUser: (data) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return axios.post('/auth/admin/users', data, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);
  },
  
  deleteUser: (id) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return axios.delete(`/auth/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);
  }
};

export default authService;