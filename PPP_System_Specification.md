# AAPPP — Automated PPP Platform
## System Specification & Project Proposal

**Federal PPP Directorate — Project Proposal & Asset Management Platform**

| | |
|---|---|
| **Document Type** | System Specification / Proposal for Presentation |
| **Version** | 2.0 |
| **Date** | September 2026 |
| **Status** | Implemented — Living Specification |
| **Audience** | Stakeholders, Steering Committee, Technical Review Board |

---

## 1. Executive Summary

The **Automated PPP Platform (AAPPP)** is a full-stack web application that digitizes the complete lifecycle of Public-Private Partnership operations for the Federal PPP Directorate. It replaces fragmented, paper- and email-based processes with a single centralized platform covering:

1. **Proposal Management** — submission, auto-numbered registration, multi-reviewer evaluation, and approval of PPP project proposals from private developers.
2. **Asset Management** — a registry of PPP buildings, floors, and rentable units.
3. **Contract & Revenue Management** — rental contracts with tenants and automated payment schedules with collection tracking.
4. **Institutional Configuration** — a foundation layer of 15+ configurable lookup domains (geography, currencies, statuses, sectors, units, types) that keeps the platform adaptable without code changes.

The system is built on a proven, cost-effective open-source stack (React, Node.js/Express, PostgreSQL), enforces role-based access control with JWT security, and maintains full audit trails on all transactional data.

---

## 2. Background & Problem Statement

Ethiopia's Federal PPP Directorate coordinates infrastructure partnerships across energy, transport, health, education, and urban development. The incumbent process suffered from:

| Problem | Impact |
|---|---|
| Proposals submitted via email/physical delivery | Scattered documents, no single source of truth |
| Manual routing between departments | Bottlenecks, no visibility into review progress |
| No status visibility for developers | Constant phone/email follow-up |
| Contract & rent tracking on spreadsheets | Missed payments, weak accountability |
| Lookups (sectors, regions, currencies) hardcoded or inconsistent | High cost of every process change |

AAPPP addresses all five by providing one integrated platform for **proposals → review → approval → assets → contracts → payments**.

---

## 3. System Scope & Functional Modules

### 3.1 Module Map

```
┌────────────────────────────────────────────────────────────────────┐
│                          AAPPP PLATFORM                            │
├──────────────────┬──────────────────┬──────────────────────────────┤
│  PROPOSAL        │  REVIEW          │  ASSET & CONTRACT            │
│  MANAGEMENT      │  WORKFLOW        │  MANAGEMENT                  │
│                  │                  │                              │
│  • Proposal CRUD │  • Reviewer      │  • Buildings registry        │
│  • Auto numbering│    assignment    │  • Floors & Units            │
│  • Categories    │  • Submit review │  • Rental contracts          │
│  • Documents     │  • Decisions     │  • Payment schedules         │
│    (attachments) │  • Statistics    │  • Payment collection        │
├──────────────────┴──────────────────┴──────────────────────────────┤
│                     FOUNDATION / CONFIGURATION LAYER               │
│  Countries · Regions · Zones · Woredas · Currencies ·              │
│  Project Categories · Proposal Statuses · Project Statuses ·       │
│  Business Sectors · Organization Types · Building Types ·          │
│  Floor Types · Area Units · Shop Service Types ·                   │
│  Payment Timings · Rental Payment Types · Tracking Types (WBS) ·   │
│  Tracking Areas · Checklists · Document Sequences                  │
├────────────────────────────────────────────────────────────────────┤
│        SECURITY · USERS · ORGANIZATIONS · DASHBOARD & REPORTS      │
└────────────────────────────────────────────────────────────────────┘
```

### 3.2 Module 1 — Proposal Management

- **Structured proposal intake**: project name, developer organization, project category (with on-land classification), proposed capital amount + currency, land requested (m²), description, and remarks.
- **Automatic document numbering**: a *Document Sequence* service generates sequential, auditable proposal numbers (`document_sequences` table + `prop_number` on proposals) — no duplicate or manual registration numbers.
- **Draft → Submit lifecycle**: proposals are saved as drafts and formally submitted; editing is restricted by lifecycle stage.
- **Proposal categories**: configurable classification of proposal types, including an *is-on-land* flag driving later land/asset handling.
- **Categorization via `proposal_categories`** with many-to-many organization–organization-type assignment.

### 3.3 Module 2 — Review & Approval Workflow

