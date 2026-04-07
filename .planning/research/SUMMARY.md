# Research Summary — Finance Tracker PWA

**Project:** Personal Finance Tracker (Income & Expense)
**Date:** 2026-04-07
**Stack choice:** React 18 + Vite PWA + Google Apps Script + Google Sheets + GitHub Pages

---

## Key Findings

### Architecture Decision: Google Apps Script is the right call
Google Apps Script + Sheets is the ideal zero-cost backend for a personal finance app. It handles authentication (Google JWT), storage (Sheets), and API (doGet/doPost) without any server management. One critical setup note: use `Content-Type: text/plain` for POST requests to avoid CORS preflight issues.

### The Reference App (Money Lover) Patterns to Copy
Money Lover's UX is optimized for logging expenses quickly on mobile:
1. **Floating action button** (FAB) at bottom center → bottom drawer form
2. **Amount input first** (large numpad feel) → then category → date → note
3. **Category grid** (emoji icons, 4 per row) → fast visual selection
4. **Bottom navigation** (4–5 tabs) → standard mobile nav
5. **Month selector** (arrows ← March 2026 →) → standard date nav

Adopt all 5 patterns in Phase 1 for an immediately familiar UX.

### Category Set: 12 Expense + 4 Income
The 12-category expense set covers 95%+ of personal spending. The user's categories all have standard financial equivalents:
- Food → Food & Dining
- Gas → Transportation
- Shopping + Shopee → Shopping & Apparel + Online Shopping (keep separate; different context)
- Travelling → Travel & Vacation
- Self development → Personal Development
- Party/birthday/wedding → Gifts & Celebrations

Three additional categories (Bills & Utilities, Healthcare, Entertainment) complete standard coverage.

### VND Formatting: Use `Intl.NumberFormat` from Day 1
Vietnamese currency formatting has no decimal places. Establish `formatVND()` utility before building any UI. `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })` produces `85.000 ₫` (note: uses period as thousand separator in vi-VN locale). Consider formatting as `85,000 ₫` using custom formatter for wider familiarity.

### Biggest Risk: GAS CORS + Google Token Flow (Phase 1)
The most technically risky part is getting the Google OAuth flow + GAS API calls working correctly from a static GitHub Pages app. Tackle this in Phase 1 before building any UI on top. Build `api.ts` as a tested module, verify GAS endpoint works with Postman/curl before React integration.

### PWA Install = The "Phone App" Experience
vite-plugin-pwa + Workbox makes the app installable on any phone via "Add to Home Screen." The manifest should include: `name`, `short_name`, `theme_color` (match brand), `display: standalone`, 192x192 and 512x512 icons. This transforms a website into a phone app experience in Phase 3.

---

## Build Order (Correct Sequence)

```
Phase 1: Data Infrastructure → Core Entry
  1. Create Google Sheet (Transactions + Categories tabs)
  2. Write GAS Web App (all 5 actions) — test with curl
  3. React project setup (Vite + TypeScript + Tailwind + Zustand)
  4. Google Sign-In flow (One Tap + button fallback)
  5. api.ts module (all GAS actions wrapped in typed functions)
  6. Add Transaction form (amount → category → date → note)
  7. Transaction list view (monthly, grouped by date)
  8. Edit + delete transaction

Phase 2: Insights
  1. Dashboard page (balance summary cards)
  2. Spending breakdown chart (Recharts PieChart by category)
  3. 6-month trend chart (Recharts BarChart or LineChart)
  4. Month/year navigation

Phase 3: Polish & Distribution
  1. PWA manifest + service worker (vite-plugin-pwa)
  2. iOS safe area fixes
  3. CSV export
  4. GitHub Actions deploy pipeline
  5. Performance audit (Lighthouse)
```

---

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| GAS CORS issues | High | High | Use text/plain content-type; test first |
| OAuth token expiry | Medium | High | Auto-refresh every 50 minutes |
| Chart lag on mobile | Medium | Low | Disable animations, lazy load |
| GAS quota exceeded | Low | Medium | Batch operations, month-scoped reads |

---
*Research synthesized: 2026-04-07*
