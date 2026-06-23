// src/services/api.js
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Request interceptor: attach token ----
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response interceptor: handle 401 ----
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { token, logout, setToken } = useAuthStore.getState();
        const res = await axios.post(`${BASE_URL}/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setToken(res.data.token);
        original.headers.Authorization = `Bearer ${res.data.token}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ---- Typed API modules ----
export const authApi = {
  login:   (data) => api.post('/auth/login', data),
  register:(data) => api.post('/auth/register', data),
};

export const productApi = {
  getAll:     (params) => api.get('/products', { params }),
  getById:    (id)     => api.get(`/products/${id}`),
  getByBarcode:(b)     => api.get(`/products/barcode/${b}`),
  create:     (data)   => api.post('/products', data),
  update:     (id, d)  => api.put(`/products/${id}`, d),
  adjustStock:(id, q, type, notes) =>
    api.patch(`/products/${id}/stock`, null, { params: { quantity: q, movementType: type, notes } }),
  deactivate: (id)     => api.delete(`/products/${id}`),
  getLowStock:()       => api.get('/products/low-stock'),
};

export const saleApi = {
  create:     (data)   => api.post('/sales', data),
  getAll:     (params) => api.get('/sales', { params }),
  getById:    (id)     => api.get(`/sales/${id}`),
  getReceipt: (num)    => api.get(`/sales/receipt/${num}`),
  voidSale:   (id, reason) =>
    api.post(`/sales/${id}/void`, null, { params: { reason } }),
  mySales:    (params) => api.get('/sales/my-sales', { params }),
};

export const reportApi = {
  daily:       (date)        => api.get('/reports/daily', { params: { date } }),
  sales:       (from, to)    => api.get('/reports/sales', { params: { from, to } }),
  topProducts: (limit, from, to) =>
    api.get('/reports/top-products', { params: { limit, from, to } }),
  cashierPerf: (from, to)    => api.get('/reports/cashier-performance', { params: { from, to } }),
};

export const userApi = {
  getAll:  ()       => api.get('/users'),
  getById: (id)     => api.get(`/users/${id}`),
  create:  (data)   => api.post('/users', data),
  update:  (id, d)  => api.put(`/users/${id}`, d),
  toggle:  (id)     => api.patch(`/users/${id}/toggle-active`),
};

export const categoryApi = {
  getAll:  () => api.get('/categories'),
  create:  (data) => api.post('/categories', data),
};
