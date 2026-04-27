---
phase: 03-mobile-polish-export
plan: 01
subsystem: pwa
tags: [pwa, vite-plugin-pwa, workbox, service-worker, manifest, icons, github-pages]

# Dependency graph
requires:
  - phase: 01-core-entry-sync
    provides: Vite base /GSD/ config and GitHub Pages deployment setup
provides:
  - PWA manifest with correct scope /GSD/ and start_url /GSD/ for GitHub Pages installability
  - All required icon sizes in public/ (64, 192, 512px PNG, maskable 512px, apple-touch 180px)
  - Workbox service worker with NetworkFirst GAS API caching and CacheFirst Google Fonts
affects: [04-ynab-budget-allocation, deploy, pwa-installability]

# Tech tracking
tech-stack:
  added: ["@vite-pwa/assets-generator (dev dep)"]
  patterns: ["Separate maskable icon entry in manifest (not combined with purpose: any)", "NetworkFirst for mutable API responses, CacheFirst for immutable fonts"]

key-files:
  created:
    - finance-tracker/public/logo.svg
    - finance-tracker/public/pwa-64x64.png
    - finance-tracker/public/pwa-192x192.png
    - finance-tracker/public/pwa-512x512.png
    - finance-tracker/public/maskable-icon-512x512.png
    - finance-tracker/public/apple-touch-icon.png
  modified:
    - finance-tracker/vite.config.ts

key-decisions:
  - "scope and start_url set to '/GSD/' not '/' — required for GitHub Pages sub-path deployment"
  - "Maskable icon uses a dedicated manifest entry with purpose: maskable (not combined with any)"
  - "Icons generated via custom Node.js script using sharp directly due to pwa-assets-generator sharp Windows native module loading issue"

patterns-established:
  - "PWA manifest: always match scope and start_url to Vite base path"
  - "Workbox runtimeCaching: NetworkFirst for GAS API (24h TTL), CacheFirst for fonts (1yr TTL)"

requirements-completed: [PWA-02, PWA-03]

# Metrics
duration: 15min
completed: 2026-04-19
---

# Phase 03 Plan 01: PWA Installability & Workbox Caching Summary

**VitePWA config fixed for GitHub Pages sub-path with correct scope/start_url '/GSD/', all required icon sizes generated, and Workbox NetworkFirst caching added for GAS API**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-19T10:38:55Z
- **Completed:** 2026-04-19T10:53:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created public/logo.svg (Vietnamese Dong symbol on green rounded square) and generated all 5 required PWA icon sizes
- Fixed PWA manifest scope and start_url from '/' to '/GSD/' — the root cause of Chrome installability failure on GitHub Pages
- Added Workbox runtime caching: NetworkFirst for GAS API (24h TTL, 50 entries), CacheFirst for Google Fonts (1yr TTL)
- `npm run build` exits 0, dist/sw.js generated, manifest.webmanifest verified correct

## Task Commits

Each task was committed atomically:

1. **Task 1: Create logo.svg and generate PWA icon assets** - `a7c8008` (feat)
2. **Task 2: Fix vite.config.ts — correct PWA scope, icons, and add Workbox caching** - `2fe4e5f` (feat)

## Files Created/Modified
- `finance-tracker/public/logo.svg` - App icon source: Vietnamese Dong symbol on green rounded square (512x512 viewBox)
- `finance-tracker/public/pwa-64x64.png` - 64x64 PNG for browser tab / small contexts
- `finance-tracker/public/pwa-192x192.png` - 192x192 PNG for manifest (purpose: any)
- `finance-tracker/public/pwa-512x512.png` - 512x512 PNG for manifest (purpose: any)
- `finance-tracker/public/maskable-icon-512x512.png` - 512x512 PNG for Android adaptive icons (purpose: maskable)
- `finance-tracker/public/apple-touch-icon.png` - 180x180 PNG for iOS home screen
- `finance-tracker/vite.config.ts` - Fixed scope/start_url, added icon entries with purpose fields, added Workbox runtimeCaching

## Decisions Made
- Icons generated via custom Node.js script (`generate-icons.cjs`, removed after use) that requires sharp directly from local node_modules — `pwa-assets-generator` CLI failed because it resolved a different sharp instance with a Windows DLL loading error
- Kept `@vite-pwa/assets-generator` as a dev dependency (it pulled in the working sharp version), but do not rely on its CLI for icon generation on Windows

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] sharp Windows native module DLL loading failure in pwa-assets-generator CLI**
- **Found during:** Task 1 (icon generation step)
- **Issue:** `npx pwa-assets-generator --preset minimal2023 public/logo.svg` failed with `ERR_DLOPEN_FAILED` on `sharp-win32-x64.node`. The CLI loaded a different sharp instance than the one that worked after `npm install --include=optional sharp`.
- **Fix:** Wrote a temporary `generate-icons.cjs` script that required sharp directly from `./node_modules/sharp` (which was functional) and generated all 5 icon sizes manually. Script was deleted after use.
- **Files modified:** package.json (added @vite-pwa/assets-generator), public/*.png (generated), generate-icons.cjs (temp, deleted)
- **Verification:** All 5 PNG files present in public/, sizes confirmed via `file` command
- **Committed in:** a7c8008 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required workaround for Windows-specific sharp native binary issue. All icon files generated correctly. No scope creep.

## Issues Encountered
- `@vite-pwa/assets-generator` CLI uses sharp internally but resolves a different module instance on Windows, triggering a native DLL load failure even after `npm install --os=win32 --cpu=x64 sharp`. Fixed by using sharp directly in a custom script.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PWA manifest is now correctly configured for GitHub Pages installability — Chrome on Android should show "Add to Home Screen" prompt
- Workbox service worker precaches app shell and caches GAS API responses with NetworkFirst strategy
- iOS users can install via Safari share sheet (apple-touch-icon.png provided)
- Ready for Phase 03 Plan 02 (remaining mobile polish / export tasks)

---
*Phase: 03-mobile-polish-export*
*Completed: 2026-04-19*
