// Mock Database Logic (In a real app, use MongoDB/PostgreSQL)
// This file handles the data persistence and building lookup logic.

let systemsTable = [];

// Helper: Calculate Building from IP (Matches Phase 1 logic)
const lookupBuilding = (ip) => {
    // In a real DB, this would be a SQL query: 
    // SELECT name FROM buildings WHERE '192.168.10.45' BETWEEN start AND end
    const segments = ip.split('.');
    if (segments[0] !== '192' || segments[1] !== '168') return 'Unknown';

    const mapping = {
        '10': 'Admin Block',
        '20': 'Library',
        '30': 'Lecture Hall A',
        '40': 'Science Lab',
        '50': 'Server Room',
        '60': 'Conference Room',
        '70': 'Staff Room',
        '80': 'Seminar Hall'
    };

    return mapping[segments[2]] || 'External / VPN';
};

const registerSystem = async (data) => {
    const existingIndex = systemsTable.findIndex(s => s.mac === data.mac);
    const location = lookupBuilding(data.ip);

    if (existingIndex !== -1) {
        // Update existing record
        systemsTable[existingIndex] = {
            ...systemsTable[existingIndex],
            ...data,
            location,
            last_seen: new Date().toISOString()
        };
        return {
            asset_id: systemsTable[existingIndex].asset_id,
            status: 'updated',
            location
        };
    } else {
        // Create new Asset ID (CLG-XXX)
        const id = `CLG-${String(systemsTable.length + 1).padStart(3, '0')}`;
        const newSystem = {
            ...data,
            asset_id: id,
            location,
            registered_at: new Date().toISOString(),
            last_seen: new Date().toISOString()
        };
        systemsTable.push(newSystem);
        return { asset_id: id, status: 'created', location };
    }
};

const heartbeat = async (mac) => {
    const system = systemsTable.find(s => s.mac === mac);
    if (system) {
        system.last_seen = new Date().toISOString();
        system.status = 'online';
    }
};

const getRegisteredSystems = async () => systemsTable;

module.exports = {
    registerSystem,
    getRegisteredSystems,
    heartbeat
};
