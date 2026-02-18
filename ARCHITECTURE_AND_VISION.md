# eSihagBa Project: Architecture, Vision & Core Functionality

> **Purpose**: Persistent reference for the eSihagBa City Budget Tracker. Use this document to align all architecture decisions, feature planning, and implementation with the project's core vision.

---

## Core Vision (Primary)

**eSihagBa's core functionality is:**

1. **One wallet per barangay** – Each barangay gets a unique wallet address (ICP/blockchain address) that represents their budget account.

2. **LGU Super Admin allocates budgets** – The LGU (Local Government Unit) acts as super admin and sends budget allocations to each barangay for a given time period (e.g., quarterly, annual).

3. **Transparent spending per barangay** – Each barangay can see their own allocated budget, remaining balance, and transaction history. Citizens and auditors can verify spending is on-chain and transparent.

**Flow:**
```
LGU (Super Admin) → Allocate budget to Barangay Wallet A for Q1 2025
                  → Allocate budget to Barangay Wallet B for Q1 2025
                  → ...

Barangay A → Receives allocation
          → Spends (transactions recorded on-chain)
          → Citizens view: "Barangay A received ₱X, spent ₱Y, remaining ₱Z"

Barangay B → Same model
```

**Implications:**
- **Barangay = Wallet** (or Barangay has a primary wallet)
- **Allocation** = LGU sends funds (or records allocation) to that wallet for period X
- **Spending** = Transactions from that barangay's wallet are visible and auditable
- **Transparency** = Public can query: allocations, spent amounts, remaining per barangay

---

## Expanded Design (From Core Vision)

### Actor Roles

| Role | Capabilities |
|------|--------------|
| **LGU Super Admin** | Create barangay wallets, allocate budgets (send/assign funds per period), view all barangays, approve or oversee spending |
| **Barangay Admin** | Manage own barangay wallet, record spending/transactions, view own allocation and history |
| **Barangay User** | View own barangay's budget status, submit or record expenses (if permitted) |
| **Auditor** | Read-only access to all allocations and transactions for compliance |
| **Citizen (Public)** | View public summaries: which barangay received what, spent what, when (no auth required) |

### Data Model (Conceptual)

```
Barangay
  - id
  - name
  - walletAddress (primary)
  - createdBy (LGU)
  - isActive

BudgetAllocation (LGU → Barangay)
  - barangayId
  - amount
  - periodStart, periodEnd (e.g., Q1 2025)
  - allocatedBy (LGU principal)
  - status (Pending, Active, Exhausted, Closed)

Transaction (Spending)
  - fromWallet (barangay wallet)
  - toAddress (vendor, payee)
  - amount
  - category (Infrastructure, Healthcare, etc.)
  - period/allocationId (links to which budget period this draws from)
  - memo, timestamp
```

### Key Workflows

1. **LGU allocates budget**
   - LGU selects barangay, enters amount, period
   - System creates BudgetAllocation and (optionally) records on-chain transfer or internal ledger entry

2. **Barangay spends**
   - Barangay admin records transaction (from barangay wallet, to payee, amount, category)
   - System deducts from allocation, updates remaining balance
   - Transaction is immutable and auditable

3. **Transparency view**
   - Citizen opens app, selects barangay (or sees list)
   - Sees: allocated, spent, remaining, transaction history (sanitized for privacy if needed)

---

## Architecture Review Summary (From Prior Analysis)

### Current State
- Backend: Motoko canister with Users, Wallets, Transactions, BudgetAllocations, Events, AuditLogs
- Frontend: React + Vite + Internet Identity
- Roles: Admin, User, Auditor (need **LGU Super Admin** and **Barangay**-level roles)
- No explicit Barangay entity; Wallet is the closest

### Gaps vs Core Vision
- No **Barangay** entity (barangay = wallet is possible but needs explicit linking)
- No **BudgetAllocation** workflow where LGU sends to a barangay for period X
- Current allocations are category-based, not barangay-based
- No period-scoped allocations (start/end dates)
- Role model needs LGU Super Admin vs Barangay Admin distinction

---

