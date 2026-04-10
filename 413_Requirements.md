# IS 413 Requirements Review — INTEX II (Lucera / Lighthouse)

This document maps the **IS 413 – Enterprise Application Development** assignment text and rubric to what is **implemented in this repository**. It is based on static analysis of the codebase (routes, pages, controllers, models) and **`npm run build`** / **`dotnet build`**.

The team did not maintain a written checklist; this file is the independent audit.

**Last re-verification:** 2026-04-09 (after pulling latest **`main`**).

---

## Re-verification summary (post–`main` merge)

These are the items that were previously **partial**, **unverified in-repo**, or **at risk**.

| Check | Command / method | Result |
|-------|-------------------|--------|
| Frontend compiles | `npm install && npm run build` in `frontend/` | **Pass** — `tsc -b` and Vite production build succeed. |
| Backend compiles | `dotnet build` in `backend/INTEX_II/INTEX_II/` | **Pass** — 0 errors (NU1900 vulnerability-cache warnings may appear locally; not compile failures). |
| Case conferences (spec) | Grep + read `HomeVisitationCaseConference.tsx`, backend controllers | **Still partial** — page title says “Visitations & Conferences,” but **no case-conference list/forms** and **no `InterventionPlan`/conference API** for staff (only `InterventionPlans` counts in `ReportsAnalyticsController`). The old static `CASE_CONFERENCES` demo array is **gone** from this page on `main`. |
| Social Media Composer routed | `App.tsx` routes | **Still partial** — `SocialMediaComposer.tsx` exists; **no `<Route>`** imports it. |
| ReadMe deployment docs | `ReadMe.md` after `## Deployment` | **Still empty** — team uses Azure Web App + Supabase (per prior note); worth writing down for judges. |
| Admin sidebar → User management | `AdminSidebar.tsx` `NAV_ITEMS` | **Still omitted** — `/admin-user-management` exists in `App.tsx` but not in the main admin nav list. |
| Process recording sort order | `ProcessRecordingController.GetRecordings` | **Unchanged** — still **`OrderByDescending(SessionDate)`** (newest first); syllabus wording “chronologically” may mean oldest-first. |
| ESLint / “code quality” | `npm run lint` | **Fails** — many `prettier/prettier` warnings repo-wide; **`CookieBanner.tsx`** has a **`react-hooks/set-state-in-effect` error**. Does not block `npm run build`, but weakens the “polish / quality” story if graders run lint. |

---

## Team clarifications (follow-up)

| Topic | Your answer |
|-------|-------------|
| Checklist | No summarized checklist (tracked mentally). |
| Deployment | **Azure Web App** for the app/API and **Supabase** for the database — **hosted separately**, satisfying the syllabus expectation. |
| IS 414 | No separate IS 414 specification to cross-check; **PrivacyPolicy** + **CookieBanner** are judged on their own merits. |

---

## Executive summary

**Substance vs. delivery:** The project **covers almost all functional areas** the syllabus describes: .NET 10 Web API, PostgreSQL via EF Core (compatible with Supabase Postgres), React + TypeScript (Vite), public impact endpoints, donor flows (including fake donations persisted to the database), and a broad admin portal (residents, donors/contributions, counseling notes, visit logging, reports). The **data model** for Philippine-style case fields (sub-categories, 4Ps/solo parent/indigenous/informal settler flags, disability, referral, social worker, reintegration) is **well aligned** with the caseload requirement.

**Build status (current `main`):** **`npm install` + `npm run build`** (frontend) and **`dotnet build`** (backend) **both succeed** on re-run.

**Remaining functional nuance — case conferences:** The syllabus asks for **case conference history and upcoming conferences for each resident**. On current `main`, the visitation screen is **visit-centric** (API-backed scheduling, logging, history). **`intervention_plans` / `CaseConferenceDate`** exist in the database and feed **analytics**, but there is **no staff UI or REST surface** comparable to visits for per-resident conferences. The earlier static conference cards are **not** present anymore—only the **page heading** still mentions conferences.

**Deployment:** Confirmed by the team (**Azure Web App** + **Supabase**). The repo **`ReadMe.md` → Deployment** section is still **blank**; adding a short paragraph would help judges.

---

## Tech stack (syllabus checklist)

| Requirement | Evidence in repo |
|-------------|------------------|
| .NET 10 / C# backend | `backend/INTEX_II/INTEX_II/INTEX_II.csproj` → `TargetFramework` **net10.0** |
| React / TypeScript (Vite) frontend | `frontend/` (Vite + TS) |
| Relational database | **PostgreSQL** + Npgsql; production may use **Supabase** (Postgres) per team |
| Security / identity | ASP.NET Core **Identity** + JWT (`AuthController`) — typically same DB as app data (syllabus allows optional separate security DB) |
| Deployed app + DB separately | **Team-confirmed:** Azure Web App + Supabase |

