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
  withCredentials: true,
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
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // CHECK 1: Is this a session check? (Don't redirect guests)
    const isSessionCheck = originalRequest.url && originalRequest.url.includes('/auth/me');

    // [FIX] CHECK 2: Is this a Login Attempt?
    // We must NOT redirect on login failures (wrong password), 
    // otherwise the user sees no error message.
    const isLoginAttempt = originalRequest.url && (
      originalRequest.url.includes('/auth/level') ||      // Level 1-4 Logins
      originalRequest.url.includes('/auth/fido/login') || // FIDO2 Login
      originalRequest.url.includes('/auth/admin/login')   // Admin Login
    );

    // 2. Active Session Termination Logic
    // Only redirect if it's NOT a login attempt and NOT a session check
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isSessionCheck &&
      !isLoginAttempt // <--- ADDED THIS CHECK
    ) {
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
    // Pass the specific error message (e.g., "Invalid credentials") to the UI
    const cleanMessage = error.response?.data?.message || 'Secure connection failed.';
    error.sanitizedMessage = cleanMessage;

    return Promise.reject(error);
  }
);

export default axiosInstance;