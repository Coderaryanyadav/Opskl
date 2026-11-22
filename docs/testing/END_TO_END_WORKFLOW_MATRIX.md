# Opskl End-to-End Business Workflow Matrix

**Date:** 2026-10-22  
**Audit Scope:** Worker Journey, Organizer Journey, Admin Journey, and Cross-Role E2E Journey  
**Execution Environment:** Isolated Dockerized Stack (`opskl-test-admin-1`, `opskl-test-worker-1`, `opskl-test-organizer-1`, Supabase CLI `127.0.0.1:54321` / PostgreSQL `127.0.0.1:54322`)

---

## 1. Executive Summary

This matrix documents the verification of end-to-end user journeys executed across Opskl's three applications and isolated backend. Every journey was validated using real browser automation (`scripts/docker/test_ui_workflow.mjs`), live PostgREST API calls (`scripts/docker/test_api_workflow.mjs`), and backend transaction state assertions (`scripts/docker/test_workflow_adversarial.mjs`).

All operations use synthetic identities and test-mode ledger records. No tests rely on direct manual database manipulation to simulate state transitions.

---

## 2. Journey A: Worker Lifecycle

| Step ID | User Action | Application Screen | Expected User-Visible Result | Backend & Database Mutation | Verification Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `WRK-FLOW-01` | Register new worker with phone & password | `/auth/login?mode=signup` | Form validates; activation notice or direct session returned | Inserts `auth.users`, triggers `on_auth_user_created`, creates `profiles` (role: `worker`) | **PASS** | `ui-checks.json`, `worker-login.png` |
| `WRK-FLOW-02` | Worker login with valid credentials | `/auth/login` | Redirected away from login route to `/` or requested tab | Issues GoTrue JWT; validates `profiles.is_active = true` | **PASS** | `test_ui_workflow.mjs` |
| `WRK-FLOW-03` | KYC profile submission | `/onboarding` | Profile submission banner; status displays `under_review` | Creates `verification_cases` row; sets `worker_profiles.verification_status = 'under_review'` | **PASS** | `test_workflow_adversarial.mjs` |
| `WRK-FLOW-04` | KYC rejection handling | `/(tabs)/profile` | Clear banner displaying administrator's rejection reason | Updates `verification_cases.status = 'rejected'`; sets `worker_profiles.verification_status = 'rejected'` | **PASS** | `test_workflow_adversarial.mjs` (`WF-KYC-02`) |
| `WRK-FLOW-05` | KYC correction & resubmission | `/onboarding` | Status transitions from `rejected` back to `under_review` | Updates `verification_cases.status = 'resubmitted'`; appends to history | **PASS** | `test_workflow_adversarial.mjs` (`WF-KYC-03`) |
| `WRK-FLOW-06` | Shift discovery & search | `/(tabs)` | Available published shifts displayed; filtered by category/locality | PostgREST `jobs` query filtered by `status = 'published'` and worker geofence | **PASS** | `worker-feed.png` |
| `WRK-FLOW-07` | Shift detail & briefing review | `/shift/[id]` | Wage breakdown, venue location, and briefing checklist displayed | Reads `jobs` row; client verifies dress code and arrival time | **PASS** | `worker-shift-detail.png` |
| `WRK-FLOW-08` | Application submission | `/shift/[id]` | Application confirmed; button transitions to "Application Sent" | Invokes `apply_for_job_safe` RPC; inserts `applications` row (`pending`) | **PASS** | `test_api_workflow.mjs` |
| `WRK-FLOW-09` | Duplicate application rejection | `/shift/[id]` | Warning banner: "Application already submitted for this shift" | RPC raises exception: `DUPLICATE_APPLICATION`; no second row created | **PASS** | `test_api_workflow.mjs` |
| `WRK-FLOW-10` | Offer acceptance | `/(tabs)/my-shifts` | Shift transitions to "Upcoming"; confirmed booking visible | Invokes `worker_confirm_selection_safe` RPC; updates `bookings.status = 'confirmed'` | **PASS** | `test_workflow_adversarial.mjs` (`WF-CAP-04`) |
| `WRK-FLOW-11` | Early check-in rejection | `/shift/checkin` | Check-in rejected: shift starts > 2 hours in the future | RPC raises exception: `CHECK_IN_TOO_EARLY`; attendance record blocked | **PASS** | `test_workflow_adversarial.mjs` (`WF-GEO-00`) |
| `WRK-FLOW-12` | Geofenced venue check-in | `/shift/checkin` | "Checked In Successfully" confirmation banner; green duty indicator | Invokes `check_in_safe` RPC; records `attendance_records` with GPS & timestamp | **PASS** | `test_workflow_adversarial.mjs` (`WF-GEO-01`) |
| `WRK-FLOW-13` | Shift check-out | `/shift/checkin` | Check-out timestamp recorded; shift moves to "Completed" | Invokes `check_out_safe` RPC; calculates duration hours | **PASS** | `test_api_workflow.mjs` |
| `WRK-FLOW-14` | Earnings visibility & UPI setup | `/(tabs)/earnings` | Balance cards show pending wage; UPI modal saves valid handle | Updates `worker_profiles.default_upi_id`; validates Indian UPI regex | **PASS** | `worker-earnings.png` |

