/**
 * CITIL Backend Seed Script
 *
 * Populates Firestore with realistic sample data for development and testing.
 * Run: node scripts/seed.js
 *
 * WARNING: This will overwrite existing data in the seed collections.
 */

require('dotenv').config({ path: '../.env' });
const { db, auth } = require('../firebaseAdmin');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

// ── Sample data ─────────────────────────────────────────────────────────────

const LOCATIONS = [
    { locationId: 'LOC-MAIN-LAB', name: 'Main Computer Lab', building: 'Block A', floor: '2', zone: 'East Wing', type: 'Lab', capacity: 60 },
    { locationId: 'LOC-STORE-A', name: 'Central Storeroom', building: 'Block B', floor: 'G', zone: 'West Wing', type: 'Storage', capacity: 500 },
    { locationId: 'LOC-ADMIN', name: 'Admin Office', building: 'Main Building', floor: '1', zone: 'North Wing', type: 'Office', capacity: 20 },
    { locationId: 'LOC-WORKSHOP', name: 'Electronics Workshop', building: 'Block C', floor: '1', zone: 'South', type: 'Lab', capacity: 30 },
];

const USERS = [
    { email: 'admin@campus.edu', name: 'System Admin', role: 'admin' },
    { email: 'finance@campus.edu', name: 'Finance Manager', role: 'finance' },
    { email: 'inventory@campus.edu', name: 'Inventory Manager', role: 'inventory' },
    { email: 'head@campus.edu', name: 'Dr. Patel', role: 'department', department: 'Computer Science' },
    { email: 'auditor@campus.edu', name: 'Senior Auditor', role: 'auditor' },
    { email: 'director@campus.edu', name: 'Director', role: 'executive' },
];

const ASSETS = [
    { name: 'Dell Laptop Pro 15', category: 'IT Equipment', purchasePrice: 75000, health: 'Good', currentDepartment: 'Computer Science', currentLocation: 'LOC-MAIN-LAB' },
    { name: 'HP LaserJet Printer', category: 'Office Equipment', purchasePrice: 22000, health: 'Excellent', currentDepartment: 'Admin', currentLocation: 'LOC-ADMIN' },
    { name: 'Oscilloscope DS1054Z', category: 'Lab Equipment', purchasePrice: 18000, health: 'Good', currentDepartment: 'Electronics', currentLocation: 'LOC-WORKSHOP' },
    { name: 'Projector BenQ MH560', category: 'AV Equipment', purchasePrice: 45000, health: 'Fair', currentDepartment: 'Computer Science', currentLocation: 'LOC-MAIN-LAB' },
    { name: 'UPS APC Smart 2200VA', category: 'Power Equipment', purchasePrice: 28000, health: 'Good', currentDepartment: 'IT', currentLocation: 'LOC-MAIN-LAB' },
];

const INVENTORY = [
    { itemName: 'A4 Paper Ream', itemCode: 'STAT-001', category: 'Stationery', unit: 'Reams', currentQuantity: 45, reorderLevel: 20, maxLevel: 200, unitCost: 250 },
    { itemName: 'Toner Cartridge HP', itemCode: 'CONS-001', category: 'Consumables', unit: 'Units', currentQuantity: 3, reorderLevel: 5, maxLevel: 30, unitCost: 2200 },
    { itemName: 'Ethernet Cable Cat6', itemCode: 'NET-001', category: 'Network', unit: 'Meters', currentQuantity: 120, reorderLevel: 50, maxLevel: 500, unitCost: 35 },
    { itemName: 'Whiteboard Marker Set', itemCode: 'STAT-002', category: 'Stationery', unit: 'Packs', currentQuantity: 8, reorderLevel: 10, maxLevel: 60, unitCost: 180 },
    { itemName: 'Thermal Paste Arctic', itemCode: 'MAINT-001', category: 'Maintenance', unit: 'Tubes', currentQuantity: 2, reorderLevel: 5, maxLevel: 20, unitCost: 450 },
];

// ── Seed functions ─────────────────────────────────────────────────────────

async function seedLocations() {
    console.log('📍 Seeding locations...');
    const batch = db.batch();
    LOCATIONS.forEach(loc => {
        batch.set(db.collection('locations').doc(loc.locationId), {
            ...loc,
            currentAssetCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
        });
    });
    await batch.commit();
    console.log(`   ✓ ${LOCATIONS.length} locations seeded`);
}

