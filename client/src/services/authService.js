import axios from '../api/axios';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

/**
 * AUTHENTICATION SERVICE LAYER (STABILIZED v2026)
 * Orchestrates session management across all labs.
 */
const authService = {

  _handlePersistence: (token, rememberMe) => {
    if (!token) return;
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('auth_token', token);
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
    } finally {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      // ✅ FIX: Reload current page to reset state without jumping to another level
      window.location.reload();
    }
  },

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
    if (verifyRes.data.token) authService._handlePersistence(verifyRes.data.token, rememberMe);
    return verifyRes.data;
  },

  fidoLogin: async (email, rememberMe) => {
    const optsRes = await axios.post('/auth/fido/login/start', { email });
    const assertResp = await startAuthentication({ optionsJSON: optsRes.data });
    const verifyRes = await axios.post('/auth/fido/login/finish', { email, data: assertResp });
    if (verifyRes.data.token) authService._handlePersistence(verifyRes.data.token, rememberMe);
    return verifyRes.data;
  },

  fidoDisable: async (email) => axios.post('/auth/fido/disable', { email }).then(res => res.data),

  verifyMfa: async (data) => {
    return await axios.post('/auth/mfa/verify', data).then(res => {
      if (res.data.token) authService._handlePersistence(res.data.token, data.rememberMe);
      return res.data;
    });
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
  getAllUsers: () => axios.get('/auth/admin/users').then(res => res.data),
  createUser: (data) => axios.post('/auth/admin/users', data).then(res => res.data),
  deleteUser: (id) => axios.delete(`/auth/admin/users/${id}`).then(res => res.data)
};

export default authService;