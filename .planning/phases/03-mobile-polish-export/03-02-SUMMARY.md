---
phase: 03-mobile-polish-export
plan: 02
subsystem: ui
tags: [pwa, ios, safe-area, viewport, react, tailwind]

requires:
  - phase: 03-mobile-polish-export-01
    provides: PWA manifest, icons, and vite-plugin-pwa config required for installability

provides:
  - viewport-fit=cover meta tag enabling env(safe-area-inset-bottom) on iOS
  - BottomNav safe-area padding preventing home indicator overlap
  - Removed user-scalable=no (WCAG 1.4.4 compliance)
  - black-translucent iOS status bar overlay mode

affects:
  - 03-mobile-polish-export (all subsequent mobile QA plans)

tech-stack:
  added: []
  patterns:
    - "iOS safe-area: viewport-fit=cover + env(safe-area-inset-bottom) inline style on fixed bottom nav"

key-files:
  created: []
  modified:
    - finance-tracker/index.html
    - finance-tracker/src/components/BottomNav.tsx

key-decisions:
  - "Used inline style paddingBottom: env(safe-area-inset-bottom) on nav element rather than .safe-pb CSS class — avoids Tailwind purge concern and is explicit"
  - "status-bar-style set to black-translucent (not default) — required companion to viewport-fit=cover for correct overlay behaviour"

patterns-established:
  - "Safe-area pattern: always pair viewport-fit=cover in HTML meta with env(safe-area-inset-bottom) on the fixed bottom element"

requirements-completed: [PWA-01]

duration: 5min
completed: 2026-04-19
---

# Phase 03 Plan 02: iPhone Safe Area Fix Summary

**viewport-fit=cover + env(safe-area-inset-bottom) on BottomNav eliminates home-indicator overlap on Face ID iPhones**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-19T00:00:00Z
- **Completed:** 2026-04-19T00:05:00Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Fixed viewport meta: replaced `user-scalable=no` with `viewport-fit=cover`, enabling iOS to expose `env(safe-area-inset-bottom)` in CSS
- Changed `apple-mobile-web-app-status-bar-style` from `default` to `black-translucent` so the iOS status bar overlays the green header correctly
- Added `style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}` to the BottomNav `<nav>` element — the tab bar now sits above the home indicator on all iPhones
- Build clean: `npm run build` exits 0, 5.66s, no TypeScript errors

## Task Commits

1. **Task 1: Fix viewport meta and BottomNav safe-area padding** - `0205339` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `finance-tracker/index.html` — viewport meta updated (`viewport-fit=cover`, removed `user-scalable=no`); status-bar-style changed to `black-translucent`
- `finance-tracker/src/components/BottomNav.tsx` — nav element gains `style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}`

## Decisions Made

- Used inline style rather than the pre-existing `.safe-pb` CSS class — avoids any Tailwind purge risk and makes the intent explicit in JSX.
- `black-translucent` status bar style is the required companion to `viewport-fit=cover`; `default` causes the viewport to be pushed down, negating the cover effect.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Human Verification Required

Physical iPhone verification is required to confirm the fix is visible:

1. Install the app as a PWA (Add to Home Screen) on an iPhone with Face ID or a home indicator.
2. Open the app and navigate to the Home tab.
3. Verify the tab bar labels (Home / Budget / Reports) are fully visible and NOT obscured by the home indicator swipe bar at the bottom.
4. On the iOS status bar: verify it overlays the green header in translucent mode (no white bar pushing content down).

This cannot be verified in a desktop browser — the iOS simulator or a physical device is required.

## Next Phase Readiness

- Safe-area fix is complete and build is clean.
- PWA-01 requirement met (app fully usable on mobile — no home indicator overlap).
- Ready for Plan 03 (CSV export) and Plan 04 (pull-to-refresh).

---
*Phase: 03-mobile-polish-export*
*Completed: 2026-04-19*
