# Security Boundary and Authorization Matrix

**Date:** 2026-10-22 (IST)  
**Suite:** `scripts/docker/test_security_adversarial.mjs`  
**Command:** `docker compose -p opskl-test run --rm test-runner node scripts/docker/test_security_adversarial.mjs`  
**Exit Code:** `0`  
**Result:** **52 PASSED / 0 FAILED**  
**Evidence:** `test-artifacts/docker/security-adversarial.log`  

---

## 1. Unauthenticated Anonymous Access Barriers

| Test ID | Boundary Tested | Expected Result | Actual Result | Status | Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `SEC-ANON-01` | `verification_cases` SELECT | 0 rows / RLS denied | 0 rows | **PASS** | `security-adversarial.log` |
| `SEC-ANON-02` | `organizer_invoices` SELECT | 0 rows / RLS denied | 0 rows | **PASS** | `security-adversarial.log` |
| `SEC-ANON-03` | `payment_records` SELECT | 0 rows / RLS denied | 0 rows | **PASS** | `security-adversarial.log` |
| `SEC-ANON-04` | `audit_logs` SELECT | 0 rows / RLS denied | 0 rows | **PASS** | `security-adversarial.log` |
| `SEC-ANON-05` | `disputes` SELECT | 0 rows / RLS denied | 0 rows | **PASS** | `security-adversarial.log` |
| `SEC-ANON-06` | `safety_reports` SELECT | 0 rows / RLS denied | 0 rows | **PASS** | `security-adversarial.log` |
| `SEC-ANON-07` | `rate_limit_buckets` SELECT | 0 rows / RLS denied | 0 rows | **PASS** | `security-adversarial.log` |
| `SEC-ANON-08` | `invoice_fiscal_sequences` SELECT | 0 rows / RLS denied | 0 rows | **PASS** | `security-adversarial.log` |
| `SEC-ANON-09` | RPC `create_job_safe` | `UNAUTHENTICATED` | Blocked (HTTP error / UNAUTHENTICATED) | **PASS** | `security-adversarial.log` |
| `SEC-ANON-10` | RPC `apply_for_job_safe` | `UNAUTHENTICATED` | Blocked (HTTP error / UNAUTHENTICATED) | **PASS** | `security-adversarial.log` |
| `SEC-ANON-11` | RPC `select_worker_offer_safe` | `UNAUTHENTICATED` | Blocked (HTTP error / UNAUTHENTICATED) | **PASS** | `security-adversarial.log` |
| `SEC-ANON-12` | RPC `worker_confirm_selection_safe` | `UNAUTHENTICATED` | Blocked (HTTP error / UNAUTHENTICATED) | **PASS** | `security-adversarial.log` |
| `SEC-ANON-13` | RPC `check_in_worker_safe` | `UNAUTHENTICATED` | Blocked (HTTP error / UNAUTHENTICATED) | **PASS** | `security-adversarial.log` |
| `SEC-ANON-14` | RPC `check_out_worker_safe` | `UNAUTHENTICATED` | Blocked (HTTP error / UNAUTHENTICATED) | **PASS** | `security-adversarial.log` |
| `SEC-ANON-15` | RPC `complete_shift_and_approve_attendance` | `UNAUTHENTICATED` | Blocked (HTTP error / UNAUTHENTICATED) | **PASS** | `security-adversarial.log` |
| `SEC-ANON-16` | RPC `generate_job_invoice_safe` | `UNAUTHENTICATED` | Blocked (HTTP error / UNAUTHENTICATED) | **PASS** | `security-adversarial.log` |
| `SEC-ANON-17` | RPC `initiate_worker_payout_safe` | `UNAUTHENTICATED` | Blocked (HTTP error / UNAUTHENTICATED) | **PASS** | `security-adversarial.log` |
| `SEC-ANON-18` | RPC `admin_verify_case_safe` | `UNAUTHORIZED` | Blocked (UNAUTHORIZED / is_current_admin false) | **PASS** | `security-adversarial.log` |
| `SEC-ANON-19` | RPC `admin_mark_payout_settled` | `UNAUTHORIZED` | Blocked (UNAUTHORIZED / is_current_admin false) | **PASS** | `security-adversarial.log` |
| `SEC-ANON-20` | RPC `admin_mark_invoice_funded` | `UNAUTHORIZED` | Blocked (UNAUTHORIZED / is_current_admin false) | **PASS** | `security-adversarial.log` |
| `SEC-ANON-21` | RPC `admin_resolve_dispute_safe` | `UNAUTHORIZED` | Blocked (UNAUTHORIZED / is_current_admin false) | **PASS** | `security-adversarial.log` |

---

## 2. Cross-Worker Authorization & Data Isolation

| Test ID | Action Attempted | Attacker Role | Expected Result | Status | Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `SEC-WORKER-01` | Read Worker 2's KYC case | Worker 1 | 0 rows returned via RLS | **PASS** | `security-adversarial.log` |
| `SEC-WORKER-02` | Update Worker 2's `profiles` record | Worker 1 | 0 rows modified / RLS denied | **PASS** | `security-adversarial.log` |
| `SEC-WORKER-03` | Update Worker 2's UPI handle in `worker_profiles` | Worker 1 | 0 rows modified / RLS denied | **PASS** | `security-adversarial.log` |
| `SEC-WORKER-04` | Insert notification targeting Worker 2 | Worker 1 | `CHECK` constraint violation / blocked | **PASS** | `security-adversarial.log` |

---

## 3. Cross-Organizer Authorization & Multi-Tenancy

