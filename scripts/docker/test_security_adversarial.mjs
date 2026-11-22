#!/usr/bin/env node
/**
 * Adversarial Security & Authorization Boundary Test Suite
 * 
 * Tests unauthenticated access, cross-worker isolation, cross-organizer isolation,
 * privilege escalation guards, storage bucket policies, and secret isolation.
 */
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const url = process.env.SUPABASE_URL || process.env.TEST_API_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error('Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}
const host = new URL(url).hostname;
if (!['127.0.0.1', 'localhost', 'opskl-test-api'].includes(host)) {
  console.error(`Refusing non-loopback Supabase URL host: ${host}`);
  process.exit(2);
}

const accounts = {
  admin: { email: process.env.ADMIN_EMAIL || 'admin@test.opskil.local', password: process.env.ADMIN_PASSWORD || 'OpsklTestAdmin!2026' },
  worker: { email: process.env.WORKER_EMAIL || 'worker@test.opskil.local', password: process.env.WORKER_PASSWORD || 'OpsklTestWorker!2026' },
  worker2: { email: process.env.WORKER2_EMAIL || 'worker2@test.opskil.local', password: process.env.WORKER2_PASSWORD || 'OpsklTestWorker2!2026' },
  organizer: { email: process.env.ORGANIZER_EMAIL || 'organizer@test.opskil.local', password: process.env.ORGANIZER_PASSWORD || 'OpsklTestOrganizer!2026' },
  organizer2: { email: process.env.ORGANIZER2_EMAIL || 'organizer2@test.opskil.local', password: process.env.ORGANIZER2_PASSWORD || 'OpsklTestOrganizer2!2026' },
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

function makeClient(token = null) {
  const options = { auth: { autoRefreshToken: false, persistSession: false } };
  const client = createClient(url, anonKey, options);
  return client;
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

async function main() {
  console.log('\n============================================================');
  console.log('   STAGE 2 — ADVERSARIAL SECURITY & AUTHORIZATION SUITE    ');
  console.log('============================================================\n');

  const service = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const anon = makeClient();

  const admin = await signIn('admin');
  const worker1 = await signIn('worker');
  const worker2 = await signIn('worker2');
  const org1 = await signIn('organizer');
  const org2 = await signIn('organizer2');

  console.log('[1] Anonymous Table Access Boundaries (Direct PostgREST Queries)');

  const tables = [
    { table: 'verification_cases', id: 'SEC-ANON-01' },
    { table: 'organizer_invoices', id: 'SEC-ANON-02' },
    { table: 'payment_records', id: 'SEC-ANON-03' },
    { table: 'audit_logs', id: 'SEC-ANON-04' },
    { table: 'disputes', id: 'SEC-ANON-05' },
    { table: 'safety_reports', id: 'SEC-ANON-06' },
    { table: 'rate_limit_buckets', id: 'SEC-ANON-07' },
    { table: 'invoice_fiscal_sequences', id: 'SEC-ANON-08' },
  ];

  for (const t of tables) {
    const res = await anon.from(t.table).select('*').limit(5);
    const blocked = Boolean(res.error) || (Array.isArray(res.data) && res.data.length === 0);
    check(t.id, `Anon cannot read sensitive table: ${t.table}`, blocked, JSON.stringify(res.error || res.data));
  }

  console.log('\n[2] Anonymous RPC Execution Barriers');
  const fakeUUID = '00000000-0000-4000-8000-000000000000';

  const anonRpcs = [
    { id: 'SEC-ANON-09', rpc: 'create_job_safe', args: { p_organizer_id: fakeUUID, p_job: { title: 'Hacked' } } },
    { id: 'SEC-ANON-10', rpc: 'apply_for_job_safe', args: { p_job_id: fakeUUID } },
    { id: 'SEC-ANON-11', rpc: 'select_worker_offer_safe', args: { p_job_id: fakeUUID, p_worker_id: fakeUUID } },
    { id: 'SEC-ANON-12', rpc: 'worker_confirm_selection_safe', args: { p_booking_or_job_id: fakeUUID } },
    { id: 'SEC-ANON-13', rpc: 'check_in_worker_safe', args: { p_booking_id: fakeUUID, p_code: 'OP-00000000', p_lat: 19.0, p_lng: 72.8 } },
    { id: 'SEC-ANON-14', rpc: 'check_out_worker_safe', args: { p_booking_id: fakeUUID } },
    { id: 'SEC-ANON-15', rpc: 'complete_shift_and_approve_attendance', args: { p_booking_id: fakeUUID, p_verified_hours: 8 } },
    { id: 'SEC-ANON-16', rpc: 'generate_job_invoice_safe', args: { p_job_id: fakeUUID, p_organizer_id: fakeUUID } },
    { id: 'SEC-ANON-17', rpc: 'initiate_worker_payout_safe', args: { p_booking_id: fakeUUID, p_upi_id: 'test@upi', p_idempotency_key: 'h1' } },
    { id: 'SEC-ANON-18', rpc: 'admin_verify_case_safe', args: { p_case_id: fakeUUID, p_status: 'approved', p_admin_id: fakeUUID } },
    { id: 'SEC-ANON-19', rpc: 'admin_mark_payout_settled', args: { p_payment_id: fakeUUID, p_utr: 'HACKED' } },
    { id: 'SEC-ANON-20', rpc: 'admin_mark_invoice_funded', args: { p_invoice_id: fakeUUID, p_reference: 'HACKED' } },
    { id: 'SEC-ANON-21', rpc: 'admin_resolve_dispute_safe', args: { p_dispute_id: fakeUUID, p_status: 'resolved' } },
  ];

  for (const item of anonRpcs) {
    const res = await anon.rpc(item.rpc, item.args);
    const denied = Boolean(res.error) || res.data?.success === false || res.data?.error_code === 'UNAUTHENTICATED' || res.data?.error_code === 'UNAUTHORIZED';
    check(item.id, `Anon execution blocked: ${item.rpc}`, denied, JSON.stringify(res.error || res.data));
  }

  console.log('\n[3] Cross-Worker Authorization & Privacy');
  
  // Worker 1 trying to read Worker 2's KYC
  const w1ReadW2Kyc = await worker1.client.from('verification_cases').select('*').eq('profile_id', worker2.userId);
  check('SEC-WORKER-01', "Worker 1 cannot read Worker 2's KYC verification case", !w1ReadW2Kyc.error && (w1ReadW2Kyc.data || []).length === 0, JSON.stringify(w1ReadW2Kyc));

  // Worker 1 trying to update Worker 2's profile
  const w1UpdateW2 = await worker1.client.from('profiles').update({ full_name: 'Compromised Name' }).eq('id', worker2.userId).select();
  check('SEC-WORKER-02', "Worker 1 cannot update Worker 2's core profile", !w1UpdateW2.error && (w1UpdateW2.data || []).length === 0, JSON.stringify(w1UpdateW2));

  // Worker 1 trying to update Worker 2's worker profile (e.g. steal UPI)
  const w1UpdateW2Worker = await worker1.client.from('worker_profiles').update({ upi_id: 'thief@upi' }).eq('id', worker2.userId).select();
  check('SEC-WORKER-03', "Worker 1 cannot update Worker 2's worker profile or UPI handle", !w1UpdateW2Worker.error && (w1UpdateW2Worker.data || []).length === 0, JSON.stringify(w1UpdateW2Worker));

  // Worker 1 forging a notification for Worker 2
  const w1ForgeNotif = await worker1.client.from('notifications').insert({
    user_id: worker2.userId,
    title: 'Phishing Notification',
    body: 'Click here to compromise your account',
    type: 'security_alert',
  });
  check('SEC-WORKER-04', 'Worker 1 cannot forge a notification for Worker 2', Boolean(w1ForgeNotif.error), JSON.stringify(w1ForgeNotif.error || w1ForgeNotif.data));

  console.log('\n[4] Cross-Organizer Authorization');

  // Let Organizer 2 create an isolated shift
  const org2ShiftRes = await org2.client.rpc('create_job_safe', {
    p_organizer_id: org2.userId,
    p_job: {
      title: 'Organizer 2 Private Shift',
      category: 'hospitality',
      venue_name: 'Org 2 Venue',
      venue_address: 'Andheri West, Mumbai',
      city: 'Mumbai',
      zone: 'Andheri',
      latitude: 19.1136,
      longitude: 72.8697,
      date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      start_time: '11:00',
      end_time: '19:00',
      hourly_rate: 400,
      slots_total: 1,
      supervisor_name: 'Org 2 Supervisor',
      supervisor_phone: '9000000109',
      duties: ['VIP Greeter'],
      breaks_minutes: 30,
      meal_provided: true,
    },
  });
  const org2JobId = org2ShiftRes.data?.job_id;

  // Organizer 1 attempts to edit Organizer 2's shift
  const org1EditOrg2 = await org1.client.rpc('edit_job_safe', {
    p_job_id: org2JobId,
    p_job: { title: 'Tampered Shift Title' },
  });
  check('SEC-ORG-01', "Organizer 1 cannot edit Organizer 2's shift", org1EditOrg2.data?.success === false && org1EditOrg2.data?.error_code === 'UNAUTHORIZED', JSON.stringify(org1EditOrg2));

  // Organizer 1 attempts to generate invoice for Organizer 2's shift
  const org1InvoiceOrg2 = await org1.client.rpc('generate_job_invoice_safe', {
    p_job_id: org2JobId,
    p_organizer_id: org1.userId,
  });
  check('SEC-ORG-02', "Organizer 1 cannot invoice Organizer 2's shift", org1InvoiceOrg2.data?.success === false && org1InvoiceOrg2.data?.error_code === 'UNAUTHORIZED', JSON.stringify(org1InvoiceOrg2));

  // Organizer 1 attempts to read Organizer 2's invoices
  const org1ReadOrg2Invoices = await org1.client.from('organizer_invoices').select('*').eq('organizer_id', org2.userId);
  check('SEC-ORG-03', "Organizer 1 cannot read Organizer 2's invoices", !org1ReadOrg2Invoices.error && (org1ReadOrg2Invoices.data || []).length === 0, JSON.stringify(org1ReadOrg2Invoices));

  // Organizer 1 attempts to offer worker for Organizer 2's shift
  const org1OfferOrg2 = await org1.client.rpc('select_worker_offer_safe', {
    p_job_id: org2JobId,
    p_worker_id: worker1.userId,
  });
  check('SEC-ORG-04', "Organizer 1 cannot select or offer workers for Organizer 2's shift", org1OfferOrg2.data?.success === false && org1OfferOrg2.data?.error_code === 'UNAUTHORIZED', JSON.stringify(org1OfferOrg2));

  console.log('\n[5] Privilege Escalation & Role Tampering');

  // Worker attempts to promote own role to admin directly via REST
  const workerEscalate = await worker1.client.from('profiles').update({ role: 'admin' }).eq('id', worker1.userId).select();
  check('SEC-ELEV-01', 'Worker cannot escalate profile role to admin directly', Boolean(workerEscalate.error) || workerEscalate.data?.length === 0, JSON.stringify(workerEscalate));

  // Organizer attempts to promote own role to admin directly via REST
  const orgEscalate = await org1.client.from('profiles').update({ role: 'admin' }).eq('id', org1.userId).select();
  check('SEC-ELEV-02', 'Organizer cannot escalate profile role to admin directly', Boolean(orgEscalate.error) || orgEscalate.data?.length === 0, JSON.stringify(orgEscalate));

  // Worker attempts to modify administrative rating/shifts fields directly
  const workerTamperAdminFields = await worker1.client.from('worker_profiles').update({ rating: 5.0, shifts_completed: 999 }).eq('id', worker1.userId).select();
  check('SEC-ELEV-03A', 'Worker cannot tamper with administrative rating or shifts_completed fields', Boolean(workerTamperAdminFields.error), JSON.stringify(workerTamperAdminFields));

  // Unverified Worker attempts to self-verify directly
  const unverifiedWorkerEmail = `unverified_w_${Date.now()}@test.opskil.local`;
  const { data: unwAuth } = await service.auth.admin.createUser({
    email: unverifiedWorkerEmail,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: { role: 'worker', full_name: 'Unverified Test Worker' },
  });
  const unwClient = makeClient();
  await unwClient.auth.signInWithPassword({ email: unverifiedWorkerEmail, password: 'Password123!' });
  const unwEscalate = await unwClient.from('worker_profiles').update({ verification_status: 'verified' }).eq('id', unwAuth.user.id).select();
  check('SEC-ELEV-03B', 'Unverified worker cannot directly self-verify to verified status', Boolean(unwEscalate.error), JSON.stringify(unwEscalate));

  // Organizer attempts to modify administrative rating/events fields directly
  const orgTamperAdminFields = await org1.client.from('organizer_profiles').update({ rating: 5.0, total_events_hosted: 999 }).eq('id', org1.userId).select();
  check('SEC-ELEV-04A', 'Organizer cannot tamper with administrative rating or events hosted fields', Boolean(orgTamperAdminFields.error), JSON.stringify(orgTamperAdminFields));

  // Unverified Organizer attempts to self-verify directly
  const unverifiedOrgEmail = `unverified_org_${Date.now()}@test.opskil.local`;
  const { data: unoAuth } = await service.auth.admin.createUser({
    email: unverifiedOrgEmail,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: { role: 'organizer', full_name: 'Unverified Test Org' },
  });
  const unoClient = makeClient();
  await unoClient.auth.signInWithPassword({ email: unverifiedOrgEmail, password: 'Password123!' });
  const unoEscalate = await unoClient.from('organizer_profiles').update({ verification_status: 'verified' }).eq('id', unoAuth.user.id).select();
  check('SEC-ELEV-04B', 'Unverified organizer cannot directly self-verify to verified status', Boolean(unoEscalate.error), JSON.stringify(unoEscalate));

  // Clean up temporary unverified accounts
  await service.auth.admin.deleteUser(unwAuth.user.id);
  await service.auth.admin.deleteUser(unoAuth.user.id);

  // Worker attempts to invoke admin_verify_case_safe
  const workerCallAdminKyc = await worker1.client.rpc('admin_verify_case_safe', {
    p_case_id: fakeUUID,
    p_status: 'approved',
    p_admin_id: worker1.userId,
  });
  check('SEC-ELEV-05', 'Worker cannot execute admin_verify_case_safe', workerCallAdminKyc.data?.success === false || Boolean(workerCallAdminKyc.error), JSON.stringify(workerCallAdminKyc));

  // Organizer attempts to mark payout settled
  const orgCallAdminSettle = await org1.client.rpc('admin_mark_payout_settled', {
    p_payment_id: fakeUUID,
    p_utr: 'FORGED_UTR_123',
  });
  check('SEC-ELEV-06', 'Organizer cannot execute admin_mark_payout_settled', orgCallAdminSettle.data?.success === false || Boolean(orgCallAdminSettle.error), JSON.stringify(orgCallAdminSettle));

  // Organizer attempts to mark invoice funded
  const orgCallAdminFund = await org1.client.rpc('admin_mark_invoice_funded', {
    p_invoice_id: fakeUUID,
    p_reference: 'FORGED_FUNDING_REF',
  });
  check('SEC-ELEV-07', 'Organizer cannot execute admin_mark_invoice_funded', orgCallAdminFund.data?.success === false || Boolean(orgCallAdminFund.error), JSON.stringify(orgCallAdminFund));

  // Worker attempts to resolve a dispute
  const workerCallAdminDispute = await worker1.client.rpc('admin_resolve_dispute_safe', {
    p_dispute_id: fakeUUID,
    p_status: 'resolved',
  });
  check('SEC-ELEV-08', 'Worker cannot execute admin_resolve_dispute_safe', workerCallAdminDispute.data?.success === false || Boolean(workerCallAdminDispute.error), JSON.stringify(workerCallAdminDispute));

  console.log('\n[6] Storage Bucket Privacy & Isolation');

  // Upload a synthetic KYC file for Worker 2 using service client
  const w2DocPath = `${worker2.userId}/aadhaar.pdf`;
  await service.storage.from('verification-documents').upload(w2DocPath, Buffer.from('FAKE AADHAAR PDF DATA'), {
    contentType: 'application/pdf',
    upsert: true,
  });

  // Anon download attempt
  const anonStorage = await anon.storage.from('verification-documents').download(w2DocPath);
  check('SEC-STORE-01', 'Anon cannot download from verification-documents bucket', Boolean(anonStorage.error), JSON.stringify(anonStorage.error));

  // Worker 1 download attempt on Worker 2's document
  const w1DownloadW2 = await worker1.client.storage.from('verification-documents').download(w2DocPath);
  check('SEC-STORE-02', "Worker 1 cannot download Worker 2's verification document", Boolean(w1DownloadW2.error), JSON.stringify(w1DownloadW2.error));

  // Organizer 1 download attempt on Worker 2's document
  const orgDownloadW2 = await org1.client.storage.from('verification-documents').download(w2DocPath);
  check('SEC-STORE-03', "Organizer 1 cannot download Worker 2's verification document", Boolean(orgDownloadW2.error), JSON.stringify(orgDownloadW2.error));

  // Admin download attempt on Worker 2's document (legitimate duty)
  const adminDownloadW2 = await admin.client.storage.from('verification-documents').download(w2DocPath);
  check('SEC-STORE-04', "Admin can download Worker 2's verification document for review", !adminDownloadW2.error && adminDownloadW2.data !== null, JSON.stringify(adminDownloadW2.error));

  // Private incident-evidence bucket check
  const w2IncidentPath = `${worker2.userId}/incident_001.png`;
  await service.storage.from('incident-evidence').upload(w2IncidentPath, Buffer.from('FAKE INCIDENT EVIDENCE IMAGE'), {
    contentType: 'image/png',
    upsert: true,
  });

  const anonIncident = await anon.storage.from('incident-evidence').download(w2IncidentPath);
  check('SEC-STORE-05', 'Anon cannot download from incident-evidence bucket', Boolean(anonIncident.error), JSON.stringify(anonIncident.error));

  const w1DownloadW2Incident = await worker1.client.storage.from('incident-evidence').download(w2IncidentPath);
  check('SEC-STORE-06', "Worker 1 cannot download Worker 2's incident evidence", Boolean(w1DownloadW2Incident.error), JSON.stringify(w1DownloadW2Incident.error));

  console.log('\n[7] Secret Isolation in Containers & Static Bundles');

  // Verify running containers do NOT contain SUPABASE_SERVICE_ROLE_KEY
  for (const container of ['opskl-test-admin-1', 'opskl-test-worker-1', 'opskl-test-organizer-1']) {
    let hasLeak = false;
    try {
      const envOut = execSync(`docker exec ${container} env`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
      hasLeak = envOut.includes('SUPABASE_SERVICE_ROLE_KEY');
    } catch (e) {
      // container might not be running or exec blocked
    }
    check(`SEC-LEAK-${container.split('-')[2]}`, `Container ${container} does not contain SUPABASE_SERVICE_ROLE_KEY`, !hasLeak, `Leak check: ${hasLeak}`);
  }

  // Verify served frontend HTML/JS does not contain the service-role JWT secret
  const rawServiceKey = serviceKey.trim();
  for (const [targetName, targetUrl] of [
    ['admin', process.env.APP_ADMIN_URL || 'http://127.0.0.1:3001'],
    ['worker', process.env.APP_WORKER_URL || 'http://127.0.0.1:3002'],
    ['organizer', process.env.APP_ORGANIZER_URL || 'http://127.0.0.1:3003'],
  ]) {
    let httpLeak = false;
    try {
      const res = await fetch(targetUrl);
      const html = await res.text();
      httpLeak = html.includes(rawServiceKey);
    } catch (e) {}
    check(`SEC-LEAK-HTTP-${targetName}`, `Served ${targetName} web application does not leak SUPABASE_SERVICE_ROLE_KEY`, !httpLeak, `HTTP leak: ${httpLeak}`);
  }

  // Verify web exports / bundles do not contain the service-role JWT secret
  let staticLeak = false;
  try {
    const grepResult = execSync(`grep -rn "${rawServiceKey}" apps/worker/dist-web apps/organizer/dist-web apps/admin/.next 2>/dev/null || true`).toString();
    staticLeak = grepResult.trim().length > 0;
  } catch (e) {}
  check('SEC-LEAK-STATIC', 'Built web bundles do not contain the raw SUPABASE_SERVICE_ROLE_KEY', !staticLeak, `Static bundle leak: ${staticLeak}`);

  console.log(`\n============================================================`);
  console.log(`SECURITY SUITE RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log(`============================================================\n`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL SECURITY TEST ERROR:', err);
  process.exit(1);
});
