# Defects Found, Fixed, and Investigated During Testing

**Run:** 2026-10-22  
**New product defects found in Phase 2:** 0  
**Harness / Test-Environment defects resolved:** 13  
**Open confirmed P0/P1 product defects:** 0  

This document distinguishes true product defects from test-harness defects, assertion corrections, and environment boundaries. A broken seed script, misconfigured test environment, or inaccurate test expectation is not evidence of an app defect, and a green test must not be used to hide a real failure.

---

## 1. Phase 1 Environment Defects Fixed

| ID | Class | Severity | Defect | Root Cause | Fix | Regression Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DOCKER-001` | Migration / environment | P1 test-blocker | Fresh Supabase migration failed with a duplicate `schema_migrations` primary key / `MigrationApplyError` | Two migration files shared version `20261021000000` | Renamed `20261021000000_incident_evidence_storage.sql` to `20261022000006_incident_evidence_storage.sql`; updated references | `reset-test-data.sh` exit 0; all 44 migrations applied; no duplicate versions |
| `DOCKER-002` | Test fixture | P1 test-blocker | Re-running the seed failed with `Database error deleting user` | Synthetic users owned RESTRICT-referenced jobs, bookings, invoices, attendance, payments, and disputes | Added FK-safe dependency cleanup before profile/Auth deletion | Seed ran repeatedly against the same DB; final container seed exit 0 |
| `DOCKER-003` | Test security / isolation | P1 | Admin compose service received the full test env file, including the service-role key | `env_file` supplied all test values to an app container | Removed `env_file` from Admin; injected only anon/public values; added smoke assertion | `run-smoke-tests.sh` checks Admin/Worker/Organizer for the key; result PASS, key ABSENT |
| `DOCKER-004` | Legacy harness | P2 | Phase 4 marketplace test failed admin KYC approval with `UNAUTHORIZED` | Its fixture used `ON CONFLICT (id) DO UPDATE SET is_active = true`, so the auth-trigger-created worker profile was never promoted to admin | Changed conflict update to set `role = EXCLUDED.role`; also made SSL conditional for local PostgreSQL | Phase 4 marketplace test: 12/12 steps, exit 0 |
| `DOCKER-005` | Test runner process | P2 | Container UI run reported 14/18 while the host run was 18/18 | `opskl-test-runner:test` had not been rebuilt after seed/UI script changes | Rebuilt the runner image and reran | Final container UI: 18/18, exit 0 |
| `DOCKER-006` | Test assertions | P3 | API test reported three false failures | Tests used `p_status` instead of `p_new_status`; expected `offered` instead of `selected_awaiting_confirmation`; treated idempotent duplicate check-in as an error | Corrected assertions and documented idempotency | API workflow: 41/41, exit 0 |
| `DOCKER-007` | Test fixture design | P3 | Worker UI saw `0 LIVE` after seeding one shift | The discovery feed deliberately excludes shifts the current worker already applied to, and the seed applied the only shift | Added a second untouched `Docker Test Open Discovery Shift` for the worker feed | Worker UI shows the open discovery shift; organizer keeps the applied shift |

---

## 2. Phase 2 Adversarial Testing Investigation & Discoveries

| ID | Class | Severity | Observation / Defect | Root Cause | Fix / Architecture Realization | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DOCKER-008` | Test oracle false-pass | P2 | Worker self-verification assertion passed falsely when testing verified worker | Seed had already verified Worker 1; `NEW.verification_status IS DISTINCT FROM OLD.verification_status` was false | Added `SEC-ELEV-03B` and `SEC-ELEV-04B` using fresh *unverified* synthetic accounts; trigger strictly blocks self-verification | `security-adversarial.log` |
| `DOCKER-009` | Script Environment Boundary | P1 | Running `test_phase4_marketplace.mjs` standalone failed foreign key check | Script fell back to parsing `.env` (pointing to remote Supabase project) while `DATABASE_URL` was local | Enforced loading `.env.docker.test` so Auth client and database pooler both target the local test instance | Exit code 0, 12/12 steps pass |
| `DOCKER-010` | Business Logic Validation | P2 | Worker 1 offer acceptance failed with `SCHEDULE_CONFLICT` | Worker 1 was already confirmed on an overlapping shift scheduled during the exact same hours | Separated capacity test shift to a distinct schedule date; verifies double-booking prevention engine | `workflow-adversarial.log` |
| `DOCKER-011` | Business Logic Validation | P2 | Worker check-in failed with `CHECK_IN_TOO_EARLY` | Shift date was 5 days in the future; RPC forbids check-in > 2 hours before shift start | Tested `CHECK_IN_TOO_EARLY` as an explicit guard (`WF-GEO-00`), then adjusted date for arrival geofence | `workflow-adversarial.log` |
| `DOCKER-012` | State Machine Validation | P2 | Dispute creation failed with `INVALID_TRANSITION` | Attempted dispute on `confirmed` booking; state machine requires shift attendance before dispute (`checked_in` or `completed`) | Sequenced dispute test after supervisor sign-off and completion; dispute successfully opened | `workflow-adversarial.log` |
| `DOCKER-013` | Test-runner proxy reliability | P2 test-blocker | Unhandled `ECONNRESET` on socket in `browser_proxy.mjs` terminated loopback proxy during route transitions | `server.on('upgrade')` lacked error listeners on `socket` and `proxySocket`; net.Socket error threw unhandled exception | Attached error listeners on `socket`, `proxySocket`, `req`, `res`, and added process uncaughtException filter for socket teardowns | `browser-ui.log` 42/42 checks pass; exit code 0 |

---

## 3. Product Defect Status

- **Open Confirmed P0/P1 Product Defects:** 0
- **Database Triggers:** Verified active and enforcing (`trg_prevent_role_escalation`, `trg_protect_worker_profile`, `trg_protect_organizer_profile`).
- **Security Definer RPCs:** Set with strict `search_path = public, pg_temp` and caller authentication checks (`auth.uid() IS NULL` guard).
- **Financial Calculations:** Verified against independent oracle; no rounding errors, fee discrepancies, or tax miscalculations found.
- **Client Form Validations:** Real browser automation confirmed accurate error messaging and graceful handling of malformed and unauthorized inputs.

