import axios from '../api/axios';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

const authService = {

  // =========================================================================
  // 0. TOKEN & PERSISTENCE
  // =========================================================================

  _handlePersistence: (token, rememberMe) => {
    if (!token) return;
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');

    if (rememberMe) {
      localStorage.setItem('auth_token', token);
    } else {
      sessionStorage.setItem('auth_token', token);
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
      console.warn('Logout failed on backend, cleaning locally.');
    } finally {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      window.location.reload();
    }
  },

  // =========================================================================
  // 1. STANDARD LABS
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
    return authService.loginModern(data.email, data.password, 'v2', data.rememberMe);
  },

  // =========================================================================
  // 2. LEVEL 5: FIDO2 / WEBAUTHN (FIXED PERSISTENCE)
  // =========================================================================

  fidoLoginWithPassword: async (email, password, rememberMe = false) => {
    const res = await axios.post('/auth/fido/login-pwd', { email, password });
    if (res.data.token) authService._handlePersistence(res.data.token, rememberMe);
    return { ...res.data, rememberMe };
  },

  fidoRegister: async (email, rememberMe = false) => {
    const optsRes = await axios.post('/auth/fido/register/start', { email });
    const attResp = await startRegistration({ optionsJSON: optsRes.data });
    const verifyRes = await axios.post('/auth/fido/register/finish', { email, data: attResp });
    
    // CRITICAL: Save session after enrollment
    if (verifyRes.data.token) authService._handlePersistence(verifyRes.data.token, rememberMe);
    return verifyRes.data;
  },

  fidoLogin: async (email, rememberMe = false) => {
    const optsRes = await axios.post('/auth/fido/login/start', { email });
    const assertResp = await startAuthentication({ optionsJSON: optsRes.data });
    const verifyRes = await axios.post('/auth/fido/login/finish', { email, data: assertResp });
    
    // CRITICAL: Save session after verification
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
  // 3. MFA & ADMIN
  // =========================================================================

  verifyMfa: async (data) => {
    const res = await axios.post('/auth/mfa/verify', data);
    if (res.data.token) authService._handlePersistence(res.data.token, data.rememberMe);
    return res.data;
  },

  enableMFA: (data) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return axios.post('/auth/mfa/enable', data, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);
  },

  disableMFA: (data) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return axios.post('/auth/mfa/disable', data, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);
  },

  loginAdmin: (creds) => axios.post('/auth/admin/login', creds).then(res => {
    if (res.data.token) localStorage.setItem('auth_token', res.data.token);
    return res.data;
  }),

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