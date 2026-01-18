import axios from 'axios';

/**
 * ------------------------------------------------------------------
 * API GATEWAY CONFIGURATION (AXIOS)
 * ------------------------------------------------------------------
 * Central communication bridge between the Client (Victim UI) and the 
 * Node.js Backend. Handles environment switching and global security policies.
 */

// 1. Environment-Aware Base URL
// - Development: Connects explicitly to the backend port (5000).
// - Production: Uses relative path ('') relying on Nginx/Docker reverse proxying.
const BASE_URL = import.meta.env.MODE === 'production' 
  ? '' 
  : 'http://localhost:5000';

/**
 * Configured Axios Instance
 * Supports Hybrid Authentication:
 * 1. HttpOnly Cookies (Level 1) via 'withCredentials'.
 * 2. Bearer Tokens (Level 2-5) via Authorization headers (injected dynamically).
 */
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  
  // CRITICAL: Enables transmission of HttpOnly cookies (Session ID).
  withCredentials: true,

  // NOTE: 'Content-Type' is left undefined to allow automatic detection 
  // (Form Data for Level 1 vs JSON for Level 2+).
  headers: {
    'Accept': 'application/json',
  },
});

/**
 * ------------------------------------------------------------------
 * RESPONSE INTERCEPTOR (SECURITY GUARD)
 * ------------------------------------------------------------------
 * Enforces session termination policies and sanitizes error messages.
 */
axiosInstance.interceptors.response.use(
  (response) => {
    // Transparently pass successful responses
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // CHECK: Is this error from the initial session hydration check?
    // If yes, we expect a 401 (guest user), so we suppress the redirect.
    const isSessionCheck = originalRequest.url && originalRequest.url.includes('/auth/me');

    // 2. Active Session Termination Logic
    // If a legitimate request returns 401 (Unauthorized), the session is dead.
    if (error.response?.status === 401 && !originalRequest._retry && !isSessionCheck) {
      console.warn('[Security Protocol] Session invalidated by server. Purging local state.');
      
      // A. Purge Client-Side Artifacts (Level 2-5 Tokens)
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      
      // B. Force Security Redirect
      // Uses window.location to force a full browser refresh (clearing memory).
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    // 3. Error Sanitization
    // Mask raw server errors with user-friendly messages for the UI.
    const cleanMessage = error.response?.data?.message || 'Secure connection failed.';
    error.sanitizedMessage = cleanMessage;
    
    return Promise.reject(error);
  }
);

export default axiosInstance;