## Implementation Priorities (Aligned to Core Vision)

1. **Barangay entity** – Add Barangay (name, walletAddress, LGU-managed)
2. **LGU allocation flow** – Allocate budget to Barangay for period (amount, startDate, endDate)
3. **Spending linked to allocation** – Transaction records which allocation/period it draws from
4. **Barangay-scoped views** – Barangay users see only their barangay; LGU sees all
5. **Public transparency** – Citizen portal shows per-barangay allocations and spending (read-only)
6. **Role hierarchy** – LGU Super Admin > Barangay Admin > Barangay User > Auditor > Citizen

---

## Design Decisions & Clarifications

### 1. Period Logic & Rollover Policy

**Question:** If Barangay A has ₱10,000 left at the end of Q1, does it automatically roll over to Q2, or is it "liquidated" back to the LGU?

**Decision:** **No automatic rollover** – Unspent funds are returned to LGU at period end.

**Rationale:**
- Ensures LGU maintains control over budget allocation
- Prevents accumulation of unused funds across periods
- Simplifies accounting and audit trails
- Allows LGU to reallocate based on actual needs

**Implementation:**
- When `periodEnd` is reached, remaining balance is marked as "Returned to LGU"
- Status changes: `Active` → `Closed`
- New allocation for next period must be explicitly created by LGU
- Historical data preserved: "Barangay A had ₱10K remaining in Q1, returned to LGU"

**Edge Cases:**
- Transactions initiated before `periodEnd` but confirmed after: Count against the period in which they were initiated
- Partial period spending: If allocation starts mid-quarter, spending is tracked from `periodStart` date

---

### 2. On-Chain vs. Off-Chain Data Storage

**Clarification:** What exactly is stored on-chain (ICP blockchain) vs. in the canister (private but persistent)?

**On-Chain (Public, Immutable):**
- Wallet addresses (barangay wallet addresses)
- Allocation amounts (how much was allocated per period)
- Transaction hashes (if actual ICP transfers occur)
- Timestamps (when allocations and transactions occurred)
- Period boundaries (start/end dates)

**Off-Chain / Private Canister Storage:**
- Detailed transaction memos/descriptions (may contain sensitive vendor names, project details)
- User emails and personal information
- Internal notes and comments
- Audit log details (full descriptions)
- Barangay contact information

**Hybrid Approach:**
- **Public queries** (`getPublicBudgetSummary`, `getPublicTransactionHistory`): Return sanitized data (amounts, dates, categories) without sensitive memos
- **Authenticated queries**: Return full details including memos for authorized users
- **Transaction hashes**: If real ICP transfers occur, hash is on-chain; if ledger-only, hash is canister-generated but still immutable

**Security Consideration:**
- Sensitive memos are stored in the canister (not on public blockchain) but are still immutable once recorded
- Canister storage is persistent across upgrades but not publicly queryable without authentication

---

### 3. Security & Multi-Signature (Future Proofing)

**Requirement:** Wallet recovery and multi-signature for high-value transfers.

**Current State:**
- Single wallet per barangay (single key/principal)
- Barangay Admin controls wallet

**Future Enhancements:**

**Multi-Signature (High Priority):**
- For transactions above a threshold (e.g., ₱100,000), require 2-of-3 signatures:
  - Barangay Admin (primary)
  - LGU Supervisor (approval)
  - Barangay Treasurer (secondary)
- Prevents single-point-of-failure compromise
- Can be implemented via ICP's multi-sig wallet standards or canister-level approval workflow

**Wallet Recovery:**
- If Barangay Admin loses access:
  - LGU Super Admin can initiate recovery process
  - Requires verification (documented request, identity proof)
  - New wallet address assigned, old wallet marked inactive
  - Historical transactions remain linked to old wallet for audit trail

**Implementation Notes:**
- Phase 1: Single-signature (current)
- Phase 2: Add approval workflow for high-value transactions (canister-level, not requiring multi-sig wallet)
- Phase 3: Integrate ICP multi-sig wallet standards when available

---

## eSihagBa Project Review: Architect + Brainstorming

### Part 1: Understanding Summary

