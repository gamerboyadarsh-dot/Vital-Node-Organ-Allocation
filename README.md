# ODRMN — Organ Donation & Recipient Matching Network

> A database systems mini-project demonstrating a hybrid relational + graph-style schema for real-time donor-recipient compatibility and urgency-based matching.

---

## Problem Statement

Organ donation coordination is historically fragmented across institutions — matching is done via phone calls, spreadsheets, and informal rankings. This results in inequitable allocation, double-allocation race conditions, and no auditable history. ODRMN replaces this with a unified, transactionally-correct system with transparent, formula-driven priority scoring.

---

## Setup Instructions

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- No database installation needed (SQLite, zero setup) — see "Switching to PostgreSQL" below

### Install & Run

```bash
# 1. Clone / extract the project
cd odrmn

# 2. Install all dependencies (root + backend + frontend)
npm install                    # root
cd backend && npm install      # backend
cd ../frontend && npm install  # frontend

# 3. Generate Prisma client + push schema
cd backend
npx prisma generate
npx prisma db push

# 4. Seed the database
node prisma/seed.js
# (or: npm run seed from root)

# 5. Start both servers (from root)
npm run dev
# Backend → http://localhost:3001
# Frontend → http://localhost:5173
```

### Environment Variables (`backend/.env`)

```
DATABASE_URL="file:./odrmn.db"   # SQLite (default)
PORT=3001
NODE_ENV=development
```

### Switching to PostgreSQL

1. Change `backend/.env`:  
   `DATABASE_URL="postgresql://user:password@localhost:5432/odrmn"`
2. Change `backend/prisma/schema.prisma` line 8:  
   `provider = "postgresql"`
3. Re-run: `npx prisma db push && node prisma/seed.js`

Everything else (routes, services, queries) stays identical — Prisma abstracts the driver.

---

## ER Diagram Description

### Entities and Attributes

| Entity | PK | Key Attributes |
|--------|----|----------------|
| **Hospital** | id (UUID) | name, city, latitude, longitude, contactInfo |
| **Donor** | id (UUID) | name, age, bloodGroup (enum), organType (enum), hlaType (JSON), hospitalId (FK), consentStatus (enum), isAvailable |
| **Recipient** | id (UUID) | name, age, bloodGroup (enum), organTypeNeeded (enum), hlaType (JSON), hospitalId (FK), severityScore (1-10), waitTimeDays, priorFailedMatches, status (enum) |
| **CompatibilityMatch** | id (UUID) | donorId (FK), recipientId (FK), bloodCompatible, hlaMatchScore, organTypeMatch, distanceKm, urgencyScore, overallCompatibilityScore, matchStatus (enum) |
| **AuditLog** | id (UUID) | entityType, entityId (polymorphic string), action, actor, details, timestamp |
| **Transplant** | id (UUID) | matchId (FK, unique), donorId (FK), recipientId (FK), outcome (enum), transplantDate, notes |

### Relationships and Cardinalities

```
Hospital 1 ──── N Donor          (one hospital registers many donors)
Hospital 1 ──── N Recipient      (one hospital registers many recipients)
Donor    1 ──── N CompatibilityMatch   (one donor has many candidate edges)
Recipient 1 ──── N CompatibilityMatch  (one recipient appears in many candidate edges)
CompatibilityMatch 1 ──── 0..1 Transplant  (a finalized match becomes exactly one transplant)
Donor    1 ──── N Transplant     (one donor can have at most one transplant in practice, enforced via isAvailable)
Recipient 1 ──── N Transplant    (one recipient may have multiple transplants if prior ones failed)
```

**CompatibilityMatch is the "graph edge" table**: it models a directed compatibility relationship between every donor-recipient pair that passes the blood-group filter. The attributes *on the edge* (hlaMatchScore, distanceKm, overallCompatibilityScore) follow the graph model — they are properties of the *relationship*, not of either endpoint alone.

**AuditLog uses a polymorphic entityId**: it stores the ID of any entity (Donor, Recipient, Match, or Transplant) as a plain string with an `entityType` discriminator, rather than four separate FK columns. This is intentional — it keeps the table append-only and schema-simple at the cost of not enforcing referential integrity at the DB level (acceptable for an audit log).

### Normalization Notes

The current schema is in **3NF**:
- All non-key attributes depend on the whole primary key (no partial dependencies — all tables use single-column UUID PKs)
- No transitive dependencies (e.g., `distanceKm` on `CompatibilityMatch` is derived from hospital lat/lng, not stored on Donor/Recipient directly)

**Path to BCNF**: The `hlaType` stored as a JSON array violates strict 1NF. In a fully normalized design, HLA markers would be split into a separate `DonorHlaMarker(donor_id, marker)` table, enabling indexed lookups. The Jaccard computation would then be a SQL set-intersection query rather than application code.

