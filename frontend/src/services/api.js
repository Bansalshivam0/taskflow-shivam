import axios from 'axios';

// Call the Go API directly. CORS allows localhost dev origins; the Vite /api proxy
// was returning 405 for some routes (POST/DELETE), so we avoid it for API traffic.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
