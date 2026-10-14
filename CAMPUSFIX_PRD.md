# CampusFix — Product Requirements Document (PRD)

**Version:** 1.0  
**Project:** CampusFix  
**Tagline:** *See it. Report it. Route it. Resolve it.*  
**Target:** 36-hour college hackathon MVP  
**Platform:** Responsive Web Application  
**Status:** Build-ready specification

---

## 1. Product Overview

CampusFix is an AI-powered campus issue reporting and resolution platform.

It transforms an unstructured campus complaint into a structured workflow:

> **See issue → Report → AI understands → Detect duplicate → Route → Resolve → Verify → Analyze**

A student photographs a campus problem, selects its location, and optionally adds a short description. AI assists with identifying the issue, category, severity, department, and concise description. The student reviews the suggestions before submitting the ticket.

Staff members receive relevant issues, work on them, and submit resolution evidence. Administrators verify the result and close the ticket.

Historical issue data becomes campus intelligence such as recurring problems, department workload, and location hotspots.

### Core Product Positioning

CampusFix is **not simply an AI complaint form**.

Its value comes from converting complaints into:

1. Structured operational tickets
2. Department-routed work
3. Traceable resolution workflows
4. Duplicate-aware issue management
5. Historical campus intelligence

---

# 2. Problem Statement

Campus problems are frequently reported through informal conversations, messaging groups, calls, or generic forms.

This creates:

- Incomplete issue descriptions
- Incorrect or missing locations
- Wrong department routing
- Duplicate complaints
- No transparent status
- Weak accountability
- No resolution evidence
- No useful historical data
- Hidden recurring problems

CampusFix addresses these problems through a centralized workflow.

---

# 3. Product Goals

## Primary Goals

CampusFix must:

- Make issue reporting extremely simple.
- Use AI to structure unstructured reports.
- Reduce manual category/department selection.
- Suggest issue severity.
- Detect potential duplicate issues.
- Route issues to appropriate departments.
- Provide clear ticket status.
- Allow staff to submit resolution evidence.
- Allow administrators to verify resolutions.
- Generate useful operational analytics.
- Demonstrate a scalable multi-college architecture.

## Secondary Goals

- Provide a professional SaaS-style user experience.
- Work responsively on mobile and desktop.
- Keep architecture simple enough for a 36-hour hackathon.
- Separate AI assistance from deterministic application logic.
- Provide a reliable demo fallback when external services fail.

---

# 4. Non-Goals for MVP

Do not implement these unless the core MVP is already complete:

- Native Android/iOS applications
- WhatsApp integration
- SMS infrastructure
- Blockchain or cryptocurrency
- Payment systems
- AR/VR
- Custom computer-vision model training
- Complex predictive ML
- Large multi-agent AI systems
- Advanced campus maps
- IoT sensor integration
- Enterprise ERP integrations
- Complex notification infrastructure
- Fully automated AI issue closure

The priority is a reliable end-to-end web prototype.

---

# 5. Target Users

## Student

Students can:

- Sign in
- Report issues
- Upload images
- Select location
- Review AI suggestions
- Edit AI suggestions
- Create tickets
- View their own tickets
- Track ticket status
- See potential duplicate issues

## Staff / Technician

Staff can:

- View assigned issues
- Filter issues
- Open issue details
- Start work
- Update issue status
- Add resolution notes
- Upload resolution evidence
- Submit a resolution

## Admin

Admins can:

- View all college issues
- Assign/reassign issues
- Correct classifications
- Verify resolutions
- Close issues
- View analytics
- View recurring problems
- View location hotspots
- View department workload
- Manage configurable campus data

---

# 6. Core User Journey

1. Student notices a campus problem.
2. Student opens CampusFix.
3. Student selects **Report Issue**.
4. Student uploads/takes a photo.
5. Student selects building/floor/room/area.
6. Student optionally adds a description.
7. CampusFix sends the report to the AI analysis endpoint.
8. AI suggests title, category, severity, department, description and safety risk.
9. Student reviews the suggestions.
10. CampusFix checks for potential duplicates.
11. Student sees a duplicate warning if applicable.
12. Student chooses to follow an existing issue or create a new report.
13. Ticket is created.
14. Staff receives the issue.
15. Staff starts work.
16. Staff uploads resolution evidence.
17. Admin verifies the resolution.
18. Issue becomes closed.
19. Analytics update.

---

# 7. MVP Feature Requirements

## 7.1 Authentication

Use:

- Supabase Auth
- Email/password or an appropriate supported authentication method
- Profiles connected to authenticated users

Every authenticated user must have:

- User ID
- College ID
- Name
- Email
- Role
- Optional department ID

