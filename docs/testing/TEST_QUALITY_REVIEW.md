# Test Quality and Rigor Review

**Date:** 2026-10-22 (IST)  
**Repository:** `/Users/aryan/Desktop/PROJECTS/OPSKIL`  
**Purpose:** Independent critique of existing test suites, distinguishing live application tests, database trigger assertions, static source assertions, and simulated mocks.

---

## 1. Classification of Test Types Across All Suites

| Suite / File | Total Checks | Actual Live Application / RPC | Database Triggers / RLS | Static Source / Catalog | Mock / Synthetic Simulation |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`test_api_workflow.mjs`** | 41 | 38 (92.7%) | 38 (92.7%) | 0 (0%) | 1 (time-travel attendance) |
| **`test_ui_workflow.mjs`** | 18 | 18 (100%) | 18 (100%) | 0 (0%) | 0 (real Chromium headless) |
| **`test_security_adversarial.mjs`** | 52 | 52 (100%) | 52 (100%) | 1 (bundle grep) | 0 (real multi-tenant tokens) |
| **`test_workflow_adversarial.mjs`**| 37 | 37 (100%) | 37 (100%) | 0 (0%) | 1 (time-travel attendance) |
| **`test_sql_integration.mjs`** | 56 | 22 (39.3%) | 34 (60.7%) | 34 (catalog checks) | 0 (direct PG transaction) |
| **`test_lifecycle_db.mjs`** | 69 | 69 (100%) | 69 (100%) | 9 (catalog grants) | 0 (direct PG connection) |
| **`test_full_workflow_db.mjs`** | 52 | 52 (100%) | 52 (100%) | 0 (0%) | 0 (direct PG connection) |
| **`test_phase4_marketplace.mjs`** | 12 | 12 (100%) | 12 (100%) | 0 (0%) | 0 (real auth + PG pooler) |
| **Unit Suites (`npm test`)** | 390 | 0 (0%) | 0 (0%) | 390 (unit logic) | 390 (in-memory Jest mocks) |

---

## 2. In-Depth Critique of Previous Blind Spots

### 2.1 The "Already-Verified" Privilege Escalation False Confidence
- **Issue:** In Phase 1, `test_api_workflow.mjs` verified that `adminProfile.role === 'admin'`. However, it did not test what happens when a normal worker attempts to update their own `verification_status` to `'verified'`.
- **Finding in Phase 2:** When we initially ran an adversarial test updating `verification_status` on Worker 1, the check succeeded because Worker 1 was *already* marked `'verified'` by the seed script. Testing an update of `verification_status: 'verified'` when `OLD.verification_status` was already `'verified'` resulted in `NEW.verification_status IS DISTINCT FROM OLD.verification_status` evaluating to `false`.
- **Rigor Added:** Phase 2 introduced [test_security_adversarial.mjs](file:///Users/aryan/Desktop/PROJECTS/OPSKIL/scripts/docker/test_security_adversarial.mjs) (`SEC-ELEV-03B` and `SEC-ELEV-04B`) which provisions *fresh unverified* worker and organizer accounts and attempts direct REST self-verification. Both attempts are strictly blocked by `check_worker_profile_update()` and `check_organizer_profile_update()`.

### 2.2 Cross-Tenant Isolation Blind Spots
- **Issue:** Phase 1 only seeded one worker and one organizer. Therefore, it was impossible to prove cross-worker or cross-organizer authorization barriers.
- **Rigor Added:** Phase 2 expanded the fixture seed to provision `worker2` and `organizer2`. The adversarial suite tested:
  - Worker 1 reading Worker 2's KYC documents and private bookings.
  - Worker 1 checking in or confirming offers meant for Worker 2.
  - Organizer 1 editing, invoicing, offering, or settling Organizer 2's shifts.
  All cross-tenant attempts were verified to fail with `UNAUTHORIZED` or empty sets.

### 2.3 Financial Calculation Oracle Independence
- **Issue:** Previous tests only asserted that `total_payable > 4000`. This is a weak assertion that does not prove GST or platform fee correctness.
- **Rigor Added:** Phase 2 built an independent financial calculation oracle (`calculateExpectedInvoice`) in [test_workflow_adversarial.mjs](file:///Users/aryan/Desktop/PROJECTS/OPSKIL/scripts/docker/test_workflow_adversarial.mjs) that calculates:
  - Wage Total: ₹4,000.00
  - Platform Fee (10%): ₹400.00
  - GST (18% on Platform Fee): ₹72.00
  - Total Payable: ₹4,472.00
  Every individual column in `organizer_invoices` was asserted against the independent oracle, proving 0.00 rupee discrepancy.

### 2.4 Time Travel vs Real Waiting
- **Finding:** The checkout RPC `check_out_worker_safe` requires a minimum shift duration of 15 minutes before checkout is permitted.
- **Execution:** Both `test_api_workflow.mjs` and `test_workflow_adversarial.mjs` use the service client to update `check_in_time` in `bookings` and `attendance_records` to 9 hours in the past.
- **Critique:** This is an intentional fixture simulation to prevent blocking automated CI runs for 15 minutes. It is **not** an application bypass; the checkout RPC still executes its internal duration validations.
