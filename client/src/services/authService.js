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
   * Retrieves the current user profile by checking for valid session credentials.
   */
  getCurrentUser: async () => {
    // For Level 2 (JWT), we check storage tiers; Level 1 uses HttpOnly cookies automatically via axios
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    const config = token 
      ? { headers: { Authorization: `Bearer ${token}` } } 
      : {};

    const response = await axios.get('/auth/me', config);
    return response.data;
  },

  /**
   * Terminate Session
   * Triggers backend to clear HttpOnly cookies and prepares for client-side state cleanup.
   */
  logout: async () => {
    const response = await axios.post('/auth/logout');
    
    // Clear Level 2 local tokens if present
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    
    return response.data;
  },

  // ==========================================
  // 1. AUTHENTICATION STRATEGIES
  // ==========================================

  /**
   * LEVEL 1: Legacy Authentication (Cookie-Based)
   * Sends data as URL-encoded form parameters to simulate older systems.
   */
  loginLevel1: async (formData) => {
    const response = await axios.post('/auth/level1', formData);
    return response.data;
  },

  /**
   * LEVEL 2: Modern Authentication (Token-Based)
   * Sends data as JSON payload for stateless JWT authentication.
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
   * Permanent deletion of a user account.
   */
  deleteUser: async (userId) => {
    const response = await axios.delete(`/auth/admin/users/${userId}`);
    return response.data;
  }
};

export default authService;