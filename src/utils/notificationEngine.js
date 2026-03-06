import { localDatabase } from './localDatabase';

export const notificationEngine = {
    // Run simulation check
    simulate: async () => {
        try {
            console.log('Running notification simulation...');
            const [inventory, assets] = await Promise.all([
                localDatabase.getInventory(),
                localDatabase.getAssets()
            ]);

            const newNotifs = [];

            // 1. Low stock check
            const lowStockItems = inventory.filter(i => i.currentStock <= i.minStockLevel);
            lowStockItems.slice(0, 3).forEach(item => {
                newNotifs.push({
                    id: `SIM-LS-${Date.now()}-${item.id}`,
                    title: 'Low Stock Alert',
                    body: `${item.name} is running low (${item.currentStock} units left).`,
                    type: 'inventory',
                    read: false,
                    createdAt: { _seconds: Math.floor(Date.now() / 1000) }
                });
            });

            // 2. Maintenance check (simulation based on status)
            const maintenanceAssets = assets.filter(a => a.status === 'In Maintenance');
            maintenanceAssets.slice(0, 2).forEach(asset => {
                newNotifs.push({
                    id: `SIM-MT-${Date.now()}-${asset.id}`,
                    title: 'Maintenance Update',
                    body: `Asset ${asset.name} (${asset.id}) is scheduled for routine check.`,
                    type: 'asset',
                    read: false,
                    createdAt: { _seconds: Math.floor(Date.now() / 1000) }
                });
            });

            // 3. Procurement (static simulation)
            newNotifs.push({
                id: `SIM-PR-${Date.now()}`,
                title: 'New PR Pending',
                body: 'Purchase Request PR-882 requires your approval.',
                type: 'procurement',
                read: false,
                createdAt: { _seconds: Math.floor(Date.now() / 1000) }
            });

            // Persist
            const current = await localDatabase.getNotifications();
            // Prefix new ones and keep total reasonable
            const updated = [...newNotifs, ...current].slice(0, 50);

            // Note: We need a way to set notifications in localDatabase
            // I'll add a 'setNotifications' to localDatabase.js
            return updated;
        } catch (e) {
            console.error('Simulation Error:', e);
            return [];
        }
    }
};
