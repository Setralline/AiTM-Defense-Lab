import axios from 'axios';

/**
 * ------------------------------------------------------------------
 * API GATEWAY CONFIGURATION
 * ------------------------------------------------------------------
 * This instance acts as the central communication bridge between 
 * the React Client (Victim UI) and the Node.js Backend.
 */

// 1. Environment-Aware Base URL
// Ensures seamless switching between Development (Localhost) and Production.
const BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://your-production-api.com'
  : 'http://localhost:5000';

/**
 * Configured Axios Instance
 * Designed to support Hybrid Authentication (Cookies + Tokens).
 */
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  
  // CRITICAL: Enables transmission of HttpOnly cookies (Session ID) for Level 1.
  withCredentials: true,

  // NOTE: We deliberately removed the default 'Content-Type' header.
  // This allows specific services (Level 1 vs Level 2) to define their own 
  // payload types (Form Data vs JSON) without global conflicts.
  headers: {
    'Accept': 'application/json', // We always expect structured JSON responses.
  },
});

/**
 * ------------------------------------------------------------------
 * RESPONSE INTERCEPTOR (The Security Guard)
 * ------------------------------------------------------------------
 * Handles global error states and enforces session termination policies.
 */
axiosInstance.interceptors.response.use(
  (response) => {
    // If the request succeeds, pass the response through transparently.
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // CHECK: Is this error coming from the initial session check?
    // If yes, we expect a 401 (user not logged in yet), so we SHOULD NOT redirect.
    const isSessionCheck = originalRequest.url && originalRequest.url.includes('/auth/me');

    // 2. Active Session Termination Logic
    // Only trigger if it's a real unauthorized error (not just a session check)
    if (error.response?.status === 401 && !originalRequest._retry && !isSessionCheck) {
      console.warn('[Security Protocol] Session terminated by server. Purging local state.');
      
      // A. Purge any stored tokens (Level 2 artifacts)
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      
      // B. Force Redirect to Home Base
      // Redirect to '/' because '/login' does not exist in our routing map.
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    // 3. Error Sanitization (Security Best Practice)
    // Extract a clean message for the UI to display, hiding raw server traces.
    const cleanMessage = error.response?.data?.message || 'Connection to secure server failed.';
    
    // Attach the clean message to the error object for easy access in React components.
    error.sanitizedMessage = cleanMessage;
    
    return Promise.reject(error);
  }
);

export default axiosInstance;