---

## 3. Journey B: Organizer Lifecycle

| Step ID | User Action | Application Screen | Expected User-Visible Result | Backend & Database Mutation | Verification Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ORG-FLOW-01` | Organizer registration & login | `/auth/login` | Redirected to dashboard; displays company legal name | Validates organizer profile; issues JWT with role `organizer` | **PASS** | `organizer-dashboard.png` |
| `ORG-FLOW-02` | Business verification & GSTIN setup | `/verification` | GSTIN validated; status badge displays verification state | Updates `organizer_profiles`; validates 15-character GSTIN regex | **PASS** | `organizer-verification.png` |
| `ORG-FLOW-03` | Shift creation wizard (Step 1-4) | `/(tabs)/create` | Multi-step form validates role, schedule, wage, and briefing | Client calculates real-time 10% platform fee and 18% GST estimate | **PASS** | `organizer-create-step1.png` |
| `ORG-FLOW-04` | Shift publication | `/(tabs)/create` | "Shift Published"; shift appears on organizer dashboard | Invokes `create_job_safe` RPC; inserts `jobs` row (`status = 'published'`) | **PASS** | `test_api_workflow.mjs` |
| `ORG-FLOW-05` | Applicant review & screening | `/shift/screening` | Applicants listed with KYC status and trust score | Reads `applications` joined with `worker_profiles`; hides sensitive PII | **PASS** | `organizer-screening.png` |
| `ORG-FLOW-06` | Worker selection / offer dispatch | `/shift/screening` | Applicant status changes to "Offer Sent"; waiting for confirmation | Invokes `select_worker_offer_safe` RPC; updates application to `selected_awaiting_confirmation` | **PASS** | `test_workflow_adversarial.mjs` (`WF-CAP-03`) |
| `ORG-FLOW-07` | Live roster tracking | `/(tabs)/roster` | Real-time status tags: Approaching, On Duty, Checked Out | Reads live booking statuses; displays distance to venue | **PASS** | `organizer-roster.png` |
| `ORG-FLOW-08` | Attendance approval & sign-off | `/shift/attendance` | Shift marked completed; supervisor sign-off recorded | Invokes `complete_shift_and_approve_attendance` RPC; updates `bookings.status = 'completed'` | **PASS** | `test_api_workflow.mjs` |
| `ORG-FLOW-09` | GST invoice generation | `/(tabs)/finances` | Tax invoice generated with SAC 9985 GST breakdown | Invokes `generate_job_invoice_safe` RPC; inserts `invoices` with 18% tax | **PASS** | `test_workflow_adversarial.mjs` (`WF-FIN-01`) |
| `ORG-FLOW-10` | Payment UTR submission | `/(tabs)/finances` | Invoice status transitions to `funded` in test ledger | Updates `invoices.payment_reference` and `payment_status` | **PASS** | `organizer-finances.png` |

---

## 4. Journey C: Administrator Lifecycle

| Step ID | User Action | Application Screen | Expected User-Visible Result | Backend & Database Mutation | Verification Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ADM-FLOW-01` | Admin login enforcement | `/login` | Access granted only to profiles with `role = 'admin'` | Checks `profiles.role = 'admin'` and `is_active = true`; rejects other roles | **PASS** | `admin-login-denied.png` |
| `ADM-FLOW-02` | KYC review queue triage | `/?module=verifications` | Priority intake roster renders pending worker/organizer cases | Queries `verification_cases` where `status = 'under_review'` | **PASS** | `admin-verifications.png` |
| `ADM-FLOW-03` | KYC approval | `/?module=verifications` | Case removed from queue; profile marked verified | Invokes `resolve_verification_case_safe` (`approved`); updates worker profile | **PASS** | `test_api_workflow.mjs` |
| `ADM-FLOW-04` | Dispute adjudication | `/?module=disputes` | Binding arbitration ruling applied; adjusted payout logged | Invokes `resolve_dispute_safe` RPC; updates `disputes` and `bookings` | **PASS** | `test_workflow_adversarial.mjs` (`WF-DISPUTE-04`) |
| `ADM-FLOW-05` | Shift living wage moderation | `/?module=jobs` | Shifts flagged for wage review or policy violation | Updates `jobs.status` (`flagged` / `cancelled`) | **PASS** | `admin-jobs.png` |
| `ADM-FLOW-06` | Emergency lockdown / booking pause | `/?module=settings` | Platform-wide booking freeze enabled; banner displayed | Updates `platform_settings.is_booking_paused = true`; logs emergency audit event | **PASS** | `admin-lockdown-modal.png` |
| `ADM-FLOW-07` | Audit trail inspection | `/?module=audit` | Immutable chronological log of all administrative actions in IST | Queries `audit_logs` table (read-only) | **PASS** | `admin-audit.png` |