1. **What is built** – City budget tracker on ICP: transparent budget tracking, transactions, wallets, events, audit logs, and public citizen portal.
2. **Why it exists** – Budget transparency and accountability via on-chain records.
3. **Who it is for** – Admins (budget/events), users (transactions/wallets), auditors (audit logs), citizens (public read-only data).
4. **Constraints** – ICP (Motoko) backend, cycles, Internet Identity, single-canister backend.
5. **Explicit non-goals** – External DBs (e.g. Supabase); off-chain data persistence.

---

### Part 2: Current Architecture

**System Context:**
```
React Frontend (Vite, shadcn) ↔ Internet Identity ↔ ICP Mainnet
                                      ↓
                            Backend Canister (Motoko)
                            Frontend Assets Canister
```

**Core Domain Entities:**
- Users (Principal + Role) ✅ Implemented
- Wallets ✅ Implemented
- Transactions ✅ Implemented
- Budget Allocations ✅ Backend ready, frontend partial
- Events ✅ Backend ready, frontend partial
- Audit Logs ✅ Implemented
- Public APIs ✅ Backend ready, frontend placeholder

---

### Part 3: Architect Review

**Strengths:**
- Clean separation: Backend logic in one actor, clear shared types
- Role-based access: Admin / User / Auditor with proper checks
- State persistence: `preupgrade` / `postupgrade` for HashMaps
- Scalability: Pagination implemented (`getTransactionsPaginated`, `getAuditLogs`)
- Public APIs: Read-only citizen endpoints without auth

**Architectural Risks:**

| Risk | Severity | Description |
|------|----------|-------------|
| Single-canister bottleneck | Medium | All logic/data in one canister; high load hits memory/cycle limits |
| O(n) aggregations | Medium | `getSystemStats`, `getMonthlyExpenditure` scan all data |
| Monthly expenditure logic | High | Currently divides total by 12 instead of grouping by actual month |
| No transaction–budget link | Medium | `updateBudgetSpent` is manual; transactions don't drive category spend |
| Incomplete audit logging | Low | `logAction` only called for budget/events; missing for transactions/wallets |

**Anti-Patterns / Gaps:**
1. Data model gap: Transactions and Budget Allocations not linked; no category on transactions
2. Inconsistent audit logging: Transaction/wallet operations don't call `logAction`
3. Monthly expenditure: Logic divides totals by 12 instead of timestamp-based grouping
4. No ICP Ledger integration: Addresses stored as text; no verification against IC ledger

---

### Part 4: Core Functionalities Status

**✅ Implemented (Working):**
- User registration and Internet Identity auth
- Wallet creation and listing
- Transaction recording, confirmation, failure
- System stats (totals, pending, confirmed, failed)
- Paginated transaction list
- Activity feed from audit logs
- Audit trail (paginated) for Admin/Auditor

**⚠️ Partial / Misaligned:**
- Monthly expenditure: Backend logic incorrect; frontend shows data but semantics wrong
- Category distribution: Backend returns budget allocations; frontend expects transaction-based breakdown
- Budget analytics: Backend has budget APIs; Analytics page needs alignment
- Events: Full backend; Events UI incomplete integration

**❌ Placeholder / Not Implemented:**
- Citizen Portal: Public backend APIs exist; frontend is "Coming Soon"
- confirmTransaction / failTransaction: Backend APIs exist; frontend Transactions section doesn't expose them

---

### Part 5: Design Approaches

**Approach A: Incremental Fixes (Recommended)**
- Fix `getMonthlyExpenditure` timestamp logic
- Add audit logging for transaction/wallet operations
- Wire confirm/fail transaction in UI
- Align Analytics with budget allocation APIs
- Connect Citizen Portal to public APIs

**Approach B: Data Model Enhancement**
- Add `category: ?BudgetCategory` to transactions
- Auto-update budget spent when transactions confirmed
- Make category distribution derived from transactions

**Approach C: Multi-Canister Split**
- Split into separate canisters (users, transactions, events, public)
- Inter-canister calls

**Decision:** Approach A (incremental fixes) + selective Approach B (transaction–budget link)

