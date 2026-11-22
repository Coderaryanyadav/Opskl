# Opskl Security & Authorization Verification Results

**Date:** 2026-10-22  
**Test Suite:** `scripts/docker/test_security_adversarial.mjs`  
**Execution Environment:** Isolated Dockerized Stack (`opskl-test-admin-1`, `opskl-test-worker-1`, `opskl-test-organizer-1`, Supabase CLI `127.0.0.1:54321` / PostgreSQL `127.0.0.1:54322`)  
**Overall Security Status:** **PASS — ZERO LEAKS, ZERO ESCALATIONS, STRICT RLS ENFORCED**

---

## 1. Test Summary

| Security Domain | Checks Executed | Passed | Failed | Blocked |
| :--- | :--- | :--- | :--- | :--- |
| **1. Anonymous Access Denials** | 10 | 10 | 0 | 0 |
| **2. Anonymous Sensitive RPC Denials** | 6 | 6 | 0 | 0 |
| **3. Cross-Worker Record Isolation** | 6 | 6 | 0 | 0 |
| **4. Cross-Organizer Record Isolation** | 6 | 6 | 0 | 0 |
| **5. Cross-Role Operation Guardrails** | 6 | 6 | 0 | 0 |
| **6. Privilege Escalation Guards & Triggers** | 6 | 6 | 0 | 0 |
| **7. Storage Bucket Object RLS** | 4 | 4 | 0 | 0 |
| **8. Service-Role Key Zero-Leak Guarantee** | 8 | 8 | 0 | 0 |
| **Total Security Checks** | **52** | **52** | **0** | **0** |

---

## 2. Detailed Test Matrix

### Domain 1: Anonymous Access Denials (Table RLS)
Anonymous HTTP requests bearing only the public anon key attempted to read sensitive database tables directly via PostgREST.

| Test ID | Target Table | HTTP Verb | Expected Status | Actual Status | RLS Policy Enforced | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SEC-ANON-01` | `/rest/v1/worker_profiles` | `GET` | 200 (Empty Array `[]`) | 200 (`[]`) | `worker_profiles_isolation_policy` | **PASS** |
| `SEC-ANON-02` | `/rest/v1/organizer_profiles` | `GET` | 200 (Empty Array `[]`) | 200 (`[]`) | `organizer_profiles_isolation_policy` | **PASS** |
| `SEC-ANON-03` | `/rest/v1/applications` | `GET` | 200 (Empty Array `[]`) | 200 (`[]`) | `applications_isolation_policy` | **PASS** |
| `SEC-ANON-04` | `/rest/v1/attendance_records` | `GET` | 200 (Empty Array `[]`) | 200 (`[]`) | `attendance_records_isolation_policy` | **PASS** |
| `SEC-ANON-05` | `/rest/v1/invoices` | `GET` | 200 (Empty Array `[]`) | 200 (`[]`) | `invoices_isolation_policy` | **PASS** |
| `SEC-ANON-06` | `/rest/v1/payout_records` | `GET` | 200 (Empty Array `[]`) | 200 (`[]`) | `payout_records_isolation_policy` | **PASS** |
| `SEC-ANON-07` | `/rest/v1/disputes` | `GET` | 200 (Empty Array `[]`) | 200 (`[]`) | `disputes_isolation_policy` | **PASS** |
| `SEC-ANON-08` | `/rest/v1/incident_reports` | `GET` | 200 (Empty Array `[]`) | 200 (`[]`) | `incident_reports_isolation_policy` | **PASS** |
| `SEC-ANON-09` | `/rest/v1/verification_cases` | `GET` | 200 (Empty Array `[]`) | 200 (`[]`) | `verification_cases_admin_only` | **PASS** |
| `SEC-ANON-10` | `/rest/v1/audit_logs` | `GET` | 200 (Empty Array `[]`) | 200 (`[]`) | `audit_logs_admin_only` | **PASS** |

### Domain 2: Anonymous Sensitive RPC Denials
Anonymous clients attempted direct remote procedure calls to administrative or mutated business functions.

| Test ID | Target RPC | Payload | Expected Outcome | Actual Outcome | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SEC-RPC-01` | `/rpc/resolve_verification_case_safe` | Synthetic case ID, status: `approved` | HTTP 400/401/403 with `UNAUTHORIZED` | HTTP 400 (`UNAUTHORIZED: caller must be an active administrator`) | **PASS** |
| `SEC-RPC-02` | `/rpc/admin_settle_payout` | Synthetic payout ID, UTR reference | HTTP 400/401/403 with `UNAUTHORIZED` | HTTP 400 (`UNAUTHORIZED: caller must be an active administrator`) | **PASS** |
| `SEC-RPC-03` | `/rpc/create_job_safe` | Valid shift parameters | HTTP 400/401/403 with `UNAUTHORIZED` | HTTP 400 (`UNAUTHORIZED: caller must be an active organizer`) | **PASS** |
| `SEC-RPC-04` | `/rpc/apply_for_job_safe` | Valid job ID | HTTP 400/401/403 with `UNAUTHORIZED` | HTTP 400 (`UNAUTHORIZED: caller must be an active worker`) | **PASS** |
| `SEC-RPC-05` | `/rpc/check_in_safe` | Valid booking ID, venue coordinates | HTTP 400/401/403 with `UNAUTHORIZED` | HTTP 400 (`UNAUTHORIZED: caller must be an authenticated worker`) | **PASS** |
| `SEC-RPC-06` | `/rpc/resolve_dispute_safe` | Synthetic dispute ID, ruling | HTTP 400/401/403 with `UNAUTHORIZED` | HTTP 400 (`UNAUTHORIZED: caller must be an active administrator`) | **PASS** |

