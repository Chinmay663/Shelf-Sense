import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Products
export const getProducts = (params) => api.get('/products', { params });
export const getProductByBarcode = (barcode) => api.get(`/products/barcode/${barcode}`);
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const getLowStockProducts = () => api.get('/products/status/low-stock');
export const bulkUpdateStock = (data) => api.post('/products/bulk-update', data);

// Categories
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Transactions
export const getTransactions = (params) => api.get('/transactions', { params });
export const createTransaction = (data) => api.post('/transactions', data);
export const getTransaction = (id) => api.get(`/transactions/${id}`);

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getStockTrends = () => api.get('/dashboard/trends');
export const getCategoryDistribution = () => api.get('/dashboard/category-distribution');
export const getTopProducts = () => api.get('/dashboard/top-products');
export const getRecentActivity = () => api.get('/dashboard/recent-activity');

// Quick Items
export const getQuickItems = () => api.get('/quick-items');
export const createQuickItem = (data) => api.post('/quick-items', data);
export const updateQuickItem = (id, data) => api.put(`/quick-items/${id}`, data);
export const useQuickItem = (id) => api.post(`/quick-items/${id}/use`);
export const deleteQuickItem = (id) => api.delete(`/quick-items/${id}`);

export default api;