- **Reviewer assignment**: foundation staff assign one or more reviewers to a submitted proposal, with per-assignment status (Pending / Approved / Rejected / Cancelled).
- **Independent review workspace**: each reviewer submits a decision with remarks via `POST /proposal-reviews/:id/submit`.
- **Aggregation & statistics**: review statistics per proposal (approvals, rejections, pending counts) exposed via `GET /proposal-reviews/proposal/:id/statistics`.
- **Proceed decision**: a formal `proceed` action (`POST /proposal-reviews/proposal/:id/proceed`) advances the proposal once review outcomes justify it.
- **Review decision registry**: a dedicated `review_decisions` domain (Approve / Reject / Request Changes) configurable by administrators.
- **Full traceability**: every review action is attributed, timestamped, and queryable per proposal and per reviewer.

### 3.4 Module 3 — Asset & Rental Contract Management

**Buildings**
- Building registry with floors and individual rentable units.
- Unit attributes include building type, floor type, area (with configurable area units), rental state flags (`is_rented`, `is_for_rent`), and shop service types.

**Rental Contracts**
- Contract creation per unit referencing: tenant organization, floor number, area value, rent per m², computed monthly total, rental payment type, payment timing, start/end dates.
- Soft-delete with full audit columns; `is_active` flag governs contract validity.

**Rental Payments**
- Automatic payment schedule generation per contract: amount due, due date, amount paid, payment date, next payment date, and `is_paid` settlement flag.
- Enables receivables tracking and arrears follow-up for every leased PPP unit.

### 3.5 Module 4 — Foundation / Configuration Layer

A self-service catalogue of master data, each with full CRUD admin screens:

| Domain | Purpose |
|---|---|
| Countries → Regions → Zones → Woredas | 4-level geographic hierarchy (unified Geographic Management screen) |
| Currencies | Multi-currency financial entries (ETB, USD, …) |
| Project Categories / Proposal Categories | Proposal classification |
| Proposal Statuses / Project Statuses | Workflow state configuration |
| Business Sectors | Economic sector classification |
| Organization Types | Partner/developer classification |
| Building / Floor Types, Area Units | Asset registry attributes |
| Shop Service Types | Retail unit service classification |
| Payment Timings, Rental Payment Types | Contract payment terms |
| Tracking Item Types | WBS-enabled work-breakdown types (Pillar → Phase → Task) with WBS-capable / leaf-node constraints |
| Tracking Areas & Checklists | Project tracking configuration |
| Document Sequences | Registration numbering rules |

### 3.6 Module 5 — Security & Administration

- **Authentication**: email/password login, bcrypt-hashed credentials, JWT access tokens (15-minute expiry) with 7-day refresh tokens.
- **Live account-state enforcement**: the auth middleware re-validates the user against the database on **every request** — deactivated accounts are locked out immediately, even with a valid token.
- **Session timeout modal** on the frontend for idle-session handling.
- **User administration**: create/edit/deactivate users, role assignment, user details.
- **Organization administration**: organizations and their types (developers, partners, tenants).
- **Role-based access**: Administrator, Foundation Staff, Reviewer, Developer — enforced at API route level and reflected in navigation.

### 3.7 Module 6 — Dashboard & Reporting

- Summary cards: total proposals, pending reviews, recently submitted, approved counts.
- Project charts (Recharts) for status distribution and submission trends.
- Review statistics dialog per proposal.
- Role-aware quick actions (New Proposal, View All, My Reviews).

### 3.8 Module 7 — Document Management

- Multi-file upload (drag-and-drop) attached to proposals: PDF, Word, Excel, PowerPoint, images.
- Server-side validation, UUID-based storage names (path-traversal safe), original filename and MIME type preserved, served through a controlled `/uploads` endpoint.
- Download/preview from the proposal details view.

---

## 4. Technical Architecture

### 4.1 Architecture Overview — Three-Tier

```
┌──────────────────────────────────────────────────────────────┐
│  PRESENTATION TIER                                           │
│  React 19 SPA · Vite 8 · Material UI v9 · React Router v7    │
│  React Hook Form + Yup · MUI X Data Grid · Recharts · Day.js │
└──────────────────────────┬───────────────────────────────────┘
                           │  HTTPS / JSON (REST)
┌──────────────────────────▼───────────────────────────────────┐
│  APPLICATION TIER                                            │
│  Node.js · Express 5 REST API                                │
│  Layered: Routes → Controllers → Services → Models           │
│  JWT auth middleware · Joi validation · Multer uploads        │
│  Helmet · CORS · Morgan logging · Nodemailer (SMTP)          │
└──────────────────────────┬───────────────────────────────────┘
                           │  Parameterized SQL (node-postgres)
┌──────────────────────────▼───────────────────────────────────┐
│  DATA TIER                                                   │
│  PostgreSQL (aappp_db) · UUID primary keys · Soft deletes    │
│  Audit columns (created/updated/deleted_by + timestamps)     │
│  Versioned SQL migrations in /migrations                     │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Technology Stack (as implemented)

**Frontend** (`ppp-frontend`)
- React **19** with functional components & hooks; context-based auth/project state
- **Vite 8** build tooling; **oxlint** for linting
- **Material UI v9** + Emotion; MUI **X Data Grid** for enterprise tables; MUI Lab
- **React Router v7** (nested protected routes, catch-all redirect)
- **React Hook Form + Yup** for validated forms
- **Recharts** for analytics; **Day.js** for dates; **Notistack** for notifications
- Government-grade visual identity: deep navy `#1a237e` primary, teal accent, Plus Jakarta Sans typography

