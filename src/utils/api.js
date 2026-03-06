import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'citil_auth_token';

// ── Token Storage Helpers ─────────────────────────────────────────────────────
export const storeToken = async (token) => {
    if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
    } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
};

export const getToken = async () => {
    if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async () => {
    if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
    } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
};

// ── Axios Instance ────────────────────────────────────────────────────────────
const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Request Interceptor ───────────────────────────────────────────────────
apiClient.interceptors.request.use(
    async (config) => {
        const token = await getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response Interceptor ────────────────────────
apiClient.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        if (error.response?.status === 401) {
            await removeToken();
        }
        return Promise.reject(error);
    }
);

// ── Domain Helpers ────────────────────────────────────────────────────────────
export const authAPI = {
    getProfile: () => apiClient.get('/auth/profile'),
    getMe: () => apiClient.get('/auth/me'),
};

export const assetsAPI = {
    getAssets: (params) => apiClient.get('/assets', { params }),
    getAssetById: (id) => apiClient.get(`/assets/${id}`),
    create: (data) => apiClient.post('/assets', data),
    update: (id, data) => apiClient.put(`/assets/${id}`, data),
};

export const inventoryAPI = {
    getInventory: () => apiClient.get('/inventory'),
    getLowStock: () => apiClient.get('/inventory/low-stock'),
    update: (id, data) => apiClient.put(`/inventory/${id}`, data),
};

export const procurementAPI = {
    getRequests: () => apiClient.get('/purchase-requests'),
    getRequestById: (id) => apiClient.get(`/purchase-requests/${id}`),
    create: (data) => apiClient.post('/purchase-requests', data),
    getQueue: () => apiClient.get('/approval-queue'),
};

export const notificationsAPI = {
    getNotifications: () => apiClient.get('/notifications'),
    markRead: (id) => apiClient.patch(`/notifications/${id}/read`),
};

export const analyticsAPI = {
    getDashboard: () => apiClient.get('/analytics/dashboard'),
};

export default apiClient;
