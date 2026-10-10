# VitalNode (ODRMN) — Autonomous Organ Allocation & Regional Medical Logistics Network

<div align="center">

![VitalNode Logo](frontend/public/favicon.svg)

### *Precision Clinical Allocation • Real-Time ADS-B Organ Transit Radar • Explainable Copilot AI • ACID Multi-Hospital Consensus*

[![Live Demo](https://img.shields.io/badge/Frontend-Vercel%20Live-brightgreen?style=for-the-badge&logo=vercel)](https://vital-node-organ-allocation.vercel.app)
[![API Server](https://img.shields.io/badge/Backend-Render%20Live-blue?style=for-the-badge&logo=render)](https://vital-node-organ-allocation.onrender.com)
[![SQL Inspector](https://img.shields.io/badge/SQL%20Console-Interactive-blueviolet?style=for-the-badge)](https://vital-node-organ-allocation.vercel.app/sql)
[![Evaluation Tests](https://img.shields.io/badge/Evaluation%20Tests-10%2F10%20Passed-success?style=for-the-badge)](https://github.com/gamerboyadarsh-dot/Vital-Node-Organ-Allocation)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

---

### 🌐 Live Production Deployments

| Component | Platform | Live URL |
| :--- | :--- | :--- |
| **Frontend Command Terminal** | **Vercel** | **[https://vital-node-organ-allocation.vercel.app](https://vital-node-organ-allocation.vercel.app)** |
| **Backend REST & WebSockets** | **Render** | **[https://vital-node-organ-allocation.onrender.com](https://vital-node-organ-allocation.onrender.com)** |
| **Interactive Live SQL Console** | **Vercel** | **[https://vital-node-organ-allocation.vercel.app/sql](https://vital-node-organ-allocation.vercel.app/sql)** |
| **Live Health Check Probe** | **Render** | **[https://vital-node-organ-allocation.onrender.com/api/health](https://vital-node-organ-allocation.onrender.com/api/health)** |

---

</div>

## 💡 The Human Problem: Why VitalNode Exists

In modern medicine, organ transplantation remains a miracle hindered by archaic logistics. When a donor organ becomes viable, seconds dictate survival:
- **Cold Ischemic Time (CIT)** degrades graft viability by the minute (hearts degrade within 4 hours, livers in 12 hours, kidneys in 24 hours).
- Coordinators across regional hospitals historically rely on fragmented phone calls, manual spreadsheets, and opaque priority rankings.
- Catastrophic **double-allocation race conditions** and informal triage create distrust and tragic delays.

**VitalNode** reimagines organ allocation as a unified, transparent, mathematically verifiable platform. It unites **15 regional medical centers** under atomic ACID transactional guarantees, real-time ADS-B flight corridor tracking, multi-locus HLA tissue typing, and explainable clinical AI to eliminate bureaucratic friction and maximize lives saved.

---

## 🎓 Academic Demonstration Guide: Live Evaluation Checklist

This section directly maps to the **Project Implementation & Live Demonstration** evaluation criteria. Every feature is functional and demonstrable live in the deployed app or local environment.

| Evaluation Criterion | Implementation Details | How to Demonstrate Live |
| :--- | :--- | :--- |
| **1. Front-End / Application** | React 18, Vite 5, Tailwind CSS, Lucide icons, Recharts visualizations, Three.js 3D graph, real-time WebSockets. | Navigate through [Live Web App](https://vital-node-organ-allocation.vercel.app). Switch between **Augen Pro** and **Terminal** themes. |
| **2. Database Connectivity** | Prisma ORM 5 with connection pooling and transactional isolation, SQLite (`odrmn.db`) switchable to Cloud PostgreSQL. | Check `/api/health` or run `npm test` to verify database connection pool status. |
| **3. Data Insertion (Create)** | Validated REST APIs: `POST /api/donors` & `POST /api/recipients` with normalized data mapping and audit logging. | Click **Register Donor** (`/donors/new`) or **Add Recipient** (`/recipients/new`) in the UI; record immediately appears in registry. |
| **4. Data Retrieval (Read)** | Complex relational fetching with URL filters: blood group, organ type, status, hospital, and patient search. | Use search bar and filter pills on **Donor Registry** (`/donors`) and **Waitlist Registry** (`/recipients`). |
| **5. Update & Delete (CRUD)** | `PUT /api/donors/:id`, `DELETE /api/donors/:id`, `PUT /api/recipients/:id`, `DELETE /api/recipients/:id`, `PATCH /api/donors/:id/consent`. | Click **Edit** on any donor or recipient row to update clinical scores live; click **Delete** (trash icon) with confirmation. |
| **6. SQL Joins** | 4-table inner join connecting `compatibility_matches`, `donors`, `recipients`, and `hospitals`. | Open **SQL Inspector** (`/sql`) → Click **"1. Multi-Table Relational JOIN"** → Click **Run Query**. |
| **7. Nested Subqueries** | Correlated subquery identifying patients whose clinical severity exceeds their organ's regional average. | Open **SQL Inspector** (`/sql`) → Click **"2. Nested Subquery with Correlated Filter"** → Click **Run Query**. |
| **8. Aggregate Functions** | `COUNT(*)`, `AVG(age)`, `MIN(age)`, `MAX(age)` grouped by `organ_type` filtered via `HAVING COUNT(*) > 0`. | Open **SQL Inspector** (`/sql`) → Click **"3. Aggregate Functions with GROUP BY & HAVING"** → Click **Run Query**. |
| **9. Database Views** | Materialized/Virtual SQL View: `v_critical_waitlist` filtering high-acuity patients ($severity \ge 8$). | Open **SQL Inspector** (`/sql`) → Click **"4. Database View Query (v_critical_waitlist)"** → Click **Run Query**. |
| **10. Triggers & Stored Logic** | SQL trigger `trg_recipient_status_audit` + serialized 2-phase commit stored function `finalizeMatch`. | Open **SQL Inspector** (`/sql`) → Click **"6. Trigger Activity & Audit Log Inspection"** to see automated trigger logs. |
| **11. Semi-Structured / NoSQL** | Multi-locus HLA tissue typing stored as JSON arrays (`HLA-A`, `HLA-B`, `DRB1`) with Jaccard coefficient evaluation. | Open **SQL Inspector** (`/sql`) → Click **"5. Semi-Structured NoSQL / JSON Array Inspection"**. |
| **12. Cloud Database Support** | Seamless driver interchangeability via Prisma: swap from SQLite to PostgreSQL with a single configuration line. | See [Cloud Database Configuration](#-cloud-database-configuration-postgresql--supabase--neon). |
| **13. Dashboard & Visualization** | Live KPI counters, priority waitlist, organ inventory donut chart, 3D exchange topology, and ADS-B radar. | View **Overview Dashboard** (`/`) and open **Transit Radar** or **3D Exchange Graph** (`/exchange`). |
| **14. Security & Access Control** | JWT authentication, bcrypt password hashing, coordinator authorization, append-only immutable audit trail. | Log out and log in via `/login`; view audit ledger at `/audit`. |
| **15. Automated Verification** | Automated end-to-end test suite testing connectivity, CRUD, joins, subqueries, aggregates, views, and triggers. | Run `npm test` in the terminal to watch all 10 evaluation checks pass. |

---

## ⚡ Key Highlights & Core Features

### 1. 🗄️ Interactive Live SQL & Relational Query Inspector (`/sql`)
- Built-in web SQL console allowing evaluators to execute live queries directly against the database engine.
- Includes pre-packaged academic demonstrations:
  - **4-Table JOIN**: Resolves `compatibility_matches` $\leftrightarrow$ `donors` $\leftrightarrow$ `recipients` $\leftrightarrow$ `hospitals`.
  - **Correlated Subquery**: Evaluates `severity_score > (SELECT AVG(severity_score) FROM recipients WHERE organ_type = r.organ_type)`.
  - **Aggregations & Grouping**: `COUNT(*)`, `ROUND(AVG(age), 1)`, `MIN()`, `MAX()` with `HAVING`.
  - **View Execution**: Directly queries `v_critical_waitlist`.
- Real-time execution latency benchmark (e.g., `3ms`) and table row counts.

### 2. 🛸 Live ADS-B Organ Transit Radar & Medevac Flight Corridor
- **Real-Time 360° Tactical Sweep**: Tracks airborne Medevac flights (*King Air 350*, *Sikorsky S-76C+*) and emergency ground couriers across regional airspace.
- **Cold Ischemia Time (CIT) Telemetry**: Live countdown clocks displaying remaining ischemic viability before irreversible tissue necrosis.
- **Hypothermic Perfusion Telemetry**: Monitors graft core temperature (regulated strictly between $3.6^\circ\text{C} - 4.1^\circ\text{C}$) and perfusion pump arterial pressure.
- **Meteorological Squall Simulator**: Interactive weather simulation (fog, squalls, 20kt headwinds) demonstrating real-time vector re-routing.

### 3. 🤖 VitalAI Clinical Decision Copilot
- **Explainable Attribution Matrix**: Answers clinical coordinator queries with deep transparent breakdowns of why one recipient was prioritized over another (e.g., HLA 35%, Urgency 30%, CIT Feasibility 20%, Accrued Waitlist 15%).
- **Ischemia Risk & Delay Simulation**: Simulates the clinical ramifications of a 2h or 4h transit delay on projected **5-year graft survival probability**.
- **Contingency Backup Triaging**: Scans regional centers in real time for immediate fallback candidates if an intraoperative crossmatch suddenly fails.
- **Persistent Conversational Memory**: Chat history stays intact across navigation drawer toggles with zero layout shifts.

### 4. 📄 Cryptographic Surgical Allocation Dossier & Chain of Custody
- **Printable UNOS / OPTN Official Manifest**: Formatted specifically for physical operating theatre hand-offs and medical transport sign-offs.
- **Cryptographic SHA-256 Ledger Seal**: Immutable cryptographic digest certifying data integrity and tamper-proof allocation logging.
- **5-Locus HLA Crossmatch Table**: Side-by-side tissue compatibility matrix comparing donor and recipient allele typing (`HLA-A`, `HLA-B`, `HLA-C`, `DRB1`, `DQB1`).
- **Cold Chain Verification**: Records cross-clamp timestamps, Donor Risk Index (DRI), and transport courier custody transfers.

### 5. 🛡️ ACID 2-Phase Commit Atomic Allocation
- Completely prevents catastrophic double-allocations via serialized transactional isolation.
- Automatically re-verifies donor availability and candidate eligibility inside an atomic transaction block:
  1. Checks and locks donor availability (`isAvailable: false`).
  2. Updates recipient status from `Waiting` to `Matched`.
  3. Finalizes the matching edge and automatically cascades rejections to competing candidates.
  4. Creates a pending transplant record and appends an immutable entry to the audit ledger.

### 6. 🌐 3D Paired Kidney Exchange Network (PKE)
- Interactive 3D force-directed graph (Three.js) resolving complex donor-recipient incompatible pairs into closed 2-way and 3-way swap cycles.
- Simultaneous surgical cross-commit verification ensuring no donor donates without their paired recipient receiving an organ.

---

## 🧮 Transparent Scoring Formulas

### 1. Clinical Urgency Score (0–10)
$$\text{Urgency Score} = (\text{Severity} \times 0.5) + (\text{Normalized Wait Days} \times 0.3) + (\text{Prior Failed Matches} \times 0.2)$$
$$\text{where } \text{Normalized Wait Days} = \min\left(\frac{\text{Wait Days}}{365}, 1\right) \times 10$$

### 2. Multi-Factor Compatibility Score (0–100)
$$\text{Compatibility Score} = \text{ABO}_{\text{Compatible}}(40) + (\text{HLA}_{\text{Jaccard}} \times 30) + \text{Organ}_{\text{Match}}(20) + \max\left(0, 10 - \frac{\text{Distance (km)}}{50}\right)$$

---

## 📐 System Architecture & Relational Design

```mermaid
flowchart TD
    subgraph Client["Frontend Client (Vercel)"]
        UI["React 18 SPA (Augen Pro / Terminal)"]
        Radar["🛸 Transit Flight Radar"]
        Copilot["🤖 VitalAI Copilot"]
        Dossier["📄 Surgical Manifest"]
        SQL["🗄️ SQL Inspector Console"]
        PKE["🧬 3D Paired Exchange"]
    end

    subgraph Server["Backend Node.js Service (Render)"]
        API["Express REST API (/api/*)"]
        WS["Socket.io Real-Time Hub"]
        Daemon["📡 Autonomous Hospital Telemetry Daemon"]
        Engine["⚙️ Matching & Urgency Engine"]
    end

    subgraph Database["Relational Storage Layer (Prisma ORM)"]
        Hospitals["Hospitals (15 Regional Nodes)"]
        Donors["Donors (Living & Deceased)"]
        Recipients["Recipients (Waitlist Queue)"]
        Matches["Compatibility Matches (Graph Edges)"]
        Transplants["Transplants & Outcomes"]
        Audit["Immutable Audit Ledger (Append-Only)"]
        Views["Database Views (v_critical_waitlist)"]
        Triggers["Database Triggers (trg_recipient_status_audit)"]
    end

    UI <-->|HTTPS REST| API
    UI <-->|WSS WebSockets| WS
    Daemon -->|Broadcast Telemetry| WS
    API --> Engine
    Engine --> Matches
    API --> Hospitals & Donors & Recipients & Transplants & Audit & Views
```

### 3NF Normalization Breakdown
- **1NF**: All table columns contain atomic, scalar values (single UUID PKs). HLA arrays are indexed and evaluated via JSON functions.
- **2NF**: No partial dependencies — each non-key attribute fully depends on the entire primary key.
- **3NF**: Zero transitive dependencies. Derived distances (`distanceKm`) are computed from hospital coordinates and stored on relational edges (`compatibility_matches`) rather than entity tables.

---

## 🧪 Automated Academic Evaluation Test Suite

To demonstrate automated database verification live in front of evaluators:

```bash
# Run from repository root
npm test
```

### Output:
```text
================================================================
  VITALNODE (ODRMN) — ACADEMIC LIVE EVALUATION TEST SUITE       
================================================================

  ✔ [PASSED] 1. Database Connectivity & Connection Pool
  ✔ [PASSED] 2. Data Insertion (INSERT INTO Donors & Recipients)
  ✔ [PASSED] 3. Data Retrieval (Complex Filtering & Relational Query)
  ✔ [PASSED] 4. Update Operation (UPDATE Recipient Severity & Wait Time)
  ✔ [PASSED] 5. Delete Operation (DELETE Candidate and Cascade Check)
  ✔ [PASSED] 6. Multi-Table Relational JOIN (CompatibilityMatches + Donors + Recipients + Hospitals)
  ✔ [PASSED] 7. Nested Correlated Subquery (Candidate Severity > Organ Category Average)
  ✔ [PASSED] 8. Aggregate Functions (COUNT, AVG, MIN, MAX with GROUP BY & HAVING)
  ✔ [PASSED] 9. Database View Verification (SELECT * FROM v_critical_waitlist)
  ✔ [PASSED] 10. Database Triggers & Audit Log Insertion

----------------------------------------------------------------
  Test Summary: 10/10 criteria passed.
  ✔ SYSTEM IS 100% READY FOR LIVE ACADEMIC EVALUATION!
----------------------------------------------------------------
```

---

## ☁️ Cloud Database Configuration (PostgreSQL / Supabase / Neon)

VitalNode is cloud-agnostic. While running SQLite locally for zero-setup execution, it can instantly connect to any cloud PostgreSQL instance:

1. In `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. In your cloud environment variables (Render, Railway, or `.env`):
   ```env
   DATABASE_URL="postgresql://username:password@your-cloud-db.supabase.co:5432/vitalnode"
   ```
3. Push schema to cloud:
   ```bash
   npx prisma db push && node prisma/seed.js
   ```

---

## 🚀 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/gamerboyadarsh-dot/Vital-Node-Organ-Allocation.git
cd Vital-Node-Organ-Allocation

# 2. Install dependencies
npm install
npm --prefix backend install
npm --prefix frontend install

# 3. Initialize & Seed database
cd backend
npx prisma generate
npx prisma db push
node prisma/seed.js
cd ..

# 4. Start full-stack development servers
npm run dev
# Frontend -> http://localhost:5174 (or 5173)
# Backend  -> http://localhost:3001
```

---

## 🔒 Security, Compliance & Ethical Controls

- **Role-Based Access Control**: Enforced roles (`Coordinator`, `Admin`, `Hospital Staff`) with JWT authentication and bcrypt password hashing.
- **Append-Only Auditability**: All allocations, certifications, consent revocations, and system actions write strictly append-only records to `audit_logs`.
- **Zero Opaque Biases**: Deterministic mathematical formulas prevent favoritism; every prioritization factor is inspectable and explainable.

---

## 👨‍💻 Author & Contributions

**Developed by Adarsh Agrawal**
- GitHub: [@gamerboyadarsh-dot](https://github.com/gamerboyadarsh-dot)
- Email: [gamerboyadarsh@gmail.com](mailto:gamerboyadarsh@gmail.com)

---

<div align="center">
  <sub>VitalNode — Precision Engineering for Life-Saving Allocation.</sub>
</div>
