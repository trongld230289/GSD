# Requirements: Finance Tracker

**Defined:** 2026-04-07
**Core Value:** See exactly where your money goes each month — income versus spending by category — accessible from any phone or browser, synced via Google Sheets, at zero cost.

---

## v1 Requirements

### Authentication
- [ ] **AUTH-01**: User can sign in with their Google account (One Tap prompt + button fallback)
- [ ] **AUTH-02**: User session persists across browser refresh and app restart
- [ ] **AUTH-03**: User's data is isolated per Google account (email-scoped in Sheets)
- [ ] **AUTH-04**: User can sign out

### Transactions — Add
- [ ] **TRANS-01**: User can add an expense transaction with: amount (VND), category, date, optional note
- [ ] **TRANS-02**: User can add an income transaction with: amount (VND), source category, date, optional note
- [ ] **TRANS-03**: Add transaction form opens as a bottom drawer (mobile-first pattern) via FAB button
- [ ] **TRANS-04**: Amount input is prominent and first (large numpad-feel input)
- [ ] **TRANS-05**: Category is selected from a grid of emoji icons (4 per row)
- [ ] **TRANS-06**: Date defaults to today; user can change it
- [ ] **TRANS-07**: Form validates that amount > 0 and category is selected before saving

### Transactions — View & Manage
- [ ] **TRANS-08**: User can view a list of transactions for the current month grouped by date
- [ ] **TRANS-09**: User can navigate to previous/next months via arrow buttons (← March 2026 →)
- [ ] **TRANS-10**: Each transaction shows: amount (VND formatted), category icon+name, date, note (if any)
- [x] **TRANS-11**: User can delete a transaction (with confirmation prompt)
- [x] **TRANS-12**: User can edit an existing transaction (all fields modifiable)

### Categories
- [ ] **CAT-01**: App ships with 12 default expense categories:
  Food & Dining 🍜, Transportation 🚗, Shopping & Apparel 👗, Online Shopping 📦,
  Travel & Vacation ✈️, Personal Development 📚, Gifts & Celebrations 🎁,
  Bills & Utilities 💡, Healthcare 💊, Entertainment 🎬, Savings / Investment 💰, Other 📝
- [ ] **CAT-02**: App ships with 4 default income categories:
  Salary / Wages 💼, Freelance / Side Income 🔧, Gifts Received 🧧, Other Income 📊
- [ ] **CAT-03**: Expense and income categories are visually separated in the category selector

### Dashboard
- [ ] **DASH-01**: User can view total income for the selected month
- [ ] **DASH-02**: User can view total expenses for the selected month
- [ ] **DASH-03**: User can view net balance (income minus expenses) for the selected month; shown in green (positive) or red (negative)
- [ ] **DASH-04**: Dashboard shows spending breakdown by expense category as a chart (pie or donut)
- [ ] **DASH-05**: Each category in the chart shows: name, amount, percentage of total spending

### Reports
- [ ] **REPORT-01**: User can view spending trend over the last 6 months as a bar/line chart
- [ ] **REPORT-02**: User can view a per-category breakdown (sorted by amount, highest first) for any selected month
- [ ] **REPORT-03**: User can filter all report views by month/year via month selector

### Export
- [ ] **EXPORT-01**: User can export all transactions for the selected month as a CSV file
- [ ] **EXPORT-02**: CSV columns: Date, Type (income/expense), Category, Amount (VND), Note
- [ ] **EXPORT-03**: Data is also directly accessible in the user's Google Sheet (read-only for power users)

### Responsive / PWA
- [x] **PWA-01**: App is fully usable on mobile screen sizes (320px–430px width)
- [x] **PWA-02**: App is installable on Android and iOS via "Add to Home Screen" (valid PWA manifest + service worker)
- [x] **PWA-03**: Previously loaded transaction data is viewable offline (service worker cache)

---

## v2 Requirements

### Budget Management (YNAB-style allocation)
- **BUDGET-01**: GAS backend stores per-category monthly budget allocations in a Budgets sheet (month, category_id, budgeted columns); getBudgets and setBudget endpoints read/upsert rows with exact month matching and no duplicates
- **BUDGET-02**: GAS setBudget endpoint upserts correctly — updates existing row on repeat call for same month+category_id, never creates duplicates
- **BUDGET-03**: BudgetEntry and BudgetRow TypeScript types exported from types.ts; apiGetBudgets and apiSetBudget API functions exported from gas.ts following gasGet/gasPost pattern
- **BUDGET-04**: useBudgetStore Zustand slice with YYYY-MM keyed cache, setBudgets, updateBudgetEntry, setBudgetMonth, setLoadingBudgets actions — no persist middleware (always fresh from GAS)
- **BUDGET-05**: User can navigate to /budget from a "Budget" tab in the bottom navigation bar
- **BUDGET-06**: Budget page shows a row per expense category with Budgeted (inline editable), Spent, and Available (Budgeted − Spent) columns; Available shown in red when negative
- **BUDGET-07**: Ready to Assign banner shows total income minus total budgeted for the month; green when ≥ 0, red with "Over-budgeted by X" when negative; saves to GAS on blur or Enter only

### Recurring Transactions
- **RECUR-01**: User can mark a transaction as recurring (monthly, weekly)
- **RECUR-02**: Recurring transactions are automatically added at their scheduled interval

### Custom Categories
- **CUST-01**: User can add a custom expense or income category with a name and emoji
- **CUST-02**: User can hide default categories they don't use

### Multi-Currency
- **CURR-01**: User can log transactions in VND or USD
- **CURR-02**: Dashboard shows equivalent amount in VND using a user-defined exchange rate

---

## Out of Scope

| Feature | Reason |
|---|---|
| Bank account sync / auto-import | Significant security surface, high complexity, not needed for core value |
| Native iOS/Android app | PWA covers the mobile use case without App Store overhead |
| Shared / household tracking | Multi-user data model adds significant complexity |
| Investment portfolio tracking | Different product; separate concerns |
| Receipt scanning / OCR | Nice-to-have but not core; adds AI/ML complexity |
| Push notifications | Requires budget feature (v2) and notification permissions |
| Dark mode | Cosmetic; v2 polish |

---

## Traceability

| Requirement | Phase | Status |
|---|---|---|
| AUTH-01–04 | Phase 1 | Pending |
| TRANS-01–12 | Phase 1 | Pending |
| CAT-01–03 | Phase 1 | Pending |
| DASH-01–05 | Phase 2 | Pending |
| REPORT-01–03 | Phase 2 | Pending |
| EXPORT-01–03 | Phase 3 | Pending |
| PWA-01–03 | Phase 3 | Pending |
| BUDGET-01–07 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 34 total
- v2 requirements (Phase 4): 7 total
- Mapped to phases: 41
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-07*
*Last updated: 2026-04-07 after initial definition*
