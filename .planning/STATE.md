---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 04
status: unknown
last_updated: "2026-04-19T05:37:26.541Z"
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 4
  completed_plans: 5
  percent: 67
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: Phase 1 — Verify remaining features, then start Phase 2
status: unknown
last_updated: "2026-04-18T17:43:53.136Z"
progress:
  [███████░░░] 67%
  completed_phases: 0
  total_plans: 0
  completed_plans: 1
---

# Project State: Finance Tracker

**Last Updated:** 2026-04-10 (end of day)
**Current Phase:** 04
**Overall Status:** 🟡 Phase 1 functionally complete, pending final verification tomorrow

## Deployment Info

| Key | Value |
|---|---|
| GAS Web App URL | `https://script.google.com/macros/s/AKfycbxGdYKi_QY54tA8yZXOW1_XyBhv4NUa9ppQIzERUCYH_wbr-Y4EWII1aekUA9_6VwtI/exec` |
| Google OAuth Client ID | `993101146522-rn89slm3464o5d60qrq1hj5spf264vh8.apps.googleusercontent.com` (Web client 2) |
| GitHub Pages URL | ✅ LIVE — `https://trongld230289.github.io/GSD/` |
| GitHub Repo | `https://github.com/trongld230289/GSD` |
| Vite base | `/GSD/` |
| BrowserRouter basename | `/GSD` |

---

## Active Context

### What we completed today
- Fixed GAS token audience mismatch ✅
- Fixed `getCategories` bypassing token check ✅
- Created new GAS deployment (new URL) to bust cache ✅
- Fixed `addTransaction` — frontend now wraps tx in `{ data: tx }` ✅
- Fixed `getTransactions` — splits `YYYY-MM` into `month=MM&year=YYYY` ✅
- First transaction saved end-to-end ✅
- GitHub Actions deploy workflow created ✅
- App deployed to GitHub Pages ✅
- App confirmed working on iPhone ✅
- New OAuth client (Web client 2) created with `https://trongld230289.github.io` as authorized origin ✅
- Updated `LoginPage.tsx` with new OAuth Client ID ✅

### What to do FIRST tomorrow (before Phase 2)
Run these 3 verification tests on the live iPhone app (`https://trongld230289.github.io/GSD/`):

1. **Swipe to delete** — swipe left on a transaction → red Delete button appears → tap → confirm → gone
2. **Edit** — tap a transaction row → drawer opens pre-filled with existing values → change something → Save → updated in list
3. **Month nav** — tap ‹ → March 2026 (empty) → tap › → back to April 2026 with transactions

If any test fails, fix it before starting Phase 2.

### Phase 2 scope (after verification)
- Pie/donut chart of spending by category (Recharts)
- 6-month income vs expense bar chart
- New `/dashboard` route accessible from header/nav

---

## Phase Status

| Phase | Status | Started | Completed |
|---|---|---|---|
| Phase 1: Core Entry & Sync | � Verify | 2026-04-10 | Pending final test |
| Phase 2: Dashboard & Analytics | 🔲 Pending | — | — |
| Phase 3: Mobile Polish & Export | 🔲 Pending | — | — |

---

## Key Context for Execution

### Tech Stack (locked)
- **Frontend:** React 18 + Vite 5 + TypeScript + Tailwind CSS + Zustand + React Router v6
- **Charts:** Recharts 2.x
- **PWA:** vite-plugin-pwa (Workbox)
- **Auth:** Google Identity Services (GSI) — One Tap + button fallback
- **Backend:** Google Apps Script Web App (REST API)
- **Database:** Google Sheets (Transactions + Categories sheets)
- **Hosting:** GitHub Pages + GitHub Actions

### Critical reminders (from research)
1. Use `Content-Type: text/plain;charset=utf-8` for all POST requests to GAS to avoid CORS preflight
2. Define `formatVND()` utility before any UI work
3. GAS: fetch only current month's rows (never all rows at once)
4. Test GAS API with curl/Postman before integrating React
5. Google OAuth token expires in 1 hour — build refresh logic in Phase 1

### Roadmap Evolution
- Phase 4 added: YNAB Budget Allocation (give every dollar a job — Available/Budgeted/Spent per category, overspend pulls from other categories)

### Decisions made
- Google Sheets as database (user chose this over Firebase/Supabase)
- VND only for v1
- Tracking-only (no budget limits) for v1
- Interactive mode (user approves each phase plan)
- Coarse granularity (3 phases)

---
- [Phase 04-ynab-budget-allocation]: useBudgetStore omits persist middleware — budget data always fresh-loaded from GAS on mount
- [Phase 04-ynab-budget-allocation]: BudgetRow is a computed UI-only type, not stored in Zustand — cross-references categories and transactions in UI layer
- [Phase 04-ynab-budget-allocation]: Budgets stored in separate sheet tab (month|category_id|budgeted), no user_email column, Available computed client-side
- [Phase 04-ynab-budget-allocation]: BottomNav Budget tab uses money-bag emoji, consistent with existing emoji pattern
- [Phase 04-ynab-budget-allocation]: computeBudgetRows defined inside BudgetPage.tsx (not exported utility) to keep UI logic co-located
- [Phase 04-ynab-budget-allocation]: BottomNav Budget tab uses money-bag emoji (consistent with existing emoji pattern)
- [Phase 04-ynab-budget-allocation]: computeBudgetRows defined inside BudgetPage.tsx (not exported utility) to keep UI logic co-located
- [Phase 04-ynab-budget-allocation]: BudgetPage loads transactions independently if txCache is empty (direct /budget navigation works without white screen)
- [Phase 01-core-entry-sync]: GAS URL hardcoded in gas.ts instead of env var — single-user app, simplifies GitHub Pages deployment
- [Phase 01-core-entry-sync]: Single useStore.ts with three named Zustand stores instead of separate store files
- [Phase 01-core-entry-sync]: IDs generated server-side by GAS — omitted client-side utils/id.ts

## Requirements Progress

| Category | Total | Complete | In Progress | Pending |
|---|---|---|---|---|
| AUTH | 4 | 0 | 0 | 4 |
| TRANS | 12 | 0 | 0 | 12 |
| CAT | 3 | 0 | 0 | 3 |
| DASH | 5 | 0 | 0 | 5 |
| REPORT | 3 | 0 | 0 | 3 |
| EXPORT | 3 | 0 | 0 | 3 |
| PWA | 3 | 0 | 0 | 3 |
| **Total** | **34** | **0** | **0** | **34** |

---

## Open Questions / Decisions Pending

| Question | Context | When to resolve |
|---|---|---|
| Which specific GAS deployment URL? | Created during Phase 1 setup | Phase 1, Plan 1 |
| GitHub repo name / GitHub Pages URL? | Determines app URL | Phase 1, Plan 2 |
| App name / branding? | Display name in PWA manifest | Phase 1 or Phase 3 |

---
*State initialized: 2026-04-07*