async function seedUsers() {
    console.log('👥 Seeding users...');
    const results = [];
    for (const u of USERS) {
        try {
            let userRecord;
            try {
                userRecord = await auth.getUserByEmail(u.email);
            } catch (_) {
                userRecord = await auth.createUser({ email: u.email, password: 'Campus@123', displayName: u.name });
            }
            await auth.setCustomUserClaims(userRecord.uid, { role: u.role, department: u.department || null });
            await db.collection('users').doc(userRecord.uid).set({
                uid: userRecord.uid,
                email: u.email,
                name: u.name,
                role: u.role,
                department: u.department || null,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastLogin: null,
                preferences: { notifications: { email: true, inApp: true, criticalAlerts: true, approvalUpdates: true, stockAlerts: true }, theme: 'dark' },
            });
            results.push({ email: u.email, uid: userRecord.uid, role: u.role });
        } catch (e) {
            console.warn(`   ⚠ Could not seed user ${u.email}: ${e.message}`);
        }
    }
    console.log(`   ✓ ${results.length} users seeded (password: Campus@123)`);
    return results;
}

async function seedAssets() {
    console.log('📦 Seeding assets...');
    const batch = db.batch();
    ASSETS.forEach((a, i) => {
        const assetId = `AST-SEED-${String(i + 1).padStart(3, '0')}`;
        batch.set(db.collection('assets').doc(assetId), {
            assetId,
            ...a,
            status: 'Active',
            qrCode: null,
            purchaseDate: dayjs().subtract(i * 30 + 90, 'day').toISOString(),
            warrantyExpiry: dayjs().add(365, 'day').toISOString(),
            lastVerified: dayjs().subtract(i * 7, 'day').toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            assignedTo: null,
            metadata: {},
            createdBy: 'system',
        });
    });
    await batch.commit();
    console.log(`   ✓ ${ASSETS.length} assets seeded`);
}

async function seedInventory() {
    console.log('🗄  Seeding inventory...');
    const batch = db.batch();
    INVENTORY.forEach((item, i) => {
        const inventoryId = `INV-SEED-${String(i + 1).padStart(3, '0')}`;
        const qty = item.currentQuantity;
        const status = qty === 0 ? 'Critical' : qty <= item.reorderLevel * 0.5 ? 'Critical' : qty <= item.reorderLevel ? 'Low' : 'In-Stock';
        batch.set(db.collection('inventory').doc(inventoryId), {
            inventoryId,
            ...item,
            status,
            consumptionRate: parseFloat((Math.random() * 2 + 0.2).toFixed(2)),
            lastRestockDate: dayjs().subtract(30, 'day').toISOString(),
            lastUpdated: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            createdBy: 'system',
        });
    });
    await batch.commit();
    console.log(`   ✓ ${INVENTORY.length} inventory items seeded (some are low/critical for demo)`);
}

async function seedAlerts() {
    console.log('🔔 Seeding sample alerts...');
    const alerts = [
        { type: 'LowStock', severity: 'Critical', message: 'Toner Cartridge HP is critically low (3 units)', status: 'Active' },
        { type: 'LowStock', severity: 'Warning', message: 'Whiteboard Marker Set below reorder level', status: 'Active' },
        { type: 'PendingApproval', severity: 'Info', message: 'Purchase request PR-DEMO-001 awaiting dept. head approval', status: 'Active' },
        { type: 'MaintenanceNeeded', severity: 'Warning', message: 'Projector BenQ MH560 health is Fair — schedule maintenance', status: 'Acknowledged' },
    ];
    const batch = db.batch();
    alerts.forEach(alert => {
        const alertId = uuidv4();
        batch.set(db.collection('alerts').doc(alertId), {
            alertId,
            ...alert,
            createdAt: dayjs().subtract(Math.floor(Math.random() * 48), 'hour').toISOString(),
            acknowledgedAt: alert.status === 'Acknowledged' ? new Date().toISOString() : null,
            acknowledgedBy: null,
            resolvedAt: null,
            resolvedBy: null,
            resolution: null,
        });
    });
    await batch.commit();
    console.log(`   ✓ ${alerts.length} alerts seeded`);
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n🚀 CITIL Seed Script Starting...\n');
    try {
        await seedLocations();
        await seedUsers();
        await seedAssets();
        await seedInventory();
        await seedAlerts();
        console.log('\n✅ Seed complete! You can now log in with:\n');
        USERS.forEach(u => console.log(`   ${u.role.padEnd(12)} → ${u.email}  /  Campus@123`));
        console.log();
        process.exit(0);
    } catch (e) {
        console.error('\n❌ Seed failed:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
}

main();
