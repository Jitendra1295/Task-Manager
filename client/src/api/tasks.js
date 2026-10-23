import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Automatically inject Bearer token into outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('task_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized responses (token expiration)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('task_token');
      localStorage.removeItem('task_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

/**
 * Fetch all tasks, optionally filtered by status ('all', 'pending', 'completed')
 */
export const fetchTasks = async (status) => {
  const params = {};
  if (status && status !== 'all') {
    params.status = status;
  }
  const response = await api.get('/tasks', { params });
  return response.data.data;
};

/**
 * Create a new task
 */
export const createTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data.data;
};

/**
 * Update an existing task (title, description, or status)
 */
export const updateTask = async (id, updates) => {
  const response = await api.patch(`/tasks/${id}`, updates);
  return response.data.data;
};

/**
 * Delete a task by ID
 */
export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};
