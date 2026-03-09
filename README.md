# CITIL — Campus Inventory, Asset & Material Traceability Platform

> A full-stack campus resource management system built with **React + Vite** on the frontend and **Express + Firebase** on the backend.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Roles & Permissions](#roles--permissions)
- [Backend API Reference](#backend-api-reference)
- [Frontend Pages](#frontend-pages)
- [Services Reference](#services-reference)
- [Real-time (WebSocket)](#real-time-websocket)
- [Scheduled Jobs](#scheduled-jobs)
- [Bill Extractor Feature](#bill-extractor-feature)
- [Scripts & Utilities](#scripts--utilities)

---

## Overview

CITIL helps campus administrators track assets, manage inventory, process procurement requests, generate analytics, scan QR codes, extract bill data using OCR + AI, and enforce role-based access — all in one platform.

Key capabilities:
- **Asset lifecycle management** — register, transfer, retire, QR-code-tag assets
- **Inventory control** — stock levels, reorder suggestions, low-stock alerts
- **Procurement workflow** — multi-stage purchase request → dept approval → finance approval
- **Analytics & predictions** — dashboard KPIs, consumption trends, anomaly detection
- **Audit trail** — immutable log of every action across every module
- **Bill/Receipt extractor** — OCR + AI converts scanned bills to structured data
- **Role-based access** — 6 roles with a granular permission matrix
- **Real-time notifications** — WebSocket push + in-app notification centre

---

## Tech Stack

### Frontend
| Package | Purpose |
|---|---|
| React 19 + Vite 7 | UI framework & build tool |
| React Router DOM v7 | Client-side routing |
| Tailwind CSS v4 | Utility-first styling |
| Recharts | Charts and data visualisation |
| Lucide React | Icon library |
| Firebase JS SDK | Authentication (client-side) |

### Backend
| Package | Purpose |
|---|---|
| Express 4 | HTTP server & routing |
| Firebase Admin SDK | Firestore DB + Auth token verification |
| `multer` | Multipart file upload (bills) |
| `tesseract.js` | OCR — image → text |
| `pdf-parse` | PDF text extraction |
| `openai` (via OpenRouter) | AI bill parsing (free models) |
| `ws` | WebSocket server |
| `node-cron` | Scheduled background jobs |
| `helmet` | HTTP security headers |
| `express-rate-limit` | Rate limiting |
| `joi` | Request body validation |
| `dayjs` | Date utilities |
| `uuid` | Unique ID generation |
| `winston` | Structured logging |
| `xlsx` | Excel export |
| `qrcode` | QR code generation |
| `pdfkit` | PDF report generation |

---

## Project Structure

```
citil/
├── backend/
│   ├── config/
│   │   ├── cors.js              # CORS allowed-origins config
│   │   ├── permissions.js       # Role → permission matrix
│   │   └── rateLimiter.js       # express-rate-limit config
│   ├── functions/
│   │   ├── scheduledAlerts.js   # Cron: low-stock alerts + notifications
│   │   ├── analyticsSnapshot.js # Cron: daily analytics refresh
│   │   └── approvalReminders.js # Cron: pending-approval nudges
│   ├── middleware/
│   │   ├── auth.js              # Firebase token verification + role resolution
│   │   ├── rbac.js              # RBAC guard factories
│   │   ├── validate.js          # Joi schema validation middleware
│   │   ├── errorHandler.js      # Global error handler
│   │   └── logger.js            # Request logger
│   ├── models/
│   │   └── schemas.js           # Joi schemas for all request bodies
│   ├── routes/
│   │   ├── index.js             # Router registry
│   │   ├── auth.js              # /api/auth
│   │   ├── assets.js            # /api/assets
│   │   ├── inventory.js         # /api/inventory
│   │   ├── procurement.js       # /api/purchase-requests, /api/approval-queue
│   │   ├── alerts.js            # /api/alerts
│   │   ├── analytics.js         # /api/analytics, /api/predictions
│   │   ├── audit.js             # /api/audit-logs, /api/reports
│   │   ├── locations.js         # /api/locations
│   │   ├── users.js             # /api/users
│   │   ├── notifications.js     # /api/notifications
│   │   └── bills.js             # /api/bills
│   ├── services/               # Business logic (one file per domain)
│   ├── utils/                  # logger, helpers
│   ├── websocket/
│   │   └── wsServer.js          # WebSocket server setup
│   └── server.js               # Entry point
└── src/                        # Frontend (React)
    ├── components/
    │   ├── layout/              # Sidebar, Header, Layout
    │   └── ui/                  # Shared UI components
    ├── context/
    │   └── AppContext.jsx        # Global state (user, sidebar, role)
    ├── pages/                   # One folder per route
    ├── utils/
    │   └── api.js               # Typed API client (fetch wrapper + domain helpers)
    └── data/
        └── mockData.js          # Static demo data (never modified)
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- A Firebase project with Firestore and Authentication enabled
- An [OpenRouter](https://openrouter.ai) account (free) for AI bill parsing

### 1. Clone & install

```bash
git clone <repo-url>
cd citil

# Install frontend deps
npm install

# Install backend deps
cd backend && npm install
```

### 2. Firebase setup
1. Go to **Firebase Console → Project Settings → Service Accounts**
2. Click **Generate new private key** → download `serviceAccountKey.json`
3. Place it at `backend/serviceAccountKey.json`

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values (see section below)
```

### 4. Seed users (first-time only)

```bash
cd backend
npm run seed
```

### 5. Run in development

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd .. && npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000/api  
Health check: http://localhost:5000/health

---

## Environment Variables

All variables live in `backend/.env` (copy from `backend/.env.example`):

```dotenv
# Server
PORT=5000
NODE_ENV=development

# Firebase (option A: path to key file)
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# Firebase (option B: individual fields for CI/CD)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Cron schedules (cron syntax)
CRON_STOCK_CHECK=0 * * * *         # hourly
CRON_APPROVAL_CHECK=0 */6 * * *    # every 6 hours
CRON_ANALYTICS_REFRESH=0 0 * * *   # midnight daily

# Bill Extractor — AI parsing (free via OpenRouter)
OPENAI_API_KEY=sk-or-v1-...
```

**Frontend** environment: create `src/.env` (or set in Vite config):
```dotenv
VITE_API_URL=http://localhost:5000/api
```

---

## Roles & Permissions

Six roles are defined in `backend/config/permissions.js`:

| Role | Description |
|---|---|
| `admin` | Full access to everything (`*:*`) |
| `finance` | Read all + approve/reject PRs + create reports |
| `inventory` | Manage stock + assets + create PRs |
| `department` | Create PRs + read own resources |
| `auditor` | Read-only everywhere + export reports |
| `executive` | Read analytics, PRs, alerts + export reports |

Roles are resolved in this priority order:
1. Firebase custom claims (set by admin scripts)
2. Firestore `users` collection by UID
3. Firestore `users` collection by email-derived ID
4. Firestore `users` collection by email query

The `authenticate` middleware in `backend/middleware/auth.js` handles this chain automatically.

### RBAC Middleware Usage

```js
const { authenticate } = require('../middleware/auth');
const { checkPermission, adminOnly, requireRoles } = require('../middleware/rbac');

// Fine-grained permission check
router.get('/assets', authenticate, checkPermission('read', 'assets'), handler);

// Admin only
router.delete('/users/:id', authenticate, adminOnly, handler);

// Allow multiple roles
router.post('/reports', authenticate, requireRoles('finance', 'auditor', 'admin'), handler);
```

---

## Backend API Reference

All routes are prefixed with `/api`. All protected routes require:
```
Authorization: Bearer <Firebase ID Token>
```

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create a new user account |
| POST | `/auth/login` | No | Sign in (returns Firebase token) |
| GET | `/auth/me` | ✅ | Get current user's profile + role |
| GET | `/auth/verify` | ✅ | Verify token is valid |

---

### Assets — `/api/assets`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/assets` | ✅ | List all assets (paginated, filterable) |
| GET | `/assets/:id` | ✅ | Get single asset with full history |
| POST | `/assets` | ✅ | Register a new asset |
| PUT | `/assets/:id` | ✅ | Update asset details |
| POST | `/assets/:id/transfer` | ✅ | Transfer asset to new location/department |
| GET | `/assets/:id/movements` | ✅ | Get movement/transfer history |
| POST | `/assets/bulk` | ✅ | Bulk-register multiple assets |
| GET | `/assets/qr/verify` | ✅ | Verify QR token and return asset info |

---

### Inventory — `/api/inventory`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/inventory` | ✅ | List all stock items (paginated) |
| GET | `/inventory/:id` | ✅ | Get single item + consumption trends |
| POST | `/inventory` | ✅ | Add a new inventory item |
| PUT | `/inventory/:id` | ✅ | Update item details |
| POST | `/inventory/:id/adjust` | ✅ | Adjust stock quantity (in/out) |
| GET | `/inventory/:id/movements` | ✅ | Stock movement history |
| GET | `/inventory/low-stock` | ✅ | Items below reorder threshold |
| GET | `/inventory/consumption-trends` | ✅ | Consumption trend data for charts |
| POST | `/inventory/reorder` | ✅ | Trigger reorder suggestion for an item |

---

### Procurement — `/api/purchase-requests` & `/api/approval-queue`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/purchase-requests` | ✅ | List PRs (filtered by user role) |
| GET | `/purchase-requests/:id` | ✅ | Get single PR |
| POST | `/purchase-requests` | ✅ | Create a new purchase request |
| POST | `/purchase-requests/:id/submit` | ✅ | Submit draft for review |
| POST | `/purchase-requests/:id/approve` | ✅ | Approve PR (finance/dept head) |
| POST | `/purchase-requests/:id/reject` | ✅ | Reject PR with reason |
| GET | `/purchase-requests/:id/approval-history` | ✅ | Full approval audit trail |
| GET | `/approval-queue` | ✅ | All PRs awaiting current user's action |

Approval notifications are automatically sent to relevant users on submit, approve, and reject events.

---

### Alerts — `/api/alerts`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/alerts` | ✅ | List all alerts (paginated) |
| GET | `/alerts/active` | ✅ | Active (unresolved) alerts only |
| GET | `/alerts/:id` | ✅ | Get single alert |
| POST | `/alerts/:id/acknowledge` | ✅ | Mark alert as acknowledged |
| POST | `/alerts/:id/resolve` | ✅ | Mark alert as resolved |

---

### Analytics & Predictions — `/api/analytics` & `/api/predictions`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/analytics/dashboard` | ✅ | All dashboard KPIs in one call |
| GET | `/analytics/assets` | ✅ | Asset breakdown metrics |
| GET | `/analytics/inventory` | ✅ | Inventory metrics |
| GET | `/analytics/procurement` | ✅ | Procurement pipeline metrics |
| GET | `/predictions/shortages` | ✅ | Predicted stock shortage items |
| GET | `/predictions/reorder-suggestions` | ✅ | AI-based reorder tips |
| GET | `/predictions/anomalies` | ✅ | Detected consumption anomalies |
| GET | `/predictions/demand-forecast` | ✅ | Demand forecast data |
| POST | `/analytics/snapshot` | ✅ Admin | Manually trigger analytics refresh |
| POST | `/analytics/low-stock-check` | ✅ Admin | Manually trigger low-stock scan |

---

### Audit Logs & Reports — `/api/audit-logs` & `/api/reports`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/audit-logs` | ✅ | List audit logs (paginated, filterable) |
| GET | `/audit-logs/by-asset/:id` | ✅ | Logs for a specific asset |
| GET | `/audit-logs/by-user/:id` | ✅ | Logs for a specific user |
| POST | `/reports/audit` | ✅ | Generate an audit report |
| POST | `/reports/export` | ✅ | Export data as CSV/Excel/PDF |

---

### Locations — `/api/locations`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/locations` | ✅ | List all campus locations |
| GET | `/locations/:id` | ✅ | Get location details |
| POST | `/locations` | ✅ | Add a new location |
| PUT | `/locations/:id` | ✅ | Update location info |
| GET | `/locations/map-data` | ✅ | Locations formatted for map rendering |
| GET | `/locations/:id/assets` | ✅ | Assets at a specific location |

---

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users` | ✅ Admin | List all platform users |
| GET | `/users/:id` | ✅ | Get user profile |
| PUT | `/users/:id` | ✅ | Update user profile |
| DELETE | `/users/:id` | ✅ Admin | Delete a user |

---

### Notifications — `/api/notifications`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | ✅ | Get current user's notifications |
| PATCH | `/notifications/:id/read` | ✅ | Mark one notification as read |
| PATCH | `/notifications/read-all` | ✅ | Mark all notifications as read |
| DELETE | `/notifications/:id` | ✅ | Delete a notification |
| DELETE | `/notifications` | ✅ | Clear all notifications |

Notifications are also pushed via WebSocket in real-time (see [Real-time](#real-time-websocket)).

---

### Bills (OCR Extractor) — `/api/bills`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/bills/extract` | ✅ | Upload image/PDF → OCR → AI → save & return JSON |
| GET | `/bills` | ✅ | List user's saved bills |
| GET | `/bills/:id` | ✅ | Get single bill |
| PUT | `/bills/:id` | ✅ | Update bill after user edits |
| DELETE | `/bills/:id` | ✅ | Delete a bill |

See [Bill Extractor Feature](#bill-extractor-feature) for full details.

---

## Frontend Pages

| Route | Page | Description |
|---|---|---|
| `/login` | LoginPage | Firebase email/password login |
| `/dashboard/admin` | AdminDashboard | Full platform overview + metrics |
| `/dashboard/finance` | FinanceDashboard | Finance-specific KPIs |
| `/dashboard/inventory` | InventoryDashboard | Stock and asset overview |
| `/dashboard/department` | DepartmentDashboard | Department requests + assets |
| `/dashboard/auditor` | AuditorDashboard | Audit log summary |
| `/dashboard/executive` | ExecutiveDashboard | High-level executive summary |
| `/assets` | AssetList | Searchable asset list |
| `/assets/:id` | AssetDetail | Asset detail + QR + history |
| `/assets/register` | AssetRegister | Register a new asset |
| `/campus` | CampusMap | Interactive campus location map |
| `/inventory` | StockLevels | Stock level table + adjustments |
| `/procurement/request` | PurchaseRequest | Step-by-step PR creation wizard |
| `/procurement/approvals` | ApprovalQueue | Review and act on pending PRs |
| `/procurement/history` | PurchaseHistory | Historical PR list |
| `/analytics` | AnalyticsDashboard | Charts, trends, predictions |
| `/alerts` | AlertsPanel | Alert management with tabs |
| `/compliance/audit` | AuditTrail | Filterable audit log viewer |
| `/compliance/reports` | ReportGenerator | Generate and export reports |
| `/scanner` | QRScanner | Camera-based QR code scanner |
| `/bills` | BillExtractor | OCR + AI bill/receipt extraction |

All routes except `/login` are protected — unauthenticated users are redirected to `/login`.

---

## Services Reference

All business logic lives in `backend/services/`. Routes call services; services never import routes.

| Service | Key Functions |
|---|---|
| `authService` | `createUser`, `getUser`, `listUsers`, `updateUser`, `deleteUser` |
| `assetService` | `createAsset`, `listAssets`, `getAsset`, `updateAsset`, `transferAsset`, `generateQR` |
| `inventoryService` | `listItems`, `getItem`, `createItem`, `updateItem`, `adjustStock`, `getLowStock` |
| `procurementService` | `createPR`, `submitPR`, `approvePR`, `rejectPR`, `getQueue`, `getHistory` |
| `alertService` | `createAlert`, `listAlerts`, `getActiveAlerts`, `acknowledgeAlert`, `resolveAlert` |
| `analyticsService` | `getDashboard`, `getAssetMetrics`, `getInventoryMetrics`, `snapshotAnalytics` |
| `predictiveService` | `getShortages`, `getReorderSuggestions`, `detectAnomalies`, `getDemandForecast` |
| `auditService` | `logAction`, `getLogs`, `getLogsByAsset`, `getLogsByUser` |
| `locationService` | `list`, `get`, `create`, `update`, `getMapData`, `getAssets` |
| `notificationService` | `createNotification`, `listNotifications`, `markRead`, `notifyRole`, `notifyProcurement`, `notifyLowStock` |
| `billService` | `createBill`, `listBills`, `getBill`, `updateBill`, `deleteBill` |
| `ocrService` | `extractText` (Tesseract/pdf-parse), `parseWithAI` (OpenRouter LLM) |

---

## Real-time (WebSocket)

The backend runs a WebSocket server at `ws://localhost:5000/ws`.

Events pushed to clients:

| Event type | Trigger |
|---|---|
| `notification` | New in-app notification created |
| `alert` | New stock or system alert fired |
| `announcement` | Admin broadcasts a message to all users |

Clients authenticate by sending their Firebase ID token in the WebSocket `Upgrade` request header:
```
Authorization: Bearer <token>
```

The server tags each connection with the user's UID and role, enabling targeted pushes (e.g. only notify `finance` role users about a pending PR).

---

## Scheduled Jobs

Three cron jobs run inside `backend/functions/`:

| Job | Default Schedule | What it does |
|---|---|---|
| `scheduledAlerts.js` | Every hour (`0 * * * *`) | Scans inventory for items below reorder threshold; creates alerts + fires in-app notifications to inventory staff; prevents duplicate alerts |
| `analyticsSnapshot.js` | Daily midnight (`0 0 * * *`) | Refreshes pre-computed analytics metrics in Firestore |
| `approvalReminders.js` | Every 6 hours (`0 */6 * * *`) | Sends reminders for PRs that have been pending approval for > 24 hours |

Schedules are configurable via `.env` (`CRON_STOCK_CHECK`, `CRON_ANALYTICS_REFRESH`, `CRON_APPROVAL_CHECK`).

Manual triggers are available for admins:
- `POST /api/analytics/snapshot`
- `POST /api/analytics/low-stock-check`

---

## Bill Extractor Feature

Route: `/bills` | API prefix: `/api/bills`

### How it works

```
User uploads file
      ↓
multer saves to os.tmpdir()
      ↓
ocrService.extractText()
   • Image (JPEG/PNG/WEBP/BMP/TIFF) → Tesseract.js OCR
   • PDF → pdf-parse text extraction
      ↓
ocrService.parseWithAI()
   • Sends raw text to OpenRouter (free LLM API)
   • Model fallback chain (if one model is overloaded → next)
   • Returns structured JSON: vendor, date, items[], tax, grandTotal, warrantyInfo
      ↓
billService.createBill()  →  Firestore: bills/{userId}/items/{billId}
      ↓
201 JSON response to frontend
      ↓
User reviews + edits in BillExtractor.jsx
      ↓
PUT /api/bills/:id  →  Firestore updated
```

### AI Model Fallback Chain

Models are tried in order — if a model returns 429 (overloaded), the next is tried automatically:

1. `arcee-ai/trinity-mini:free`
2. `meta-llama/llama-3.3-70b-instruct:free`
3. `google/gemini-2.0-flash-exp:free`
4. `mistralai/mistral-small-3.1-24b-instruct:free`
5. `qwen/qwen2.5-72b-instruct:free`

If all models fail, the bill is still saved with the raw OCR text — the user can manually fill in fields.

### Limits
- Maximum file size: **20 MB**
- Accepted types: JPEG · PNG · WEBP · BMP · TIFF · PDF

### Setup
Get a **free** API key at [openrouter.ai/keys](https://openrouter.ai/keys) (no credit card needed) and set:
```dotenv
OPENAI_API_KEY=sk-or-v1-...
```

---

## Scripts & Utilities

```bash
# Backend
npm run dev        # Start with nodemon (hot reload)
npm start          # Production start
npm test           # Run Jest tests
npm run seed       # Seed Firestore with initial users/data
npm run lint       # ESLint

# Frontend
npm run dev        # Vite dev server (localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm run lint       # ESLint
```

### Seed script

`backend/scripts/seed.js` populates Firestore with:
- Demo user accounts for each role
- Sample inventory items
- Sample assets
- Sample locations

Run it once after setting up a fresh Firebase project.

---

## Security Notes

- All routes (except `/auth/login`, `/auth/register`, `/health`) require a valid Firebase ID token
- Rate limiting is applied globally and stricter on auth endpoints
- HTTP security headers set by `helmet`
- CORS restricted to origins in `ALLOWED_ORIGINS`
- Uploaded files are written to OS temp directory and **deleted immediately** after processing — nothing is stored on disk permanently
- Firestore rules should enforce that users can only access their own documents (configure in Firebase Console)

---

## License

MIT
