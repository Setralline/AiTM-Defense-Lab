import axios from 'axios';

// Determine the API base URL based on the environment
const BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://your-production-api.com'
  : 'http://localhost:5000';

/**
 * Configured Axios Instance
 * withCredentials is set to true to handle HttpOnly cookies for Level 1.
 */
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to manage global response behavior and error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for 401 Unauthorized errors (Session expired or terminated)
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized access detected.');
      // You can trigger a redirect to login here if needed
    }

    // Sanitize error messages to avoid leaking sensitive server details in the UI
    const errorMessage = error.response?.data?.message || 'A network error occurred';
    console.error('API Error Interface:', errorMessage);
    
    return Promise.reject(error);
  }
);

export default axiosInstance;