---

### Part 6: Decision Log

| # | Decision | Alternatives | Reason |
|---|----------|--------------|--------|
| 1 | Prioritize Approach A | B, C | Quickest path to correctness and feature completion |
| 2 | Fix `getMonthlyExpenditure` | Keep as-is | Current logic is wrong; needs timestamp-based bucketing |
| 3 | Add audit logging for tx/wallet | Skip | Needed for accountability and audit trail quality |
| 4 | Expose confirm/fail in UI | Backend-only | Admins/auditors must be able to change transaction status |
| 5 | Keep single canister | Split canisters | Simpler and sufficient for current/near-term load |
| 6 | **Transactions tied to categories** | **Manual only** | **Yes – Auto-update budget spend when transactions confirmed** |
| 7 | **Citizen portal public** | **Auth required** | **Yes – Appears on login page, no auth required** |
| 8 | **Export functionality** | **No export** | **Yes – CSV/PDF export for transactions and audit logs** |

---

### Part 7: Assumptions

1. Users manage ICP-style addresses; full ledger verification is out of scope for now
2. Admin is registered and configured outside the app (first-time setup)
3. Public APIs are read-only; no sensitive data exposed
4. Current load is low–medium; single-canister limits are acceptable
5. MISSING_FUNCTIONALITY.md reflects intended roadmap; some items already present in backend
6. **Performance targets:** No specific scale targets defined yet; optimize as needed based on usage

---

### Part 8: Open Questions (Answered)

**Q1: Should transactions be tied to budget categories and drive budget spend automatically?**  
**A:** **Yes** – Transactions should have a `category: BudgetCategory` field, and when a transaction is confirmed, it should automatically update the corresponding budget allocation's `spentAmount`. This ensures single source of truth and accurate real-time budget tracking.

**Q2: Should the citizen portal be public (no auth) or require lightweight auth?**  
**A:** **Yes, public** – The citizen portal should appear on the login page and be accessible without authentication. Citizens can view public budget summaries, transaction history (sanitized), and upcoming events without needing Internet Identity.

**Q3: Is there a requirement for export (CSV/PDF) of transactions and audit logs?**  
**A:** **Yes** – Export functionality is required:
- CSV export: Transactions, audit logs, budget allocations (for Excel analysis)
- PDF export: Formatted reports for official documentation and printing
- Role-based: Admins/Auditors can export full data; Citizens can export public summaries only

**Q4: Are there concrete performance or scale targets (users, transactions per day, pages per second)?**  
**A:** **Not yet defined** – No specific performance targets set. System should optimize as needed based on actual usage. Current architecture (single canister, pagination) should handle moderate scale. Monitor and optimize when bottlenecks appear.

---

### Part 9: Recommended Next Steps

*(See Implementation Phases below for detailed breakdown.)*

---

## Implementation Phases

Detailed, ordered phases for implementing the eSihagBa vision. Each phase builds on the previous. Dependencies are noted.

---

### Phase 0: Foundation Fixes (1–2 days)

**Goal:** Fix existing bugs and complete partial features before adding new domain logic.

| # | Task | Backend | Frontend | Deliverable |
|---|------|---------|----------|-------------|
| 0.1 | Fix `getMonthlyExpenditure` | Group transactions by actual month from timestamps; stop dividing total by 12 | — | Correct monthly expenditure data |
| 0.2 | Add audit logging | Call `logAction` in `recordTransaction`, `confirmTransaction`, `failTransaction`, `createWallet` | — | Complete audit trail |
| 0.3 | Expose confirm/fail in UI | — | Add Confirm/Fail buttons to Transactions section with role checks | Admins/auditors can change tx status |

**Dependencies:** None  
**Exit criteria:** Monthly charts correct; all mutations logged; confirm/fail usable in UI.

---

### Phase 1: Citizen Portal & Public Transparency (2–3 days)

**Goal:** Enable public, unauthenticated access to budget and spending data on the login page.

