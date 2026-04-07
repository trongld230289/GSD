# Roadmap: Finance Tracker

**Created:** 2026-04-07
**Phases:** 3
**Strategy:** Coarse granularity — each phase delivers a complete vertical slice of value.

---

## Phase Overview

| Phase | Name | Goal | Requirements | Status |
|---|---|---|---|---|
| 1 | Core Entry & Sync | Users can log income/expenses and see them synced | AUTH-01–04, TRANS-01–12, CAT-01–03 | 🔲 Pending |
| 2 | Dashboard & Analytics | Users can understand their spending via charts | DASH-01–05, REPORT-01–03 | 🔲 Pending |
| 3 | Mobile Polish & Export | App installs on phone, data exportable | EXPORT-01–03, PWA-01–03 | 🔲 Pending |

---

## Phase 1: Core Entry & Sync

**Goal:** A working app where the user can sign in, log income and expenses, view the transaction history for any month, and edit/delete entries. All data persists in Google Sheets.

**Done when:**
- [ ] User can sign in with Google account and session persists
- [ ] User can add an expense transaction and see it appear in the list
- [ ] User can add an income transaction and see it appear in the list
- [ ] User can navigate between months and see filtered transactions
- [ ] User can edit and delete transactions
- [ ] All 16 default categories are available in the category picker
- [ ] Data is confirmed present in Google Sheets after adding

**Plans:**
1. Google Sheets + GAS API setup (schema, all 5 endpoints, CORS-safe, tested with curl)
2. React project bootstrap (Vite + TypeScript + Tailwind + Zustand + React Router)
3. Google Sign-In flow (One Tap + button, token refresh, api.ts wrapper)
4. Add Transaction UI (FAB → bottom drawer → amount + category grid + date + note)
5. Transaction list view (monthly grouped list, month selector navigation)
6. Edit + delete transaction

**Requirements covered:** AUTH-01–04, TRANS-01–12, CAT-01–03

---

## Phase 2: Dashboard & Analytics

**Goal:** A dashboard home screen that shows income/expenses/balance for the current month, a category breakdown chart, and a 6-month trend chart on the reports page.

**Done when:**
- [ ] Dashboard shows total income, total expenses, and net balance for selected month
- [ ] Net balance is color-coded (green = positive, red = negative)
- [ ] Pie/donut chart shows spending split by category with amounts and percentages
- [ ] Reports page shows 6-month bar chart of total expenses
- [ ] Reports page shows per-category breakdown sorted by amount for selected month
- [ ] Month navigation works consistently across dashboard and reports

**Plans:**
1. Dashboard page layout (balance summary cards + month selector)
2. Category pie/donut chart (Recharts PieChart, labeled with amount + %)
3. Reports page (6-month trend BarChart + per-category breakdown list)
4. Performance check on mobile (disable animations if lag detected)

**Requirements covered:** DASH-01–05, REPORT-01–03

---

## Phase 3: Mobile Polish & Export

**Goal:** App is installable on phone, feels native, performs well, and data can be exported to CSV.

**Done when:**
- [ ] App can be installed on Android via "Add to Home Screen" and opens standalone
- [ ] App can be added on iOS and opens without Safari browser chrome
- [ ] App passes Lighthouse PWA audit (score ≥ 90)
- [ ] Content renders correctly on 320px–430px screen widths
- [ ] iPhone bottom safe area is handled (bottom nav not obscured by home indicator)
- [ ] User can export current month's transactions to CSV and download it
- [ ] CSV opens correctly in Excel/Google Sheets
- [ ] GitHub Actions auto-deploys on push to main

**Plans:**
1. PWA manifest + vite-plugin-pwa + Workbox service worker
2. iOS safe area fixes + mobile viewport meta tags
3. Responsive QA pass (test at 320px, 375px, 390px, 430px)
4. CSV export (generate in-browser, trigger download)
5. GitHub Actions deploy workflow
6. Lighthouse audit + fixes

**Requirements covered:** EXPORT-01–03, PWA-01–03

---

## Post-v1 Backlog (v2)

| Feature | Phase TBD | Priority |
|---|---|---|
| Monthly budget limits per category | Phase 4 | High |
| Budget progress bars in dashboard | Phase 4 | High |
| Alerts at 80% budget | Phase 4 | Medium |
| Recurring transactions | Phase 5 | Medium |
| Custom categories | Phase 4 | Low |
| Dark mode | Phase 5 | Low |
| Multi-currency (VND + USD) | Phase 5 | Low |

---
*Roadmap created: 2026-04-07*
*Last updated: 2026-04-07 after initial creation*
