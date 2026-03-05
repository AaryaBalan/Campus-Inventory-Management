// ─── Assets ─────────────────────────────────────────────────────────────────
export const assets = [
    { id: 'AST-0001', name: 'Dell Laptop Pro 15', category: 'Electronics', location: 'Admin Block', department: 'Administration', status: 'Active', health: 'Good', purchaseDate: '2023-01-15', purchaseValue: 85000, lastUpdated: '2024-01-20', assignedTo: 'Alice Johnson', qr: 'QR-AST-0001' },
    { id: 'AST-0002', name: 'HP LaserJet Printer', category: 'Electronics', location: 'Library', department: 'Library', status: 'Active', health: 'Fair', purchaseDate: '2022-06-10', purchaseValue: 32000, lastUpdated: '2024-01-18', assignedTo: 'Bob Smith', qr: 'QR-AST-0002' },
    { id: 'AST-0003', name: 'Projector Epson EB-X51', category: 'Electronics', location: 'Lecture Hall A', department: 'Academic', status: 'Maintenance', health: 'Poor', purchaseDate: '2021-03-22', purchaseValue: 45000, lastUpdated: '2024-01-15', assignedTo: 'Unassigned', qr: 'QR-AST-0003' },
    { id: 'AST-0004', name: 'Office Chair Ergonomic', category: 'Furniture', location: 'Admin Block', department: 'Administration', status: 'Active', health: 'Good', purchaseDate: '2023-08-01', purchaseValue: 12000, lastUpdated: '2024-01-10', assignedTo: 'Carol Davis', qr: 'QR-AST-0004' },
    { id: 'AST-0005', name: 'Network Switch 24-Port', category: 'Networking', location: 'Server Room', department: 'IT', status: 'Active', health: 'Good', purchaseDate: '2022-11-15', purchaseValue: 28000, lastUpdated: '2024-01-22', assignedTo: 'IT Team', qr: 'QR-AST-0005' },
    { id: 'AST-0006', name: 'Microscope Binocular', category: 'Lab Equipment', location: 'Science Lab', department: 'Science', status: 'Active', health: 'Good', purchaseDate: '2023-04-05', purchaseValue: 65000, lastUpdated: '2024-01-19', assignedTo: 'Dr. Patel', qr: 'QR-AST-0006' },
    { id: 'AST-0007', name: 'Air Conditioner 1.5 Ton', category: 'HVAC', location: 'Conference Room', department: 'Administration', status: 'Active', health: 'Good', purchaseDate: '2022-05-20', purchaseValue: 42000, lastUpdated: '2024-01-12', assignedTo: 'Facilities', qr: 'QR-AST-0007' },
    { id: 'AST-0008', name: 'CCTV Camera 4K', category: 'Security', location: 'Main Gate', department: 'Security', status: 'Active', health: 'Good', purchaseDate: '2023-09-10', purchaseValue: 18000, lastUpdated: '2024-01-21', assignedTo: 'Security Team', qr: 'QR-AST-0008' },
    { id: 'AST-0009', name: 'Whiteboard Interactive 65"', category: 'Electronics', location: 'Seminar Hall', department: 'Academic', status: 'Active', health: 'Good', purchaseDate: '2023-11-30', purchaseValue: 95000, lastUpdated: '2024-01-20', assignedTo: 'Academic Team', qr: 'QR-AST-0009' },
    { id: 'AST-0010', name: 'Generator 25KVA', category: 'Electrical', location: 'Power Plant', department: 'Facilities', status: 'Active', health: 'Fair', purchaseDate: '2020-02-14', purchaseValue: 185000, lastUpdated: '2024-01-16', assignedTo: 'Electrician Team', qr: 'QR-AST-0010' },
    { id: 'AST-0011', name: 'Server Dell PowerEdge', category: 'Networking', location: 'Server Room', department: 'IT', status: 'Active', health: 'Good', purchaseDate: '2023-03-01', purchaseValue: 220000, lastUpdated: '2024-01-23', assignedTo: 'IT Team', qr: 'QR-AST-0011' },
    { id: 'AST-0012', name: 'Coffee Machine Industrial', category: 'Appliances', location: 'Staff Room', department: 'Administration', status: 'Retired', health: 'Poor', purchaseDate: '2019-07-15', purchaseValue: 15000, lastUpdated: '2024-01-05', assignedTo: 'Unassigned', qr: 'QR-AST-0012' },
];