| # | Task | Backend | Frontend | Deliverable |
|---|------|---------|----------|-------------|
| 1.1 | Citizen Portal route | — | Add public route (e.g. `/transparency` or section on login page) | Citizen-facing entry point |
| 1.2 | Wire public APIs | Ensure `getPublicBudgetSummary`, `getPublicEvents`, `getPublicTransactionHistory` return sanitized data | Fetch and display data | Public budget overview |
| 1.3 | Barangay-level view | Add `getPublicBarangaySummary(barangayId)` if Barangay exists; else use wallets | List barangays/wallets with allocations | Per-barangay transparency |
| 1.4 | Login page integration | — | Add "View Public Transparency" link/section on Landing page | Citizens access without auth |

**Dependencies:** Phase 0 complete (data correct)  
**Exit criteria:** Citizens can view budget summaries and transaction history without logging in.

---

### Phase 2: Transaction–Budget Link & Analytics (2–3 days)

**Goal:** Tie transactions to budget categories and drive budget spend automatically.

| # | Task | Backend | Frontend | Deliverable |
|---|------|---------|----------|-------------|
| 2.1 | Add `category` to transactions | Add `category: BudgetCategory` to `recordTransaction`; make required | Update transaction form with category field | Category on every tx |
| 2.2 | Auto-update budget on confirm | In `confirmTransaction`, call `updateBudgetSpent` for tx category + period | — | Budget spent auto-updates |
| 2.3 | Link tx to allocation/period | Add `allocationId` or `period` to Transaction; validate spend vs allocation | Show allocation/period in tx list | Tx tied to period |
| 2.4 | Analytics alignment | Ensure `getCategoryDistribution` reflects confirmed tx spend | Update Analytics charts to use real data | Accurate category breakdown |
| 2.5 | Events UI completion | — | Complete create/update event flows; wire to backend | Events fully usable |

**Dependencies:** Phase 0, Phase 1  
**Exit criteria:** Confirmed transactions update category spend; analytics show correct data; Events CRUD works.

---

### Phase 3: Export Functionality (1–2 days)

**Goal:** CSV and PDF export for transactions and audit logs.

| # | Task | Backend | Frontend | Deliverable |
|---|------|---------|----------|-------------|
| 3.1 | Export API (optional) | Optional: `getTransactionsForExport`, `getAuditLogsForExport` with filters | — | Structured export data |
| 3.2 | CSV export | — | Generate CSV from transactions, audit logs, allocations; role-based | CSV download |
| 3.3 | PDF export | — | Use library (e.g. jspdf, react-pdf) for formatted reports | PDF download |
| 3.4 | Export UI | — | Add Export buttons to Transactions, Audit Trail, Analytics | User-triggered export |

**Dependencies:** Phase 0, Phase 2  
**Exit criteria:** Admins/auditors can export transactions and audit logs as CSV/PDF.

---

### Phase 4: Barangay Entity & Core Vision (3–5 days)

**Goal:** Implement "One wallet per barangay" and LGU allocation flow.

| # | Task | Backend | Frontend | Deliverable |
|---|------|---------|----------|-------------|
| 4.1 | Barangay entity | Add `Barangay` type and storage; `createBarangay`, `getBarangays`, `getBarangay` | — | Barangay CRUD |
| 4.2 | Link Wallet ↔ Barangay | Add `barangayId` to Wallet; one primary wallet per barangay | Barangay selector in wallet creation | Barangay–wallet mapping |
| 4.3 | Role model update | Add `LGUAdmin`, `BarangayAdmin` (or map Admin→LGU, User→Barangay) | Role-based UI routing | LGU vs Barangay roles |
| 4.4 | Period-based BudgetAllocation | Extend allocation: `barangayId`, `periodStart`, `periodEnd`, `status` (Pending, Active, Exhausted, Closed) | — | Period-scoped allocations |
| 4.5 | LGU allocation flow | `allocateBudgetToBarangay(barangayId, amount, periodStart, periodEnd)` | LGU UI: select barangay, amount, period; submit | LGU allocates to barangays |
| 4.6 | Period closure logic | Cron or manual: close period at `periodEnd`, mark remaining as returned to LGU | — | No rollover; funds returned |
| 4.7 | Barangay-scoped views | Queries filter by `barangayId` for Barangay Admin | Barangay Admin sees only own barangay | Scoped data access |
| 4.8 | Public barangay list | `getPublicBarangaySummaries()` – allocations, spent, remaining per barangay | Citizen portal shows per-barangay data | Full transparency |

