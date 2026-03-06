import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateMockAssets, generateMockInventory, generateMockNotifications } from './mockDataGenerator';

const DB_KEYS = {
    ASSETS: 'citil_local_assets',
    INVENTORY: 'citil_local_inventory',
    NOTIFS: 'citil_local_notifications',
    DEMO_MODE: 'citil_demo_mode',
    INITIALIZED: 'citil_db_initialized'
};

export const localDatabase = {
    // Initialize DB with mock data if first time
    initialize: async (force = false) => {
        try {
            const isInitialized = await AsyncStorage.getItem(DB_KEYS.INITIALIZED);
            if (!isInitialized || force) {
                console.log('Initializing local database with mock data...');
                const assets = generateMockAssets(1005);
                const inventory = generateMockInventory(500);
                const notifications = generateMockNotifications(30);

                await Promise.all([
                    AsyncStorage.setItem(DB_KEYS.ASSETS, JSON.stringify(assets)),
                    AsyncStorage.setItem(DB_KEYS.INVENTORY, JSON.stringify(inventory)),
                    AsyncStorage.setItem(DB_KEYS.NOTIFS, JSON.stringify(notifications)),
                    AsyncStorage.setItem(DB_KEYS.INITIALIZED, 'true'),
                    AsyncStorage.setItem(DB_KEYS.DEMO_MODE, 'true')
                ]);
                return true;
            }
        } catch (e) {
            console.error('Local DB Init Error:', e);
            return false;
        }
    },

    clear: async () => {
        const keys = Object.values(DB_KEYS);
        await AsyncStorage.multiRemove(keys);
    },

    setDemoMode: async (enabled) => {
        await AsyncStorage.setItem(DB_KEYS.DEMO_MODE, JSON.stringify(enabled));
    },

    isDemoMode: async () => {
        const mode = await AsyncStorage.getItem(DB_KEYS.DEMO_MODE);
        return mode ? JSON.parse(mode) : false;
    },

    // ── Assets ────────────────────────────────────────────────────────────────
    getAssets: async (search = '', filter = {}) => {
        const data = await AsyncStorage.getItem(DB_KEYS.ASSETS);
        let assets = data ? JSON.parse(data) : [];

        if (search) {
            const s = search.toLowerCase();
            assets = assets.filter(a =>
                a.name.toLowerCase().includes(s) ||
                a.id.toLowerCase().includes(s) ||
                a.assetTag.toLowerCase().includes(s)
            );
        }

        if (filter.building) assets = assets.filter(a => a.building === filter.building);
        if (filter.category) assets = assets.filter(a => a.category === filter.category);
        if (filter.status) assets = assets.filter(a => a.status === filter.status);

        return assets;
    },

    getAssetById: async (id) => {
        const data = await AsyncStorage.getItem(DB_KEYS.ASSETS);
        const assets = data ? JSON.parse(data) : [];
        return assets.find(a => a.id === id) || null;
    },

    // ── Inventory ─────────────────────────────────────────────────────────────
    getInventory: async () => {
        const data = await AsyncStorage.getItem(DB_KEYS.INVENTORY);
        return data ? JSON.parse(data) : [];
    },

    getLowStock: async () => {
        const items = await localDatabase.getInventory();
        return items.filter(i => i.currentStock <= i.minStockLevel);
    },

    // ── Notifications ─────────────────────────────────────────────────────────
    getNotifications: async () => {
        const data = await AsyncStorage.getItem(DB_KEYS.NOTIFS);
        return data ? JSON.parse(data) : [];
    },

    markNotifRead: async (id) => {
        const notifs = await localDatabase.getNotifications();
        const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
        await AsyncStorage.setItem(DB_KEYS.NOTIFS, JSON.stringify(updated));
    },

    markAllNotifsRead: async () => {
        const notifs = await localDatabase.getNotifications();
        const updated = notifs.map(n => ({ ...n, read: true }));
        await AsyncStorage.setItem(DB_KEYS.NOTIFS, JSON.stringify(updated));
    },

    saveNotifications: async (notifs) => {
        await AsyncStorage.setItem(DB_KEYS.NOTIFS, JSON.stringify(notifs));
    },

    getDashboardStats: async () => {
        const [assets, inventory, lowStock, notifs] = await Promise.all([
            localDatabase.getAssets(),
            localDatabase.getInventory(),
            localDatabase.getLowStock(),
            localDatabase.getNotifications()
        ]);

        return {
            totalAssets: assets.length,
            totalInventory: inventory.length,
            activeAlerts: lowStock.length + notifs.filter(n => !n.read).length,
            pendingPRs: 8,
            totalPRs: 142,
            approvedPRs: 98,
            rejectedPRs: 12,
            totalSpend: 1250000, // 1.25M
            complianceScore: 94,
            auditScore: 98,
            lowStock: lowStock.slice(0, 5)
        };
    }
};
