# CITIL – Campus Inventory, Asset & Material Traceability Platform
### Product Documentation v1.0

---

## 1. Vision & Mission

CITIL is a full-stack campus resource management platform designed to give educational institutions complete, real-time visibility over their physical and digital assets. Its mission is to eliminate manual tracking, reduce resource waste, accelerate procurement decisions, and provide role-appropriate intelligence to every stakeholder — from department heads to finance officers to campus executives.

---

## 2. Problem Statement

- Physical assets (laptops, projectors, lab equipment) go untracked after purchase.
- Stock levels are managed via spreadsheets with no real-time visibility.
- Purchase requests travel through email chains with no audit trail.
- No project-level resource allocation tracking across departments.
- Orphan or over-ordered inventory discovered only during audits.
- Finance teams lack consolidated procurement analytics.
- Zero early-warning system for stock shortages or budget overruns.

---

## 3. Core Feature Architecture

### A. Asset Lifecycle Management
- Register assets with full metadata (category, value, location, warranty, assignee).
- Unique QR code generation per asset for physical tagging.
- Track transfers between locations and departments.
- Automatically log every status change with timestamps and responsible user.
- Retirement and loss tracking with audit evidence.

### B. Inventory & Stock Control
- Real-time stock level monitoring across all campus departments.
- Configurable reorder thresholds with automatic low-stock alerts.
- Stock adjustment log with reason codes (restock, consumption, damage, audit correction).
- Consumption trend analysis to predict future shortages before they occur.
- One-click reorder suggestion triggered by predictive engine.

### C. Multi-Stage Procurement Workflow
- Step-by-step purchase request creation wizard with justification and priority.
- Configurable approval chain: Department Head → Finance Officer.
- In-app and real-time notifications at every stage transition.
- Full approval history with timestamps and approver notes.
- Finance dashboard with aggregated spend, pending requests, and budget utilisation.

### D. Analytics & Predictive Intelligence
- Role-specific dashboards (Admin, Finance, Inventory, Department, Auditor, Executive).
- Key performance indicators: asset utilisation, stock health, procurement cycle time.
- Consumption trend charts and demand forecasting using historical data.
- Anomaly detection to flag unusual consumption or spending patterns.
- Exportable reports in PDF, CSV, and Excel formats.

### E. Bill & Receipt Extractor
- Upload any bill, invoice, or receipt as an image (JPEG/PNG/WEBP) or PDF.
- OCR engine (Tesseract.js) extracts raw text from the document.
- AI model (via OpenRouter free tier) parses text into structured JSON:
  vendor, date, line items, quantities, unit prices, tax, grand total, warranty info.
- Automatic fallback chain across multiple free AI models if one is overloaded.
- Extracted results displayed in an inline editor for review and correction.
- Saved to user's bill history with full expand and delete controls.

### F. Compliance & Audit Trail
- Immutable log of every create, update, transfer, approve, and reject action.
- Filterable by user, asset, date range, and action type.
- Exportable audit reports for regulatory or internal compliance review.
- Integrated with procurement workflow — every approval decision is logged.

### G. Real-Time Notification System
- Per-user in-app notifications stored in Firestore.
- Instant WebSocket push ensures notifications appear without page refresh.
- Role-targeted broadcasts (e.g., only Finance receives PR approval notifications).
- Procurement event triggers: submit, approve, reject — each fires a notification to all relevant parties.
- Low-stock alerts automatically notify inventory staff when items cross thresholds.

---

## 4. Technical Architecture Overview

### Frontend
- **React 19 + Vite 7** — component-based UI with fast hot-reload.
- **React Router DOM v7** — client-side routing with protected route guards.
- **Tailwind CSS v4** — utility-first styling with a dark zinc/slate design system.
- **Recharts** — responsive data visualisation for all analytics charts.
- **Firebase JS SDK** — client-side authentication token management.
- **Lucide React** — consistent icon library across all UI components.

### Backend
- **Express 4** — RESTful API with modular route and service architecture.
- **Firebase Admin SDK** — Firestore database and server-side token verification.
- **WebSocket (`ws`)** — real-time push notifications and live data updates.
- **`node-cron`** — scheduled background jobs for stock checks and analytics snapshots.
- **`multer`** — secure multipart file upload for bill images and PDFs.
- **`tesseract.js`** — on-device OCR; no external billing or data sharing.
- **`openai` (OpenRouter)** — AI bill parsing via free-tier language models.
- **`helmet` + `express-rate-limit`** — security headers and request throttling.
- **`joi`** — schema-level request body validation.
- **`winston`** — structured request and service logging.

