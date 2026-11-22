# Phase 2 — Baseline Verification and Environment Reality

**Date:** 2026-10-22 (IST)  
**Repository:** `/Users/aryan/Desktop/PROJECTS/OPSKIL`  
**Branch:** `main` (commit `f981865` / clean working tree)  
**Host Environment:** macOS arm64, Docker 29.4.0, Docker Compose v5.1.2, Node v26.11.1, Supabase CLI 2.121.0  
**Container Runner Environment:** `opskl-test-runner:test` (Node v24.21.0 on `linux/arm64`, Playwright Chromium v1.64.0)  

---

## 1. Baseline Verification & Independent Reproduction

The initial Phase 1 report claimed 65 passing checks (5 smoke, 1 seed, 41 API/RLS, 18 browser UI), 44 clean migrations, and 7 resolved environment/harness issues.

In Stage 1 of Phase 2, this baseline was independently audited, executed, and verified from first principles:

| Check / Suite | Invocation Command | Exit Code | Checks Executed | Status | Evidence Path |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Compose Preflight** | `./docker/scripts/preflight.sh` | 0 | 6 assertions | **PASS** | stdout / docker network inspection |
| **Container Smoke** | `./docker/scripts/run-smoke-tests.sh` | 0 | 5 assertions | **PASS** | `test-artifacts/docker/smoke.log` |
| **Deterministic Seed** | `node scripts/docker/seed_test_data.mjs` | 0 | 5 accounts + 2 shifts | **PASS** | `test-artifacts/docker/seed.log` |
| **Original API/RLS** | `node scripts/docker/test_api_workflow.mjs` | 0 | 41 checks | **PASS** | `test-artifacts/docker/api-rpc-rls.log` |
| **Original Chromium UI** | `node scripts/docker/test_ui_workflow.mjs` | 0 | 18 checks | **PASS** | `test-artifacts/docker/browser-ui.log`, `ui-checks.json` |
| **Fresh Database Migrations** | `npx supabase migration list --local` | 0 | 44 applied, 0 pending | **PASS** | PostgreSQL `supabase_migrations` catalog |
| **Lifecycle SQL Suite** | `DATABASE_URL=... node scripts/test_lifecycle_db.mjs` | 0 | 69 checks | **PASS** | `test-artifacts/docker/lifecycle-db.log` |
| **Three-Role SQL Workflow**| `DATABASE_URL=... node scripts/test_full_workflow_db.mjs` | 0 | 52 checks | **PASS** | `test-artifacts/docker/full-workflow-db.log` |
| **SQL Integration Suite** | `DATABASE_URL=... node scripts/test_sql_integration.mjs` | 0 | 56 checks | **PASS** | `test-artifacts/docker/sql-integration.log` |
| **Marketplace Phase 4** | `DATABASE_URL=... node scripts/test_phase4_marketplace.mjs` | 0 | 12 steps | **PASS** | `test-artifacts/docker/phase4-marketplace.log` |

---

## 2. Docker Images & Image Contents Reality

| Image Tag | Actual Framework & Base Image | Running Role / Process | Ports & Network | Truthful Capability |
| :--- | :--- | :--- | :--- | :--- |
| **`opskl-admin:test`** | Next.js 15.5.27 standalone on `node:22-alpine` | Admin Operations Web Portal | `127.0.0.1:3001 -> 3000` | Full SSR web application. Connects to `opskl-test-api:8000` internally. |
| **`opskl-worker:test`** | Expo Web Static Export on `nginxinc/nginx-unprivileged:1.27-alpine` | Worker Mobile Web Target | `127.0.0.1:3002 -> 8080` | **Web export only**. Truthful web UI. Does NOT run iOS/Android native runtime. |
| **`opskl-organizer:test`**| Expo Web Static Export on `nginxinc/nginx-unprivileged:1.27-alpine` | Organizer Mobile Web Target | `127.0.0.1:3003 -> 8080` | **Web export only**. Truthful web UI. Does NOT run iOS/Android native runtime. |
| **`opskl-test-runner:test`** | Playwright Chromium on `mcr.microsoft.com/playwright:v1.64.0-noble` | Automated API & UI test orchestrator | Internal network only | Headless Chromium + Node test runner. Rebuilt dynamically from current workspace scripts. |

---

## 3. Database Reality: Supabase CLI Stack vs `opskl-pg`

OrbStack displays two distinct database resources:
1. **`supabase_db_OPSKIL` (Port 54322)**: Official Supabase CLI PostgreSQL 17.11 instance, running with GoTrue Auth (`supabase_auth_OPSKIL`), Kong API Gateway (`supabase_kong_OPSKIL` on port 54321), Storage API (`supabase_storage_OPSKIL`), and PostgREST.
   - **Verdict:** This is the **authoritative test database**. All 44 migrations, RLS policies, and RPC triggers reside here.
2. **`opskl-pg` (Port 55432)**: Standalone `postgres:15-alpine` container running in bridge mode with database `opskil`.
   - **Verdict:** Isolated standalone Postgres instance. It lacks Supabase GoTrue Auth, Storage API, and Auth triggers (`auth.users`). Pointing test applications at `opskl-pg` would fail authentication flows. Documented as a legacy/isolated container.

---

## 4. Migration Ordering & Timestamp Collision Analysis

In Phase 1, a migration timestamp collision occurred between:
- `20261021000000_fix_admin_service_role_profile_updates.sql`
- `20261021000000_incident_evidence_storage.sql` (renamed to `20261022000006_incident_evidence_storage.sql`)

### Migration Ordering Verification:
1. `20261022000005_fix_role_switch_guard.sql` applies role-switching guards on `profiles`.
2. `20261022000006_incident_evidence_storage.sql` creates the private `incident-evidence` storage bucket and RLS policies on `storage.objects`.
3. Fresh-database execution was verified via `./docker/scripts/reset-test-data.sh`. All 44 migrations apply in ascending chronological order with exit code 0.
4. `npx supabase migration list --local` confirms 44 local versions perfectly matching 44 applied versions.