---

## 5. Journey D: End-to-End Cross-Role Journey

A single continuous business lifecycle spanning Organizer, Worker, and Admin:

```
[1. Organizer] Publishes Event Hospitality Shift (₹4,000 / 8 hrs)
       ↓
[2. Worker] Discovers Shift on Feed & Submits Application
       ↓
[3. Organizer] Reviews Applicant on Screening Desk & Dispatches Offer
       ↓
[4. Worker] Accepts Offer; Booking Status Transitions to Confirmed (1/1 slots filled)
       ↓
[5. Capacity Guard] Concurrent Application from Worker 2 Safely Rejected (Capacity Full)
       ↓
[6. Worker] Arrives at Venue Geofence (0m distance) & Checks In via Proximity Radar
       ↓
[7. Organizer] Observes Worker "On Duty" on Live Roster
       ↓
[8. Worker] Completes Shift & Checks Out
       ↓
[9. Organizer] Approves Attendance & Finalizes Shift Completion
       ↓
[10. Finance] Tax Invoice Issued: ₹4,000 Wage + ₹400 Platform Fee (10%) + ₹72 GST (18%) = ₹4,472
       ↓
[11. Payout] Test Ledger Payout Initiated & Settled with Bank UTR Reference
       ↓
[12. Admin] Audit Trail Verifies Complete Sequence with Zero Discrepancies
```

- **Cross-Role Journey Verification Result:** **PASS — INDEPENDENTLY REPRODUCED**
- **Exit Code:** `0`
- **Total Checks in Cross-Role Journey:** 41 API checks + 37 state machine checks + 42 UI workflow checks