export const assetMovements = [
    { id: 1, assetId: 'AST-0001', action: 'Transfer', from: 'IT Store', to: 'Admin Block', by: 'Rahul Kumar', timestamp: '2024-01-20 09:15', notes: 'Assigned to new employee', approved: true },
    { id: 2, assetId: 'AST-0001', action: 'Verification', from: 'Admin Block', to: 'Admin Block', by: 'Seema Nair', timestamp: '2024-01-10 14:30', notes: 'Annual asset verification', approved: true },
    { id: 3, assetId: 'AST-0001', action: 'Maintenance', from: 'Admin Block', to: 'Service Center', by: 'Ramesh IT', timestamp: '2023-11-05 10:00', notes: 'Battery replacement', approved: true },
    { id: 4, assetId: 'AST-0001', action: 'Transfer', from: 'Procurement', to: 'IT Store', by: 'Finance Dept', timestamp: '2023-01-16 11:00', notes: 'Initial procurement receipt', approved: true },
];

// ─── Inventory ───────────────────────────────────────────────────────────────
export const inventoryItems = [
    { id: 'INV-001', name: 'Printer Cartridges (Black)', category: 'Stationery', unit: 'Pcs', quantity: 5, reorderLevel: 20, maxLevel: 100, lastReorder: '2024-01-10', status: 'critical', unitCost: 800 },
    { id: 'INV-002', name: 'A4 Paper Ream', category: 'Stationery', unit: 'Reams', quantity: 18, reorderLevel: 25, maxLevel: 200, lastReorder: '2024-01-15', status: 'low', unitCost: 350 },
    { id: 'INV-003', name: 'Hand Sanitizer 500ml', category: 'Hygiene', unit: 'Bottles', quantity: 45, reorderLevel: 30, maxLevel: 150, lastReorder: '2024-01-08', status: 'ok', unitCost: 120 },
    { id: 'INV-004', name: 'Whiteboard Markers', category: 'Stationery', unit: 'Box', quantity: 3, reorderLevel: 10, maxLevel: 50, lastReorder: '2024-01-12', status: 'critical', unitCost: 250 },
    { id: 'INV-005', name: 'Lab Gloves (Medium)', category: 'Lab Supplies', unit: 'Boxes', quantity: 22, reorderLevel: 15, maxLevel: 80, lastReorder: '2024-01-18', status: 'ok', unitCost: 450 },
    { id: 'INV-006', name: 'Toner Cartridge HP', category: 'Electronics', unit: 'Pcs', quantity: 12, reorderLevel: 10, maxLevel: 40, lastReorder: '2024-01-05', status: 'ok', unitCost: 1800 },
    { id: 'INV-007', name: 'Cleaning Detergent 5L', category: 'Hygiene', unit: 'Cans', quantity: 8, reorderLevel: 12, maxLevel: 60, lastReorder: '2024-01-20', status: 'low', unitCost: 280 },
    { id: 'INV-008', name: 'USB Flash Drive 32GB', category: 'Electronics', unit: 'Pcs', quantity: 35, reorderLevel: 20, maxLevel: 100, lastReorder: '2023-12-20', status: 'ok', unitCost: 600 },
];

export const consumptionHistory = [
    { month: 'Aug', stationery: 65, lab: 40, hygiene: 30, electronics: 20 },
    { month: 'Sep', stationery: 72, lab: 45, hygiene: 35, electronics: 18 },
    { month: 'Oct', stationery: 68, lab: 52, hygiene: 28, electronics: 25 },
    { month: 'Nov', stationery: 85, lab: 38, hygiene: 42, electronics: 22 },
    { month: 'Dec', stationery: 90, lab: 60, hygiene: 38, electronics: 30 },
    { month: 'Jan', stationery: 78, lab: 48, hygiene: 32, electronics: 28 },
];

