# State Machine and Adversarial Workflow Matrix

**Date:** 2026-10-22 (IST)  
**Suite:** `scripts/docker/test_workflow_adversarial.mjs`  
**Command:** `docker compose -p opskl-test run --rm test-runner node scripts/docker/test_workflow_adversarial.mjs`  
**Exit Code:** `0`  
**Result:** **37 PASSED / 0 FAILED**  
**Evidence:** `test-artifacts/docker/workflow-adversarial.log`  

---

## 1. KYC State Machine & Adversarial Decisions

```text
[Unverified / Draft]
       |
       | submit_verification_case_safe
       v
   [Pending] <------------------------------------------+
       |                                                |
       |-- (reject: reason < 5 chars) -> REJECTED       | worker resubmits
       |-- (reject: reason >= 5 chars) -> [Rejected] ---+
       |
       v (approve: admin_verify_case_safe)
  [Verified] (Flags set: is_aadhaar_verified / is_gstin_verified = true)
```

| Test ID | Workflow Step | Setup / Action | Expected Result | Status | Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `WF-KYC-01` | KYC Submission | Worker submits synthetic Aadhaar case | Case created with status `pending` | **PASS** | `workflow-adversarial.log` |
| `WF-KYC-02` | Admin Rejection Guard | Admin rejects with reason `'bad'` (< 5 chars) | Rejected with `REASON_REQUIRED` | **PASS** | `workflow-adversarial.log` |
| `WF-KYC-03` | Admin Rejection | Admin rejects with 50-char explanation | Case transitions to `rejected` | **PASS** | `workflow-adversarial.log` |
| `WF-KYC-04` | Profile State Sync | Inspect `worker_profiles.verification_status` | Status reflects `rejected` | **PASS** | `workflow-adversarial.log` |
| `WF-KYC-05` | Worker Resubmission | Worker uploads new clean document | New case created with status `pending` | **PASS** | `workflow-adversarial.log` |
| `WF-KYC-06` | Admin Approval | Admin approves resubmitted case | Case transitions to `approved` | **PASS** | `workflow-adversarial.log` |
| `WF-KYC-07` | Profile Reinstatement| Inspect `worker_profiles` flags | Status `verified`, `is_aadhaar_verified = true` | **PASS** | `workflow-adversarial.log` |

---

## 2. Shift Creation Boundaries & Overnight Math

| Test ID | Boundary Condition | Input Parameters | Expected Result | Status | Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `WF-SHIFT-01` | Past Start Time | Date today, start time 04:00 IST | Rejected: shift start is in the past | **PASS** | `workflow-adversarial.log` |
| `WF-SHIFT-02` | Non-India Coordinates | Westminster London (51.5°N, -0.1°W) | Rejected with `INVALID_COORDINATES` | **PASS** | `workflow-adversarial.log` |
| `WF-SHIFT-03` | Minimum Wage Floor | ₹50/hr (below statutory ₹100 floor) | Rejected with `INVALID_WAGE` | **PASS** | `workflow-adversarial.log` |
| `WF-SHIFT-04` | Overnight Shift Creation | 22:00 to 06:00 next morning | Shift successfully created | **PASS** | `workflow-adversarial.log` |
| `WF-SHIFT-05` | Overnight Math & Flags | 8 hours @ ₹400/hr | `crosses_midnight = true`, duration = 8h, pay = ₹3,200 | **PASS** | `workflow-adversarial.log` |

---

## 3. Concurrent Capacity Enforcement & Race Condition Simulation

| Test ID | Race / Capacity Step | Action | Expected Result | Status | Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `WF-CAP-01` | Concurrent Applicant 1 | Worker 1 applies via `Promise.all` | Application registered in pool (`applied`) | **PASS** | `workflow-adversarial.log` |
| `WF-CAP-02` | Concurrent Applicant 2 | Worker 2 applies via `Promise.all` | Application registered in pool (`applied`) | **PASS** | `workflow-adversarial.log` |
| `WF-CAP-03` | Single-Slot Offer | Organizer offers slot to Worker 1 | Booking in `selected_awaiting_confirmation` | **PASS** | `workflow-adversarial.log` |
| `WF-CAP-04` | Worker 1 Confirmation | Worker 1 confirms offer | Booking confirmed; shift capacity reaches 1/1 | **PASS** | `workflow-adversarial.log` |
| `WF-CAP-05` | Shift Status Transition | Verify `jobs.status` and `slots_filled` | Status `filled`, `slots_filled = 1` | **PASS** | `workflow-adversarial.log` |
| `WF-CAP-06` | Over-Capacity Offer Block | Organizer tries to offer Worker 2 | Offer rejected (capacity filled) | **PASS** | `workflow-adversarial.log` |
| `WF-CAP-07` | Unauthorized Confirmation | Worker 2 tries to confirm | Confirmation rejected (no offer / filled) | **PASS** | `workflow-adversarial.log` |

