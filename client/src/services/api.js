/**
 * api.js — Axios HTTP Client Instance
 *
 * Pre-configured Axios instance used for all API calls to the backend.
 * Handles authentication token injection and global 401 error handling.
 *
 * Base URL: /api
 *   In development, Vite proxies /api → http://localhost:5000 (see vite.config.js)
 *   In production, the hosting platform handles the proxy or CORS
 *
 * Interceptors:
 *   Request  — Attaches the JWT Bearer token from localStorage to every request
 *   Response — On 401 Unauthorized, clears auth data and redirects to /signin
 */

import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

/**
 * Request interceptor — Inject the auth token into every outgoing request.
 *
 * Reads auth_token from localStorage on each request (not cached at startup)
 * so it always reflects the current login state.
 */
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Response interceptor — Handle 401 Unauthorized globally.
 *
 * When the server returns 401 (expired/invalid token), automatically:
 *  1. Clear all auth-related data from localStorage
 *  2. Redirect the user to the sign-in page
 *
 * This prevents the user from being stuck in a broken authenticated state.
 */
api.interceptors.response.use(
  res => res, // pass through successful responses unchanged
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('agrobot_conversationId');
      window.location.href = '/signin'; // hard redirect to clear React state
    }
    return Promise.reject(err);
  }
);

export default api;