// ─── Procurement ─────────────────────────────────────────────────────────────
export const purchaseRequests = [
    { id: 'PR-2024-089', item: 'Dell Laptop Pro 15', department: 'Science', quantity: 5, unitCost: 85000, total: 425000, priority: 'High', status: 'finance_review', stage: 2, requestedBy: 'Dr. Patel', requestedDate: '2024-01-18', justification: 'Lab upgrade for new semester', stages: [{ name: 'Requested', status: 'done', date: '2024-01-18', by: 'Dr. Patel' }, { name: 'Dept Head', status: 'done', date: '2024-01-19', by: 'Prof. Mehta' }, { name: 'Finance', status: 'active', date: null, by: null }, { name: 'Approved', status: 'pending', date: null, by: null }] },
    { id: 'PR-2024-090', item: 'Office Chairs (Ergonomic)', department: 'Administration', quantity: 10, unitCost: 12000, total: 120000, priority: 'Medium', status: 'dept_review', stage: 1, requestedBy: 'Anita Roy', requestedDate: '2024-01-20', justification: 'Replacement of worn-out chairs', stages: [{ name: 'Requested', status: 'done', date: '2024-01-20', by: 'Anita Roy' }, { name: 'Dept Head', status: 'active', date: null, by: null }, { name: 'Finance', status: 'pending', date: null, by: null }, { name: 'Approved', status: 'pending', date: null, by: null }] },
    { id: 'PR-2024-091', item: 'A4 Paper (5 Boxes)', department: 'Library', quantity: 5, unitCost: 3500, total: 17500, priority: 'Low', status: 'approved', stage: 3, requestedBy: 'Bob Smith', requestedDate: '2024-01-15', justification: 'Monthly replenishment', stages: [{ name: 'Requested', status: 'done', date: '2024-01-15', by: 'Bob Smith' }, { name: 'Dept Head', status: 'done', date: '2024-01-16', by: 'Ms. Verma' }, { name: 'Finance', status: 'done', date: '2024-01-17', by: 'Finance Team' }, { name: 'Approved', status: 'done', date: '2024-01-17', by: 'Admin' }] },
    { id: 'PR-2024-092', item: 'Network Switch 48-Port', department: 'IT', quantity: 2, unitCost: 45000, total: 90000, priority: 'High', status: 'rejected', stage: 1, requestedBy: 'IT Team', requestedDate: '2024-01-10', justification: 'Network expansion project', stages: [{ name: 'Requested', status: 'done', date: '2024-01-10', by: 'IT Team' }, { name: 'Dept Head', status: 'rejected', date: '2024-01-11', by: 'Mr. Sharma', reason: 'Budget constraints for Q1' }, { name: 'Finance', status: 'pending', date: null, by: null }, { name: 'Approved', status: 'pending', date: null, by: null }] },
    { id: 'PR-2024-093', item: 'Lab Microscopes', department: 'Science', quantity: 3, unitCost: 65000, total: 195000, priority: 'High', status: 'requested', stage: 0, requestedBy: 'Dr. Kumar', requestedDate: '2024-01-22', justification: 'Replacement for damaged units', stages: [{ name: 'Requested', status: 'active', date: '2024-01-22', by: 'Dr. Kumar' }, { name: 'Dept Head', status: 'pending', date: null, by: null }, { name: 'Finance', status: 'pending', date: null, by: null }, { name: 'Approved', status: 'pending', date: null, by: null }] },
];

