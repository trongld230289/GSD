# Phase 2: Dashboard & Analytics — Research

**Gathered:** 2026-04-11
**Status:** Complete
**Source:** Codebase analysis + discussion

---

## 1. Existing Codebase Inventory

### Dependencies already installed
| Package | Version | Usage |
|---|---|---|
| `recharts` | `^2.12.7` | Charts — already installed, no new dep needed |
| `react-router-dom` | `^6.23.1` | Routing — `NavLink` for bottom tab bar |
| `zustand` | `^4.5.2` | State — extend for tx cache |
| `date-fns` | bundled | `subMonths`, `format` for month generation |

### Relevant source files
| File | Notes |
|---|---|
| `src/store/useStore.ts` | `useAppStore` — add `txCache`, `setCachedTransactions`, `invalidateCache` |
| `src/api/gas.ts` | Add `apiGetMonthlyTotals()` + `lastNMonths()` helper |
| `src/types.ts` | Add `MonthlyTotals` interface |
| `src/pages/HomePage.tsx` | Add `SpendingChart`, load from cache, call `invalidateCache` on mutations |
| `src/App.tsx` | Add `/reports` route |
| `src/components/Header.tsx` | Reused as-is on Reports page |
| `src/components/MonthNav.tsx` | Reused as-is on Reports page (controls breakdown only) |

### Current routing structure
```
/ (HomePage) — all content, FAB
/login (LoginPage)
```
Adding: `/reports` (ReportsPage)

---

## 2. Performance Problem Analysis

### Root causes of current slowness
1. **GAS cold start** — Google Apps Script idles when not used. First request after idle takes 2–5s to spin up. Unavoidable, but spinner makes it feel intentional.
2. **No caching** — every month navigation triggers a fresh GAS API call, even for months already loaded.
3. **6 parallel calls for trend data** — fetching 6 months of full transaction rows just to sum income/expense is wasteful.

### Solutions chosen
| Problem | Solution |
|---|---|
| Re-fetching visited months | Zustand `txCache` — serve from memory on revisit |
| 6 parallel calls for trend | New `getMonthlyTotals` GAS endpoint — 1 call, aggregated totals only |
| Cold start | Unavoidable — spinner on first load, cache on repeat |

---

## 3. GAS `getMonthlyTotals` Endpoint Research

### Why a new endpoint
- `getTransactions` returns full row data (all columns) for a month — each call scans the whole sheet
- For the 6-month chart we only need `{month, income, expense}` — no transaction details
- Single call with `months=YYYY-MM,YYYY-MM,...` → one sheet scan → aggregate → return totals
- Estimated data size: `6 × 3 fields` vs `N_transactions × 8 columns × 6 months`

### Implementation approach
- Accepts comma-separated `months` param: `?action=getMonthlyTotals&token=...&months=2026-04,2026-03,...`
- Filters by `user_email` (from token) for data isolation
- Returns `[{month, income, expense}]` — all requested months present (0s for empty months)
- Date parsing: `String(row[1]).slice(0, 7)` handles both string `"2026-04-10"` and GAS `Date` objects

### Deployment note
Always create a **new GAS deployment** (never update existing) to avoid execution cache. New deployment = new URL → update `GAS_URL` in `src/api/gas.ts`.

---

## 4. Chart Library Research (Recharts)

### Donut chart
```tsx
<PieChart>
  <Pie dataKey="amount" innerRadius={42} outerRadius={65} startAngle={90} endAngle={-270}>
    {data.map(entry => <Cell fill={entry.color} />)}
  </Pie>
</PieChart>
```
- `innerRadius > 0` → donut (vs solid pie)
- `startAngle={90} endAngle={-270}` → starts at 12 o'clock
- Custom legend below the chart (Recharts built-in legend has poor mobile layout)

### Bar chart (6-month trend)
```tsx
<BarChart data={chartData}>
  <Bar dataKey="income" fill="#22C55E" />
  <Bar dataKey="expense" fill="#EF4444" />
</BarChart>
```
- Two bars side-by-side per month group
- Y-axis formatter: `shortVND` (1M, 500K) to fit narrow screens
- X-axis: 3-letter month label (`"Apr"`, `"Mar"`)

---

## 5. Session Cache Design

### Structure
```typescript
txCache: Record<string, Transaction[]>  // key = "YYYY-MM"
```

### Lifecycle
| Event | Action |
|---|---|
| Month navigation (cached) | Serve `txCache[month]` → no API call, no spinner |
| Month navigation (uncached) | Fetch → store in `txCache[month]` |
| Add transaction | `invalidateCache(currentMonth)` |
| Edit transaction | `invalidateCache(currentMonth)` |
| Delete transaction | `invalidateCache(currentMonth)` |
| Page refresh | Cache cleared (not persisted — memory only) |

### Why not persist the cache
- Transactions can be edited externally (directly in Google Sheet)
- Stale cache across sessions would show wrong data
- Fresh fetch on app open is the safest baseline

---

## 6. New Files to Create

| File | Type |
|---|---|
| `src/components/BottomNav.tsx` | New component |
| `src/components/SpendingChart.tsx` | New component |
| `src/pages/ReportsPage.tsx` | New page |

## 7. Files to Modify

| File | Change |
|---|---|
| `src/types.ts` | Add `MonthlyTotals` interface |
| `src/api/gas.ts` | Add `apiGetMonthlyTotals`, `lastNMonths`, update `GAS_URL` |
| `src/store/useStore.ts` | Add `txCache`, `setCachedTransactions`, `invalidateCache` |
| `src/pages/HomePage.tsx` | Add `SpendingChart`, use cache, invalidate on mutations |
| `src/App.tsx` | Add `/reports` route |
| `Code.gs` (GAS) | Add `getMonthlyTotals` function + new deployment |
