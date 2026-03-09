// Mock Database Logic (In a real app, use MongoDB/PostgreSQL)
// This file handles the data persistence and building lookup logic.

let systemsTable = [];

// Helper: Calculate Building from IP (Matches Phase 1 logic)
const lookupBuilding = (ip) => {
    const segments = ip.split('.');
    if (segments[0] !== '192' || segments[1] !== '168') {
        return { name: 'External / VPN', code: 'EVN' };
    }

    const mapping = {
        '10': { name: 'Admin Block', code: 'ADM' },
        '20': { name: 'Library', code: 'LIB' },
        '30': { name: 'Lecture Hall A', code: 'LHA' },
        '40': { name: 'Science Lab', code: 'SCI' },
        '50': { name: 'Server Room', code: 'SRV' },
        '60': { name: 'Conference Room', code: 'CNF' },
        '70': { name: 'Staff Room', code: 'STF' },
        '80': { name: 'Seminar Hall', code: 'SEM' }
    };

    return mapping[segments[2]] || { name: 'External / VPN', code: 'EVN' };
};

const registerSystem = async (data) => {
    const existingIndex = systemsTable.findIndex(s => s.mac === data.mac);
    const { name: building, code: building_code } = lookupBuilding(data.ip);

    if (existingIndex !== -1) {
        // Update existing record
        systemsTable[existingIndex] = {
            ...systemsTable[existingIndex],
            ...data,
            building,
            building_code,
            last_seen: new Date().toISOString()
        };
        return {
            asset_id: systemsTable[existingIndex].asset_id,
            status: 'updated',
            location: building
        };
    } else {
        // Create new Asset ID (CLG-XXX)
        const id = `CLG-${String(systemsTable.length + 1).padStart(3, '0')}`;
        const newSystem = {
            ...data,
            asset_id: id,
            building,
            building_code,
            registered_at: new Date().toISOString(),
            last_seen: new Date().toISOString()
        };
        systemsTable.push(newSystem);
        return { asset_id: id, status: 'created', location: building };
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