// ─── Alerts ──────────────────────────────────────────────────────────────────
export const alerts = [
    { id: 1, type: 'critical', category: 'Security', title: 'Unauthorized Movement Detected', description: 'Asset AST-0006 (Microscope) moved without authorization from Science Lab to unknown location', timestamp: '2024-01-23 08:45', asset: 'AST-0006', status: 'open', actionRequired: true },
    { id: 2, type: 'critical', category: 'Stock', title: 'Critical Stock: Printer Cartridges', description: 'Printer Cartridges stock (5 units) is below critical threshold (20 units). Immediate reorder required.', timestamp: '2024-01-22 14:30', asset: 'INV-001', status: 'open', actionRequired: true },
    { id: 3, type: 'warning', category: 'Maintenance', title: 'Maintenance Due: Projector EB-X51', description: 'Annual maintenance for Projector AST-0003 is overdue by 15 days', timestamp: '2024-01-21 09:00', asset: 'AST-0003', status: 'acknowledged', actionRequired: false },
    { id: 4, type: 'warning', category: 'Stock', title: 'Low Stock: A4 Paper', description: 'A4 Paper stock (18 reams) approaching reorder level (25 reams)', timestamp: '2024-01-20 16:00', asset: 'INV-002', status: 'open', actionRequired: true },
    { id: 5, type: 'warning', category: 'Approval', title: 'Pending Approvals Overdue', description: '3 purchase requests pending for more than 48 hours in approval queue', timestamp: '2024-01-20 10:00', asset: null, status: 'open', actionRequired: true },
    { id: 6, type: 'info', category: 'Audit', title: 'Monthly Audit Report Ready', description: 'January 2024 asset audit report has been generated and is ready for review', timestamp: '2024-01-19 18:00', asset: null, status: 'acknowledged', actionRequired: false },
    { id: 7, type: 'info', category: 'Stock', title: 'Reorder Triggered: Whiteboard Markers', description: 'Automated reorder triggered for Whiteboard Markers. PO generated: AUTO-2024-012', timestamp: '2024-01-18 08:30', asset: 'INV-004', status: 'resolved', actionRequired: false },
];

// ─── Audit Trail ─────────────────────────────────────────────────────────────
export const auditEvents = [
    { id: 1, timestamp: '2024-01-23 08:45', user: 'System', action: 'Alert Generated', module: 'Alert', asset: 'AST-0006', details: 'Unauthorized movement alert triggered', severity: 'critical', ip: '10.0.0.1' },
    { id: 2, timestamp: '2024-01-22 17:30', user: 'Rahul Kumar', action: 'Asset Transfer', module: 'Asset', asset: 'AST-0001', details: 'Transferred from Admin Block to Conference Room', severity: 'info', ip: '192.168.1.58' },
    { id: 3, timestamp: '2024-01-22 14:15', user: 'Finance Team', action: 'PR Approved', module: 'Procurement', asset: null, details: 'Purchase Request PR-2024-091 approved (₹17,500)', severity: 'info', ip: '192.168.2.12' },
    { id: 4, timestamp: '2024-01-21 11:00', user: 'Bob Smith', action: 'Stock Updated', module: 'Inventory', asset: 'INV-002', details: 'A4 Paper stock updated: 45 → 18 reams (consumption recorded)', severity: 'warning', ip: '192.168.1.77' },
    { id: 5, timestamp: '2024-01-20 09:30', user: 'Admin', action: 'User Login', module: 'Auth', asset: null, details: 'Admin user session started from 192.168.1.45', severity: 'info', ip: '192.168.1.45' },
    { id: 6, timestamp: '2024-01-19 16:45', user: 'Seema Nair', action: 'Asset Verified', module: 'Asset', asset: 'AST-0001', details: 'Annual verification completed. Status: Good', severity: 'info', ip: '192.168.1.32' },
    { id: 7, timestamp: '2024-01-18 10:00', user: 'Dr. Patel', action: 'PR Submitted', module: 'Procurement', asset: null, details: 'Purchase request PR-2024-089 submitted (₹4,25,000)', severity: 'info', ip: '192.168.3.11' },
    { id: 8, timestamp: '2024-01-17 14:30', user: 'IT Team', action: 'Asset Registered', module: 'Asset', asset: 'AST-0011', details: 'New asset Dell PowerEdge Server registered (₹2,20,000)', severity: 'info', ip: '192.168.2.50' },
];

