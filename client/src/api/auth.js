import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Register a new user
 */
export const registerUser = async ({ name, email, password }) => {
  const response = await authApi.post('/auth/register', { name, email, password });
  return response.data;
};

/**
 * Login user with credentials
 */
export const loginUser = async ({ email, password }) => {
  const response = await authApi.post('/auth/login', { email, password });
  return response.data;
};

/**
 * Get currently authenticated user profile
 */
export const getMe = async (token) => {
  const response = await authApi.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
