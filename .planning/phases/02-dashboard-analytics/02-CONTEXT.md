# Phase 2: Dashboard & Analytics — Context

**Gathered:** 2026-04-11
**Status:** Ready for execution
**Source:** /gsd-discuss-phase 2 + research (user decisions)

<domain>
## Phase Boundary

Phase 2 adds analytics on top of the existing Phase 1 app. The user can:
- See a donut chart of spending by category on the Home screen (scrolling down below balance cards)
- Navigate to a Reports page via a bottom tab bar
- View a 6-month income vs expense bar chart on the Reports page
- Browse a per-category spending breakdown list for any selected month

Phase 2 also improves perceived performance via a Zustand session cache — visited months load instantly after the first fetch, and a new single-call GAS endpoint replaces 6 parallel calls for the trend chart.

Everything in Phase 2 is read-only analytics — no new data entry flows, no settings.

</domain>

<decisions>
## Implementation Decisions

### Chart Placement
- **Donut chart lives on the Home screen**, below the balance cards and above the transaction list
- Hidden while loading, hidden when there are no expense transactions
- Keeps the app to one screen for common use (add + check balance + see chart without navigating away)

### Navigation
- **Bottom tab bar** with 2 tabs: 🏠 Home | 📊 Reports
- `NavLink` from React Router — active tab highlighted in green
- FAB (+) only shown on Home tab (not on Reports)
- Bottom nav is `position: fixed`, height ~60px; scroll containers use `pb-24` to avoid content hiding behind it

### Chart Library
- **Recharts** (already installed at `2.12.7`) — no new dependency
- Donut chart: `PieChart` + `Pie` with `innerRadius={42} outerRadius={65}`
- Bar chart: `BarChart` + two `Bar` components (income=green, expense=red), side by side
- Custom legend below the donut (better than Recharts built-in on narrow screens)

### 6-Month Trend Data
- **New GAS endpoint** `getMonthlyTotals` — one API call returns aggregated `{month, income, expense}` for all 6 months
- Much faster than 6 parallel `getTransactions` calls (one sheet scan vs six)
- Requires new GAS deployment (new URL) — always create new deployment, never update existing
- Frontend helper `lastNMonths(n)` generates the months array

### Session Cache
- `txCache: Record<string, Transaction[]>` added to Zustand `useAppStore` (NOT persisted — memory only)
- On month change: serve from cache if key exists, otherwise fetch + store
- Cache invalidated for current month after add / edit / delete
- Result: month navigation is instant after first visit — no spinner on revisit

### Reports Page Layout
- `Header` (same as Home) at top
- 6-month bar chart card (loads once on mount)
- `MonthNav` below chart — controls only the breakdown list (not the bar chart)
- Per-category breakdown: icon + name + colored progress bar + amount + percentage
- Sorted by amount descending (highest spending first)

### MonthNav Scope on Reports
- The `MonthNav` on the Reports page controls the **breakdown list only**
- The 6-month bar chart always shows "last 6 months from today" — it does NOT move with MonthNav
- This distinction must be clear in the UI (separate sections with clear headings)

### GAS getMonthlyTotals Implementation
- Accepts `months` param as comma-separated `YYYY-MM` strings
- Filters by `user_email` for data isolation
- Returns `[{month, income, expense}]` — empty months return `{income: 0, expense: 0}`
- Date parsing: `String(row[1]).slice(0, 7)` handles both string dates and GAS Date objects

### Claude's Discretion
- Exact Tailwind spacing values and responsive tweaks
- Recharts tooltip styling
- Y-axis number formatting (`shortVND` helper: 1M, 500K etc.)
- Loading spinner placement within chart cards
- Exact padding/margin adjustments to BottomNav and content areas

</decisions>
