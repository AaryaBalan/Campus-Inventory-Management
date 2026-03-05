import { auth } from '../config/firebase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Core fetch wrapper — attaches the current user's Firebase ID token automatically.
 * Throws a structured error on non-2xx responses.
 */
async function request(path, options = {}, timeoutMs = 15000) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };

    // Attach auth token if a user is signed in
    if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Abort after timeoutMs so the UI never hangs forever
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers,
            signal: controller.signal,
        });

        if (!res.ok) {
            let errBody;
            try { errBody = await res.json(); } catch (_) { errBody = {}; }
            const err = new Error(errBody.error || `Request failed: ${res.status}`);
            err.status = res.status;
            err.details = errBody.details;
            throw err;
        }

        if (res.status === 204) return null;
        return res.json();
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('Request timed out — the server took too long to respond');
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

// ── Convenience methods ─────────────────────────────────────────────────────

export const api = {
    get: (path) => request(path, { method: 'GET' }),
    post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
    put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
    patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (path) => request(path, { method: 'DELETE' }),
};

// ── Domain helpers (mirrors backend routes) ─────────────────────────────────

export const inventoryApi = {
    list: (params = {}) => api.get('/inventory?' + new URLSearchParams(params)),
    get: (id) => api.get(`/inventory/${id}`),
    create: (data) => api.post('/inventory', data),
    update: (id, data) => api.put(`/inventory/${id}`, data),
    adjust: (id, data) => api.post(`/inventory/${id}/adjust`, data),
    movements: (id) => api.get(`/inventory/${id}/movements`),
    lowStock: () => api.get('/inventory/low-stock'),
    trends: (id, days) => api.get(`/inventory/consumption-trends?inventoryId=${id}&days=${days || 90}`),
    reorder: (inventoryId) => api.post('/inventory/reorder', { inventoryId }),
};

export const assetApi = {
    list: (params = {}) => api.get('/assets?' + new URLSearchParams(params)),
    get: (id) => api.get(`/assets/${id}`),
    create: (data) => api.post('/assets', data),
    update: (id, data) => api.put(`/assets/${id}`, data),
    transfer: (id, data) => api.post(`/assets/${id}/transfer`, data),
    retire: (id, reason) => api.delete(`/assets/${id}`, { reason }),
    movements: (id) => api.get(`/assets/${id}/movements`),
    bulkCreate: (assets) => api.post('/assets/bulk-register', assets),
    verifyQR: (qrValue) => api.post('/assets/verify', { qrValue }),
    qrCode: (id) => api.get(`/assets/${id}/qr`),
    // CITRA lifecycle events
    events: (id, limit) => api.get(`/assets/${id}/events${limit ? `?limit=${limit}` : ''}`),
    eventSummary: (id) => api.get(`/assets/${id}/events/summary`),
};

export const procurementApi = {
    list: (params = {}) => api.get('/purchase-requests?' + new URLSearchParams(params)),
    get: (id) => api.get(`/purchase-requests/${id}`),
    create: (data) => api.post('/purchase-requests', data),
    submit: (id) => api.post(`/purchase-requests/${id}/submit`),
    approve: (id, data) => api.post(`/purchase-requests/${id}/approve`, data),
    reject: (id, data) => api.post(`/purchase-requests/${id}/reject`, data),
    history: (id) => api.get(`/purchase-requests/${id}/approval-history`),
    queue: () => api.get('/approval-queue'),
};

export const alertsApi = {
    list: (params = {}) => api.get('/alerts?' + new URLSearchParams(params)),
    active: () => api.get('/alerts/active'),
    get: (id) => api.get(`/alerts/${id}`),
    acknowledge: (id) => api.post(`/alerts/${id}/acknowledge`),
    resolve: (id, data) => api.post(`/alerts/${id}/resolve`, data),
};

export const analyticsApi = {
    dashboard: () => api.get('/analytics/dashboard'),
    assets: () => api.get('/analytics/assets'),
    inventory: () => api.get('/analytics/inventory'),
    procurement: () => api.get('/analytics/procurement'),
    shortages: () => api.get('/predictions/shortages'),
    reorderTips: () => api.get('/predictions/reorder-suggestions'),
    anomalies: () => api.get('/predictions/anomalies'),
    demandForecast: () => api.get('/predictions/demand-forecast'),
    // CITRA: precise reorder timing with safety-stock & velocity trend
    reorderTiming: (leadDays) => api.get(`/predictions/reorder-timing${leadDays ? `?leadDays=${leadDays}` : ''}`),
};

export const auditApi = {
    logs: (params = {}) => api.get('/audit-logs?' + new URLSearchParams(params)),
    byAsset: (id) => api.get(`/audit-logs/by-asset/${id}`),
    byUser: (id) => api.get(`/audit-logs/by-user/${id}`),
    report: (data) => api.post('/reports/audit', data),
    export: (data) => api.post('/reports/export', data),
};

// CITRA Audit Mode
export const auditSessionsApi = {
    list: (params = {}) => api.get('/audit-sessions?' + new URLSearchParams(params)),
    start: (data) => api.post('/audit-sessions', data),
    get: (id) => api.get(`/audit-sessions/${id}`),
    scan: (id, data) => api.post(`/audit-sessions/${id}/scan`, data),
    close: (id) => api.post(`/audit-sessions/${id}/close`, {}),
    report: (id) => api.get(`/audit-sessions/${id}/report`),
};

export const locationsApi = {
    list: () => api.get('/locations'),
    get: (id) => api.get(`/locations/${id}`),
    create: (data) => api.post('/locations', data),
    update: (id, data) => api.put(`/locations/${id}`, data),
    mapData: () => api.get('/locations/map-data'),
    assets: (id) => api.get(`/locations/${id}/assets`),
};

export const notificationsApi = {
    list: () => api.get('/notifications'),
    markRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllRead: () => api.patch('/notifications/read-all'),
    delete: (id) => api.delete(`/notifications/${id}`),
    clearAll: () => api.delete('/notifications'),
};

// ── Bill Extractor ──────────────────────────────────────────────────────────

/**
 * Multipart upload wrapper — lets the browser set Content-Type + boundary automatically.
 */
async function requestMultipart(path, formData, timeoutMs = 120000) {
    const headers = {};
    if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method: 'POST',
            headers,
            body: formData,
            signal: controller.signal,
        });

        if (!res.ok) {
            let errBody;
            try { errBody = await res.json(); } catch (_) { errBody = {}; }
            const err = new Error(errBody.error || `Request failed: ${res.status}`);
            err.status = res.status;
            throw err;
        }

        return res.json();
    } catch (err) {
        if (err.name === 'AbortError') throw new Error('OCR timed out — the server took too long. Try a smaller or clearer image.');
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

export const billsApi = {
    extract: (file) => {
        const fd = new FormData();
        fd.append('file', file);
        return requestMultipart('/bills/extract', fd);
    },
    list: () => api.get('/bills'),
    get: (id) => api.get(`/bills/${id}`),
    update: (id, data) => request(`/bills/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => api.delete(`/bills/${id}`),
    // CITRA: fetch draft assets for a saved bill
    draftAssets: (id, { department = '', location = '' } = {}) =>
        api.get(`/bills/${id}/draft-assets?department=${encodeURIComponent(department)}&location=${encodeURIComponent(location)}`),
};

export default api;

