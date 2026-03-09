# CITIL Backend — Setup Guide

## Prerequisites
- Node.js v18+
- A [Firebase project](https://console.firebase.google.com/) with:
  - **Firestore** database enabled (Native mode)
  - **Firebase Authentication** enabled (Email/Password)
  - **Storage** bucket created

---

## 1. Firebase Configuration

### Option A — Service Account JSON (recommended for local dev)
1. Firebase Console → Project Settings → Service Accounts
2. Click **Generate new private key** → save as `backend/serviceAccountKey.json`
3. In `.env`: `FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json`

### Option B — Environment Variables (recommended for CI/Docker)
Copy values from the downloaded JSON into your `.env`:
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
```

> ⚠️ **Never commit `serviceAccountKey.json` or `.env` to git.**

---

## 2. Firestore Indexes

Create these composite indexes in the Firebase Console (Firestore → Indexes → Composite):

| Collection | Fields | Order |
|-----------|--------|-------|
| `assets` | `category` ASC, `createdAt` DESC | — |
| `assets` | `status` ASC, `createdAt` DESC | — |
| `inventory` | `status` ASC, `lastUpdated` DESC | — |
| `purchaseRequests` | `status` ASC, `createdAt` DESC | — |
| `approvalQueues` | `status` ASC, `targetRole` ASC | — |
| `auditLogs` | `userId` ASC, `timestamp` DESC | — |
| `auditLogs` | `entityType` ASC, `timestamp` DESC | — |
| `alerts` | `severity` ASC, `createdAt` DESC | — |

---

## 3. Installation & Running

```bash
cd backend

# Copy and fill env vars
cp .env.example .env
# Edit .env with your Firebase credentials

# Install dependencies
npm install

# Seed development data (creates users, assets, inventory, alerts)
node scripts/seed.js

# Start development server (auto-reload)
npm run dev

# Start production server
npm start
```

Server starts at: **http://localhost:5000**

Health check: `GET http://localhost:5000/health`

---

## 4. Test Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@campus.edu | Campus@123 |
| Finance | finance@campus.edu | Campus@123 |
| Inventory | inventory@campus.edu | Campus@123 |
| Dept. Head | head@campus.edu | Campus@123 |
| Auditor | auditor@campus.edu | Campus@123 |
| Executive | director@campus.edu | Campus@123 |

---

## 5. Authentication Flow

The frontend (React) uses **Firebase Client SDK** to sign in users and obtain an ID token:

```js
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
const auth = getAuth();
const { user } = await signInWithEmailAndPassword(auth, email, password);
const idToken = await user.getIdToken();

// All API calls include the token
fetch('http://localhost:5000/api/assets', {
  headers: { Authorization: `Bearer ${idToken}` }
});
```

The backend verifies the token using Firebase Admin SDK and reads the role from custom claims.

---

## 6. WebSocket Connection

```js
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onopen = () => {
  // Subscribe to room
  ws.send(JSON.stringify({ type: 'subscribe', room: 'alerts' }));
  ws.send(JSON.stringify({ type: 'subscribe', room: 'dashboard' }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  // Events: ALERT_CREATED, STOCK_UPDATED, ASSET_MOVED, PR_STATUS_CHANGED, etc.
  console.log(msg.event, msg.data);
};
```

---

## 7. API Quick Reference

All endpoints are prefixed with `/api`. All except `/auth/reset-password` require `Authorization: Bearer <Firebase ID Token>`.

| Module | Base Path |
|--------|-----------|
| Auth | `/api/auth` |
| Assets | `/api/assets` |
| Inventory | `/api/inventory` |
| Purchase Requests | `/api/purchase-requests` |
| Approval Queue | `/api/approval-queue` |
| Alerts | `/api/alerts` |
| Audit Logs | `/api/audit-logs` |
| Reports | `/api/reports` |
| Analytics | `/api/analytics` |
| Predictions | `/api/predictions` |
| Locations | `/api/locations` |
| Users | `/api/users` |

---

## 8. Running Tests

```bash
cd backend
npm test                    # all unit tests
npm run test:integration    # integration tests (requires live Firebase emulator)
```

---

## 9. Cron Job Schedule

| Job | Default Schedule | Purpose |
|-----|-----------------|---------|
| Stock check | Every 1 hour | Generate low-stock alerts |
| Approval expiry | Every 6 hours | Escalate overdue approvals |
| Analytics refresh | Daily midnight | Persist KPI snapshot |

Override via `.env`: `CRON_STOCK_CHECK`, `CRON_APPROVAL_CHECK`, `CRON_ANALYTICS_REFRESH`

---

## 10. Frontend Integration

To connect the React frontend to this backend, add to `src/` (or environment config):

```js
// src/config/api.js
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';
```

And in `vite.config.js` dev proxy:
```js
server: {
  proxy: {
    '/api': 'http://localhost:5000',
    '/ws': { target: 'ws://localhost:5000', ws: true },
  }
}
```
