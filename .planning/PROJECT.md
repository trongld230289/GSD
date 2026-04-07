# Finance Tracker — Personal Income & Expense Manager

## What This Is

A Progressive Web App (PWA) for tracking personal income and daily expenses, accessible from any phone or web browser. Data is stored in a personal Google Sheet via Google Apps Script, so everything syncs automatically across all devices through your Google account. Inspired by apps like Money Lover (Money Love), with a focus on simplicity and accuracy.

## Core Value

See exactly where your money goes each month — income versus spending broken down by category — without needing a bank integration or subscription.

## Requirements

### Validated
(None yet — ship to validate)

### Active
- [ ] Add income and expense transactions with amount, category, date, and optional note
- [ ] View and manage (edit/delete) transaction history filtered by month
- [ ] Default category set covers all common spending types (12 categories)
- [ ] Monthly dashboard: total income, total expenses, net balance
- [ ] Spending breakdown chart by category
- [ ] 6-month spending trend chart
- [ ] Export transactions to CSV
- [ ] Google Sign-In for access control and per-user data isolation
- [ ] App installable on mobile (PWA) and fully responsive

### Out of Scope
- Budget limits / alerts — tracking-only for v1
- Recurring/automatic transactions — v2
- Multi-currency — VND only for v1
- Bank integration / automatic import — too complex, not core value
- Shared household tracking — v2
- Native iOS/Android app — PWA covers mobile

## Context

- **Reference app:** Money Lover (Money Love) — popular Vietnamese personal finance app; benchmark for UX patterns
- **Storage:** Google Sheets via Google Apps Script (free, no database to manage)
- **Hosting:** GitHub Pages (free static hosting) + Google Apps Script as backend API
- **Auth:** Google Sign-In (OAuth) — same account as the Google Sheet
- **Currency:** Vietnamese Dong (VND), formatted as `1,500,000 ₫`
- **Target user:** Single person tracking their own finances; non-technical, uses phone daily
- **Platform priority:** Mobile-first, then desktop web

## Expense Categories (Standard Financial Terms)

| User's Term | Standard Category | Description |
|---|---|---|
| Food | **Food & Dining** | Meals, groceries, coffee, snacks, restaurants |
| Gas | **Transportation** | Fuel, Grab/Uber, parking, vehicle maintenance |
| Shopping | **Shopping & Apparel** | Clothing, accessories, household goods |
| Shopee | **Online Shopping** | Shopee, Lazada, Tiki, Amazon purchases |
| Travelling | **Travel & Vacation** | Flights, hotels, tours, overnight trips |
| Self development | **Personal Development** | Courses, books, workshops, certifications |
| Party (birthday, wedding) | **Gifts & Celebrations** | Gifts, event contributions, flowers, donations |
| — | **Bills & Utilities** | Phone, internet, electricity, water |
| — | **Healthcare** | Medicine, doctor, dental, gym |
| — | **Entertainment** | Movies, concerts, streaming subscriptions |

### Income Categories

| Category | Description |
|---|---|
| **Salary / Wages** | Regular employment income |
| **Freelance / Side Income** | Contract work, gigs, extra jobs |
| **Gifts Received** | Money gifts from family/friends |
| **Other Income** | Investment returns, dividends, misc |

## Constraints

- **Cost**: Zero infrastructure cost — Google Sheets (free) + GitHub Pages (free)
- **Auth**: Google account required to use the app
- **API rate limit**: Google Sheets API has per-minute quotas; sufficient for personal use
- **Offline**: Read-only offline access via PWA cache; writes require connectivity

## Key Decisions

| Decision | Rationale | Outcome |
|---|---|---|
| Google Sheets as database | Free, visible/editable directly, no DB setup needed | — Pending |
| Google Apps Script as API | Pairs with Sheets, zero hosting cost, no server to manage | — Pending |
| React PWA on GitHub Pages | Free hosting, installable on mobile, offline-capable | — Pending |
| VND-only for v1 | Simplifies display and calculation logic | — Pending |
| Tracking-only (no budgets) | Reduces scope; balance visibility delivers core value | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

---
*Last updated: 2026-04-07 after initial project initialization*
