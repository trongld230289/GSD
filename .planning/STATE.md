# Project State: Finance Tracker

**Last Updated:** 2026-04-09
**Current Phase:** Phase 1 — Executing Plan 2 (React Scaffold)
**Overall Status:** 🟢 In Progress

## Deployment Info

| Key | Value |
|---|---|
| GAS Web App URL | `https://script.google.com/macros/s/AKfycbysl0gDewDC6fr-7eiqpO0nlK5olVbNyy5DnGghkSSpDdQcB01MHOy3XLCrSUYo66Ui/exec` |
| Google OAuth Client ID | `993101146522-hg4h22245evgi99fk60viflj7vk83gq0.apps.googleusercontent.com` |
| GitHub Pages URL | ⏳ TODO — after hosting setup |

---

## Active Context

### What we just did
- Initialized new project via `gsd-new-project`
- Gathered requirements through user questioning
- Completed domain research (STACK, FEATURES, ARCHITECTURE, PITFALLS, SUMMARY)
- Defined 34 v1 requirements across 7 categories
- Created 3-phase roadmap

### Current focus
**Ready to start Phase 1:** Core Entry & Sync

### What's next
Run `/gsd-plan-phase 1` to generate the detailed execution plan for Phase 1.

---

## Phase Status

| Phase | Status | Started | Completed |
|---|---|---|---|
| Phase 1: Core Entry & Sync | 🔲 Pending | — | — |
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

### Decisions made
- Google Sheets as database (user chose this over Firebase/Supabase)
- VND only for v1
- Tracking-only (no budget limits) for v1
- Interactive mode (user approves each phase plan)
- Coarse granularity (3 phases)

---

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
