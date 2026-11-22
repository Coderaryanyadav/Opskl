# ⚡ Opskl — High-Density Single-Day Shift Marketplace & Workforce Dispatch

[![CI Invariants & Verification](https://github.com/Coderaryanyadav/Opskl/actions/workflows/ci.yml/badge.svg)](https://github.com/Coderaryanyadav/Opskl/actions/workflows/ci.yml)
[![Build Mobile (APK/IPA) & Admin](https://github.com/Coderaryanyadav/Opskl/actions/workflows/build-artifacts.yml/badge.svg)](https://github.com/Coderaryanyadav/Opskl/actions/workflows/build-artifacts.yml)
[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057%2F58-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![Next.js](https://img.shields.io/badge/Next.js-15.2%20App%20Router-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%2015-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Target Market](https://img.shields.io/badge/Launch%20Region-Mumbai%20%28MMR%29-orange)](https://opskil.com)

---

## 💧 About

> **Urban water deficit logistics, emergency dispatch & fair metering platform
> for high-density metropolitan ecosystems. Built with Expo SDK 58, React
> Native, Supabase, PostGIS & TypeScript.**

### 🏷️ Repository Tags & Topics

`dispatch-system` &bull; `expo` &bull; `fleet-management` &bull; `geospatial`
&bull; `logistics` &bull; `mobile-app` &bull; `mumbai` &bull; `postgis` &bull;
`postgresql` &bull; `razorpay` &bull; `react-native` &bull; `real-time` &bull;
`supabase` &bull; `typescript` &bull; `water-management` &bull; `zustand`

```text
dispatch-system, expo, fleet-management, geospatial, logistics, mobile-app, mumbai, postgis, postgresql, razorpay, react-native, real-time, supabase, typescript, water-management, zustand
```

---

## 📑 Table of Contents

- [About & Repository Tags](#-about)
- [Platform Mission & Capabilities](#-platform-mission--overview)
- [System Architecture & Diagrams](#-system-architecture--diagrams)
  - [1. High-Level System Architecture](#1-high-level-system-architecture)
  - [2. Marketplace Shift Lifecycle State Machine](#2-marketplace-shift-lifecycle-state-machine)
  - [3. End-to-End Shift Booking & Payout Sequence](#3-end-to-end-shift-booking--payout-sequence)
  - [4. Database Entity-Relationship (ER) Schema](#4-database-entity-relationship-er-schema)
  - [5. Trust & Verification Governance Workflow](#5-trust--verification-governance-workflow)
- [Monorepo Package Breakdown](#-monorepo-package-breakdown)
- [Application Identifiers & Build Specs](#-application-identifiers--build-specs)
- [Core Platform Capabilities](#-core-platform-capabilities)
- [Environment Configuration & Security Rules](#-environment-configuration--security-rules)
- [Local Development Setup](#-local-development-setup)
- [Automated Mobile Builds: APK & IPA](#-automated-mobile-builds-apk--ipa)
- [Quality Assurance & Testing Suites](#-quality-assurance--testing-suites)
- [Statutory Compliance & Indian Market Safeguards](#-statutory-compliance--indian-market-safeguards)
- [License](#-license)

---

## 🎯 Platform Mission & Overview

**Opskl** is an on-demand, two-sided event staffing, dispatch, and single-day
shift marketplace built for high-density metropolitan ecosystems, launching in
the **Mumbai Metropolitan Region (MMR)**. It connects event organizers,
corporate hosts, and exhibition managers with vetted, on-ground personnel
(registration ushers, booth executives, crowd marshals, backstage runners, and
hospitality crew).

The platform enforces zero-demo live architecture: transparent daily wages,
escrow-locked funding, geofenced QR check-in, statutory minimum living wages (≥
₹100/hr in Mumbai), and automated direct-to-bank UPI settlements upon supervisor
sign-off.

---

## 🏛️ System Architecture & Diagrams

### 1. High-Level System Architecture

Opskl is designed as a unified monorepo leveraging npm workspaces, connecting
native mobile clients and a centralized web operations dashboard with a hardened
Supabase backend.

```mermaid
graph TD
    subgraph Clients["Client Layer"]
        WA["📱 Opskl Worker App<br/>(React Native / Expo Router)<br/>iOS & Android"]
        OA["📱 Opskl Organizer App<br/>(React Native / Expo Router)<br/>iOS & Android"]
        AC["💻 Opskl Admin Console<br/>(Next.js 15 App Router)<br/>Desktop Web"]
    end

    subgraph SharedPackages["Monorepo Shared Packages"]
        DS["@opskil/design-system<br/>(Monochrome UI Tokens, Components)"]
        SH["@opskil/shared<br/>(Domain Types, Supabase RPCs, Utils)"]
        VAL["@opskil/validation<br/>(Zod Schemas: GSTIN, UPI, Jobs)"]
    end

    subgraph Backend["Platform Core (Supabase & PostgreSQL 15)"]
        AUTH["Supabase Auth<br/>(Phone OTP & Email OTP)"]
        RLS["Row Level Security (RLS)<br/>(Tenant Isolation & Privacy)"]
        RPC["Atomic PostgreSQL RPCs<br/>(Capacity, Booking, Attendance)"]
        GEO["PostGIS Geospatial Engine<br/>(Venue Geofencing & Distance)"]
        RT["Realtime Channels<br/>(Roster Updates, Job Broadcasts)"]
        STOR["Supabase Storage<br/>(KYC Documents, Venue Media)"]
    end

    subgraph Integrations["External Services & Edge Providers"]
        GATEWAY["💳 Payment Gateway (Razorpay)<br/>Escrow & UPI Settlement"]
        PUSH["🔔 Push Notification Service<br/>(Expo Notifications)"]
        MAPS["🗺️ Geocoding & Maps API<br/>(Coordinates & Landmarks)"]
    end

    WA --> DS
    WA --> SH
    WA --> VAL
    OA --> DS
    OA --> SH
    OA --> VAL
    AC --> SH
    AC --> VAL

    Clients --> AUTH
    Clients --> RLS
    Clients --> RPC
    Clients --> RT
    Clients --> STOR

    RPC --> GEO
    RPC --> GATEWAY
    RPC --> PUSH
    OA --> MAPS
```

---

### 2. Marketplace Shift Lifecycle State Machine

Shifts advance through strict state validation rules. Completed or cancelled
shifts cannot be resurrected, preventing race conditions and double-commit
hazards.

```mermaid
stateDiagram-v2
    [*] --> draft: Organizer prepares shift listing
    draft --> open: Escrow estimate calculated & listing published
    open --> filling: First verified worker applies & vetted
    filling --> filled: All required crew slots confirmed
    filling --> open: Confirmed worker cancels (slot reopens)
    filled --> in_progress: Shift start window reached
    open --> in_progress: Shift begins with partial confirmed crew
    in_progress --> completed: Shift ended & all supervisor check-outs signed off
    in_progress --> disputed: Unresolved attendance or wage dispute raised
    disputed --> completed: Admin arbitrates & settles payout
    draft --> cancelled: Organizer cancels before publishing
    open --> cancelled: Organizer cancels (full escrow refunded)
    filling --> cancelled: Organizer cancels (all workers released + refunded)
    completed --> [*]
    cancelled --> [*]
```

---

### 3. End-to-End Shift Booking & Payout Sequence

The complete transactional lifecycle from shift publication to direct-to-bank
UPI payout:

```mermaid
sequenceDiagram
    autonumber
    actor Organizer as 🏢 Organizer
    participant Platform as ⚡ Opskl Engine (RPC)
    participant Escrow as 🏦 Razorpay Escrow
    actor Worker as 👷 Worker
    actor Admin as 🛡️ Admin / Dispute Desk

    Organizer->>Platform: create_job_safe(title, zone, hours, wage >= ₹100/hr)
    Platform->>Escrow: Pre-authorize & freeze shift escrow funds
    Platform-->>Organizer: Shift Published (Status: OPEN)

    Worker->>Platform: apply_for_job_safe(job_id)
    Platform-->>Organizer: Real-time application alert

    Organizer->>Platform: confirm_worker_booking_safe(application_id)
    Platform->>Platform: Verify slot capacity & ensure no overlapping worker bookings
    Platform-->>Worker: Booking Confirmed (QR Check-in Passcode issued)

    Note over Worker,Organizer: Shift Day at Event Venue (e.g. Jio World Convention Centre, BKC)

    Worker->>Platform: check_in_worker_safe(booking_id, GPS coords, pass_code)
    Platform->>Platform: PostGIS verify distance <= 300m & within time window
    Platform-->>Organizer: Worker On-Site Checked In

    Organizer->>Platform: complete_shift_and_approve_attendance(booking_id, final_hours)
    Platform->>Escrow: Release wage disbursement via instant UPI
    Escrow-->>Worker: Instant UPI bank credit (₹)

    alt Attendance Dispute
        Worker->>Platform: raise_dispute_safe(booking_id, reason)
        Platform->>Admin: Alert arbitration queue
        Admin->>Platform: arbitrate_dispute_safe(payout_adjustments)
        Platform->>Escrow: Execute adjudicated split
    end
```

---

### 4. Database Entity-Relationship (ER) Schema

Core relational PostgreSQL schema deployed under Supabase with strict Row Level
Security (RLS) enforcement:

```mermaid
erDiagram
    PROFILES ||--o| WORKER_PROFILES : "extends"
    PROFILES ||--o| ORGANIZER_PROFILES : "extends"
    ORGANIZER_PROFILES ||--o{ JOBS : "publishes"
    JOBS ||--o{ APPLICATIONS : "receives"
    WORKER_PROFILES ||--o{ APPLICATIONS : "submits"
    APPLICATIONS ||--o| BOOKINGS : "converts_to"
    JOBS ||--o{ BOOKINGS : "allocates_slot"
    BOOKINGS ||--o| ATTENDANCE_RECORDS : "tracks"
    BOOKINGS ||--o{ DISPUTES : "logs"
    ORGANIZER_PROFILES ||--o{ INVOICES : "billed_to"
    BOOKINGS ||--o| PAYOUTS : "settles"
    PROFILES ||--o{ AUDIT_LOGS : "triggers"

    PROFILES {
        uuid id PK
        string role "worker | organizer | admin"
        string full_name
        string phone
        string email
        timestamp created_at
    }

    WORKER_PROFILES {
        uuid id PK,FK
        string upi_id
        string kyc_status "pending | verified | rejected"
        string identity_document_type "aadhaar | pan"
        numeric rating
        integer total_shifts_completed
    }

    ORGANIZER_PROFILES {
        uuid id PK,FK
        string business_name
        string gstin
        string pan
        string kyc_status "pending | verified | rejected"
    }

    JOBS {
        uuid id PK
        uuid organizer_id FK
        string title
        string zone "BKC | Goregaon | Worli | Vashi | South Mumbai"
        geometry venue_coordinates "PostGIS Point"
        numeric wage_per_hour ">= 100.00"
        integer slots_required
        integer slots_filled
        string status "draft | open | filling | filled | in_progress | completed | cancelled"
    }

    BOOKINGS {
        uuid id PK
        uuid job_id FK
        uuid worker_id FK
        string status "confirmed | checked_in | completed | no_show | cancelled"
        string checkin_passcode
        numeric agreed_total_pay
    }

    ATTENDANCE_RECORDS {
        uuid id PK
        uuid booking_id FK
        timestamp check_in_time
        timestamp check_out_time
        numeric distance_to_venue_km
        numeric approved_hours
        numeric approved_total_pay
    }
```

---

### 5. Trust & Verification Governance Workflow

```mermaid
flowchart TD
    UserReg[User Registers via Phone/Email OTP] --> RoleBranch{Select Role}
    
    RoleBranch -->|Worker| W_KYC[Submit Aadhaar / PAN + UPI ID]
    RoleBranch -->|Organizer| O_KYC[Submit GSTIN / PAN + Business Details]
    
    W_KYC --> AdminQueue[Opskl Admin Operations Console]
    O_KYC --> AdminQueue
    
    AdminQueue --> DocVerify{KYC Review}
    DocVerify -->|Valid| ApproveUser[Status: VERIFIED]
    DocVerify -->|Invalid / Blurred| RejectUser[Request Re-submission]
    
    ApproveUser --> ActiveMarket[Full Marketplace Access]
    ActiveMarket --> ShiftOps[Shift Posting & Applications]
    
    ShiftOps --> DisputeCheck{Dispute Raised?}
    DisputeCheck -->|No| PayoutAuto[Instant UPI Payout via Escrow]
    DisputeCheck -->|Yes| ArbitrationDesk[Admin Arbitration Desk]
    ArbitrationDesk --> ResolveDispute[Adjudicated Resolution & Release]
```

---

## 📦 Monorepo Package Breakdown

```text
opskil/
├── .agents/
│   └── AGENTS.md                      # Engineering Constitution & AI Operating Manual
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Continuous integration: typecheck, lint, test, admin build
│       └── build-artifacts.yml        # Multi-platform packaging: APK, IPA, and Admin web distribution
├── .maestro/
│   ├── organizer_roster_flow.yaml     # Maestro UI automation for Organizer roster flow
│   └── worker_discovery_flow.yaml     # Maestro UI automation for Worker shift discovery
├── .vscode/
│   ├── extensions.json                # Recommended workspace VSCode extensions
│   └── settings.json                  # Editor formatting, linting & TypeScript settings
├── .dockerignore                      # Docker context ignore rules
├── .env.example                       # Client vs server environment variable specification
├── .env.docker.test.example           # Docker testing environment template
├── .env.production.template           # Production deployment secret manifest
├── .gitignore                         # Git repository ignore rules
├── .npmrc                             # NPM package management configuration
├── .yarnrc.yml                        # Yarn modern configuration
├── apps/
│   ├── worker/                        # Opskl Worker Mobile App (React Native, Expo SDK 57/58, Expo Router)
│   │   ├── app/                       # File-based routes ((tabs), shift/[id], profile, earnings, kyc)
│   │   ├── assets/images/             # Branding assets (icon.png, splash-icon.png, adaptive icons)
│   │   ├── app.json                   # com.opskil.worker, scheme: opskil-worker
│   │   ├── eas.json                   # EAS build profiles (development, preview, preview-simulator, prod)
│   │   └── package.json
│   ├── organizer/                     # Opskl Organizer Mobile App (React Native, Expo SDK 57/58, Expo Router)
│   │   ├── app/                       # File-based routes ((tabs), create, roster, attendance, kyc)
│   │   ├── assets/images/             # Branding assets (icon.png, splash-icon.png, adaptive icons)
│   │   ├── app.json                   # com.opskil.organizer, scheme: opskil-organizer
│   │   ├── eas.json                   # EAS build profiles (development, preview, preview-simulator, prod)
│   │   └── package.json
│   └── admin/                         # Opskl Admin Operations Console (Next.js 15, React 19, Tailwind)
│       ├── src/app/                   # App Router pages (dashboard, verifications, disputes, audit)
│       └── package.json
├── packages/
│   ├── design-system/                 # Strict monochrome Apple-grade UI design system
│   │   ├── src/components/            # Button, Card, Badge, Input, WageText, ErrorBoundary
│   │   └── src/theme/                 # Contrast tokens (#000000 / #FFFFFF), spacing, typography
│   ├── shared/                        # Shared business logic, database types, formatters, and RPC clients
│   │   ├── src/supabase/              # Safe RPC bindings (jobs, applications, bookings, attendance)
│   │   ├── src/formatters/            # INR currency (₹), IST time formatting, Mumbai zones
│   │   └── src/__tests__/             # Adversarial, concurrency, and platform test suites (26 suites)
│   ├── validation/                    # Zod runtime validation schemas
│   │   └── src/schemas/               # GSTIN, UPI ID, Shift Creation, and Mobile Auth schemas
│   └── config/                        # Shared workspace TypeScript & build configs
├── supabase/
│   ├── migrations/                    # Version-controlled PostgreSQL migrations (20261012.. to 20261015..)
│   ├── functions/                     # Supabase Edge Functions (webhooks, notifications, cleanup)
│   ├── config.toml                    # Local Supabase CLI configuration
│   └── full_schema_release.sql        # Rebuilt consolidated zero-demo database schema
├── docker/                            # Docker containerization, compose, and test environments
├── docs/                              # Playbooks for App Store, security, payments, and pilot testing
├── scripts/                           # Database migration, verification, screenshot, and notification tools
├── screenshots/                       # High-resolution application screenshots & UI flows
├── Design/                            # Stitch design specifications, UI prototypes & screen inventory
├── OPSKL_REVIEW_REPORT.md             # Platform architecture review & marketplace gap analysis
├── PROJECT_RUNBOOK.md                 # Master operations & engineering runbook
├── Verification.md                    # Adversarial verification & audit report
├── tsconfig.base.json                 # Monorepo base TypeScript compiler configuration
├── tsconfig.json                      # Root TypeScript configuration
├── package-lock.json                  # Locked dependency graph
└── package.json                       # Monorepo workspaces and script orchestration
```

---

## 📱 Application Identifiers & Build Specs

| Application         | Platform | Identifier / Bundle ID | Deep Link Scheme      | Default Port | Output Formats                   |
| :------------------ | :------- | :--------------------- | :-------------------- | :----------- | :------------------------------- |
| **Opskl Worker**    | Android  | `com.opskil.worker`    | `opskil-worker://`    | Metro (8081) | `.apk` (Preview), `.aab` (Prod)  |
| **Opskl Worker**    | iOS      | `com.opskil.worker`    | `opskil-worker://`    | Metro (8081) | `.ipa` (Device), `.tar.gz` (Sim) |
| **Opskl Organizer** | Android  | `com.opskil.organizer` | `opskil-organizer://` | Metro (8082) | `.apk` (Preview), `.aab` (Prod)  |
| **Opskl Organizer** | iOS      | `com.opskil.organizer` | `opskil-organizer://` | Metro (8082) | `.ipa` (Device), `.tar.gz` (Sim) |
| **Opskl Admin**     | Web      | `admin.opskil.com`     | `https://`            | 3000         | Standalone Next.js Bundle        |

---

## 💎 Core Platform Capabilities

### 👷 Worker Mobile Experience (`apps/worker`)

- **Swipe & Rapid Discovery**: Browse shifts filtered by Mumbai event clusters
  (BKC, Goregaon NESCO, Worli Dome, South Mumbai WTC).
- **Statutory Wage Floor**: View guaranteed transparent hourly wages (strictly ≥
  ₹100/hr, typically ₹160–₹200/hr).
- **Geofenced Check-In**: High-precision GPS check-in validated against venue
  coordinates within an enforced 300m tolerance.
- **Direct UPI Earnings**: Track completed shifts and receive direct bank
  disbursements via Indian UPI.
- **Paperless KYC**: Upload Aadhaar or PAN documents directly for rapid
  verification.

### 🏢 Organizer Mobile Experience (`apps/organizer`)

- **Shift Creation Wizard**: Post shifts specifying role, dates, overnight
  hours, headcount, and attire requirements.
- **Automated Escrow Calculator**: Instant calculation of total worker payout +
  platform fee + GST reserve before publishing.
- **Roster & Candidate Vetting**: Review applicant ratings, past shift
  reliability, and confirm bookings in one tap.
- **On-Site QR Attendance Desk**: Live check-in console with camera-based QR
  code scanning and supervisor sign-off.
- **GST-Compliant Invoicing**: Automatically generated provisional tax invoices
  sequenced by financial year (`OPS/26-27/00001`).

### 🛡️ Admin Operations Console (`apps/admin`)

- **KYC Verification Queue**: Review government IDs (Aadhaar, PAN, GSTIN) via
  time-limited signed URLs.
- **Dispute Arbitration Desk**: Review supervisor attendance records, GPS
  distance logs, and execute binding payout split adjustments.
- **Escrow Settlement Controls**: Monitor payment gateway webhook health and
  execute manual fallbacks (`admin_mark_invoice_funded`,
  `admin_mark_payout_settled`).
- **Audit Trails**: Immutable log of all administrative actions, account
  deletion requests, and privilege checks.

---

## 🔐 Environment Configuration & Security Rules

Opskl maintains strict segregation between client-safe variables and server-side
secrets.

### 1. Client Environment (`.env` or EAS Secrets)

These variables are bundled into mobile and web client builds:

```bash
EXPO_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key"
EXPO_PUBLIC_APP_ENV="development" # development | preview | production
EXPO_PUBLIC_DEFAULT_CITY="Mumbai"

# Admin Dashboard
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key"
NEXT_PUBLIC_APP_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Server-Only Secrets (Never bundled into mobile apps)

Store exclusively in CI/CD secrets, Supabase Edge Functions, or Next.js server
runtime:

```bash
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" # Full database bypass for admin actions
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"
RAZORPAY_KEY_ID="rzp_live_xxx"
RAZORPAY_KEY_SECRET="xxx"
RAZORPAY_WEBHOOK_SECRET="xxx"
```

---

## 🚀 Local Development Setup

### Prerequisites

- **Node.js**: v20+ (tested on Node v22 and v26)
- **Package Manager**: npm v10+
- **macOS**: Xcode with Command Line Tools (`xcode-select --install`) for iOS
  builds.
- **Android**: Android Studio with Android SDK Platform 34/35 and an active
  emulator.

### 1. Installation

```bash
git clone https://github.com/Coderaryanyadav/Opskl.git
cd Opskl
npm install
cp .env.example .env
```

### 2. Launching Worker App

```bash
# Start on iOS Simulator
npm run ios:worker

# Start on Android Emulator
npm run android:worker

# Start Metro Bundler (for physical device via Expo Go)
npm run start:worker
```

### 3. Launching Organizer App

```bash
# Start on iOS Simulator
npm run ios:organizer

# Start on Android Emulator
npm run android:organizer

# Start Metro Bundler
npm run start:organizer
```

### 4. Launching Admin Web Console

```bash
npm run dev:admin
# Open http://localhost:3000
```

---

## 📦 Automated Mobile Builds: APK & IPA

Opskl includes a production-ready GitHub Actions workflow
(`.github/workflows/build-artifacts.yml`) that builds native packages for
**Worker**, **Organizer (User)**, and **Admin**.

### 1. Triggering via GitHub Actions (Web UI)

1. Navigate to **Actions** → **Build Mobile Apps (APK/IPA) & Admin Console**.
2. Click **Run workflow** and choose:
   - **Application**: `all`, `worker`, `organizer`, or `admin`
   - **Target Platform**: `all`, `android`, `ios`, or `web`
   - **Build Profile**:
     - `preview` — Generates installable Android `.apk` and iOS Ad-Hoc `.ipa`.
     - `preview-simulator` — Generates iOS Simulator `.tar.gz` bundle (no Apple
       signing cert required).
     - `production` — Generates Google Play Store `.aab` and App Store `.ipa`.
   - **Build Mode**:
     - `local` — Runs directly on GitHub Actions runners (100% free; no Expo
       cloud credits required).
     - `eas-cloud` — Dispatches builds to Expo Application Services (requires
       `EXPO_TOKEN` secret).
3. Once completed, download the `.apk`, `.ipa`, or admin web tarball directly
   from the **Artifacts** section at the bottom of the workflow run summary!

---

### 2. Local Builds via EAS CLI

You can also generate installable standalone binaries on your own workstation:

#### Worker App:

```bash
# Build Android APK locally:
npm run build:worker:apk
# Or with EAS CLI:
cd apps/worker && eas build --platform android --profile preview --local

# Build iOS IPA locally (requires macOS + Xcode):
npm run build:worker:ipa
# Or for iOS Simulator:
cd apps/worker && eas build --platform ios --profile preview-simulator --local
```

#### Organizer App:

```bash
# Build Android APK locally:
npm run build:organizer:apk
# Or with EAS CLI:
cd apps/organizer && eas build --platform android --profile preview --local

# Build iOS IPA locally (requires macOS + Xcode):
npm run build:organizer:ipa
# Or for iOS Simulator:
cd apps/organizer && eas build --platform ios --profile preview-simulator --local
```

#### Admin Dashboard:

```bash
npm run build:admin
```

---

## 🧪 Quality Assurance & Testing Suites

Opskl enforces strict continuous quality gates across all monorepo packages.

| Suite                | Scope                               | Target               | Command                  | Status                       |
| :------------------- | :---------------------------------- | :------------------- | :----------------------- | :--------------------------- |
| **Typecheck**        | All Workspaces                      | Root, Apps, Packages | `npm run typecheck`      | ✅ **0 Errors**              |
| **Shared Tests**     | Concurrency, Auth, RLS, Edge Cases  | `@opskil/shared`     | `npm test`               | ✅ **26 Suites / 314 Tests** |
| **Validation Tests** | Zod Schemas (GSTIN, UPI, Jobs)      | `@opskil/validation` | `npm test`               | ✅ **1 Suite / 7 Tests**     |
| **Worker Tests**     | Discovery Feed, Swipe, Gestures     | `@opskil/worker`     | `npm test`               | ✅ **3 Suites / 38 Tests**   |
| **Organizer Tests**  | Shift Creation, Booking, Attendance | `@opskil/organizer`  | `npm test`               | ✅ **2 Suites / 31 Tests**   |
| **SQL Invariants**   | Migration syntax, security definers | `supabase/`          | `npm run test:sql`       | ✅ **Passed**                |
| **Admin E2E**        | Playwright Web Invariants           | `@opskil/admin`      | `npm run test:e2e:admin` | ✅ **Ready**                 |

To run the complete test suite locally:

```bash
npm test
```

---

## ⚖️ Statutory Compliance & Indian Market Safeguards

1. **Minimum Living Wage Floor**: All shift postings are validated server-side
   by `create_job_safe`. Any rate below ₹100/hr is rejected with an explicit
   error to prevent exploitative labor practices.
2. **PostGIS Geofencing**: Check-ins must be within 300 meters of the declared
   venue coordinates (`venue_coordinates`). Worker GPS coordinates and distance
   calculations are recorded with tamper resistance.
3. **Escrow Guarantee**: Organizers must pre-fund the shift escrow prior to job
   status advancing to `OPEN`. Funds are held in a secure clearing account and
   disbursed directly to the worker's verified UPI ID upon supervisor sign-off.
4. **GST & FY Sequencing**: Provisional GST invoices are formatted with
   sequential fiscal-year numbers (e.g. `OPS/26-27/00001`) with explicit 18%
   CGST/SGST line items for Indian tax compliance.
5. **Data Protection & Privacy**: Contact numbers of shift supervisors and
   workers are shielded behind Row Level Security (RLS) policies and only
   revealed to confirmed participants during the active shift window.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
