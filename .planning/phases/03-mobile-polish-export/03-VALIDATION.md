---
phase: 3
slug: mobile-polish-export
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-19
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (already in project) + tsc --noEmit |
| **Config file** | finance-tracker/vite.config.ts |
| **Quick run command** | `cd finance-tracker && npx tsc --noEmit` |
| **Full suite command** | `cd finance-tracker && npx tsc --noEmit && npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd finance-tracker && npx tsc --noEmit`
- **After every plan wave:** Run `cd finance-tracker && npx tsc --noEmit && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 03-01-01 | 01 | 1 | PWA-02 | build | `npm run build` (no Workbox errors) | ⬜ pending |
| 03-01-02 | 01 | 1 | PWA-02 | file-check | `ls finance-tracker/public/*.png finance-tracker/public/*.svg` | ⬜ pending |
| 03-02-01 | 02 | 1 | PWA-01 | tsc | `npx tsc --noEmit` | ⬜ pending |
| 03-03-01 | 03 | 1 | PWA-01 | build | `npm run build` | ⬜ pending |
| 03-04-01 | 04 | 1 | EXPORT-01 | tsc | `npx tsc --noEmit` | ⬜ pending |
| 03-04-02 | 04 | 1 | EXPORT-02 | unit | vitest (CSV format test) | ⬜ pending |
| 03-05-01 | 05 | 1 | PWA-02 | ci | `cat .github/workflows/deploy.yml` | ⬜ pending |
| 03-06-01 | 06 | 2 | PWA-02 | build | `npm run build` (Lighthouse-ready build) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No new test framework needed — tsc + build cover structural correctness
- [ ] CSV export unit test stub in `finance-tracker/src/utils/exportCsv.test.ts`

*Existing infrastructure (tsc + Vite build) covers most phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PWA install prompt appears on Android | PWA-02 | Requires physical Android device / Chrome DevTools PWA panel | Open app in Chrome → 3-dot menu → "Add to Home Screen" |
| App opens standalone (no browser chrome) on iOS | PWA-02 | Requires physical iPhone / Safari | Add to Home Screen from Safari → open from home screen |
| Bottom nav not obscured by iOS home indicator | PWA-01 | Requires physical iPhone | Open app from Home Screen, check bottom nav visibility |
| Lighthouse PWA score ≥ 90 | PWA-02 | Requires deployed URL | Chrome DevTools → Lighthouse → PWA audit on GitHub Pages URL |
| CSV opens without encoding errors in Excel | EXPORT-03 | Requires Excel/Google Sheets | Download CSV → open in Excel → verify VND amounts display correctly |
| Content renders at 320px, 375px, 390px, 430px | PWA-01 | Visual QA | Chrome DevTools responsive mode at each breakpoint |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