### Domain 3: Cross-Worker Record Isolation
Worker 1 attempted to access or modify records owned exclusively by Worker 2.

| Test ID | Adversarial Action | Target Entity | Expected Outcome | Actual Outcome | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SEC-CW-01` | Worker 1 reads Worker 2 private profile | `worker_profiles` (id: Worker 2) | Returns HTTP 200 with empty array `[]` | 0 rows returned | **PASS** |
| `SEC-CW-02` | Worker 1 attempts direct update on Worker 2 profile | `worker_profiles` (id: Worker 2) | Update rejected or affects 0 rows | 0 rows affected | **PASS** |
| `SEC-CW-03` | Worker 1 reads Worker 2 bookings | `bookings` (worker_id: Worker 2) | Returns empty array `[]` | 0 rows returned | **PASS** |
| `SEC-CW-04` | Worker 1 reads Worker 2 attendance timestamps | `attendance_records` (worker_id: Worker 2) | Returns empty array `[]` | 0 rows returned | **PASS** |
| `SEC-CW-05` | Worker 1 reads Worker 2 payout ledger | `payout_records` (worker_id: Worker 2) | Returns empty array `[]` | 0 rows returned | **PASS** |
| `SEC-CW-06` | Worker 1 attempts check-in on Worker 2 booking | `/rpc/check_in_safe` (booking: Worker 2) | RPC raises exception: `BOOKING_NOT_FOUND` | `BOOKING_NOT_FOUND: caller is not the assigned worker` | **PASS** |

### Domain 4: Cross-Organizer Record Isolation
Organizer 1 attempted to inspect or tamper with shifts, rosters, and invoices owned by Organizer 2.

| Test ID | Adversarial Action | Target Entity | Expected Outcome | Actual Outcome | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SEC-CO-01` | Organizer 1 attempts to update Organizer 2 shift | `jobs` (organizer_id: Organizer 2) | Update rejected or affects 0 rows | 0 rows affected | **PASS** |
| `SEC-CO-02` | Organizer 1 reads Organizer 2 invoices | `invoices` (organizer_id: Organizer 2) | Returns empty array `[]` | 0 rows returned | **PASS** |
| `SEC-CO-03` | Organizer 1 attempts to cancel Organizer 2 booking | `/rpc/cancel_booking_safe` | RPC raises `BOOKING_NOT_FOUND` | `BOOKING_NOT_FOUND: booking does not belong to organizer` | **PASS** |
| `SEC-CO-04` | Organizer 1 attempts to generate invoice for Org 2 | `/rpc/generate_job_invoice_safe` | RPC raises `UNAUTHORIZED` | `UNAUTHORIZED: shift does not belong to caller` | **PASS** |
| `SEC-CO-05` | Organizer 1 reads applicants for Org 2 private shift | `applications` (job_id: Org 2 shift) | Returns empty array `[]` | 0 rows returned | **PASS** |
| `SEC-CO-06` | Organizer 1 attempts to approve attendance on Org 2 | `/rpc/complete_shift_and_approve_attendance` | RPC raises `UNAUTHORIZED` | `UNAUTHORIZED: shift does not belong to caller` | **PASS** |

### Domain 5: Cross-Role Operation Guardrails
Workers attempting organizer actions, or organizers attempting worker actions.

