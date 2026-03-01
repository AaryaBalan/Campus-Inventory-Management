const Joi = require('joi');

// ── Common ─────────────────────────────────────────────────────────────────

const id = Joi.string().trim().required();
const optId = Joi.string().trim();
const paginationQuery = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().trim().allow(''),
    sortBy: Joi.string().trim(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// ── Auth ───────────────────────────────────────────────────────────────────

const authRegister = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().trim().min(2).required(),
    role: Joi.string().valid('admin', 'finance', 'inventory', 'department', 'auditor', 'executive').required(),
    department: Joi.string().trim().when('role', { is: 'department', then: Joi.required(), otherwise: Joi.optional() }),
    phone: Joi.string().trim().allow(''),
});

const authLogin = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

// ── Assets ─────────────────────────────────────────────────────────────────

const createAsset = Joi.object({
    name: Joi.string().trim().min(2).required(),
    description: Joi.string().trim().allow(''),
    category: Joi.string().trim().required(),
    status: Joi.string().valid('Active', 'Retired', 'Lost', 'Under Maintenance').default('Active'),
    health: Joi.string().valid('Excellent', 'Good', 'Fair', 'Poor').default('Good'),
    purchaseDate: Joi.string().isoDate().required(),
    purchasePrice: Joi.number().positive().required(),
    warrantyExpiry: Joi.string().isoDate().allow('', null),
    currentDepartment: Joi.string().trim().required(),
    currentLocation: Joi.string().trim().required(),
    assignedTo: Joi.string().trim().allow('', null),
    metadata: Joi.object().default({}),
});

const updateAsset = createAsset.fork(
    ['name', 'category', 'purchaseDate', 'purchasePrice', 'currentDepartment', 'currentLocation'],
    field => field.optional()
);

const transferAsset = Joi.object({
    toLocation: Joi.string().trim().required(),
    toDepartment: Joi.string().trim().required(),
    toOwner: Joi.string().trim().allow('', null),
    reason: Joi.string().trim().required(),
    notes: Joi.string().trim().allow(''),
});

const assetQuery = paginationQuery.append({
    category: Joi.string().trim(),
    status: Joi.string().valid('Active', 'Retired', 'Lost', 'Under Maintenance'),
    department: Joi.string().trim(),
    locationId: Joi.string().trim(),
    health: Joi.string().valid('Excellent', 'Good', 'Fair', 'Poor'),
});

// ── Inventory ──────────────────────────────────────────────────────────────

const createInventory = Joi.object({
    itemName: Joi.string().trim().required(),
    itemCode: Joi.string().trim().required(),
    category: Joi.string().trim().required(),
    unit: Joi.string().trim().required(),
    currentQuantity: Joi.number().integer().min(0).required(),
    reorderLevel: Joi.number().integer().min(0).required(),
    maxLevel: Joi.number().integer().positive().required(),
    unitCost: Joi.number().positive().required(),
    supplier: Joi.string().trim().allow(''),
    autoReorder: Joi.boolean().default(false),
});

const adjustInventory = Joi.object({
    type: Joi.string().valid('Addition', 'Removal', 'Transfer', 'Adjustment').required(),
    quantity: Joi.number().integer().required(),
    reason: Joi.string().trim().required(),
    referenceId: Joi.string().trim().allow('', null),
    notes: Joi.string().trim().allow(''),
});

// ── Procurement ────────────────────────────────────────────────────────────

const purchaseRequestItem = Joi.object({
    itemId: Joi.string().trim().allow('', null),
    itemName: Joi.string().trim().required(),
    quantity: Joi.number().integer().positive().required(),
    estimatedUnitCost: Joi.number().positive().required(),
    justification: Joi.string().trim().required(),
    category: Joi.string().trim().allow(''),
});

const createPurchaseRequest = Joi.object({
    items: Joi.array().items(purchaseRequestItem).min(1).required(),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Urgent').default('Medium'),
    notes: Joi.string().trim().allow(''),
    requiredByDate: Joi.string().isoDate().allow('', null),
});

const approvalAction = Joi.object({
    action: Joi.string().valid('approve', 'reject').required(),
    comments: Joi.string().trim().allow(''),
    reason: Joi.string().trim().when('action', { is: 'reject', then: Joi.required(), otherwise: Joi.optional() }),
});

// ── Alerts ─────────────────────────────────────────────────────────────────

const resolveAlert = Joi.object({
    resolution: Joi.string().trim().required(),
    notes: Joi.string().trim().allow(''),
});

// ── Locations ──────────────────────────────────────────────────────────────

const createLocation = Joi.object({
    name: Joi.string().trim().required(),
    building: Joi.string().trim().required(),
    floor: Joi.string().trim().allow(''),
    zone: Joi.string().trim().allow(''),
    type: Joi.string().valid('Office', 'Lab', 'Warehouse', 'Storage', 'Lecture Hall', 'Conference Room', 'Other').default('Other'),
    capacity: Joi.number().integer().positive().allow(null),
    coordinates: Joi.object({ lat: Joi.number(), lng: Joi.number() }).allow(null),
    svgAttributes: Joi.object().allow(null), // For campus map SVG positioning
});

// ── Users ──────────────────────────────────────────────────────────────────

const updateUserRole = Joi.object({
    role: Joi.string().valid('admin', 'finance', 'inventory', 'department', 'auditor', 'executive').required(),
    department: Joi.string().trim().allow('', null),
});

const updatePreferences = Joi.object({
    notifications: Joi.object({
        email: Joi.boolean(),
        inApp: Joi.boolean(),
        criticalAlerts: Joi.boolean(),
        approvalUpdates: Joi.boolean(),
        stockAlerts: Joi.boolean(),
    }),
    dashboardLayout: Joi.object(),
    theme: Joi.string().valid('dark', 'light'),
});

// ── Reports ────────────────────────────────────────────────────────────────

const generateReport = Joi.object({
    templateId: Joi.string().trim().required(),
    dateFrom: Joi.string().isoDate().required(),
    dateTo: Joi.string().isoDate().required(),
    format: Joi.string().valid('PDF', 'XLSX', 'CSV').default('PDF'),
    filters: Joi.object().default({}),
});

const scheduleReport = generateReport.append({
    schedule: Joi.string().trim().required(), // cron expression
    recipients: Joi.array().items(Joi.string().email()).min(1).required(),
});

module.exports = {
    authRegister, authLogin,
    createAsset, updateAsset, transferAsset, assetQuery,
    createInventory, adjustInventory,
    createPurchaseRequest, approvalAction,
    resolveAlert,
    createLocation,
    updateUserRole, updatePreferences,
    generateReport, scheduleReport,
    paginationQuery,
};
