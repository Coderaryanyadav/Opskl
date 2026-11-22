#!/usr/bin/env node
/**
 * Adversarial Workflow & State Machine Test Suite
 * 
 * Tests concurrent capacity enforcement, withdrawal/decline state machines,
 * geofence boundaries, overnight shift calculations, independent financial
 * oracles, and dispute resolution lifecycles.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.TEST_API_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error('Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}

const accounts = {
  admin: { email: process.env.ADMIN_EMAIL || 'admin@test.opskil.local', password: process.env.ADMIN_PASSWORD || 'OpsklTestAdmin!2026' },
  worker: { email: process.env.WORKER_EMAIL || 'worker@test.opskil.local', password: process.env.WORKER_PASSWORD || 'OpsklTestWorker!2026' },
  worker2: { email: process.env.WORKER2_EMAIL || 'worker2@test.opskil.local', password: process.env.WORKER2_PASSWORD || 'OpsklTestWorker2!2026' },
  organizer: { email: process.env.ORGANIZER_EMAIL || 'organizer@test.opskil.local', password: process.env.ORGANIZER_PASSWORD || 'OpsklTestOrganizer!2026' },
};

let passed = 0;
let failed = 0;
const results = [];

function check(id, name, condition, detail) {
  if (condition) {
    passed += 1;
    results.push({ id, name, status: 'PASS' });
    console.log(`  PASS [${id}] ${name}`);
  } else {
    failed += 1;
    results.push({ id, name, status: 'FAIL', detail });
    console.error(`  FAIL [${id}] ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function makeClient() {
  return createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function signIn(accountKey) {
  const client = makeClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: accounts[accountKey].email,
    password: accounts[accountKey].password,
  });
  if (error) throw new Error(`signIn ${accountKey} failed: ${error.message}`);
  return { client, userId: data.user.id };
}

function kolkataDate(daysAhead) {
  const d = new Date(Date.now() + daysAhead * 86400000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

// Independent Financial Oracle: computes expected invoice values strictly from business rules
function calculateExpectedInvoice(wageTotal, feePct = 10.0, gstPct = 18.0) {
  const platformFee = Math.round(wageTotal * (feePct / 100) * 100) / 100;
  const gstAmount = Math.round(platformFee * (gstPct / 100) * 100) / 100;
  const totalPayable = Math.round((wageTotal + platformFee + gstAmount) * 100) / 100;
  return { wageTotal, platformFee, gstAmount, totalPayable };
}

async function main() {
  console.log('\n============================================================');
  console.log('   STAGE 3 — ADVERSARIAL WORKFLOW & STATE MACHINE SUITE    ');
  console.log('============================================================\n');

  const service = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const admin = await signIn('admin');
  const worker1 = await signIn('worker');
  const worker2 = await signIn('worker2');
  const org = await signIn('organizer');

  console.log('[1] KYC Adversarial Rejection, Reason Enforcement & Resubmission');
  
  // Submit a fresh KYC case for Worker 2
  const kycSubmit = await worker2.client.from('verification_cases').insert({
    profile_id: worker2.userId,
    document_type: 'aadhaar',
    document_masked_id: 'XXXX-XXXX-9999',
    document_storage_path: `${worker2.userId}/aadhaar_v2.pdf`,
  }).select('id').single();
  check('WF-KYC-01', 'Worker can submit pending KYC case', !kycSubmit.error && kycSubmit.data?.id, JSON.stringify(kycSubmit));
  const caseId = kycSubmit.data?.id;

  // Admin tries to reject with empty or too-short reason (< 5 characters)
  const rejectShort = await admin.client.rpc('admin_verify_case_safe', {
    p_case_id: caseId,
    p_status: 'rejected',
    p_rejection_reason: 'bad',
    p_admin_id: admin.userId,
  });
  check('WF-KYC-02', 'Admin rejection requires reason >= 5 characters', rejectShort.data?.success === false && rejectShort.data?.error_code === 'REASON_REQUIRED', JSON.stringify(rejectShort));

  // Admin rejects with valid descriptive reason
  const rejectValid = await admin.client.rpc('admin_verify_case_safe', {
    p_case_id: caseId,
    p_status: 'rejected',
    p_rejection_reason: 'Document image is blurred and unreadable. Please upload a clear scan.',
    p_admin_id: admin.userId,
  });
  check('WF-KYC-03', 'Admin can reject KYC with valid explanation', rejectValid.data?.success === true && rejectValid.data?.status === 'rejected', JSON.stringify(rejectValid));

  // Verify worker profile transitions to rejected
  const w2ProfileRejected = await service.from('worker_profiles').select('verification_status').eq('id', worker2.userId).single();
  check('WF-KYC-04', 'Worker profile reflects rejected verification status', w2ProfileRejected.data?.verification_status === 'rejected', JSON.stringify(w2ProfileRejected));

  // Worker resubmits a new clear document
  const kycResubmit = await worker2.client.from('verification_cases').insert({
    profile_id: worker2.userId,
    document_type: 'aadhaar',
    document_masked_id: 'XXXX-XXXX-9999',
    document_storage_path: `${worker2.userId}/aadhaar_v3_clear.pdf`,
  }).select('id').single();
  check('WF-KYC-05', 'Worker can resubmit new KYC after rejection', !kycResubmit.error && kycResubmit.data?.id, JSON.stringify(kycResubmit));
  const resubmitCaseId = kycResubmit.data?.id;

  // Admin approves resubmitted case
  const approveResubmit = await admin.client.rpc('admin_verify_case_safe', {
    p_case_id: resubmitCaseId,
    p_status: 'approved',
    p_admin_id: admin.userId,
  });
  check('WF-KYC-06', 'Admin can approve resubmitted KYC case', approveResubmit.data?.success === true && approveResubmit.data?.status === 'approved', JSON.stringify(approveResubmit));

  const w2ProfileApproved = await service.from('worker_profiles').select('verification_status, is_aadhaar_verified').eq('id', worker2.userId).single();
  check('WF-KYC-07', 'Worker profile restored to verified after approval', w2ProfileApproved.data?.verification_status === 'verified' && w2ProfileApproved.data?.is_aadhaar_verified === true, JSON.stringify(w2ProfileApproved));

  console.log('\n[2] Shift Creation Boundaries & Overnight Math');

  const runTag = Date.now().toString().slice(-6);

  // Shift with start time in the past (same day, past time in IST)
  const pastShift = await org.client.rpc('create_job_safe', {
    p_organizer_id: org.userId,
    p_job: {
      title: `Past Shift ${runTag}`,
      category: 'hospitality',
      venue_name: 'Past Venue',
      venue_address: 'BKC, Mumbai',
      city: 'Mumbai',
      zone: 'BKC',
      latitude: 19.076,
      longitude: 72.8777,
      date: kolkataDate(0), // today
      start_time: '04:00', // early morning past
      end_time: '06:00',
      hourly_rate: 300,
      slots_total: 1,
      supervisor_name: 'Supervisor',
      supervisor_phone: '9000000111',
    },
  });
  check('WF-SHIFT-01', 'Shift with past start time on current date is rejected in IST', pastShift.data?.success === false, JSON.stringify(pastShift));

  // Shift with coordinates outside India (e.g. London: 51.5, -0.1)
  const foreignCoordShift = await org.client.rpc('create_job_safe', {
    p_organizer_id: org.userId,
    p_job: {
      title: `Foreign Coord Shift ${runTag}`,
      category: 'hospitality',
      venue_name: 'London Venue',
      venue_address: 'Westminster, London',
      city: 'Mumbai',
      zone: 'BKC',
      latitude: 51.5074,
      longitude: -0.1278,
      date: kolkataDate(3),
      start_time: '10:00',
      end_time: '18:00',
      hourly_rate: 300,
      slots_total: 1,
      supervisor_name: 'Supervisor',
      supervisor_phone: '9000000111',
    },
  });
  check('WF-SHIFT-02', 'Shift coordinates outside India are rejected', foreignCoordShift.data?.success === false && (foreignCoordShift.data?.error_code === 'COORDINATES_OUT_OF_BOUNDS' || foreignCoordShift.data?.error_code === 'INVALID_COORDINATES'), JSON.stringify(foreignCoordShift));

  // Shift with hourly rate below ₹100 floor
  const lowWageShift = await org.client.rpc('create_job_safe', {
    p_organizer_id: org.userId,
    p_job: {
      title: `Low Wage Shift ${runTag}`,
      category: 'hospitality',
      venue_name: 'Low Wage Venue',
      venue_address: 'BKC, Mumbai',
      city: 'Mumbai',
      zone: 'BKC',
      latitude: 19.076,
      longitude: 72.8777,
      date: kolkataDate(3),
      start_time: '10:00',
      end_time: '18:00',
      hourly_rate: 50,
      slots_total: 1,
      supervisor_name: 'Supervisor',
      supervisor_phone: '9000000111',
    },
  });
  check('WF-SHIFT-03', 'Hourly rate below ₹100 floor is rejected', lowWageShift.data?.success === false && (lowWageShift.data?.error_code === 'BELOW_MINIMUM_WAGE' || lowWageShift.data?.error_code === 'INVALID_WAGE'), JSON.stringify(lowWageShift));

  // Overnight Shift: 22:00 to 06:00 (crosses midnight, 8 hours duration)
  const overnightShift = await org.client.rpc('create_job_safe', {
    p_organizer_id: org.userId,
    p_job: {
      title: `Overnight Gala Shift ${runTag}`,
      category: 'hospitality',
      venue_name: 'Grand Hyatt Mumbai',
      venue_address: 'Santacruz East, Mumbai',
      city: 'Mumbai',
      zone: 'Bandra',
      latitude: 19.076,
      longitude: 72.8777,
      date: kolkataDate(4),
      start_time: '22:00',
      end_time: '06:00',
      hourly_rate: 400,
      slots_total: 1,
      supervisor_name: 'Night Supervisor',
      supervisor_phone: '9000000112',
      breaks_minutes: 30,
      duties: ['Night Concierge'],
    },
  });
  check('WF-SHIFT-04', 'Overnight shift crossing midnight is created successfully', overnightShift.data?.success === true, JSON.stringify(overnightShift));
  const overnightJobId = overnightShift.data?.job_id;

  const overnightRow = await service.from('jobs').select('crosses_midnight, duration_hours, total_pay').eq('id', overnightJobId).single();
  check('WF-SHIFT-05', 'Overnight shift duration and crosses_midnight accurately calculated (8 hrs @ ₹400 = ₹3,200)', 
    overnightRow.data?.crosses_midnight === true && Number(overnightRow.data?.duration_hours) === 8 && Number(overnightRow.data?.total_pay) === 3200, 
    JSON.stringify(overnightRow));

  console.log('\n[3] Concurrent Capacity Enforcement & Race Condition Simulation');

  // Create a 1-slot shift for capacity testing
  const capShift = await org.client.rpc('create_job_safe', {
    p_organizer_id: org.userId,
    p_job: {
      title: `Capacity Race Test ${runTag}`,
      category: 'hospitality',
      venue_name: 'Race Venue',
      venue_address: 'BKC, Mumbai',
      city: 'Mumbai',
      zone: 'BKC',
      latitude: 19.076,
      longitude: 72.8777,
      date: kolkataDate(12),
      start_time: '09:00',
      end_time: '17:00',
      hourly_rate: 500,
      slots_total: 1,
      supervisor_name: 'Race Supervisor',
      supervisor_phone: '9000000113',
    },
  });
  const capJobId = capShift.data?.job_id;

  // Both Worker 1 and Worker 2 apply simultaneously
  const [w1Apply, w2Apply] = await Promise.all([
    worker1.client.rpc('apply_for_job_safe', { p_job_id: capJobId, p_notes: 'Worker 1 first' }),
    worker2.client.rpc('apply_for_job_safe', { p_job_id: capJobId, p_notes: 'Worker 2 parallel' }),
  ]);
  check('WF-CAP-01', 'Worker 1 application succeeds', w1Apply.data?.success === true, JSON.stringify(w1Apply));
  check('WF-CAP-02', 'Worker 2 application succeeds (pool stage)', w2Apply.data?.success === true, JSON.stringify(w2Apply));

  // Organizer shortlists and offers Worker 1
  const offerW1 = await org.client.rpc('select_worker_offer_safe', {
    p_job_id: capJobId,
    p_worker_id: worker1.userId,
  });
  check('WF-CAP-03', 'Organizer offers shift slot to Worker 1', offerW1.data?.success === true, JSON.stringify(offerW1));
  const w1BookingId = offerW1.data?.booking_id;

  // Worker 1 confirms offer
  const w1Confirm = await worker1.client.rpc('worker_confirm_selection_safe', { p_booking_or_job_id: w1BookingId });
  check('WF-CAP-04', 'Worker 1 accepts offer; shift capacity reaches 1/1 filled', w1Confirm.data?.success === true, JSON.stringify(w1Confirm));

  // Check job status is now filled
  const jobFilledRow = await service.from('jobs').select('status, slots_total, slots_filled').eq('id', capJobId).single();
  check('WF-CAP-05', 'Job status transitions to filled with slots_filled = 1', jobFilledRow.data?.status === 'filled' && jobFilledRow.data?.slots_filled === 1, JSON.stringify(jobFilledRow));

  // Organizer attempts to offer Worker 2 for the filled shift -> MUST BE REJECTED
  const offerW2 = await org.client.rpc('select_worker_offer_safe', {
    p_job_id: capJobId,
    p_worker_id: worker2.userId,
  });
  check('WF-CAP-06', 'Offer to Worker 2 rejected after shift capacity filled', offerW2.data?.success === false, JSON.stringify(offerW2));

  // Worker 2 attempts to confirm non-existent offer -> MUST BE REJECTED
  const w2Confirm = await worker2.client.rpc('worker_confirm_selection_safe', { p_booking_or_job_id: capJobId });
  check('WF-CAP-07', 'Worker 2 confirmation rejected when no valid offer exists', w2Confirm.data?.success === false, JSON.stringify(w2Confirm));

  console.log('\n[4] Application Withdrawal & Worker Offer Decline');

  // Create another shift for decline/withdrawal testing
  const decShift = await org.client.rpc('create_job_safe', {
    p_organizer_id: org.userId,
    p_job: {
      title: `Withdraw & Decline Test ${runTag}`,
      category: 'hospitality',
      venue_name: 'Decline Venue',
      venue_address: 'BKC, Mumbai',
      city: 'Mumbai',
      zone: 'BKC',
      latitude: 19.076,
      longitude: 72.8777,
      date: kolkataDate(6),
      start_time: '10:00',
      end_time: '18:00',
      hourly_rate: 450,
      slots_total: 1,
      supervisor_name: 'Supervisor',
      supervisor_phone: '9000000114',
    },
  });
  const decJobId = decShift.data?.job_id;

  // Worker 2 applies, then withdraws application
  const w2DecApply = await worker2.client.rpc('apply_for_job_safe', { p_job_id: decJobId, p_notes: 'Will withdraw' });
  const w2AppId = w2DecApply.data?.application_id || w2DecApply.data?.application?.id;
  const w2Withdraw = await worker2.client.rpc('withdraw_application_safe', { p_application_id: w2AppId });
  check('WF-WITHDRAW-01', 'Worker 2 can withdraw submitted application', w2Withdraw.data?.success === true && w2Withdraw.data?.status === 'withdrawn', JSON.stringify(w2Withdraw));

  // Worker 1 applies, organizer offers, Worker 1 declines
  await worker1.client.rpc('apply_for_job_safe', { p_job_id: decJobId, p_notes: 'Will decline offer' });
  const offerToDecline = await org.client.rpc('select_worker_offer_safe', {
    p_job_id: decJobId,
    p_worker_id: worker1.userId,
  });
  const declineBookingId = offerToDecline.data?.booking_id;

  const w1Decline = await worker1.client.rpc('worker_decline_selection_safe', {
    p_booking_or_job_id: declineBookingId,
    p_reason: 'Schedule conflict arose',
  });
  check('WF-DECLINE-01', 'Worker can decline shift offer with reason', w1Decline.data?.success === true && (w1Decline.data?.status === 'declined' || w1Decline.data?.status === 'cancelled'), JSON.stringify(w1Decline));

  // Verify slot reopens and job is still open
  const decJobReopened = await service.from('jobs').select('status, slots_filled').eq('id', decJobId).single();
  check('WF-DECLINE-02', 'Shift slots reopen after offer decline (status: open, slots_filled: 0)', decJobReopened.data?.status === 'open' && decJobReopened.data?.slots_filled === 0, JSON.stringify(decJobReopened));

  console.log('\n[5] Geofence Precision & Boundary Rejection');

  // Venue coordinates: (19.0760, 72.8777)
  const checkInCode = offerW1.data?.check_in_code;

  // Verify CHECK_IN_TOO_EARLY guard operates correctly when shift is in future
  const tooEarlyCheckIn = await worker1.client.rpc('check_in_worker_safe', {
    p_booking_id: w1BookingId,
    p_code: checkInCode,
    p_lat: 19.0760,
    p_lng: 72.8777,
  });
  check('WF-GEO-00', 'Check-in is rejected if shift start time is > 2 hours in the future', 
    tooEarlyCheckIn.data?.success === false && tooEarlyCheckIn.data?.error_code === 'CHECK_IN_TOO_EARLY', 
    JSON.stringify(tooEarlyCheckIn));

  // Prepare booking for attendance testing: set date to today and start time within 2 hours
  await service.from('jobs').update({ date: kolkataDate(0), start_time: '01:00' }).eq('id', capJobId);

  // Distant location: ~600m away -> OUT_OF_GEOFENCE_RANGE
  const distantCheckIn = await worker1.client.rpc('check_in_worker_safe', {
    p_booking_id: w1BookingId,
    p_code: checkInCode,
    p_lat: 19.0820,
    p_lng: 72.8777,
  });
  check('WF-GEO-DIST', 'Check-in > 300m away from venue is rejected (OUT_OF_GEOFENCE_RANGE)',
    distantCheckIn.data?.success === false && distantCheckIn.data?.error_code === 'OUT_OF_GEOFENCE_RANGE',
    JSON.stringify(distantCheckIn));

  // Exact location: distance 0m -> PASS
  const exactCheckIn = await worker1.client.rpc('check_in_worker_safe', {
    p_booking_id: w1BookingId,
    p_code: checkInCode,
    p_lat: 19.0760,
    p_lng: 72.8777,
  });
  check('WF-GEO-01', 'Check-in succeeds at exact venue coordinates (0m)', exactCheckIn.data?.success === true, JSON.stringify(exactCheckIn));

  // Duplicate check-in -> Idempotent PASS with already_checked_in
  const dupCheckIn = await worker1.client.rpc('check_in_worker_safe', {
    p_booking_id: w1BookingId,
    p_code: checkInCode,
    p_lat: 19.0760,
    p_lng: 72.8777,
  });
  check('WF-GEO-02', 'Duplicate check-in is idempotent (already_checked_in: true)', dupCheckIn.data?.success === true && dupCheckIn.data?.already_checked_in === true, JSON.stringify(dupCheckIn));

  console.log('\n[6] Independent Financial Oracle & GST Verification');

  // Complete attendance
  const pastTime = new Date(Date.now() - 3600000 * 9).toISOString();
  await service.from('bookings').update({ check_in_time: pastTime }).eq('id', w1BookingId);
  await service.from('attendance_records').update({ check_in_time: pastTime }).eq('booking_id', w1BookingId);
  await worker1.client.rpc('check_out_worker_safe', { p_booking_id: w1BookingId, p_notes: 'Completed' });
  await org.client.rpc('complete_shift_and_approve_attendance', {
    p_booking_id: w1BookingId,
    p_verified_hours: 8,
    p_overtime_approved: false,
    p_notes: 'Verified 8h',
  });

  const invoiceRes = await org.client.rpc('generate_job_invoice_safe', {
    p_job_id: capJobId,
    p_organizer_id: org.userId,
  });
  check('WF-FIN-01', 'Organizer can generate shift invoice', invoiceRes.data?.success === true, JSON.stringify(invoiceRes));
  const invoiceId = invoiceRes.data?.invoice_id;

  const invoiceDb = await service.from('organizer_invoices').select('*').eq('id', invoiceId).single();
  const dbWage = Number(invoiceDb.data?.wage_total);
  const dbFee = Number(invoiceDb.data?.platform_fee);
  const dbGst = Number(invoiceDb.data?.gst_amount);
  const dbTotal = Number(invoiceDb.data?.total_payable);

  // Independent Oracle Calculation
  const expected = calculateExpectedInvoice(4000.0, 10.0, 18.0);
  check('WF-FIN-02', `Wage total matches independent oracle (expected: ${expected.wageTotal}, actual: ${dbWage})`, dbWage === expected.wageTotal, `diff: ${dbWage - expected.wageTotal}`);
  check('WF-FIN-03', `Platform fee matches 10% rule (expected: ${expected.platformFee}, actual: ${dbFee})`, dbFee === expected.platformFee, `diff: ${dbFee - expected.platformFee}`);
  check('WF-FIN-04', `GST matches 18% on platform fee (expected: ${expected.gstAmount}, actual: ${dbGst})`, dbGst === expected.gstAmount, `diff: ${dbGst - expected.gstAmount}`);
  check('WF-FIN-05', `Total payable matches sum of components (expected: ${expected.totalPayable}, actual: ${dbTotal})`, dbTotal === expected.totalPayable, `diff: ${dbTotal - expected.totalPayable}`);

  console.log('\n[7] Dispute Resolution & Audit Trail');

  // Worker raises dispute on completed booking
  // First, verify short reason (< 10 chars) is rejected
  const shortDispute = await worker1.client.rpc('dispute_booking_safe', {
    p_booking_id: w1BookingId,
    p_reason: 'Too short',
  });
  check('WF-DISPUTE-01', 'Dispute with reason < 10 characters is rejected', shortDispute.data?.success === false && shortDispute.data?.error_code === 'INVALID_REASON', JSON.stringify(shortDispute));

  // Valid dispute
  const validDispute = await worker1.client.rpc('dispute_booking_safe', {
    p_booking_id: w1BookingId,
    p_reason: 'Overtime hours of 1.5 hours were not counted in final approval.',
    p_evidence: 'Supervisor sign-off sheet attached',
  });
  check('WF-DISPUTE-02', 'Worker can raise valid booking dispute', validDispute.data?.success === true && validDispute.data?.status === 'disputed', JSON.stringify(validDispute));
  const disputeId = validDispute.data?.dispute_id;

  // Admin claims dispute
  const claimDispute = await admin.client.rpc('claim_dispute_safe', { p_dispute_id: disputeId });
  check('WF-DISPUTE-03', 'Admin can claim dispute for investigation (status: under_review)', claimDispute.data?.success === true && (claimDispute.data?.status === 'under_review' || claimDispute.data?.status === 'under_investigation'), JSON.stringify(claimDispute));

  // Admin resolves dispute with adjusted payout
  const resolveDispute = await admin.client.rpc('admin_resolve_dispute_safe', {
    p_dispute_id: disputeId,
    p_status: 'resolved',
    p_resolution_notes: 'Approved 1h overtime bonus of ₹500.',
    p_booking_outcome: 'completed',
    p_adjusted_payout: 4500,
  });
  check('WF-DISPUTE-04', 'Admin can resolve dispute with adjusted payout', resolveDispute.data?.success === true && resolveDispute.data?.status === 'resolved', JSON.stringify(resolveDispute));

  // Verify booking reflects approved adjusted pay
  const bookingAfterDispute = await service.from('bookings').select('status, approved_total_pay').eq('id', w1BookingId).single();
  check('WF-DISPUTE-05', 'Booking reflects adjusted payout of ₹4,500 after dispute resolution', Number(bookingAfterDispute.data?.approved_total_pay) === 4500, JSON.stringify(bookingAfterDispute));

  // Verify Audit Log has record of RESOLVE_DISPUTE
  const auditRes = await service.from('audit_logs').select('action, entity_id').eq('entity_id', disputeId).order('created_at', { ascending: false });
  const hasResolveAudit = (auditRes.data || []).some(row => row.action === 'RESOLVE_DISPUTE' || row.action === 'ADMIN_RESOLVE_DISPUTE');
  check('WF-AUDIT-01', 'Dispute resolution is immutably recorded in audit_logs', hasResolveAudit, JSON.stringify(auditRes));

  console.log(`\n============================================================`);
  console.log(`WORKFLOW SUITE RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log(`============================================================\n`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL WORKFLOW TEST ERROR:', err);
  process.exit(1);
});
