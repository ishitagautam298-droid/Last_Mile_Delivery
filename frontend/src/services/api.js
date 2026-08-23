import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lastmile_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateAgentStatus: (statusData) => api.put('/auth/agent-status', statusData),
  getAgents: () => api.get('/auth/agents')
};

export const zoneAPI = {
  getZones: () => api.get('/zones'),
  createZone: (data) => api.post('/zones', data),
  updateZone: (id, data) => api.put(`/zones/${id}`, data),
  deleteZone: (id) => api.delete(`/zones/${id}`),
  getAreas: () => api.get('/zones/areas/all'),
  createArea: (data) => api.post('/zones/areas', data),
  deleteArea: (id) => api.delete(`/zones/areas/${id}`),
  lookupArea: (pincode, area) => api.get(`/zones/areas/lookup?pincode=${pincode || ''}&area=${area || ''}`)
};

export const rateCardAPI = {
  getRateCards: () => api.get('/rate-cards'),
  createRateCard: (data) => api.post('/rate-cards', data),
  updateRateCard: (id, data) => api.put(`/rate-cards/${id}`, data),
  deleteRateCard: (id) => api.delete(`/rate-cards/${id}`),
  calculateQuote: (params) => api.post('/rate-cards/calculate-quote', params)
};

export const orderAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: (params) => api.get('/orders', { params }),
  getMyOrders: () => api.get('/orders/my-orders'),
  getAgentTasks: () => api.get('/orders/agent-tasks'),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, statusData) => api.put(`/orders/${id}/status`, statusData),
  autoAssign: (id) => api.post(`/orders/${id}/auto-assign`),
  manualAssign: (id, agentId) => api.post(`/orders/${id}/manual-assign`, { agentId }),
  rescheduleOrder: (id, rescheduleData) => api.post(`/orders/${id}/reschedule`, rescheduleData),
  overrideStatus: (id, overrideData) => api.put(`/orders/${id}/override`, overrideData)
};

export const trackingAPI = {
  trackOrder: (trackingNumber) => api.get(`/track/${trackingNumber}`),
  getNotifications: (trackingNumber) => api.get(`/track/${trackingNumber}/notifications`)
};

export const analyticsAPI = {
  getDashboardMetrics: () => api.get('/analytics/dashboard')
};

export default api;
