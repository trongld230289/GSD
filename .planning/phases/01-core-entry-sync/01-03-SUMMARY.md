---
phase: 01-core-entry-sync
plan: 03
subsystem: auth
tags: [google-oauth, gsi, zustand, react, typescript, jwt, token-refresh]

requires:
  - phase: 01-core-entry-sync/01-02
    provides: useAuthStore (persist), LoginPage shell, App.tsx auth-guard pattern, GSI script in index.html

provides:
  - finance-tracker/src/pages/LoginPage.tsx: GSI One Tap + button fallback, sets tokenExpiry on sign-in
  - finance-tracker/src/hooks/useTokenRefresh.ts: schedules silent GSI prompt 5 min before JWT expiry
  - finance-tracker/src/store/useStore.ts: tokenExpiry field + setToken action in useAuthStore
  - finance-tracker/src/components/Header.tsx: disableAutoSelect() on sign-out, mounts useTokenRefresh

affects:
  - 01-04: idToken from useAuthStore used in API calls
  - 01-05: user object from useAuthStore displayed in transaction list header
  - 01-06: clearUser() sign-out flow used in Header

tech-stack:
  added: []
  patterns:
    - "Token expiry stored in persisted Zustand store (tokenExpiry: epoch ms) — survives page refresh"
    - "useTokenRefresh hook mounted in Header (authenticated context) not App root — avoids scheduling when logged out"
    - "disableAutoSelect() called before clearUser() on sign-out — prevents GSI immediate re-auth"
    - "GSI interval polling (200ms) in LoginPage instead of window load event — more reliable cross-browser"

key-files:
  created:
    - finance-tracker/src/hooks/useTokenRefresh.ts
  modified:
    - finance-tracker/src/pages/LoginPage.tsx
    - finance-tracker/src/store/useStore.ts
    - finance-tracker/src/components/Header.tsx

key-decisions:
  - "No separate AuthProvider component — App.tsx auth-guard + LoginPage GSI init achieves same result with less abstraction"
  - "useTokenRefresh hook in Header (not App) — only runs when authenticated; avoids null tokenExpiry logic"
  - "tokenExpiry = Date.now() + 60min set on sign-in — refresh scheduled for 55min mark (5min buffer)"
  - "setToken action added to AuthStore — allows refresh callback to update token+expiry independently of user profile"

patterns-established:
  - "Auth guard pattern: conditional Navigate in App.tsx routes, no AuthProvider wrapper"
  - "Token refresh: useTokenRefresh hook with setTimeout + window.google.accounts.id.prompt()"

requirements-completed: []

duration: 20min
completed: 2026-04-19
---

# Phase 1 Plan 3: Google Sign-In Flow Summary

**Google GSI One Tap + button fallback with JWT token expiry tracking, 55-minute auto-refresh timer, and disableAutoSelect on sign-out**

## Performance

- **Duration:** 20 min
- **Started:** 2026-04-19T05:39:32Z
- **Completed:** 2026-04-19T06:00:00Z
- **Tasks:** 8 (3.1-3.4 verified as pre-existing, 3.5-3.8 implemented)
- **Files modified:** 4

## Accomplishments
- Google Sign-In implemented with One Tap prompt + rendered button fallback on LoginPage
- `tokenExpiry` field added to persisted `useAuthStore` — refresh scheduling survives page reload
- `useTokenRefresh` hook schedules silent `google.accounts.id.prompt()` 5 minutes before 60-min JWT expiry
- Sign-out calls `disableAutoSelect()` before `clearUser()` — prevents GSI from immediately re-signing user
- Build passes with zero TypeScript errors (3.25s, PWA assets generated)

## Task Commits

Pre-existing tasks (verified against live implementation):

1. **Task 3.1: Create Google OAuth Client ID** — pre-existing (CLIENT_ID hardcoded: `993101146522-rn89...`)
2. **Task 3.2: Add GSI Script to index.html** — pre-existing (`<script src="...gsi/client" async defer>`)
3. **Task 3.3: GSI TypeScript Types** — pre-existing (inline `declare global` in LoginPage.tsx)
4. **Task 3.4: Create LoginPage.tsx** — pre-existing (enhanced with One Tap + interval polling)

New implementation tasks:

5. **Tasks 3.5-3.7: Auth store expiry + refresh hook + sign-out** — `0478f38` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `finance-tracker/src/hooks/useTokenRefresh.ts` — schedules silent refresh 5 min before tokenExpiry
- `finance-tracker/src/store/useStore.ts` — added `tokenExpiry: number | null` and `setToken` action
- `finance-tracker/src/pages/LoginPage.tsx` — calls `setToken()` on sign-in, adds `[Auth]` console.log
- `finance-tracker/src/components/Header.tsx` — mounts `useTokenRefresh()`, calls `disableAutoSelect()` on sign-out

## Decisions Made
- **No AuthProvider component**: The plan called for a separate `AuthProvider.tsx` wrapper. The existing implementation uses direct auth guard in App.tsx routes + LoginPage handling GSI init — equivalent functionality with less nesting. Kept existing pattern.
- **useTokenRefresh in Header, not App root**: Token refresh only makes sense when authenticated. Mounting in Header (which only renders when `user` is non-null) avoids null checks and unnecessary scheduling.
- **setToken action separate from setUser**: Allows the refresh callback to update just the token+expiry without re-setting user profile fields — cleaner separation.

## Deviations from Plan

### Structural Differences (implementation diverged from plan)

**1. [Rule 1 - Architecture] No AuthProvider.tsx component**
- **Plan specified:** `src/components/auth/AuthProvider.tsx` wrapping all children, handling GSI init, refresh timer
- **Actual:** Auth guard in App.tsx routes + LoginPage handles GSI init + `useTokenRefresh` hook in Header
- **Rationale:** Existing pattern already functional and tested in production. AuthProvider would add unnecessary nesting.
- **Impact:** None — same auth behavior, cleaner component tree

**2. [Rule 2 - Enhancement] tokenExpiry added to auth store**
- **Plan specified:** Local `refreshTimer` variable in AuthProvider (lost on unmount)
- **Actual:** `tokenExpiry` persisted in Zustand store — survives page refresh
- **Rationale:** localStorage persistence means refresh timer is correctly scheduled even after browser reload
- **Impact:** Positive — more robust than in-memory timer

---

**Total deviations:** 2 structural (both improvements over plan)
**Impact on plan:** All success criteria met. Token refresh and sign-out behavior match spec.

## Issues Encountered
None — build passes, TypeScript clean.

## User Setup Required
None — Google OAuth Client ID is hardcoded in LoginPage.tsx. OAuth consent screen and credentials were set up during earlier development session (documented in STATE.md).

## Next Phase Readiness
- `useAuthStore().idToken` available for API calls in Plan 4 (Add Transaction)
- `useAuthStore().user` available for display in header/settings
- Token auto-refresh scheduled on every authenticated page load
- Sign-out correctly prevents GSI auto re-sign

---
*Phase: 01-core-entry-sync*
*Completed: 2026-04-19*
