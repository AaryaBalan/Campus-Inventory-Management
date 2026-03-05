import storage from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'citil_auth_token';

// ── Token Helpers ─────────────────────────────────────────────────────────────
export const storeToken = async (t) => storage.setItem(TOKEN_KEY, t);
export const getToken = async () => storage.getItem(TOKEN_KEY);
export const removeToken = async () => storage.removeItem(TOKEN_KEY);

// ── AsyncStorage Cache Helpers ────────────────────────────────────────────────
export const cacheSet = async (key, data) => {
    try { await AsyncStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch (_) { }
};
export const cacheGet = async (key, maxAge = 5 * 60 * 1000) => {
    try {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        return Date.now() - ts < maxAge ? data : null;
    } catch (_) { return null; }
};

// ── Core Fetch ────────────────────────────────────────────────────────────────
const request = async (method, path, body = null, headers = {}) => {
    const token = await getToken();
    const h = { 'Content-Type': 'application/json', ...headers };
    if (token) h['Authorization'] = `Bearer ${token}`;

    const cfg = { method, headers: h };
    if (body && method !== 'GET') cfg.body = JSON.stringify(body);

    try {
        const res = await fetch(`${BASE_URL}${path}`, cfg);
        if (res.status === 401) { await removeToken(); throw new Error('UNAUTHORIZED'); }
        if (res.status === 204) return null;
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
        return data;
    } catch (err) {
        if (err.message === 'Network request failed') throw new Error('Cannot connect to server. Check your connection.');
        throw err;
    }
};

export const api = {
    get: (path, h) => request('GET', path, null, h),
    post: (path, b, h) => request('POST', path, b, h),
    put: (path, b, h) => request('PUT', path, b, h),
    patch: (path, b, h) => request('PATCH', path, b, h),
    delete: (path, h) => request('DELETE', path, null, h),
};

// ── Domain Helpers ────────────────────────────────────────────────────────────
export const authApi = {
    getMe: () => api.get('/auth/me'),
    verify: () => api.get('/auth/verify'),
};

export const assetsApi = {
    list: (q = '') => api.get(`/assets${q}`),
    get: (id) => api.get(`/assets/${id}`),
    create: (d) => api.post('/assets', d),
    update: (id, d) => api.put(`/assets/${id}`, d),
    transfer: (id, d) => api.post(`/assets/${id}/transfer`, d),
    movements: (id) => api.get(`/assets/${id}/movements`),
    verifyQR: (token) => api.get(`/assets/qr/verify?token=${token}`),
};

export const inventoryApi = {
    list: (q = '') => api.get(`/inventory${q}`),
    get: (id) => api.get(`/inventory/${id}`),
    create: (d) => api.post('/inventory', d),
    update: (id, d) => api.put(`/inventory/${id}`, d),
    adjust: (id, d) => api.post(`/inventory/${id}/adjust`, d),
    lowStock: () => api.get('/inventory/low-stock'),
    trends: () => api.get('/inventory/consumption-trends'),
};

export const procurementApi = {
    list: (q = '') => api.get(`/purchase-requests${q}`),
    get: (id) => api.get(`/purchase-requests/${id}`),
    create: (d) => api.post('/purchase-requests', d),
    submit: (id) => api.post(`/purchase-requests/${id}/submit`),
    approve: (id, d) => api.post(`/purchase-requests/${id}/approve`, d),
    reject: (id, d) => api.post(`/purchase-requests/${id}/reject`, d),
    queue: () => api.get('/approval-queue'),
};

export const analyticsApi = {
    dashboard: () => api.get('/analytics/dashboard'),
    assets: () => api.get('/analytics/assets'),
    inventory: () => api.get('/analytics/inventory'),
    procurement: () => api.get('/analytics/procurement'),
    shortages: () => api.get('/predictions/shortages'),
    anomalies: () => api.get('/predictions/anomalies'),
    forecast: () => api.get('/predictions/demand-forecast'),
    reorder: () => api.get('/predictions/reorder-suggestions'),
};

export const alertsApi = {
    list: () => api.get('/alerts'),
    active: () => api.get('/alerts/active'),
    acknowledge: (id) => api.post(`/alerts/${id}/acknowledge`),
    resolve: (id) => api.post(`/alerts/${id}/resolve`),
};

export const notificationsApi = {
    list: () => api.get('/notifications'),
    markRead: (id) => api.patch(`/notifications/${id}/read`),
    markAll: () => api.patch('/notifications/read-all'),
    delete: (id) => api.delete(`/notifications/${id}`),
    clearAll: () => api.delete('/notifications'),
};

export const billsApi = {
    list: () => api.get('/bills'),
    get: (id) => api.get(`/bills/${id}`),
    update: (id, d) => api.put(`/bills/${id}`, d),
    delete: (id) => api.delete(`/bills/${id}`),
};

export const auditApi = {
    list: (q = '') => api.get(`/audit-logs${q}`),
    byAsset: (id) => api.get(`/audit-logs/by-asset/${id}`),
    byUser: (id) => api.get(`/audit-logs/by-user/${id}`),
};

export default api;