| Test ID | Role | Adversarial Action Attempted | Expected Outcome | Actual Outcome | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SEC-CR-01` | Worker | Post a new shift via `/rpc/create_job_safe` | Rejected with `UNAUTHORIZED: organizer role required` | HTTP 400 with `UNAUTHORIZED` | **PASS** |
| `SEC-CR-02` | Organizer | Apply for shift via `/rpc/apply_for_job_safe` | Rejected with `UNAUTHORIZED: worker role required` | HTTP 400 with `UNAUTHORIZED` | **PASS** |
| `SEC-CR-03` | Worker | Read GST invoices via `/rest/v1/invoices` | Empty array returned | 0 rows returned | **PASS** |
| `SEC-CR-04` | Organizer | Settle payout via `/rpc/admin_settle_payout` | Rejected with `UNAUTHORIZED: admin role required` | HTTP 400 with `UNAUTHORIZED` | **PASS** |
| `SEC-CR-05` | Worker | Approve KYC via `/rpc/resolve_verification_case_safe` | Rejected with `UNAUTHORIZED: admin role required` | HTTP 400 with `UNAUTHORIZED` | **PASS** |
| `SEC-CR-06` | Organizer | Approve KYC via `/rpc/resolve_verification_case_safe` | Rejected with `UNAUTHORIZED: admin role required` | HTTP 400 with `UNAUTHORIZED` | **PASS** |

### Domain 6: Privilege Escalation Guards & Database Triggers
Users attempted direct SQL updates or PostgREST mutations to elevate their role or verification status.

| Test ID | Actor | Attempted Mutation | Guarding Mechanism | Actual Outcome | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SEC-ELEV-01` | Worker | `UPDATE profiles SET role = 'admin' WHERE id = auth.uid()` | Trigger `trg_prevent_role_escalation` | Database exception: `UNAUTHORIZED_ROLE_ESCALATION` | **PASS** |
| `SEC-ELEV-02` | Organizer | `UPDATE profiles SET role = 'admin' WHERE id = auth.uid()` | Trigger `trg_prevent_role_escalation` | Database exception: `UNAUTHORIZED_ROLE_ESCALATION` | **PASS** |
| `SEC-ELEV-03` | Worker (Unverified) | `UPDATE worker_profiles SET verification_status = 'verified'` | Trigger `trg_protect_worker_profile` | Database exception: `CANNOT_SELF_VERIFY` | **PASS** |
| `SEC-ELEV-04` | Organizer (Unverified) | `UPDATE organizer_profiles SET verification_status = 'verified'` | Trigger `trg_protect_organizer_profile` | Database exception: `CANNOT_SELF_VERIFY` | **PASS** |
| `SEC-ELEV-05` | Worker | `UPDATE profiles SET is_active = true` on suspended account | Trigger `trg_protect_profile_status` | Direct update denied | **PASS** |
| `SEC-ELEV-06` | Anonymous | Tampering with JWT claims (`role: "admin"`) | HMAC-SHA256 signature verification | GoTrue HTTP 401: `Invalid JWT signature` | **PASS** |

### Domain 7: Storage Bucket Object RLS
Storage API permissions on private document buckets (`kyc-documents`, `incident-evidence`).

| Test ID | Actor | Target Storage Path | Expected Status | Actual Status | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SEC-STOR-01` | Anonymous | Direct download of `/storage/v1/object/public/kyc-documents/worker1_aadhaar.pdf` | HTTP 400/403/404 | HTTP 404 (Private bucket) | **PASS** |
| `SEC-STOR-02` | Worker 1 | Download of Worker 2 document `/storage/v1/object/authenticated/kyc-documents/worker2_id.jpg` | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| `SEC-STOR-03` | Organizer 1 | Direct read of unredacted KYC documents of applicants | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| `SEC-STOR-04` | Admin | Download via signed URL generated by service role | HTTP 200 OK | HTTP 200 OK | **PASS** |

### Domain 8: Zero-Leak Containment Audit
Auditing running container environments and compiled client-side JavaScript assets for leaks of `SUPABASE_SERVICE_ROLE_KEY`.

| Test ID | Target Container / Asset Path | Checked Property | Expected Status | Actual Status | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SEC-LEAK-01` | Container `opskl-test-admin-1` | Environment dump `printenv` | Service key absent | **ABSENT** | **PASS** |
| `SEC-LEAK-02` | Container `opskl-test-worker-1` | Environment dump `printenv` | Service key absent | **ABSENT** | **PASS** |
| `SEC-LEAK-03` | Container `opskl-test-organizer-1` | Environment dump `printenv` | Service key absent | **ABSENT** | **PASS** |
| `SEC-LEAK-04` | `apps/worker/web-build/static/js/` | Bundle text grep for service key prefix | Zero occurrences | **0 matches** | **PASS** |
| `SEC-LEAK-05` | `apps/organizer/web-build/static/js/` | Bundle text grep for service key prefix | Zero occurrences | **0 matches** | **PASS** |
| `SEC-LEAK-06` | `apps/admin/.next/static/` | Bundle text grep for service key prefix | Zero occurrences | **0 matches** | **PASS** |
| `SEC-LEAK-07` | HTTP Response Headers (`X-Powered-By`, `Server`) | Production URL leak check | Zero production URLs | **0 matches** | **PASS** |
| `SEC-LEAK-08` | Test Runner Artifacts (`test-artifacts/docker/*.json`) | Raw credential scan | Demo keys only, no prod secrets | **CLEAN** | **PASS** |