### Security Requirement

Never trust a role supplied by the browser.

Role permissions must be enforced using server-side authorization and Supabase Row Level Security (RLS).

---

# 8. Student Dashboard

Route:

`/student/dashboard`

Show:

- Total reported issues
- Open issues
- In-progress issues
- Resolved/closed issues
- Recent issues
- Report Issue button

Issue cards should show:

- Ticket ID
- Title
- Category
- Severity
- Location
- Status
- Created date

---

# 9. Report Issue

Route:

`/student/report`

### Required

- Issue image
- Campus location

### Optional

- Student description

The student should not be required to manually enter category, department or severity.

AI should suggest these values.

The student must be able to edit AI suggestions before submission.

---

# 10. AI Issue Analysis

Use a multimodal Gemini model through a **server-side API route**.

Never expose the Gemini API key in client-side code.

### Endpoint

`POST /api/analyze`

### Input

- Image
- Optional description
- Location

### Expected Structured Output

```json
{
  "issue_title": "Broken ceiling fan",
  "category": "Electrical",
  "severity": "medium",
  "department": "Maintenance",
  "description": "Ceiling fan appears damaged and requires inspection.",
  "safety_risk": false,
  "evidence": [
    "Fan appears physically damaged",
    "Issue affects classroom functionality"
  ]
}
```

### AI Fields

- `issue_title`: short human-readable title
- `category`: Electrical, Plumbing, Furniture, Cleanliness, Internet/Network, Classroom Equipment, Security, Civil/Infrastructure, Other
- `severity`: `low`, `medium`, `high`, `critical`
- `department`: configurable college department
- `description`: concise evidence-based description
- `safety_risk`: boolean
- `evidence`: short observable statements

Do **not** expose hidden model chain-of-thought.

---

# 11. AI Safety and Reliability

AI is an **assistant suggestion**, not an authority.

The application must:

- Validate AI output.
- Allow user correction.
- Apply deterministic rules where necessary.
- Never let AI control authorization.
- Never let AI bypass RLS.
- Never allow AI to directly close an issue.
- Reject malformed model output.

If AI fails:

1. Show a useful error/retry state.
2. Allow a transparent fallback/demo mode where appropriate.
3. Never claim live AI analysis occurred when fallback data was used.

---

# 12. Severity Logic

AI may suggest severity, while deterministic safety rules provide additional control.

Example:

### Critical
- Exposed electrical wiring
- Fire hazard
- Major structural damage
- Dangerous physical condition

### High
- Serious equipment failure
- Major water leakage
- Security-related infrastructure problem

### Medium
- Broken ceiling fan
- Broken projector
- Damaged classroom equipment

### Low
- Minor furniture damage
- Cosmetic issue
- Small non-urgent maintenance problem

These rules should remain configurable.

---

# 13. Department Routing

AI suggests the responsible department.

Authorized staff/admin users can correct it.

Example:

| Category | Possible Department |
|---|---|
| Electrical | Electrical / Maintenance |
| Plumbing | Plumbing / Maintenance |
| Internet | IT |
| Classroom Equipment | Academic/IT Support |
| Cleanliness | Housekeeping |
| Security | Security |
| Civil/Infrastructure | Maintenance |

Department mappings should be configurable per college.

---

# 14. Duplicate Detection

Duplicate detection is a primary differentiating feature.

New issues should be compared against relevant existing open/recent issues.

**Never silently merge issues.**

### Initial scoring model

| Signal | Weight |
|---|---:|
| Location similarity | 40% |
| Category similarity | 25% |
| Semantic similarity | 25% |
| Time proximity | 10% |

Initial demo threshold:

`0.80`

The threshold should be configurable.

### Duplicate UX

Show:

> **Potential duplicate issue found**

Include:

- Existing ticket ID
- Existing title
- Location
- Current status
- Match score
- Match reasons

Actions:

- **Follow Existing Issue**
- **Create New Report**

Example:

> 92% potential match  
> Same room  
> Same category  
> Similar description  
> Reported recently

---

# 15. Ticket Lifecycle

```text
NEW
 ↓
ASSIGNED
 ↓
IN_PROGRESS
 ↓
RESOLUTION_SUBMITTED
 ↓
VERIFIED
 ↓
CLOSED
```

### NEW
Issue has been created.

### ASSIGNED
Issue has been assigned to a department/staff member.

### IN_PROGRESS
Work has started.

### RESOLUTION_SUBMITTED
Staff submitted completion notes and evidence.

### VERIFIED
Admin verified the resolution.

### CLOSED
Issue is officially completed.

Use human-readable IDs such as `CF-1024`, while keeping a UUID/internal ID as the database primary key.