---

## Page-by-page: assignment narrative

### Public (non-authenticated)

| Requirement | Status | Notes |
|-------------|--------|--------|
| Home / landing — mission, professional, CTAs | **Met** | `frontend/src/pages/Home.tsx` and supporting sections (`Hero`, `CTASection`, etc.) |
| Impact / donor-facing dashboard — aggregated, anonymized | **Mostly met** | Public route `/impact` → `Impact.tsx`; stats from `/api/impact/*` (`ImpactController` — no `[Authorize]`). **`/api/impact/resident-origins`** exposes **city + count**. |
| Login — username + password, validation, errors | **Mostly met** | **Email + password** in practice (`UserName` = email). |
| Privacy policy + cookie consent | **Met** | `/privacy-policy`, `CookieBanner.tsx`, `Program.cs` cookie policy. |

### Donor (authenticated)

| Requirement | Status | Notes |
|-------------|--------|--------|
| Donor dashboard — history + fake donation | **Met** | `donor/Dashboard.tsx`, `GivingPage.tsx`; `DonorDashboardController`. |

### Admin / staff

| Requirement | Status | Notes |
|-------------|--------|--------|
| Admin dashboard — operational overview | **Met** | `admin/Dashboard.tsx` + `AdminDashboardController` |
| Donors & Contributions | **Met** | `admin/DonorsContributions.tsx` + `SupportersController` |
| Caseload inventory | **Met** | `Resident` model + `CaseloadInventory.tsx` + `ResidentController` |
| Process recording | **Mostly met** | **`OrderByDescending(SessionDate)`** in API |
| Home visitation & case conferences | **Partial** | **Visits:** strong. **Conferences:** heading only; **no** dedicated data/UI/API. |
| Reports & Analytics | **Met** | `admin/ReportsAnalytics.tsx` + `ReportsAnalyticsController` |

### Misc — additional pages

| Requirement | Status | Notes |
|-------------|--------|--------|
| Extra pages | **Partial** | Register, OAuth callback, Donor shoutout, User management **routed**. **SocialMediaComposer** still **unrouted**. |

---

## Rubric mapping (20-point table)

Qualitative assessment based on **repository + team confirmation**, not an official grade.

| # | Criterion | Weight | Assessment |
|---|-----------|--------|------------|
| 1 | App compiles and runs without errors | 1 | **High** — frontend + backend builds pass (2026-04-09). |
| 2 | Modern UI, branding, navigation | 1 | **High**; **User Management** absent from `AdminSidebar` nav. |
| 3 | Landing page + CTAs | 1 | **High** |
| 4 | Login + validation + errors | 1 | **High** (email-based) |
| 5 | Privacy policy + cookie consent visible | 1 | **High** |
| 6 | Public impact dashboard | 2 | **High** |
| 7 | Donor dashboard — history + fake donation | 1 | **High** |
| 8 | Admin operational dashboard | 2 | **High** |
| 9 | Donors & Contributions | 2 | **High** |
| 10 | Caseload — CRUD + search/filter | 1 | **High** |
| 11 | Process recording | 1 | **High** (minor sort-order wording) |
| 12 | Home visitation & case conferences | 1 | **Medium** — visits **strong**; conferences **not implemented** beyond title |
| 13 | Reports & analytics | 1 | **High** |
| 14 | ≥1 additional usable case feature | 2 | **High** |
| 15 | Database deployed separately from app | 1 | **High** — **team-confirmed:** Azure Web App + Supabase |
| 16 | Validation, error handling, code quality | 0 | **Medium** — backend validation present in places; **`npm run lint`** currently **fails** (Prettier noise + CookieBanner hooks rule) |
| — | **Bonus** — advanced React/.NET | +1 | **Possible** |

---

## Verdict vs. “we completed everything”

**Broadly yes** for IS 413: stack, pages, role separation, fake donations, admin workflows, reports, and separate deployment are in place.

**Fine print:**

1. **Case conferences** — largest remaining syllabus gap vs. the written paragraph (not the rubric line alone).
2. **Social Media Composer** — route it or drop the file from scope.
3. **ReadMe deployment** — one paragraph for Azure Web App + Supabase.
4. **Lint** — optional but improves the “quality” row if cleaned up.

---

## Suggested next steps (optional)

1. **Case conferences:** API + UI keyed by `residentId` (e.g. `InterventionPlan` or new entity); or narrow the page title to “Home Visitation” until implemented.
2. **ReadMe:** Fill **Deployment** (no secrets).
3. **Social media:** Add `Route` for `SocialMediaComposer` or remove unused page.
4. **Lint:** Fix `CookieBanner` effect/`setVisible` pattern; run Prettier or relax rules if time-boxed.
