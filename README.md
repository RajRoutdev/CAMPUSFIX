<div align="center">

# 🏛️ CampusFix
### *See it. Report it. Route it. Resolve it.*

An AI-powered campus issue management and resolution platform that transforms informal complaints into structured, auditable, and automated institutional workflows.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%7C_Auth_%7C_Storage-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Flash-8E75B2?style=flat&logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Features](#-key-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Demo Accounts](#-demo-credentials) • [Security & RBAC](#-security--role-based-access-control) • [Campus Configuration](#-campus-configuration)

---

</div>

## 📌 Executive Summary

Campus maintenance issues—broken fans, plumbing leaks, electrical hazards, furniture damage—are traditionally reported through informal WhatsApp groups, verbal complaints, or chaotic paper logs. This causes:
- ❌ **Lost reports & zero accountability**
- ❌ **Incorrect department routing**
- ❌ **Duplicate submissions flooding maintenance staff**
- ❌ **No proof of resolution or safety verification**
- ❌ **Zero historical intelligence to detect recurring infrastructure failures**

**CampusFix** solves this end-to-end:
```text
Student Photo + Location
        ↓
Gemini 1.5 Multimodal Analysis (Title, Category, Severity, Department)
        ↓
4-Factor Duplicate Detection (Location, Category, Semantic, Time)
        ↓
Automated Department Ticket Routing (CF-XXXX)
        ↓
Staff Execution & Photo Proof Submission
        ↓
Admin Verification & Safety Closure
        ↓
Campus Intelligence & Hotspot Analytics
```

---

## ✨ Key Features

### 🎓 1. Student Portal (`/student`)
- **Multimodal AI Analysis:** Students snap a photo; Google Gemini 1.5 analyzes visual evidence to auto-suggest ticket title, category, severity, department, and observable damage indicators.
- **Student Google Sign-In:** One-click Google OAuth 2.0 authentication strictly bounded to least-privileged `student` privileges.
- **4-Tier Cascading Location Hierarchy:** Select `Building` &rarr; `Floor` &rarr; `Room / Area` (supporting classrooms, labs, restrooms, corridors, lifts, and outdoor zones).
- **Intelligent Duplicate Prevention:** 4-factor duplicate scoring engine (40% location, 25% category, 25% semantic AI, 10% time proximity). Follow existing tickets with one click to prevent clutter (*Never Silently Merge* policy).
- **Live Ticket Tracker:** Real-time lifecycle bar (`NEW` &rarr; `ASSIGNED` &rarr; `IN_PROGRESS` &rarr; `RESOLUTION_SUBMITTED` &rarr; `VERIFIED` &rarr; `CLOSED`) and inspector for resolution proof photos.

### 🛠️ 2. Staff Portal (`/staff`)
- **Department-Filtered Work Order Queue:** Staff view only issues assigned to their specific trade (Electrical, Plumbing, Housekeeping, IT, Infrastructure).
- **Operational State Transitions:** One-click `Start Work` (`IN_PROGRESS`) with timer tracking.
- **Resolution Proof Submission:** Staff upload mandatory photographic evidence of completed repairs before submitting for admin verification.
- **Protected Access:** Onboarding strictly controlled via secure, single-use administrative access codes.

### 🛡️ 3. Admin Portal & Campus Configuration (`/admin`)
- **Verification & Ticket Closure:** Admins review before-and-after photo evidence to verify repairs or reassign tickets if work is inadequate.
- **Campus Data Hierarchy Management:** Web UI to create, edit, and organize Buildings, Floors, Classrooms, Labs, and Outdoor grounds without direct database access.
- **Department & Auto-Routing Rules:** Configure institutional departments and bind issue categories for automated dispatch.
- **Staff Invitation Engine:** Issue expiring `STAFF-XXXXXX` invitation codes with designated service areas and departments.
- **Bulk CSV Data Importer:** Import campus assets and locations in bulk with pre-commit duplicate validation and row-level error reporting.

### 📊 4. Campus Intelligence & Analytics (`/admin/analytics`)
- **Real-Time KPIs:** Total issue throughput, active breakdowns, verification backlog, and average resolution turnaround.
- **Hotspot Detection:** Identifies recurring failure zones (e.g. Block B Room 204 electrical recurring defects).
- **Department Workload:** Live distribution charts showing completed vs. open tasks per department.
- **AI Operational Insights:** Deterministic numeric rollups paired with Gemini natural-language synthesis for institutional facilities summaries.

---

## 🏗️ Architecture

```text
┌───────────────────────────────────────────────────────────────┐
│                     Client Browser (Next.js)                  │
│   Student Portal     │     Staff Portal     │  Admin Portal   │
└───────────────┬──────────────────────┬───────────────┬────────┘
                │                      │               │
                ▼                      ▼               ▼
┌───────────────────────────────────────────────────────────────┐
│              Next.js 14 Server Engine (App Router)            │
│  • Edge Middleware Route Guards (Strict Portal Isolation)     │
│  • Server-Side Cookie Session & Token Authentication          │
│  • Server Route Handlers (/api/analyze, /api/issues, etc.)    │
└───────────────┬──────────────────────┬───────────────┬────────┘
                │                      │               │
        ┌───────┴────────┐     ┌───────┴───────┐       │
        ▼                ▼     ▼               ▼       ▼
┌───────────────┐ ┌──────────────────┐ ┌────────────────────────┐
│ Google Gemini │ │ Supabase Storage │ │ Supabase PostgreSQL    │
│ 1.5 API       │ │ (Bucket: images) │ │ • Row-Level Security   │
│ Visual Reason │ │ Photo & Proof    │ │ • Profiles, Issues     │
│ Structured AI │ │ CDN Delivery     │ │ • Locations, Analytics │
└───────────────┘ └──────────────────┘ └────────────────────────┘
```

### Core Architecture Philosophy
> **"AI assists; deterministic application logic controls."**  
> AI models suggest categories, titles, and severities; deterministic server-side code and PostgreSQL Row Level Security (RLS) control authorization, state transitions, ticket verification, and multi-tenant isolation.

---

## 🔒 Security & Role-Based Access Control

| Role | Portal Path | Access & Privileges | Authentication Method |
| :--- | :--- | :--- | :--- |
| **Student** | `/student/*` | Report issues, view personal tickets, follow existing issues | Google OAuth 2.0 or Email/Password |
| **Staff** | `/staff/*` | View department work orders, start work, upload repair proof | Verified Email + Staff Access Code |
| **Admin** | `/admin/*` | Campus configuration, staff invites, resolution verification, analytics | Verified Email + Admin Security Code |

### Security Guarantees
- **Strict Role Isolation:** Edge middleware blocks students from entering staff/admin portals; non-student roles are prevented from filing student reports.
- **Anti-Escalation Guarantee:** Public sign-ups and Google OAuth sign-ins strictly default to `role: 'student'`. Staff and Admin privileges can NEVER be self-assigned.
- **Multi-Tenant Isolation:** All database records are strictly scoped to `college_id`. Users from College A cannot view or mutate records belonging to College B.
- **Zero Secret Exposure:** Google Gemini API key and Supabase Service Role key are executed strictly on the server and are never bundled into client JavaScript.
- **Open-Redirect Hardening:** All callback redirects pass through whitelist sanitization, mitigating external protocol escapes and phishing vectors.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** `v18.18.0` or higher
- **npm** or **pnpm**
- A **Supabase** project ([supabase.com](https://supabase.com))
- A **Google Gemini API Key** ([ai.google.dev](https://ai.google.dev))

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/campusfix.git
cd campusfix
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your configuration in `.env.local`:
```env
# Supabase Public Configuration (Browser accessible)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Server Configuration (Strictly server-side)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini AI Key (Strictly server-side)
GEMINI_API_KEY=your-gemini-api-key

# Portal Verification Codes (Strictly server-side)
STAFF_ACCESS_CODE=STAFF-CAMPUSFIX-2026
ADMIN_ACCESS_CODE=ADMIN-CAMPUSFIX-SECURE
```

### 3. Database Setup (Supabase)
1. Open your **Supabase Dashboard** &rarr; **SQL Editor**.
2. Run the master schema and migration file:
   - Copy contents of [`supabase/complete_setup.sql`](supabase/complete_setup.sql) into the SQL editor and click **Run**.
3. Under **Storage**, verify the bucket `campusfix-images` is created with public read access.

### 4. Optional: Google OAuth Configuration
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials) and create an **OAuth 2.0 Web Client ID**:
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URI: `https://<YOUR-SUPABASE-PROJECT>.supabase.co/auth/v1/callback`
2. In **Supabase Dashboard** &rarr; **Authentication** &rarr; **Providers** &rarr; **Google**:
   - Toggle **Enable Sign in with Google** to **ON**.
   - Paste your **Client ID** and **Client Secret**.
3. Under **Authentication** &rarr; **URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/api/auth/callback`

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Credentials

CampusFix includes pre-seeded accounts for immediate testing:

| Portal | Email | Password | Access Code | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `student@campusfix.edu` | `Password123!` | *None required* | `student` |
| **Staff** | `staff@campusfix.edu` | `Password123!` | `STAFF-CAMPUSFIX-2026` | `staff` (Maintenance) |
| **Admin** | `admin@campusfix.edu` | `Password123!` | `ADMIN-CAMPUSFIX-SECURE` | `admin` |

---

## 🧪 Testing & Verification

The project includes an extensive automated verification suite covering security, RBAC, duplicate algorithms, and campus configuration:

```bash
# Verify Google OAuth and strict portal containment
node scripts/verify-google-auth.mjs

# Verify Campus Configuration & Real Data hierarchy
node scripts/verify-campus-config.mjs

# Run full end-to-end security & RBAC verification
node scripts/verify-phase8.mjs

# Run TypeScript compiler checks
npm run typecheck

# Verify Next.js production build (39/39 routes)
npm run build
```

---

## 📁 Repository Structure

```text
campusfix/
├── scripts/                          # Automated verification & test suites
│   ├── verify-google-auth.mjs        # OAuth & containment tests
│   ├── verify-campus-config.mjs      # Hierarchy & CRUD tests
│   └── verify-phase*.mjs             # End-to-end phase assertions
├── src/
│   ├── app/                          # Next.js 14 App Router
│   │   ├── (auth)/                   # Portal login & registration pages
│   │   ├── admin/                    # Admin portal (dashboard, campus, analytics)
│   │   ├── staff/                    # Staff portal (queue, resolution)
│   │   ├── student/                  # Student portal (report, tracking)
│   │   ├── api/                      # Protected server-side API routes
│   │   │   ├── analyze/              # Gemini visual reasoning endpoint
│   │   │   ├── auth/callback/        # OAuth code exchange & provisioning
│   │   │   ├── campus/               # Buildings, rooms, departments CRUD
│   │   │   ├── issues/               # Lifecycle, assignment, resolution proof
│   │   │   └── matches/              # 4-factor duplicate detection
│   │   └── layout.tsx                # Master app layout & theme
│   ├── components/
│   │   ├── auth/                     # Google sign-in buttons & guards
│   │   ├── layout/                   # Navbar, role indicators, breadcrumbs
│   │   └── ui/                       # Accessible UI primitives (shadcn-inspired)
│   ├── lib/
│   │   ├── auth/                     # Session resolution & demo stores
│   │   ├── gemini/                   # Server-side Gemini client & business rules
│   │   └── supabase/                 # Browser, server, and service-role clients
│   ├── middleware.ts                 # Edge runtime route protection & RBAC
│   └── types/                        # TypeScript database & domain models
└── supabase/
    ├── complete_setup.sql            # Master schema, triggers, and RLS policies
    └── seed.sql                      # Realistic campus seed data
```

---

## 🤝 Contributing

Contributions, feedback, and issue submissions are welcome:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
<sub>Built with Next.js, Supabase & Google Gemini.</sub>
</div>
