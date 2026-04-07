# Pitfalls Research — Finance Tracker PWA

## Critical Pitfalls

### 1. Google Apps Script CORS Issues
**Problem:** Browser fetch requests to GAS Web App fail with CORS errors.
**Why it happens:** GAS adds redirect headers that browsers block for cross-origin requests.
**Prevention:** Always use `fetch` with `redirect: 'follow'` and `mode: 'cors'` is NOT supported — must use `no-cors` OR use `jsonp`-style workaround via `?callback=` OR use a proxy. Best practice: use `fetch` with POST and `Content-Type: text/plain;charset=utf-8` (not JSON) to avoid preflight.
**Phase:** Phase 1 — discover early, don't build UI before testing this.

### 2. Google ID Token Verification in GAS
**Problem:** Token expires every hour; app silently fails after 60 minutes.
**Why it happens:** GSI tokens have a 1-hour TTL.
**Prevention:** Use `google.accounts.id.initialize` with `auto_select: true` and handle token refresh. Store expiry time, proactively refresh before expiry. In GAS, always verify token on every request.
**Phase:** Phase 1.

### 3. VND Number Formatting
**Problem:** VND amounts displayed as `85000.00` instead of `85,000 ₫`.
**Why it happens:** Default JS `toLocaleString` behavior varies by browser locale.
**Prevention:** Use `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })` consistently. Define a `formatVND(amount)` utility at project start and use it everywhere.
**Phase:** Phase 1 — set utility before any UI work.

### 4. GAS Execution Time Limit (6 minutes)
**Problem:** Bulk operations timeout if user has thousands of rows.
**Why it happens:** GAS has a 6-minute execution limit per request.
**Prevention:** Paginate reads; never fetch all rows at once. Default: fetch only current month. Use `getLastRow()` + `getRange()` targeting, not `getDataRange()`.
**Phase:** Phase 1 API design.

### 5. PWA Cache Invalidation
**Problem:** Users see stale app version after deploy; new features don't appear.
**Why it happens:** Service worker caches app shell aggressively.
**Prevention:** Use Workbox `StaleWhileRevalidate` for API calls, `CacheFirst` for static assets with versioned filenames. Always include `skipWaiting` + `clientsClaim` in service worker. Show "update available" banner.
**Phase:** Phase 3.

### 6. Google Sheets Rate Limits
**Problem:** API calls start failing if user rapidly adds many transactions.
**Why it happens:** Sheets API has 100 requests/100 seconds per user quota.
**Prevention:** Batch writes where possible (add multiple rows in one GAS call). Queue failed requests with retry logic. For personal use, this only matters if users spam the form.
**Phase:** Phase 1.

### 7. Chart Performance on Mobile
**Problem:** Recharts SVG charts lag or are unresponsive on low-end Android phones.
**Why it happens:** SVG rendering is CPU-intensive.
**Prevention:** Limit data points (no more than 12 bars/points per chart). Use `isAnimationActive={false}` on mobile. Lazy-load the Reports page.
**Phase:** Phase 2.

### 8. Bottom Navigation Safe Area on iPhone
**Problem:** Bottom nav bar overlaps with iPhone home indicator.
**Why it happens:** iOS Safari has a bottom safe area (~34px) that needs `env(safe-area-inset-bottom)`.
**Prevention:** Add `padding-bottom: env(safe-area-inset-bottom)` to bottom nav. Add `<meta name="viewport" content="..., viewport-fit=cover">`.
**Phase:** Phase 3.

### 9. Google Sign-In Popup Blocked
**Problem:** Mobile browsers block popups, so GSI fails silently.
**Why it happens:** Many mobile browsers block JavaScript-triggered popups.
**Prevention:** Use GSI's "One Tap" (sign-in prompt) instead of the button-triggered popup flow for mobile. Combine One Tap + traditional button as fallback.
**Phase:** Phase 1.

### 10. Sheets Formula Breaking
**Problem:** User edits the Google Sheet directly and breaks the structure.
**Why it happens:** Users will be tempted to add formulas or sort columns.
**Prevention:** Add a "raw data" sheet that the app reads, and a separate "formatted view" sheet with formulas that users can edit freely. Document sheet structure in README.
**Phase:** Phase 1 data design.

---

## Phase Mapping Summary

| Phase | Key Pitfalls to Address |
|---|---|
| Phase 1 | CORS setup, token refresh, VND formatter, GAS rate limits, sheet structure, sign-in popup |
| Phase 2 | Chart performance on mobile |
| Phase 3 | PWA cache invalidation, iOS safe area |

---
*Research date: 2026-04-07*