---

# 16. Activity Log

Record important actions:

- Issue created
- AI analysis completed
- Assignment changed
- Status changed
- Staff started work
- Resolution submitted
- Admin verified
- Issue closed

Fields:

- ID
- Issue ID
- User ID
- Action
- Metadata
- Timestamp

---

# 17. Issue Images

Use Supabase Storage.

Image types:

- `original`
- `resolution`

Each image record should contain:

- ID
- Issue ID
- Storage URL/path
- Image type
- Created timestamp

Validate MIME type, file size and upload permissions.

---

# 18. Staff Dashboard

Route:

`/staff/dashboard`

Show:

- Assigned issues
- High-priority issues
- New assignments
- In-progress issues
- Recently resolved issues

Filters:

- Status
- Severity
- Category
- Location

---

# 19. Staff Issue Detail

Route:

`/staff/issues/[id]`

Show:

- Ticket ID
- Original image
- Description
- Category
- Severity
- Department
- Location
- Reporter
- Created date
- Activity history

Actions:

- Start Work
- Update status
- Add notes
- Upload resolution image
- Submit Resolution

---

# 20. Admin Dashboard

Route:

`/admin/dashboard`

Show:

- Total issues
- Open issues
- In-progress issues
- Resolved issues
- Critical/high-priority issues
- Department workload
- Category distribution
- Location hotspots
- Resolution-time metrics
- Recurring issue insights

---

# 21. Admin Issue Management

Route:

`/admin/issues`

Required:

- Search
- Filter
- Sort
- Pagination where needed

Search:

- Ticket ID
- Title
- Location

Filters:

- Status
- Category
- Severity
- Department
- Building
- Date

Admin can:

- Reassign department
- Correct category
- Correct severity
- Review activity
- Verify resolution
- Close issue

---

# 22. Campus Analytics

Route:

`/admin/analytics`

Initially use deterministic SQL/aggregation.

### Required Metrics

**Issue volume:** day/week/month

**Category distribution:** count/percentage by category

**Department workload:** open/in-progress/resolved

**Location hotspots:** buildings/rooms with high issue counts

**Resolution metrics:**
- Average resolution time
- Open issue age
- High-priority unresolved issues

---

# 23. Recurring Issue Detection

Identify repeated problems using:

- Location
- Category
- Date range
- Issue count

Example:

> Room 204 has 7 electrical reports in the last 30 days.

Or:

> Block B has a high concentration of maintenance issues.

AI may optionally generate a short explanation after deterministic metrics are calculated.

---

# 24. Multi-College Scalability

Every major entity should be associated with:

`college_id`

Example:

```text
College A
 ├── Departments
 ├── Locations
 ├── Users
 └── Issues

College B
 ├── Departments
 ├── Locations
 ├── Users
 └── Issues
```

Users must never access another college's data.

Enforce this through database-level RLS, not only UI filtering.

---

# 25. Database Schema

## `colleges`

- `id`
- `name`
- `logo_url`
- `created_at`

## `profiles`

- `id`
- `college_id`
- `name`
- `email`
- `role`
- `department_id`
- `created_at`

## `departments`

- `id`
- `college_id`
- `name`
- `description`

## `locations`

- `id`
- `college_id`
- `building`
- `floor`
- `room`
- `area`

## `issues`

- `id`
- `college_id`
- `reported_by`
- `title`
- `description`
- `category`
- `severity`
- `status`
- `department_id`
- `location_id`
- `created_at`
- `updated_at`
- `resolved_at`

## `issue_images`

- `id`
- `issue_id`
- `image_url`
- `image_type`
- `created_at`

## `issue_matches`

- `id`
- `issue_id`
- `matched_issue_id`
- `score`
- `reason`
- `created_at`

## `activity_logs`

- `id`
- `issue_id`
- `user_id`
- `action`
- `metadata`
- `created_at`

## Optional `notifications`

Only add if time permits.

---

# 26. Database Relationships

```text
COLLEGE
 ├── DEPARTMENTS
 ├── LOCATIONS
 ├── PROFILES
 │
 └── ISSUES
      ├── ISSUE_IMAGES
      ├── ISSUE_MATCHES
      └── ACTIVITY_LOGS
```

---

# 27. Required Routes

```text
/login

/student/dashboard
/student/report
/student/issues/[id]

/staff/dashboard
/staff/issues/[id]

/admin/dashboard
/admin/issues
/admin/issues/[id]
/admin/analytics
```

---

# 28. API Contracts

