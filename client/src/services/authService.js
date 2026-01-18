import axios from '../api/axios';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

/**
 * ------------------------------------------------------------------
 * AUTHENTICATION SERVICE LAYER (STABILIZED v2026)
 * ------------------------------------------------------------------
 * Orchestrates session management across all labs (Legacy to FIDO2).
 */
const authService = {

  // =========================================================================
  // 0. TOKEN & PERSISTENCE HELPER
  // =========================================================================

  _handlePersistence: (token, rememberMe) => {
    if (!token) return;
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');

    if (rememberMe) {
      localStorage.setItem('auth_token', token); // 1-Year Persistence
    } else {
      sessionStorage.setItem('auth_token', token); // Session-only (Survives Refresh)
    }
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await axios.get('/auth/me', config);
    return response.data;
  },

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
      // FIX: Reload current location to clear state without jumping to another lab
      window.location.reload();
    }
  },

  // =========================================================================
  // 1. HYBRID AUTHENTICATION STRATEGIES (LEVELS 1-4)
  // =========================================================================

  loginLevel1: async (formData) => {
    const response = await axios.post('/auth/level1', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },

  loginModern: async (email, password, version = 'v2', rememberMe = false) => {
    const endpoint = `/auth/level${version === 'v3' ? '3' : '2'}`;
    try {
      const response = await axios.post(endpoint, { email, password });
      if (response.data.token) {
        authService._handlePersistence(response.data.token, rememberMe);
      }
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Login Failed' };
    }
  },

  loginLevel2: async (data) => {
    // استخدم authService مباشرة لتجنب أخطاء intermediate value
    return authService.loginModern(data.email, data.password, 'v2', data.rememberMe);
  },

  // =========================================================================
  // 2. LEVEL 5: FIDO2 / WEBAUTHN ORCHESTRATION
  // =========================================================================

  fidoLoginWithPassword: async (email, password, rememberMe = false) => {
    const response = await axios.post('/auth/fido/login-pwd', { email, password });
    if (response.data.status === 'success' && response.data.token) {
      authService._handlePersistence(response.data.token, rememberMe);
    }
    return { ...response.data, rememberMe };
  },

  fidoRegister: async (email, rememberMe = false) => {
    const optsRes = await axios.post('/auth/fido/register/start', { email });
    const attResp = await startRegistration({ optionsJSON: optsRes.data });
    const verifyRes = await axios.post('/auth/fido/register/finish', { email, data: attResp });

    if (verifyRes.data.verified && verifyRes.data.token) {
      authService._handlePersistence(verifyRes.data.token, rememberMe);
    }
    return verifyRes.data;
  },

  fidoLogin: async (email, rememberMe = false) => {
    const optsRes = await axios.post('/auth/fido/login/start', { email });
    const assertResp = await startAuthentication({ optionsJSON: optsRes.data });
    const verifyRes = await axios.post('/auth/fido/login/finish', { email, data: assertResp });

    if (verifyRes.data.verified && verifyRes.data.token) {
      authService._handlePersistence(verifyRes.data.token, rememberMe);
    }
    return verifyRes.data;
  },

  fidoDisable: async (email) => {
    const response = await axios.post('/auth/fido/disable', { email });
    return response.data;
  },

  // =========================================================================
  // 3. MFA & ADMIN GATEWAY
  // =========================================================================

  verifyMfa: async (data) => {
    const response = await axios.post('/auth/mfa/verify', data);
    if (response.data.token) {
      authService._handlePersistence(response.data.token, data.rememberMe || false);
    }
    return response.data;
  },

  enableMFA: async (data) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const response = await axios.post('/auth/mfa/enable', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  disableMFA: async (data) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const response = await axios.post('/auth/mfa/disable', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  loginAdmin: async (credentials) => {
    const response = await axios.post('/auth/admin/login', credentials);
    if (response.data.token) localStorage.setItem('auth_token', response.data.token);
    return response.data;
  },

  getAllUsers: () => axios.get('/auth/admin/users').then(res => res.data),
  createUser: (data) => axios.post('/auth/admin/users', data).then(res => res.data),
  deleteUser: (id) => axios.delete(`/auth/admin/users/${id}`).then(res => res.data)
};

export default authService;