---

## Scoring Formulas

### Urgency Score

```
urgency_score = (severity_score × 0.5)
              + (normalized_wait_time × 0.3)
              + (prior_failed_matches × 0.2)

where: normalized_wait_time = min(wait_time_days / 365, 1) × 10
```

| Weight | Field | Rationale |
|--------|-------|-----------|
| **0.5** | `severity_score` | Clinical urgency is the primary factor |
| **0.3** | `waitTimeDays` | Fairness — longer waits increase priority |
| **0.2** | `priorFailedMatches` | Equity — patients who lost previous matches are compensated |

Weights are declared as named constants in `services/urgencyScoring.js` (`W_SEVERITY`, `W_WAIT`, `W_FAILED`) and exposed via the API. This directly addresses the "no informal ranking" problem — any stakeholder can inspect and audit the formula.

### Overall Compatibility Score (0–100)

```
overall_score = (bloodCompatible ? 40 : 0)
              + (hlaMatchScore × 30)
              + (organTypeMatch ? 20 : 0)
              + max(0, 10 - distanceKm / 50)
```

| Points | Factor | Rationale |
|--------|--------|-----------|
| **40** | Blood compatibility | Hard biological requirement; weighted highest |
| **30** | HLA Jaccard score | Tissue match quality; reduces rejection risk |
| **20** | Organ type match | Always true after filtering, kept for transparency |
| **≤10** | Proximity | Logistics — closer = better organ viability |

---

## ACID Transaction: The Allocation Flow

**File**: `backend/src/services/allocation.js` — `finalizeMatch(matchId)`

### The Race Condition Being Prevented

Without a transaction, two staff members at different hospitals could simultaneously load the same donor's match candidates, both click "Finalize Match" for different recipients, and both requests would succeed — resulting in **one organ allocated to two recipients** (a catastrophic double-allocation).

### How We Prevent It

```
BEGIN TRANSACTION
  1. Re-fetch donor     → if donor.isAvailable === false → ROLLBACK → 409 Conflict
  2. Re-fetch recipient → if recipient.status !== 'Waiting' → ROLLBACK → 409 Conflict
  3. UPDATE donor SET isAvailable = false
  4. UPDATE recipient SET status = 'Matched'
  5. UPDATE match SET matchStatus = 'Finalized'
  6. UPDATE all other matches for this donor SET matchStatus = 'Rejected'
  7. INSERT INTO transplants (outcome = 'Pending')
  8. INSERT INTO audit_logs (action = 'MATCH_FINALIZED')
COMMIT
```

Steps 1 & 2 are **re-checks inside the transaction** — even if both requests pass the initial availability check (before entering the transaction), only one will succeed at step 1 because the first committed transaction will have set `isAvailable = false`. The second request will see the updated value, rollback, and return a 409 to the user.

In **PostgreSQL**, this would use `SELECT ... FOR UPDATE` row-level locking for even stronger guarantees. In SQLite, file-level locking serializes concurrent writes automatically.

---

## 6 Core Functional Modules — Code Mapping

| Module | Backend Service | Route | Frontend Page |
|--------|----------------|-------|---------------|
| Registry | `auditLogger.js` | `donors.js`, `recipients.js`, `hospitals.js` | `DonorForm`, `RecipientForm` |
| Compatibility Engine | `compatibilityEngine.js`, `bloodCompatibility.js`, `hlaMatching.js` | `donors.js` (`GET /:id/matches`) | `MatchFinder` |
| Urgency Scoring | `urgencyScoring.js` | `recipients.js` (`GET /priority-list`) | `Dashboard`, `RecipientList` |
| Proximity Search | `geoSearch.js` | Embedded in `compatibilityEngine.js` | `MatchFinder` (distance column) |
| Consent & Audit Trail | `auditLogger.js` | `audit.js` | `AuditLog` |
| Analytics | `analytics.js` route | `GET /analytics/*` | `Analytics` |

---

## Next Steps: Extensions

### Full Graph Database (Neo4j)

The `CompatibilityMatch` table is already modeled as a graph edge. Migrating to Neo4j would mean:
- `Donor` and `Recipient` become **nodes** with labels
- `CompatibilityMatch` rows become **`IS_COMPATIBLE`** edges with properties (hlaMatchScore, distanceKm, etc.)
- The ranking query becomes a Cypher traversal instead of a SQL JOIN

### 3NF → BCNF Normalization

- Extract `HlaMarker(id, donor_id | recipient_id, marker_code)` table — eliminates the JSON array storage
- Extract `BloodCompatibilityRule(donor_group, recipient_group)` — makes the rule engine data-driven rather than code-driven
- Separate `UrgencyWeights(id, w_severity, w_wait, w_failed, effective_from)` — versioned weight history for full auditability
