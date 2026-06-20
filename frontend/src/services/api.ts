// src/services/api.ts
import axios from 'axios';
// @ts-ignore
const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
});

// Interceptor de Solicitudes (Request)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Respuestas (Response)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config.url?.includes(API_URL)) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { name: string; email: string; password: string; monthlyIncome?: number }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data: Partial<{ name: string; monthlyIncome: number }>) =>
    api.put('/auth/profile', data),
}

export const transactionApi = {
  list: (params?: Record<string, string | number>) =>
    api.get('/transactions', { params }),
  create: (data: Record<string, unknown>) => api.post('/transactions', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/transactions/${id}`, data),
  remove: (id: string) => api.delete(`/transactions/${id}`),
  exportCSV: (params?: Record<string, string | number>) =>
    api.get('/transactions/export', { params, responseType: 'blob' }),
}

export const dashboardApi = {
  getSummary: (month?: number, year?: number) =>
    api.get('/dashboard', { params: { month, year } }),
  getTrend: () => api.get('/dashboard/trend'),
}

export const budgetApi = {
  list: (month?: number, year?: number) =>
    api.get('/budgets', { params: { month, year } }),
  upsert: (data: Record<string, unknown>) => api.post('/budgets', data),
  remove: (id: string) => api.delete(`/budgets/${id}`),
}

export const categoryApi = {
  list: () => api.get('/categories'),
  create: (data: { name: string; icon?: string; color?: string }) =>
    api.post('/categories', data),
}

export const goalApi = {
  list: () => api.get('/goals'),
  create: (data: Record<string, unknown>) => api.post('/goals', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/goals/${id}`, data),
  remove: (id: string) => api.delete(`/goals/${id}`),
}

export const alertApi = {
  list: () => api.get('/alerts'),
  markRead: (id: string) => api.put(`/alerts/${id}/read`),
  markAllRead: () => api.put('/alerts/read-all'),
}

export default api