### Data Layer
- **Firestore** — primary database with per-domain collections.
- **Firebase Authentication** — identity provider with custom role claims.
- Role resolution chain: Firebase custom claims → Firestore UID lookup → Firestore email query.
- Per-user notification subcollections (`notifications/{userId}/items`).
- Per-user bill subcollections (`bills/{userId}/items`).

### Background Jobs
| Job | Schedule | Function |
|---|---|---|
| Low-stock scanner | Every hour | Alerts + notifications when items cross reorder threshold |
| Analytics snapshot | Daily midnight | Refreshes pre-computed KPIs in Firestore |
| Approval reminders | Every 6 hours | Nudges approvers on PRs pending > 24 hours |

---

## 5. Role-Based Access Control

Six roles enforce data isolation and action safety:

| Role | Core Capabilities |
|---|---|
| **Admin** | Full access to all modules and all actions |
| **Finance** | Approve/reject PRs, view all data, generate reports |
| **Inventory** | Manage stock and assets, create PRs, resolve alerts |
| **Department** | Create and track own PRs, view relevant assets |
| **Auditor** | Read-only across all modules, export reports |
| **Executive** | Analytics, high-level PR/alert view, export reports |

Permissions are enforced at the middleware layer — every API route validates the calling user's role against an action-resource matrix before processing the request.

---

## 6. UI & UX Principles

- **Role-aware dashboards** — the user lands on the correct dashboard automatically based on their role after login.
- **Dark-first design** — consistent dark zinc/slate palette optimised for extended use.
- **Single-page feel** — React Router with smooth transitions; no full-page reloads.
- **Inline editing** — extracted bill data, asset fields, and inventory adjustments are edited in place without modal context switches.
- **Non-intrusive alerts** — system notifications appear via WebSocket push without disrupting active workflows.
- **Mock-data fallback** — all views gracefully display demo data if the backend is unreachable, enabling offline development and presentations.
- **Privacy-first** — no third-party analytics, no telemetry, no external data sharing.

---

## 7. API Surface Summary

| Domain | Endpoints | Key Operations |
|---|---|---|
| Auth | 4 | Register, login, verify, profile |
| Assets | 8 | CRUD, transfer, QR verify, bulk import |
| Inventory | 9 | CRUD, stock adjust, low-stock, trends |
| Procurement | 8 | Create, submit, approve, reject, queue |
| Alerts | 5 | List, acknowledge, resolve |
| Analytics | 9 | Dashboard KPIs, metrics, predictions, triggers |
| Audit | 5 | Logs by user/asset, report generation |
| Locations | 6 | CRUD, map data, assets per location |
| Users | 4 | List, get, update, delete |
| Notifications | 5 | List, mark read, delete |
| Bills | 5 | Extract, list, get, update, delete |

**Total: 68 API endpoints.**

---

## 8. Security Architecture

- All API routes require a valid Firebase ID token (except `/auth/login` and `/health`).
- HTTP security headers enforced via `helmet`.
- Rate limiting on all endpoints; stricter limits on authentication routes.
- File uploads (bills) are written to OS temp directory and **deleted immediately** after processing — no files are persisted on disk.
- CORS restricted to explicitly configured origin allowlist.
- Joi schema validation rejects malformed or unexpected request shapes before business logic runs.
- Audit log is append-only — no service exposes a delete endpoint for audit records.

---

## 9. Expected Impact

CITIL aims to:

- **Eliminate manual asset tracking** — QR tagging and transfer logs make every asset's location and status instantly queryable.
- **Reduce procurement cycle time** — structured multi-stage workflow with real-time notifications cuts approval delays from days to hours.
- **Prevent stockouts** — predictive shortage detection and automatic reorder suggestions keep critical supplies available.
- **Save finance staff time** — aggregated procurement analytics and one-click report export replace manual spreadsheet consolidation.
- **Enable evidence-based audits** — immutable, filterable audit trail satisfies both internal policy and external regulatory requirements.
- **Empower departments** — self-service purchase requests with real-time status visibility reduce dependency on administrative middlemen.

By combining asset management, inventory control, procurement workflow, compliance, and AI-powered document processing in a single platform, CITIL introduces a new standard for campus resource intelligence.

---

*End of Document — CITIL Product Documentation v1.0*
