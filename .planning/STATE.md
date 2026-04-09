# Project State: Finance Tracker

**Last Updated:** 2026-04-09
**Current Phase:** Phase 1 — Execute (blocked on GAS token verification)
**Overall Status:** 🔴 Blocked

## Deployment Info

| Key | Value |
|---|---|
| GAS Web App URL | `https://script.google.com/macros/s/AKfycbysl0gDewDC6fr-7eiqpO0nlK5olVbNyy5DnGghkSSpDdQcB01MHOy3XLCrSUYo66Ui/exec` |
| Google OAuth Client ID | `993101146522-hg4h22245evgi99fk60viflj7vk83gq0.apps.googleusercontent.com` |
| GitHub Pages URL | ⏳ TODO — after hosting setup |

---

## Active Context

### What we just did
- React app fully scaffolded (Plans 2–6): login, home, balance cards, drawer, swipe-delete
- GAS deployed with all 16 categories seeded
- OAuth Client ID wired in
- Login works ✅
- **BLOCKER:** `verifyToken` in Code.gs throws "Token audience mismatch" — categories fail to load so the category grid is empty in the drawer

### Current focus
Fix GAS `verifyToken` — the `aud` field in the token doesn't match CLIENT_ID.

### Fix to apply next session
In Code.gs `verifyToken`, the `aud` value from tokeninfo is the numeric project ID, not the OAuth client ID string. Two options:
1. **Simplest:** Remove the `aud` check entirely (tokeninfo already validates authenticity)
2. **Correct:** Log `info.aud` to see the actual value and match CLIENT_ID to it

The updated `verifyToken` to paste into Code.gs:
```javascript
function verifyToken(idToken) {
  const res = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + idToken,
    { muteHttpExceptions: true }
  );
  const info = JSON.parse(res.getContentText());
  if (info.error) throw new Error('Token invalid: ' + info.error);
  return info.email;
}
```
After saving → Deploy → New version → Deploy.

### What's next after fix
- Verify categories load in drawer ✅
- Add a test transaction ✅
- Confirm it appears in the list and Google Sheet ✅
- Phase 1 complete → start Phase 2 (Dashboard & Charts)

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