**Backend** (`ppp-backend`)
- **Node.js + Express 5**, layered architecture (routes / controllers / services / models)
- **PostgreSQL** via `pg` with parameterized queries (Sequelize available in the dependency set)
- **jsonwebtoken** + **bcrypt** for auth; **Joi** for schema validation
- **Multer** for multipart uploads; **UUID** storage naming
- **Helmet**, **CORS**, **Morgan**; **Nodemailer** wired for SMTP notifications
- **Nodemon** in development; structured `migrations/` for schema versioning

### 4.3 Backend Project Structure

```
ppp-backend/
├── server.js                  # Express app + registration of 30+ route modules
├── config/database.js         # PostgreSQL connection
├── routes/                    # auth, users, organizations, projects, buildings,
│                              # rental contracts, foundation lookups, files
├── controllers/               # HTTP handlers per domain
├── services/                  # Business logic per domain
├── models/                    # Data-access layer (30+ models)
├── middlewares/auth.js        # JWT verification + live account-state check
├── migrations/                # Versioned SQL schema changes
├── uploads/proposals/         # Document storage
└── docs/                      # API documentation
```

### 4.4 Frontend Page Inventory (35+ screens)

| Area | Screens |
|---|---|
| Projects | Proposal List, New/Edit Proposal, Proposal Details, Project List/Details/Form, Review Page, Review Approval Page |
| Buildings | Index, Create, Detail, Edit |
| Contracts | Index, Create, Detail, Edit |
| Organizations | List, Form, Details, Organization Types |
| Users | List, Create, Details, Edit |
| Foundation | 14 lookup pages incl. unified Geographic Management, Tracking Types, Categories, Statuses |
| System | Dashboard (cards + charts), Login, Document Sequences |

### 4.5 REST API Surface (30+ resources under `/api/v1`)

| Group | Endpoints (illustrative) |
|---|---|
| Auth | `POST /auth/login`, refresh flow |
| Users | `GET/POST/PUT/DELETE /users` |
| Organizations | `/organizations`, `/organization-types` |
| Proposals | `/project-proposals` CRUD, `/:id/reviewers`, `prop_number` registration |
| Reviews | `/project-proposal-reviewers`, `/proposal-reviews/:id/submit`, `/proposal/:id/statistics`, `/proposal/:id/proceed`, `/review-decisions` |
| Assets | `/buildings`, `/building-floors`, `/building-units` |
| Revenue | `/rental-contracts`, `/rental-payments` |
| Lookups | `/currencies`, `/proposal-statuses`, `/project-statuses`, `/project-categories`, `/countries`, `/regions`, `/zones`, `/woredas`, `/business-sectors`, `/building-types`, `/floor-types`, `/area-units`, `/shop-service-types`, `/payment-timings`, `/rental-payment-types`, `/tracking-item-types`, `/tracking-areas`, `/checklists`, `/document-sequences` |
| Files | `/files` upload/delete; `/uploads` static serving |

**Standard response envelope**: `{ success, data, message?, pagination? }` with consistent error shape `{ success: false, message }`.

### 4.6 Database Schema (PostgreSQL — key tables)

| Table | Role |
|---|---|
| `users` | Accounts, roles, active flag, bcrypt credentials |
| `organizations`, `organization_types`, `organization_organization_types` | Partners/developers/tenants + classification (M2M) |
| `project_proposals` | Proposals with generated `prop_number`, financials, lifecycle status |
| `proposal_categories`, `project_categories` | Proposal/project classification |
| `proposal_statuses`, `project_statuses` | Workflow state configuration |
| `proposal_reviewers` | Reviewer assignments + per-reviewer status/due dates |
| `proposal_reviews`, `review_decisions` | Submitted reviews and decision catalogue |
| `buildings`, `building_floors`, `building_units` | Asset registry (units carry `is_rented`, `is_for_rent`) |
| `rental_contracts`, `rental_payments` | Leasing and receivables schedule |
| `tracking_item_types`, `tracking_areas`, `checklists` | WBS tracking configuration |
| `document_sequences` | Registration number series |
| Geographic: `countries`, `regions`, `zones`, `woredas` | 4-level address hierarchy |
| Lookups: `currencies`, `business_sectors`, `building_types`, `floor_types`, `area_units`, `shop_service_types`, `payment_timings`, `rental_payment_types` | Reference data |