| Endpoint | Purpose |
|---|---|
| `POST /api/analyze` | Image + description + location → validated AI analysis |
| `POST /api/issues` | Create issue |
| `GET /api/issues` | List/filter issues |
| `GET /api/issues/:id` | Get issue detail |
| `POST /api/matches` | Evaluate potential matches |
| `PATCH /api/issues/:id/status` | Update workflow status |
| `POST /api/issues/:id/resolution` | Submit resolution evidence |
| `PATCH /api/issues/:id/assignment` | Assign/reassign department or staff |
| `GET /api/analytics` | Operational metrics |
| `GET /api/insights` | Recurring/hotspot insights |

---

# 29. Technical Architecture

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons
- Responsive UI

## Backend/Data

- Next.js server/API routes
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security

## AI

- Gemini multimodal API through server-side route
- Structured JSON
- Schema validation
- Transparent fallback

## Deployment

- Vercel
- GitHub
- Environment variables

### Architecture Principle

**AI handles unstructured understanding; deterministic application logic handles authorization, routing rules, lifecycle transitions and analytics.**

---

# 30. Security Requirements

- Use Supabase Auth.
- Use Supabase RLS.
- Students access only their own issues.
- Staff access only permitted department/assigned issues.
- Admins access only their college.
- Enforce role-sensitive actions server-side.
- Never expose Gemini API keys.
- Never expose Supabase service-role keys.
- Validate image MIME types and sizes.
- Validate AI JSON before storage.
- Treat AI output as untrusted input.
- Log important workflow actions.

---

# 31. Failure Handling

### AI request fails
Show retry/fallback.

### Image upload fails
Show a retryable error.

### Malformed AI response
Reject through schema validation.

### Duplicate service fails
Allow ticket creation and record that matching was unavailable.

### Network issue
Keep the core workflow usable where possible.

### Fallback honesty

If demo fallback data is used, do not represent it as live AI analysis.

---

# 32. Seed Data

Create approximately **50–100 realistic issues** across:

- Multiple buildings
- Multiple rooms
- Multiple categories
- Multiple departments
- Different statuses
- Different severities
- Different dates

Include repeated issues so the demo can show:

- Duplicate detection
- Hotspots
- Recurring issues
- Analytics
- Department workload

---

# 33. UI/UX Requirements

Design style:

- Modern campus SaaS
- Professional
- Clean
- Responsive
- Minimal

Suggested visual system:

- Blue/indigo primary
- Green for resolved/low
- Amber for medium/in-progress
- Red for high/critical
- Gray for inactive/new

Use Tailwind, shadcn/ui and Lucide.

Avoid excessive gradients, animation, 3D, clutter and unnecessary dark mode.

---

# 34. Loading, Error and Empty States

Every important asynchronous operation needs:

### Loading
Skeleton/spinner/disabled controls.

### Error
Explain what failed and what the user can do.

### Empty
Example:

> No issues found. Your campus is looking good!

Never leave blank screens.

---

# 35. 36-Hour Implementation Plan

| Time | Phase | Deliverables |
|---|---|---|
| 0–3h | Foundation | Repo, Next.js, Supabase, schema, auth, RLS, demo users |
| 3–8h | Student UI | Dashboard, report page, image upload, location, ticket UI |
| 8–14h | AI | Gemini route, structured output, classification, errors, fallback |
| 14–20h | Staff/Admin | Dashboards, details, status, resolution, admin table |
| 20–25h | Killer feature | Duplicate detection and user decision flow |
| 25–29h | Intelligence | Analytics, hotspots, recurring issues |
| 29–32h | Polish | Responsive UI, states, seed data |
| 32–34h | Testing | RLS, uploads, AI failures, duplicate flow, permissions |
| 34–36h | Presentation | Demo, PPT, pitch, Q&A, backups |

### Build Discipline

- Do not add unrelated features near the end.
- Prioritize an end-to-end workflow.
- Freeze features before presentation preparation.
- Keep backup deployment, demo accounts and screenshots/video.

---

# 36. Two-Minute Demo Script

1. Open student dashboard.
2. Student notices broken fan.
3. Click Report Issue.
4. Upload photo.
5. Select Block B / Room 204.
6. AI suggests:
   - Broken Ceiling Fan
   - Electrical
   - Medium
   - Maintenance
7. Student reviews.
8. Duplicate engine finds an existing similar issue.
9. Show match score and reasons.
10. Create/follow ticket.
11. Staff opens the ticket.
12. Staff starts work.
13. Staff uploads resolution photo.
14. Admin verifies.
15. Issue closes.
16. Open analytics.
17. Show Block B hotspot / Room 204 recurring issue.

### Closing Line

> **“CampusFix doesn’t just collect complaints. It transforms complaints into structured workflows and campus intelligence.”**