| Test ID | Action Attempted | Attacker Role | Expected Result | Status | Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `SEC-ORG-01` | Call `edit_job_safe` on Organizer 2's shift | Organizer 1 | `UNAUTHORIZED` | **PASS** | `security-adversarial.log` |
| `SEC-ORG-02` | Call `generate_job_invoice_safe` on Organizer 2's shift | Organizer 1 | `UNAUTHORIZED` | **PASS** | `security-adversarial.log` |
| `SEC-ORG-03` | Read Organizer 2's invoices from `organizer_invoices` | Organizer 1 | 0 rows returned via RLS | **PASS** | `security-adversarial.log` |
| `SEC-ORG-04` | Call `select_worker_offer_safe` on Organizer 2's shift | Organizer 1 | `UNAUTHORIZED` | **PASS** | `security-adversarial.log` |

---

## 4. Privilege Escalation & Administrative Tampering

| Test ID | Target Table / RPC | Caller Role | Tamper Attempt | Expected Result | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| `SEC-ELEV-01` | `profiles` | Worker 1 | Direct update `role = 'admin'` | Blocked by trigger `trg_prevent_role_escalation` | **PASS** | `security-adversarial.log` |
| `SEC-ELEV-02` | `profiles` | Organizer 1 | Direct update `role = 'admin'` | Blocked by trigger `trg_prevent_role_escalation` | **PASS** | `security-adversarial.log` |
| `SEC-ELEV-03A`| `worker_profiles` | Worker 1 | Alter `rating = 5.0, shifts_completed = 999` | Blocked by `check_worker_profile_update` | **PASS** | `security-adversarial.log` |
| `SEC-ELEV-03B`| `worker_profiles` | Unverified Worker | Self-verify `verification_status = 'verified'` | Blocked by `check_worker_profile_update` | **PASS** | `security-adversarial.log` |
| `SEC-ELEV-04A`| `organizer_profiles` | Organizer 1 | Alter `rating = 5.0, total_events_hosted = 999` | Blocked by `check_organizer_profile_update` | **PASS** | `security-adversarial.log` |
| `SEC-ELEV-04B`| `organizer_profiles` | Unverified Organizer | Self-verify `verification_status = 'verified'` | Blocked by `check_organizer_profile_update` | **PASS** | `security-adversarial.log` |
| `SEC-ELEV-05` | `admin_verify_case_safe` | Worker 1 | Self-verify KYC case | `UNAUTHORIZED` (is_current_admin false) | **PASS** | `security-adversarial.log` |
| `SEC-ELEV-06` | `admin_mark_payout_settled` | Organizer 1 | Mark payout settled with forged UTR | `UNAUTHORIZED` (is_current_admin false) | **PASS** | `security-adversarial.log` |
| `SEC-ELEV-07` | `admin_mark_invoice_funded` | Organizer 1 | Mark invoice funded with forged reference | `UNAUTHORIZED` (is_current_admin false) | **PASS** | `security-adversarial.log` |
| `SEC-ELEV-08` | `admin_resolve_dispute_safe` | Worker 1 | Resolve dispute and modify payout | `UNAUTHORIZED` (is_current_admin false) | **PASS** | `security-adversarial.log` |

---

## 5. Storage Bucket Privacy & Object-Level Isolation

| Test ID | Bucket | Action | Caller | Path Tested | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| `SEC-STORE-01` | `verification-documents` | Download | Anon | `${worker2Id}/aadhaar.pdf` | **PASS** | 403 Forbidden / RLS denial |
| `SEC-STORE-02` | `verification-documents` | Download | Worker 1 | `${worker2Id}/aadhaar.pdf` | **PASS** | 403 Forbidden / RLS denial |
| `SEC-STORE-03` | `verification-documents` | Download | Organizer 1 | `${worker2Id}/aadhaar.pdf` | **PASS** | 403 Forbidden / RLS denial |
| `SEC-STORE-04` | `verification-documents` | Download | Admin | `${worker2Id}/aadhaar.pdf` | **PASS** | 200 OK (Legitimate review access) |
| `SEC-STORE-05` | `incident-evidence` | Download | Anon | `${worker2Id}/incident_001.png` | **PASS** | 403 Forbidden / RLS denial |
| `SEC-STORE-06` | `incident-evidence` | Download | Worker 1 | `${worker2Id}/incident_001.png` | **PASS** | 403 Forbidden / RLS denial |

---

## 6. Secret Isolation & Zero-Leak Audits

| Test ID | Target Inspected | Key / Secret Checked | Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| `SEC-LEAK-admin` | Container `opskl-test-admin-1` env | `SUPABASE_SERVICE_ROLE_KEY` | Absent | **PASS** |
| `SEC-LEAK-worker` | Container `opskl-test-worker-1` env | `SUPABASE_SERVICE_ROLE_KEY` | Absent | **PASS** |
| `SEC-LEAK-organizer` | Container `opskl-test-organizer-1` env | `SUPABASE_SERVICE_ROLE_KEY` | Absent | **PASS** |
| `SEC-LEAK-HTTP-admin` | Admin HTML & JS responses | Raw JWT Service-Role string | Absent | **PASS** |
| `SEC-LEAK-HTTP-worker` | Worker static web bundle responses | Raw JWT Service-Role string | Absent | **PASS** |
| `SEC-LEAK-HTTP-organizer`| Organizer static web bundle responses | Raw JWT Service-Role string | Absent | **PASS** |
| `SEC-LEAK-STATIC` | `apps/worker/dist-web`, `apps/organizer/dist-web` | Raw JWT Service-Role string | Absent | **PASS** |
