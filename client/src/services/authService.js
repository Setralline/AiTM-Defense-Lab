import axios from '../api/axios';

/**
 * Centralized Authentication & Administrative Service.
 * This service orchestrates hybrid session management, multi-tier login strategies,
 * and server-side session revocation for the Phishing Security Lab.
 */
const authService = {
  
  // =========================================================================
  // 0. SESSION LIFECYCLE MANAGEMENT
  // =========================================================================

  /**
   * Retrieves the current user profile.
   * Cross-references local JWT storage for Level 2 and relies on HttpOnly cookies 
   * for Level 1 persistence.
   */
  getCurrentUser: async () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    // Level 2 requires explicit Authorization header, Level 1 uses automated cookie-drift.
    const config = token 
      ? { headers: { Authorization: `Bearer ${token}` } } 
      : {};

    const response = await axios.get('/auth/me', config);
    return response.data;
  },

  /**
   * Synchronized Session Termination (Active Revocation).
   * Notifies the backend to blacklist the current JWT/Cookie before 
   * performing a full client-side state cleanup.
   */
  logout: async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      // Signals the server to record the session ID in the revocation list.
      await axios.post('/auth/logout', {}, config);
    } catch (err) {
      console.warn('Backend revocation unreachable, proceeding with client cleanup:', err.message);
    } finally {
      // Purge tokens and force redirect to reset the application state.
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
  },

  // =========================================================================
  // 1. AUTHENTICATION STRATEGIES (Hybrid Tiers)
  // =========================================================================

  /**
   * LEVEL 1: Legacy Authentication (Simulated Form Submission).
   * FIXED: Enforces 'x-www-form-urlencoded' to prevent JSON parsing conflicts 
   * on the server-side middleware stack.
   */
  loginLevel1: async (formData) => {
    const response = await axios.post('/auth/level1', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data;
  },

  /**
   * LEVEL 2: Modern Authentication (Stateless JWT Approach).
   * Manages JWT issuance and conditional persistence based on user preference.
   */
  loginLevel2: async (data) => {
    const response = await axios.post('/auth/level2', data);
    
    if (response.data.success && response.data.token) {
        const storage = data.rememberMe ? localStorage : sessionStorage;
        storage.setItem('auth_token', response.data.token);
    }
    
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