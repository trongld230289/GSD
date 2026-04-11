# Phase 2 Summary — Dashboard Analytics

**Status:** Complete and smoke-tested ✅  
**Date completed:** April 11, 2026

---

## What Was Built

### New Features
- **Donut chart on Home screen** — shows current month's expense breakdown by category; each slice uses the category's own distinct color
- **Bottom navigation bar** — Home / Reports tabs
- **Reports page** — bar chart trend (3M / 6M / 1Y selector) + spending category breakdown
- **Session cache in Zustand store** — monthly totals cached to avoid redundant GAS calls within the same session
- **Category redesign** — 16 new categories (4 income + 12 expense) replacing the original set; category picker shows a description tip when a category is selected

### Files Created
| File | Purpose |
|---|---|
| `src/components/SpendingChart.tsx` | Recharts donut + bar chart; colors from category data, PALETTE as fallback |
| `src/components/BottomNav.tsx` | Tab bar, Home / Reports icons |
| `src/pages/ReportsPage.tsx` | Trend chart + breakdown, trendRange state (3\|6\|12) |
| `src/api/gas.ts` (additions) | `apiGetMonthlyTotals`, `lastNMonths` helper |
| `src/store/useStore.ts` (additions) | `monthlyTotals` cache, `fetchMonthlyTotals` action |
| `src/data/categories.ts` | Static category metadata — ids, colors, icons, description tips |

### Files Modified
| File | Change |
|---|---|
| `src/App.tsx` | Added `/reports` route |
| `src/pages/HomePage.tsx` | Integrated SpendingChart, wired to store |
| `src/types.ts` | Added `MonthlyTotals` interface |

### GAS (`Code.gs`) Changes
| Function | Change |
|---|---|
| `getMonthlyTotals` | New function added |
| `handleRequest` | New `getMonthlyTotals` case |

---

## Bugs Found and Fixed During Smoke Testing

### 1. All added transactions blank in sheet
- **Root cause:** `apiAddTransaction` sent `{ action, token, data: tx }` — GAS reads `params.type` at top level, not `params.data.type`
- **Fix:** Changed to `{ action, token, ...tx }` flat spread in `gas.ts`

### 2. Transaction updates not persisting
- **Root cause:** Same nested payload bug in `apiUpdateTransaction` — sent `{ action, token, data: tx }`
- **Fix:** Changed to `{ action, token, ...tx }` flat spread in `gas.ts`

### 3. Date shifted -1 day in sheet (Apr 10 stored as Apr 9)
- **Root cause:** Sheets auto-converts date strings to internal Date objects using UTC, causing timezone shift when stored
- **Fix:** `sheet.getRange(newRow, 2).setNumberFormat('@')` after `appendRow` in `addTransaction`; same pattern in `updateTransaction`

### 4. Duplicate date headers in transaction list
- **Root cause:** GAS was returning raw Date object string (`"Fri Apr 09 2026 07:00:00 GMT+0700"`) instead of YYYY-MM-DD
- **Fix:** `Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), "yyyy-MM-dd")` in `getTransactions`

### 5. Reports bar chart empty — `SPREADSHEET_ID` error
- **Root cause:** `getMonthlyTotals` used `SpreadsheetApp.openById(SPREADSHEET_ID)` — `SPREADSHEET_ID` was never defined
- **Fix:** Changed to `SpreadsheetApp.getActive()` — consistent with all other functions

### 6. Reports bar chart empty — "Spread syntax requires iterable"
- **Root cause:** `handleRequest` double-wrapped the response: `json({ ok: true, data: getMonthlyTotals(...) })` — `json()` helper already wraps with `{ ok, data }`
- **Fix:** Changed to `json(getMonthlyTotals(...))` directly

### 7. `getMonthlyTotals` returning all zeros
- **Root cause:** `String(row[1]).slice(0,7)` returns `"Fri Apr"` not `"2026-04"` when the cell contains a Date object
- **Fix:** `Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), "yyyy-MM")` for month grouping key

### 8. `addTransaction` throws ReferenceError in GAS
- **Root cause:** `newRow` was referenced after `appendRow` (which changes `getLastRow()`), giving wrong row number
- **Fix:** `const newRow = sheet.getLastRow() + 1` declared **before** `appendRow`

---

## Deviations from Plan

- **1M trend option removed** — user found 1-month bar chart unhelpful; kept 3M/6M/1Y
- **Error state added to ReportsPage** — `chartError` state shows visible message if fetch fails (not in original plan)
- **SpendingChart colors** — original plan used a fixed palette by sort index; changed to use each category's own `.color` field for consistency with the picker; PALETTE kept as fallback for unknown categories
- **Category redesign post-smoke-test** — original 16 categories replaced with a new set better matching actual usage: Salary / Bonus / Side Income / Gifts (income) + Savings / Giving / Housing / Furniture / Transport / Food & Drink / Health / Personal Dev. / Lifestyle / Groceries / Debt / Others (expense)
- **Description tips in picker** — not in original plan; added as UX improvement so users can quickly identify the right category; stored as static data in `src/data/categories.ts` (no GAS change needed)

---

## Lessons Learned (added to project rules)

1. **Flat payload rule** — all `gasPost` bodies must be `{ action, token, ...fields }` never `{ action, token, data: fields }`. Documented in `.planning/gas-api-contract.md` and `copilot-instructions.md`.
2. **GAS code review rule** — read full `Code.gs` before writing any new GAS function; checklist added to `copilot-instructions.md`.
3. **GAS date handling rule** — always use `Utilities.formatDate(new Date(row[N]), Session.getScriptTimeZone(), "yyyy-MM-dd")` for reads; `setNumberFormat('@')` for writes. Documented in `copilot-instructions.md`.

---

## Final State

- Live URL: https://trongld230289.github.io/GSD/
- GAS: same deployment URL, multiple new versions deployed during Phase 2
- All smoke test items confirmed passing by user
