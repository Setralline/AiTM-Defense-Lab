import axios from '../api/axios';

/**
 * Centralized Authentication & Admin Service.
 * Manages hybrid session persistence and administrative gateway operations.
 */
const authService = {
  
  // ==========================================
  // 0. SESSION MANAGEMENT
  // ==========================================

  /**
   * Session Persistence
   * Retrieves the current user profile by checking both Persistent (Local) 
   * and Temporary (Session) storage for a valid token.
   */
  getCurrentUser: async () => {
    // Check for token in both storage tiers to support "Remember Me" logic
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    const config = token 
      ? { headers: { Authorization: `Bearer ${token}` } } 
      : {};

    const response = await axios.get('/auth/me', config);
    return response.data;
  },

  // ==========================================
  // 1. AUTHENTICATION STRATEGIES
  // ==========================================

  /**
   * LEVEL 1: Legacy Authentication (Cookie-Based)
   * Sends data as URL-encoded form parameters.
   */
  loginLevel1: async (formData) => {
    const response = await axios.post('/auth/level1', formData);
    return response.data;
  },

  /**
   * LEVEL 2: Modern Authentication (Token-Based)
   * Sends data as JSON payload.
   */
  loginLevel2: async (data) => {
    const response = await axios.post('/auth/level2', data);
    return response.data;
  },

  // ==========================================
  // 2. MULTI-FACTOR AUTHENTICATION
  // ==========================================

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

  // ==========================================
  // 3. ADMINISTRATIVE OPERATIONS
  // ==========================================

  /**
   * Admin Gateway Authentication
   * Authenticates against hardcoded lab credentials.
   */
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
   * Permanent termination of a user account.
   */
  deleteUser: async (userId) => {
    const response = await axios.delete(`/auth/admin/users/${userId}`);
    return response.data;
  }
};

export default authService;