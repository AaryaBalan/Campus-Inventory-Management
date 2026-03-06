const CATEGORIES = ['Computers', 'Projectors', 'Lab Equipment', 'Printers', 'Networking', 'Furniture', 'Servers', 'IoT Sensors'];
const BUILDINGS = ['Engineering Block', 'Library', 'Admin Building', 'Computer Lab', 'Research Center', 'Mechanical Lab', 'Electronics Lab', 'Hostel'];
const DEPTS = ['Computer Science', 'Electrical Eng', 'Mechanical Eng', 'Civil Eng', 'Physics', 'Chemistry', 'Mathematics', 'Administration'];
const STATUSES = ['Active', 'In Maintenance', 'In Repair', 'Decommissioned', 'Stored'];

export const generateMockAssets = (count = 1000) => {
    const assets = [];
    for (let i = 1; i <= count; i++) {
        const id = `AST-${String(i).padStart(6, '0')}`;
        const buildingIdx = Math.floor(Math.random() * BUILDINGS.length);
        const catIdx = Math.floor(Math.random() * CATEGORIES.length);
        const deptIdx = Math.floor(Math.random() * DEPTS.length);
        const statusIdx = Math.floor(Math.random() * STATUSES.length);

        assets.push({
            id,
            assetTag: `CITIL-${id}`,
            name: `${CATEGORIES[catIdx].slice(0, -1)} ${id}`,
            category: CATEGORIES[catIdx],
            building: BUILDINGS[buildingIdx],
            floor: Math.floor(Math.random() * 5) + 1,
            location: `Room ${100 + Math.floor(Math.random() * 400)}`,
            department: DEPTS[deptIdx],
            status: STATUSES[statusIdx],
            value: Math.floor(Math.random() * 150000) + 5000,
            purchaseDate: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365 * 3).toISOString().split('T')[0],
            qrCode: id,
        });
    }
    return assets;
};

export const generateMockInventory = (count = 500) => {
    const items = [
        'HDMI Cable', 'RJ45 Connector', 'A4 Paper Bundle', 'Marker Set', 'Battery AA',
        'Scientific Calculator', 'Soldering Lead', 'Universal Adapter', 'Extension Box',
        'Lab Coat', 'Safety Goggles', 'USB Drive 64GB', 'Keyboard', 'Mouse', 'Toner Cartridge'
    ];

    const inventory = [];
    for (let i = 1; i <= count; i++) {
        const itemBase = items[Math.floor(Math.random() * items.length)];
        const id = `INV-${String(i).padStart(5, '0')}`;
        const current = Math.floor(Math.random() * 200);
        const threshold = 15;

        inventory.push({
            id,
            name: `${itemBase} ${id}`,
            currentStock: current,
            minStockLevel: threshold,
            maxStockLevel: 250,
            unit: 'units',
            department: DEPTS[Math.floor(Math.random() * DEPTS.length)],
            category: 'Consumables',
            location: `Store ${Math.floor(Math.random() * 5) + 1}`,
            lastUpdated: new Date().toISOString(),
        });
    }
    return inventory;
};

export const generateMockNotifications = (count = 20) => {
    const notifs = [];
    for (let i = 1; i <= count; i++) {
        notifs.push({
            id: `NTF-${i}`,
            title: i % 3 === 0 ? 'Low Stock Alert' : (i % 3 === 1 ? 'Maintenance Required' : 'Approval Needed'),
            body: i % 3 === 0 ? 'HDMI Cables are below threshold (8 units left).' : (i % 3 === 1 ? 'Projector AST-00512 maintenance due.' : 'PR-402 pending your approval.'),
            read: Math.random() > 0.5,
            createdAt: { _seconds: Math.floor(Date.now() / 1000) - i * 3600 },
        });
    }
    return notifs;
};