**Dependencies:** Phase 0, Phase 2  
**Exit criteria:** LGU allocates to barangays by period; barangays see own data; citizens see per-barangay transparency.

---

### Phase 5: Period Rollover & Edge Cases (1–2 days)

**Goal:** Implement period closure and handle edge cases.

| # | Task | Backend | Frontend | Deliverable |
|---|------|---------|----------|-------------|
| 5.1 | Period closure job | Function to close expired allocations; set status `Closed`; record "returned to LGU" | — | Automated/hand-triggered closure |
| 5.2 | Tx initiated before periodEnd | Ensure tx timestamp determines period; document behavior | — | Clear period assignment |
| 5.3 | Validation | Block spending against closed allocations | Error message in UI | No spend after close |
| 5.4 | History view | `getClosedAllocations(barangayId)` for audit | Show closed periods and remaining returned | Audit trail for periods |

**Dependencies:** Phase 4  
**Exit criteria:** Periods close correctly; no post-close spending; history visible.

---

### Phase 6: Security & Future Proofing (2–4 days)

**Goal:** Approval workflow for high-value transactions; wallet recovery.

| # | Task | Backend | Frontend | Deliverable |
|---|------|---------|----------|-------------|
| 6.1 | High-value threshold | Configurable threshold (e.g. ₱100,000) | — | Threshold constant |
| 6.2 | Approval workflow | Tx above threshold: status `PendingApproval`; `approveTransaction(id)` by LGU | Approve/reject UI for LGU | 2-step approval for large tx |
| 6.3 | Wallet recovery | `initiateWalletRecovery(barangayId, newAddress)`, `completeRecovery` (LGU only) | Recovery flow in Settings/Admin | Recover lost wallet |
| 6.4 | Multi-sig (future) | Placeholder for ICP multi-sig integration | — | Design for future integration |

**Dependencies:** Phase 4  
**Exit criteria:** Large transactions require LGU approval; wallet recovery process exists.

---

### Phase 7: Polish & Scale (Ongoing)

**Goal:** Performance, monitoring, UX improvements.

| # | Task | Backend | Frontend | Deliverable |
|---|------|---------|----------|-------------|
| 7.1 | Performance | Optimize O(n) aggregations; caching if needed | — | Faster stats and reports |
| 7.2 | Monitoring | Log errors, track cycle usage | — | Observability |
| 7.3 | UX polish | — | Loading states, error messages, empty states | Better UX |
| 7.4 | Documentation | Update QUICK_START, add user guide | — | Clear docs |

**Dependencies:** All prior phases  
**Exit criteria:** System performant and maintainable.

---

### Phase Summary

| Phase | Focus | Duration | Depends On |
|-------|-------|----------|------------|
| 0 | Foundation fixes | 1–2 days | — |
| 1 | Citizen portal & public transparency | 2–3 days | 0 |
| 2 | Transaction–budget link & analytics | 2–3 days | 0, 1 |
| 3 | Export (CSV/PDF) | 1–2 days | 0, 2 |
| 4 | Barangay entity & LGU allocation | 3–5 days | 0, 2 |
| 5 | Period rollover & edge cases | 1–2 days | 4 |
| 6 | Security (approval, recovery) | 2–4 days | 4 |
| 7 | Polish & scale | Ongoing | All |

**Total estimated:** ~12–21 days for Phases 0–6 (single developer).

---

## References

- `src/backend/main.mo` – Current Motoko implementation
- `MISSING_FUNCTIONALITY.md` – Feature implementation guide
- `QUICK_START.md` – Deployment and setup
- `.cursor/rules/esihagba-vision.mdc` – Cursor rule for vision alignment

---

*Last updated: Design decisions, period logic, on-chain/off-chain clarification, security considerations, and full architecture review integrated.*
