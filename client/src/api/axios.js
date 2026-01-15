import axios from 'axios';

const BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://your-production-api.com'
  : 'http://localhost:5000';

// Create a configured Axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // IMPORTANT: Allows sending/receiving cookies (Session IDs)
});

// Security: Response Interceptor to handle global errors (e.g., token expiration)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Basic error sanitization to prevent leaking stack traces to UI
    console.error('API Error:', error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;