---

## 4. Application Withdrawal & Offer Decline State Machine

| Test ID | State Transition | Action | Expected Result | Status | Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `WF-WITHDRAW-01`| `applied -> withdrawn` | Worker 2 withdraws application | Status transitions to `withdrawn` | **PASS** | `workflow-adversarial.log` |
| `WF-DECLINE-01` | `offered -> declined` | Worker 1 declines offer with reason | Status transitions to `cancelled`/`declined` | **PASS** | `workflow-adversarial.log` |
| `WF-DECLINE-02` | Capacity Rebalancing | Inspect `jobs.status` after decline | Status reverts to `open`, `slots_filled = 0` | **PASS** | `workflow-adversarial.log` |

---

## 5. Geofence Precision & Shift Timing Boundaries

| Test ID | Condition Tested | Coordinate Offset / Distance | Expected Result | Status | Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `WF-GEO-00` | Premature Check-in | Shift scheduled 12 days in future | Rejected with `CHECK_IN_TOO_EARLY` (> 2h window) | **PASS** | `workflow-adversarial.log` |
| `WF-GEO-DIST` | Distance Violation | Venue lat + 0.006° (~600m away) | Rejected with `OUT_OF_GEOFENCE_RANGE` (> 300m) | **PASS** | `workflow-adversarial.log` |
| `WF-GEO-01` | Venue Arrival | Exact venue coordinate (0m distance)| Check-in recorded, status `checked_in` | **PASS** | `workflow-adversarial.log` |
| `WF-GEO-02` | Idempotent Recheck-in | Re-send identical check-in | Status `checked_in`, `already_checked_in: true` | **PASS** | `workflow-adversarial.log` |

---

## 6. Independent Financial Oracle Verification

```text
Financial Business Rules:
  Wage Total    = Hourly Rate * Payable Hours * Staff Headcount
  Platform Fee  = Round(Wage Total * 10%, 2)
  GST (SAC 9985)= Round(Platform Fee * 18%, 2)
  Total Payable = Wage Total + Platform Fee + GST
```

| Test ID | Calculation Component | Independent Oracle Formula | Database Persisted Value | Discrepancy | Status |
| :--- | :--- | :--- | :--- | :---: | :---: |
| `WF-FIN-01` | Invoice Generation | `generate_job_invoice_safe` | Invoice record created in `organizer_invoices` | — | **PASS** |
| `WF-FIN-02` | Wage Total | ₹500/hr * 8 hrs * 1 worker = ₹4,000.00 | ₹4,000.00 | **₹0.00** | **PASS** |
| `WF-FIN-03` | Platform Fee | ₹4,000.00 * 10% = ₹400.00 | ₹400.00 | **₹0.00** | **PASS** |
| `WF-FIN-04` | GST Amount | ₹400.00 * 18% = ₹72.00 | ₹72.00 | **₹0.00** | **PASS** |
| `WF-FIN-05` | Total Payable | ₹4,000.00 + ₹400.00 + ₹72.00 = ₹4,472.00 | ₹4,472.00 | **₹0.00** | **PASS** |

---

## 7. Dispute Resolution & Immutable Audit Trail

| Test ID | Step | Actor | Action | Expected Result | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| `WF-DISPUTE-01` | Dispute Reason Guard | Worker 1 | Raise dispute with `'Too short'` | Rejected with `INVALID_REASON` (< 10 chars) | **PASS** | `workflow-adversarial.log` |
| `WF-DISPUTE-02` | Valid Dispute Intake | Worker 1 | Dispute overtime non-payment | Dispute opened, booking status `disputed` | **PASS** | `workflow-adversarial.log` |
| `WF-DISPUTE-03` | Admin Case Claim | Admin | Call `claim_dispute_safe` | Dispute status transitions to `under_review` | **PASS** | `workflow-adversarial.log` |
| `WF-DISPUTE-04` | Dispute Arbitrated | Admin | Approve overtime bonus of ₹500 | Dispute resolved, booking outcome `completed` | **PASS** | `workflow-adversarial.log` |
| `WF-DISPUTE-05` | Pay Adjustment Persisted | Worker 1 | Inspect `bookings.approved_total_pay` | Value updated to ₹4,500.00 | **PASS** | `workflow-adversarial.log` |
| `WF-AUDIT-01` | Immutable Audit Trail | System | Query `audit_logs` for dispute entity | Action `RESOLVE_DISPUTE` immutably logged | **PASS** | `workflow-adversarial.log` |