---

# 37. Judge Q&A

### Why AI?

AI reduces manual effort when converting an image and short description into structured issue information. Deterministic logic still controls workflow and security.

### How is CampusFix different from Google Forms?

CampusFix does not stop at collection. It analyzes, routes, detects potential duplicates, tracks resolution, requires evidence and produces operational insights.

### What if AI is wrong?

AI suggestions are editable and validated. Human/admin review remains part of the workflow.

### What if 100 students report the same issue?

The matching engine compares location, category, semantic similarity and time, then surfaces potential duplicates.

### How does it scale?

The data model uses `college_id`, with configurable departments, locations and workflows.

### Why web instead of mobile?

Responsive web reduces development overhead and maximizes access during the hackathon. The same backend can support mobile later.

---

# 38. Suggested 8-Slide Presentation

## Slide 1 — CampusFix

Title, tagline and team.

## Slide 2 — Problem

Fragmented campus complaint workflow.

## Slide 3 — Solution

```text
Report
 ↓
AI Understands
 ↓
Duplicate Check
 ↓
Route
 ↓
Resolve
 ↓
Verify
 ↓
Analyze
```

## Slide 4 — Innovation

- AI issue understanding
- Context-aware duplicate detection
- Intelligent routing
- Campus intelligence

## Slide 5 — Architecture

```text
Student / Staff / Admin
          ↓
       Next.js
          ↓
    Server/API Routes
       ↙        ↘
 Supabase       Gemini
       ↓
 PostgreSQL + Storage
          ↓
       Analytics
```

## Slide 6 — Impact & Scalability

- Faster reporting
- Better routing
- Fewer duplicate tickets
- Better accountability
- Recurring issue visibility
- Multi-college architecture

## Slide 7 — Technology

- Next.js
- TypeScript
- Supabase
- Gemini
- Tailwind
- shadcn/ui
- Vercel
- GitHub

## Slide 8 — Live Demo / Future Vision

Show the complete workflow.

---

# 39. Future Roadmap

Possible post-hackathon features:

- Mobile applications
- Push/email notifications
- SLA tracking
- Escalation workflows
- Asset management
- Maintenance forecasting
- AI-assisted resolution verification
- Campus ERP integration
- Institution-wide dashboards
- Privacy-safe cross-campus benchmarking

---

# 40. Definition of Done

- [ ] Student can authenticate.
- [ ] Student can report an issue.
- [ ] Student can upload an image.
- [ ] Student can select location.
- [ ] AI analysis works or a clearly labeled fallback exists.
- [ ] AI output is editable.
- [ ] Potential duplicates are detected.
- [ ] Ticket is created.
- [ ] Staff can see assigned work.
- [ ] Staff can update status.
- [ ] Staff can submit resolution evidence.
- [ ] Admin can verify resolution.
- [ ] Admin can close an issue.
- [ ] Analytics show meaningful data.
- [ ] Seed data exists.
- [ ] RLS is tested.
- [ ] Role permissions are tested.
- [ ] Secrets are protected.
- [ ] Application is deployed.
- [ ] Complete demo works without manual database intervention.

---

# 41. Engineering Priorities

When time is limited:

## Priority 1 — Must Work

1. Authentication
2. Student report
3. Image upload
4. AI analysis
5. Ticket creation
6. Staff workflow
7. Admin verification
8. Database/RLS

## Priority 2 — High Value

9. Duplicate detection
10. Analytics
11. Seed data
12. Responsive UI

## Priority 3 — Optional

13. AI-generated analytics explanations
14. Advanced animations
15. Notifications
16. Additional configuration screens

Never sacrifice the core end-to-end workflow for optional features.

---

# 42. Product Principles

1. **AI assists; humans remain accountable.**
2. **Security is deterministic.**
3. **Never silently merge user reports.**
4. **Every issue has a clear lifecycle.**
5. **Analytics should be traceable to stored data.**
6. **Build the smallest reliable version first.**
7. **A working end-to-end demo is more valuable than unfinished advanced features.**

---

# 43. Final Product Definition

CampusFix is a campus operations platform that transforms everyday complaints into:

> **Structured tickets → intelligent routing → accountable resolution → campus intelligence**

Core loop:

```text
Student
   ↓
Photo + Location
   ↓
AI Understanding
   ↓
Duplicate Detection
   ↓
Ticket
   ↓
Staff
   ↓
Resolution Evidence
   ↓
Admin Verification
   ↓
Closed Issue
   ↓
Analytics
   ↓
Campus Intelligence
```

This document is the product source of truth for implementation. Changes to scope should be deliberate and should not compromise the core end-to-end workflow.