// ─── Analytics ───────────────────────────────────────────────────────────────
export const forecastData = [
    { period: '30 Days', stationery: { predicted: 12, confidence: 92, action: 'Reorder Now' }, lab: { predicted: 8, confidence: 87, action: 'Monitor' }, hygiene: { predicted: 25, confidence: 95, action: 'OK' } },
    { period: '60 Days', stationery: { predicted: 2, confidence: 78, action: 'Urgent' }, lab: { predicted: 3, confidence: 72, action: 'Reorder Soon' }, hygiene: { predicted: 15, confidence: 88, action: 'Monitor' } },
    { period: '90 Days', stationery: { predicted: 0, confidence: 65, action: 'Critical' }, lab: { predicted: 0, confidence: 60, action: 'Urgent' }, hygiene: { predicted: 5, confidence: 82, action: 'Monitor' } },
];

export const demandForecast = [
    { category: 'Electronics', current: 45, forecast: 62 },
    { category: 'Stationery', current: 120, forecast: 145 },
    { category: 'Lab Supplies', current: 38, forecast: 50 },
    { category: 'Hygiene', current: 75, forecast: 80 },
    { category: 'Furniture', current: 12, forecast: 18 },
    { category: 'Networking', current: 8, forecast: 15 },
];

// ─── Campus Buildings ─────────────────────────────────────────────────────────
export const buildings = [
    {
        id: 'B1', name: 'Admin Block', x: 60, y: 60, w: 120, h: 80, color: '#1e3a8a', zone: 'Administrative',
        assetCount: 38, activeAssets: 35, maintenanceAssets: 2, retiredAssets: 1,
        totalValue: 1420000, lastAudit: '2024-01-20',
        alertCount: 0, criticalAssets: 0,
        categories: [{ name: 'Electronics', count: 18 }, { name: 'Furniture', count: 12 }, { name: 'HVAC', count: 5 }, { name: 'Others', count: 3 }],
        health: { Good: 30, Fair: 6, Poor: 2 },
        recentActivity: 'Asset transferred on Jan 20',
        assignedStaff: 12,
    },
    {
        id: 'B2', name: 'Library', x: 220, y: 60, w: 100, h: 80, color: '#0891b2', zone: 'Academic',
        assetCount: 24, activeAssets: 23, maintenanceAssets: 1, retiredAssets: 0,
        totalValue: 680000, lastAudit: '2024-01-18',
        alertCount: 0, criticalAssets: 0,
        categories: [{ name: 'Electronics', count: 10 }, { name: 'Furniture', count: 9 }, { name: 'Security', count: 3 }, { name: 'Others', count: 2 }],
        health: { Good: 20, Fair: 3, Poor: 1 },
        recentActivity: 'HP Printer serviced on Jan 18',
        assignedStaff: 5,
    },
    {
        id: 'B3', name: 'Lecture Hall A', x: 360, y: 60, w: 130, h: 80, color: '#059669', zone: 'Academic',
        assetCount: 52, activeAssets: 49, maintenanceAssets: 3, retiredAssets: 0,
        totalValue: 3250000, lastAudit: '2024-01-15',
        alertCount: 1, criticalAssets: 1,
        categories: [{ name: 'Electronics', count: 28 }, { name: 'Furniture', count: 15 }, { name: 'HVAC', count: 6 }, { name: 'Electrical', count: 3 }],
        health: { Good: 42, Fair: 7, Poor: 3 },
        recentActivity: 'Projector EB-X51 under maintenance',
        assignedStaff: 8,
    },
    {
        id: 'B4', name: 'Science Lab', x: 60, y: 200, w: 120, h: 90, color: '#7c3aed', zone: 'Laboratory',
        assetCount: 67, activeAssets: 64, maintenanceAssets: 2, retiredAssets: 1,
        totalValue: 5870000, lastAudit: '2024-01-12',
        alertCount: 2, criticalAssets: 1,
        categories: [{ name: 'Lab Equipment', count: 38 }, { name: 'Electronics', count: 16 }, { name: 'Furniture', count: 10 }, { name: 'Others', count: 3 }],
        health: { Good: 55, Fair: 9, Poor: 3 },
        recentActivity: '🚨 Unauthorized movement alert on Jan 23',
        assignedStaff: 18,
    },
    {
        id: 'B5', name: 'Server Room', x: 220, y: 200, w: 100, h: 90, color: '#d97706', zone: 'IT Infrastructure',
        assetCount: 18, activeAssets: 18, maintenanceAssets: 0, retiredAssets: 0,
        totalValue: 8400000, lastAudit: '2024-01-23',
        alertCount: 0, criticalAssets: 0,
        categories: [{ name: 'Networking', count: 11 }, { name: 'Electronics', count: 5 }, { name: 'Electrical', count: 2 }],
        health: { Good: 18, Fair: 0, Poor: 0 },
        recentActivity: 'Routine audit completed Jan 23',
        assignedStaff: 4,
    },
    {
        id: 'B6', name: 'Conference Room', x: 360, y: 200, w: 130, h: 90, color: '#0891b2', zone: 'Administrative',
        assetCount: 15, activeAssets: 15, maintenanceAssets: 0, retiredAssets: 0,
        totalValue: 920000, lastAudit: '2024-01-22',
        alertCount: 0, criticalAssets: 0,
        categories: [{ name: 'Electronics', count: 8 }, { name: 'Furniture', count: 5 }, { name: 'HVAC', count: 2 }],
        health: { Good: 15, Fair: 0, Poor: 0 },
        recentActivity: 'AC maintenance scheduled on Feb 01',
        assignedStaff: 3,
    },
    {
        id: 'B7', name: 'Staff Room', x: 60, y: 350, w: 120, h: 80, color: '#dc2626', zone: 'Administrative',
        assetCount: 21, activeAssets: 18, maintenanceAssets: 1, retiredAssets: 2,
        totalValue: 580000, lastAudit: '2024-01-10',
        alertCount: 0, criticalAssets: 0,
        categories: [{ name: 'Furniture', count: 10 }, { name: 'Electronics', count: 6 }, { name: 'Appliances', count: 5 }],
        health: { Good: 15, Fair: 4, Poor: 2 },
        recentActivity: 'Coffee Machine retired on Jan 05',
        assignedStaff: 22,
    },
    {
        id: 'B8', name: 'Seminar Hall', x: 220, y: 350, w: 270, h: 80, color: '#059669', zone: 'Academic',
        assetCount: 33, activeAssets: 33, maintenanceAssets: 0, retiredAssets: 0,
        totalValue: 2100000, lastAudit: '2024-01-20',
        alertCount: 0, criticalAssets: 0,
        categories: [{ name: 'Electronics', count: 14 }, { name: 'Furniture', count: 12 }, { name: 'HVAC', count: 5 }, { name: 'Security', count: 2 }],
        health: { Good: 31, Fair: 2, Poor: 0 },
        recentActivity: 'Whiteboard Interactive installed Nov 30',
        assignedStaff: 6,
    },
];

