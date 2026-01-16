import axios from '../api/axios';

/**
 * ------------------------------------------------------------------
 * AUTHENTICATION SERVICE LAYER
 * ------------------------------------------------------------------
 * This service acts as the orchestration engine for the Phishing Defense Lab.
 * It manages the complex "Hybrid Architecture" by bridging:
 * 1. Legacy Cookie-based Authentication (Level 1)
 * 2. Modern Token-based Authentication (Level 2)
 * 3. Active Session Revocation & Admin Operations
 */

const authService = {

  // =========================================================================
  // 0. SESSION LIFECYCLE & STATE MANAGEMENT
  // =========================================================================

  /**
   * Retrieves the current user's profile to validate session integrity.
   * * Strategy:
   * - Checks for JWT in local storage (Level 2).
   * - Relies on automated browser cookie transmission for Level 1.
   */
  getCurrentUser: async () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    // Conditional Header Injection:
    // Only attach 'Authorization' header if a token exists (Level 2).
    // Level 1 requests will automatically carry the HttpOnly cookie.
    const config = token 
      ? { headers: { Authorization: `Bearer ${token}` } } 
      : {};

    const response = await axios.get('/auth/me', config);
    return response.data;
  },

  /**
   * Active Session Revocation (The Kill Switch).
   * * Security Protocol:
   * 1. Attempts to notify the backend to blacklist the session (Server-side revocation).
   * 2. GUARANTEES client-side cleanup via the 'finally' block, ensuring the user 
   * is logged out locally even if the network fails.
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
   * * Technical Note:
   * We explicitly override the Content-Type to 'application/x-www-form-urlencoded'.
   * This prevents the server's JSON parser from crashing and accurately simulates
   * legacy web traffic patterns.
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
   * LEVEL 2: Modern Simulation (JWT/Stateless).
   * * Technical Note:
   * Handles the reception of the JWT and persists it in client storage.
   * This simulates the vulnerability of tokens to XSS if not handled correctly.
   */
  loginLevel2: async (data) => {
    const response = await axios.post('/auth/level2', data);
    
    // Persist token based on "Remember Me" preference
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