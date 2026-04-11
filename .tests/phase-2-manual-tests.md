# Phase 2 Manual Test Suite — Dashboard Analytics

**Covers:** Donut chart, Bottom nav, Reports page, Category picker with tips, Data persistence  
**Regression:** All Phase 1 flows should still pass

---

## A. Bottom Navigation

| # | Steps | Expected |
|---|---|---|
| A1 | Open app → look at bottom of screen | Two tabs visible: Home (house icon), Reports (chart icon) |
| A2 | Tap **Reports** tab | Navigates to /reports |
| A3 | Tap **Home** tab | Returns to home screen |
| A4 | Refresh on /reports | Reports page loads directly (route persists) |

---

## B. Donut Chart (Home Screen)

| # | Steps | Expected |
|---|---|---|
| B1 | Home screen with no transactions this month | Donut chart is hidden (returns null) |
| B2 | Add one expense transaction → return to Home | Donut chart appears showing that category |
| B3 | Add expenses in 3+ different categories | Each slice is a different color matching the category's own color |
| B4 | Tap a slice | Tooltip shows category name + formatted VND amount |
| B5 | Add income-only transactions | Donut chart hidden (income not included in spending breakdown) |
| B6 | Navigate to another month with no expenses | Donut chart hidden |

---

## C. Reports Page — Trend Bar Chart

| # | Steps | Expected |
|---|---|---|
| C1 | Open Reports | Default view: 6M trend bar chart |
| C2 | Tap **3M** pill | Chart updates to show last 3 months |
| C3 | Tap **6M** pill | Chart updates to show last 6 months |
| C4 | Tap **1Y** pill | Chart updates to show last 12 months |
| C5 | Bar chart with data | Green bars = income, Red bars = expense |
| C6 | Hover/tap a bar | Tooltip shows month + formatted VND amounts |
| C7 | No transactions in range | Chart shows flat zero bars (not an error) |
| C8 | Reports loads on first visit | Loading spinner shows briefly, then chart appears |
| C9 | Switch range quickly (tap 3M → 6M → 1Y) | Each change triggers fresh fetch, no stale data shown |

---

## D. Reports Page — Spending Breakdown

| # | Steps | Expected |
|---|---|---|
| D1 | Open Reports with expense data | Category breakdown list visible below the chart |
| D2 | Category row | Shows icon, name, percentage bar, and VND amount |
| D3 | Category bar color | Matches the category's own color |
| D4 | All percentages | Sum to ~100% (may vary by rounding) |
| D5 | No expense transactions in period | Breakdown list is empty or hidden |

---

## E. Category Picker

| # | Steps | Expected |
|---|---|---|
| E1 | Open Add Transaction → Expense tab | Shows 12 expense categories in a 4-column grid |
| E2 | Open Add Transaction → Income tab | Shows 4 income categories |
| E3 | Tap any category | Category highlights (ring + scale), description tip appears below grid |
| E4 | Description tip content — Food & Drink | "Meals, snacks, cafes, and work lunches." |
| E5 | Description tip content — Groceries | "Supermarket trips, fresh food, and home supplies." |
| E6 | Description tip content — Savings | "Money set aside for emergencies or future goals." |
| E7 | Description tip content — Salary | "Regular monthly pay from your primary job." |
| E8 | Switch type (Expense → Income) | Category selection clears, income categories shown, tip disappears |
| E9 | Category icon color | Background tint and label color match category's distinct color |

---

## F. Add Transaction (Regression)

| # | Steps | Expected |
|---|---|---|
| F1 | Add expense → save → refresh app | Transaction persists in list and in Google Sheet |
| F2 | Add income → save → refresh app | Transaction persists; balance updates correctly |
| F3 | Check Google Sheet after adding | Row has: id, YYYY-MM-DD date, type, category_id, amount, note, timestamp, email |
| F4 | Date in sheet | Stored as plain text YYYY-MM-DD (not a Date object / no day shift) |
| F5 | Try saving without selecting category | Error: "Please select a category" |
| F6 | Try saving with amount 0 | Error: "Please enter a valid amount" |

---

## G. Edit / Delete Transaction (Regression)

| # | Steps | Expected |
|---|---|---|
| G1 | Edit a transaction → change amount → save → refresh | Updated amount persists |
| G2 | Edit transaction → change category → save | Category updates in list and in sheet |
| G3 | Edit transaction → change date | Date updates correctly in sheet (no day shift) |
| G4 | Delete a transaction → refresh | Transaction gone from list and from sheet |

---

## H. Month Navigation (Regression)

| # | Steps | Expected |
|---|---|---|
| H1 | Tap ← on MonthNav | Previous month's transactions load |
| H2 | Tap → on MonthNav | Next month's transactions load (or empty if future) |
| H3 | Balance summary | Income, expense, net totals match visible transactions |

---

## Regression Checklist

- [ ] Login with Google works
- [ ] Transaction list loads for current month
- [ ] Add transaction writes to sheet correctly
- [ ] Edit transaction updates sheet correctly
- [ ] Delete transaction removes from sheet
- [ ] Dates show as YYYY-MM-DD (no timezone shift)
- [ ] Donut chart visible when expense data exists
- [ ] Reports chart shows data for all 3 range options
- [ ] Category picker shows 12 expense / 4 income
- [ ] Description tip appears on category select
- [ ] App works after hard refresh (Ctrl+Shift+R)