// ─── KPIs ─────────────────────────────────────────────────────────────────────
export const kpis = {
    totalAssets: 1284,
    activeAssets: 1198,
    lowStockItems: 7,
    criticalStock: 2,
    pendingApprovals: 8,
    totalInventoryValue: 42500000,
    assetTraceability: 97.8,
    reconciliationTime: 44,
    procurementEfficiency: 89,
    complianceScore: 94,
    monthlySpend: 875000,
    budgetUtilization: 68,
};

export const categoryDistribution = [
    { name: 'Electronics', value: 342, fill: '#0891b2' },
    { name: 'Furniture', value: 285, fill: '#059669' },
    { name: 'Lab Equipment', value: 198, fill: '#7c3aed' },
    { name: 'Networking', value: 145, fill: '#d97706' },
    { name: 'HVAC', value: 112, fill: '#dc2626' },
    { name: 'Security', value: 89, fill: '#1e3a8a' },
    { name: 'Others', value: 113, fill: '#6b7280' },
];

export const spendTrend = [
    { month: 'Aug', spend: 620000, budget: 900000 },
    { month: 'Sep', spend: 780000, budget: 900000 },
    { month: 'Oct', spend: 540000, budget: 900000 },
    { month: 'Nov', spend: 920000, budget: 900000 },
    { month: 'Dec', spend: 1100000, budget: 900000 },
    { month: 'Jan', spend: 875000, budget: 900000 },
];