**Conventions**: UUID v4 primary keys (`uuid_generate_v4`), `created_at/updated_at/deleted_at` + `created_by/updated_by/deleted_by` audit columns, soft-delete flags (`is_deleted`, `is_active`), indexed foreign keys, `NUMERIC(18,2)` for money.

---

## 5. Non-Functional Requirements

| Category | Specification |
|---|---|
| **Security** | JWT (15 min access / 7 d refresh), bcrypt hashing, Helmet headers, CORS, per-request account-state verification, parameterized SQL, UUID upload naming, file-type/size validation |
| **Auditability** | Full audit columns on transactional tables; soft deletes; attributable review decisions; generated proposal numbers |
| **Usability** | Responsive MUI interface, validated forms, session-timeout handling, snackbar feedback, keyboard-accessible components |
| **Performance** | Indexed schema, connection pooling, paginated list endpoints, MUI X Data Grid virtualized tables |
| **Maintainability** | Layered backend (routes→controllers→services→models), one service module per domain on the frontend, versioned SQL migrations, centralized theme |
| **Portability** | Pure open-source stack; runs on any Node 18+/PostgreSQL 14+ host; environment-driven configuration (`.env`) |
| **Localizability** | Structured for Amharic/localization extension; currency and geography built in |

---

## 6. Deployment Specification

**Environments**
- Development: Node 18+, PostgreSQL 14+, Vite dev server + nodemon.
- Production: Node.js LTS behind **Nginx** reverse proxy with **SSL/TLS**, PM2 process manager, dedicated PostgreSQL instance.

**Configuration** (environment variables, secrets excluded from source)
- Backend: `PORT`, `DB_HOST/PORT/USER/NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN=15m`, `REFRESH_TOKEN_EXPIRES_IN=7d`, `SMTP_*`.
- Frontend: API base URL via `.env`.

**Provisioning steps**
1. Create database `aappp_db`; run all scripts in `ppp-backend/migrations/` in order.
2. `npm install` + `.env` setup for both tiers; `npm start` (backend :5000), `npm run build` (frontend static bundle).
3. Secure uploads directory; enable HTTPS; schedule database backups.

**Operations**: uptime & error monitoring, DB backup rotation, log management, security patch cadence, storage utilization tracking.

---

## 7. Benefits & Expected Outcomes

| Stakeholder | Outcome |
|---|---|
| **Foundation Staff** | Single workspace for proposals, reviewers, assets, contracts; automated numbering and payment schedules |
| **Reviewers** | Personalized review queue, document access, one-click approve/reject with remarks |
| **Developers** | Online submission with real-time status visibility — no follow-up calls |
| **Directorate Leadership** | Dashboards for pipeline, workload, and revenue collection; audit-ready records |
| **Citizens/Public** | Transparent, accountable PPP pipeline and asset utilization |

**Quantifiable targets**: elimination of paper-based registration, full traceability of every approval decision, immediate lockout of deactivated accounts, and receivables visibility on 100% of rental contracts.

---

## 8. Future Roadmap

1. **Notifications** — activate the wired SMTP/Nodemailer channel for submission, review, and payment-due alerts.
2. **WBS execution layer** — build the `tracking_items` hierarchy (Pillar → Phase → Task) with progress and weight roll-up on top of the existing tracking-type foundation.
3. **Advanced analytics** — drill-down dashboards, exportable reports (Excel/PDF), arrears aging.
4. **Localization** — full Amharic UI.
5. **Hardening** — multi-factor authentication, SSO integration, rate limiting.
6. **Scale-out** — Redis caching layer, CDN for static assets, horizontal API scaling (stateless by design).

---

## 9. Conclusion

AAPPP is not a concept paper — it is a **working platform** with 30+ backend resources, 35+ frontend screens, and a production-grade security model, already covering proposals, reviews, buildings, contracts, and payments. The remaining roadmap (notifications, WBS execution, analytics) builds on foundations that are already implemented and tested.

The platform positions the Federal PPP Directorate at the forefront of digital governance: **every proposal numbered, every decision traceable, every birr of rental revenue tracked.**

---

### Appendix A — Repository Layout

```
AAPPP/
├── ppp-backend/          # Express 5 REST API (this spec, §4.3)
├── ppp-frontend/         # React 19 SPA (this spec, §4.4)
├── migrations/           # Versioned PostgreSQL schema (in ppp-backend)
├── PPP_System_Specification.md      # This document
├── PPP_Project_Proposal_System.md   # Original concept proposal (v1.0)
└── PPP_System_User_Guide.md         # Operational user guide
```

*Prepared from direct codebase review — all features described reflect implemented code as of September 2026.*
