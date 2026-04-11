# Phase 2 Summary — Dashboard & Analytics

**Status:** Execution complete — deployed to GitHub Pages  
**Commit:** `e77e700`  
**Date:** 2025-04-12

---

## What Was Built

### GAS Backend
- New `getMonthlyTotals` endpoint: accepts `action=getMonthlyTotals&months=YYYY-MM,YYYY-MM,...`, returns `[{ month, income, expense }]`
- New deployment URL: `https://script.google.com/macros/s/AKfycbx7NcOGdYgPjTc0UetmluXlc1g2wEzy2Xk8raL-7bH4y9R9m7uCQq1bU4PyRLfEamzX/exec`
- Bug fix during execution: `tokenInfo.email` → `userEmail` for auth check

### New Types (`src/types.ts`)
- `MonthlyTotals { month: string; income: number; expense: number }`

### API Layer (`src/api/gas.ts`)
- Updated `GAS_URL` to new deployment
- `lastNMonths(n)` — generates array of last N `"YYYY-MM"` strings using date-fns
- `apiGetMonthlyTotals(token, months)` — fetches 6-month income/expense summary

### Store (`src/store/useStore.ts`)
- `txCache: Record<string, Transaction[]>` — session-scoped in-memory cache
- `setCachedTransactions(month, txs)` — writes to cache
- `invalidateCache(month)` — removes single month entry (kept for future use)

### New Components
| File | Description |
|---|---|
| `src/components/BottomNav.tsx` | Fixed bottom tab bar: 🏠 Home / 📊 Reports (NavLink active state, safe-area aware) |
| `src/components/SpendingChart.tsx` | Recharts PieChart donut — expense breakdown by category, custom legend with % and amounts, hides when no expenses |

### New Pages
| File | Description |
|---|---|
| `src/pages/ReportsPage.tsx` | 6-month BarChart (income+expense), MonthNav for per-month breakdown, category list sorted by amount with progress bars |

### Updated Files
| File | Change |
|---|---|
| `src/App.tsx` | Added `/reports` route with auth guard |
| `src/pages/HomePage.tsx` | Cache-aware fetch, `SpendingChart` below balance summary, `BottomNav` at bottom, auto cache sync via `useEffect` on `transactions` |

---

## Architecture Decisions

### Cache Strategy
- Load: check `txCache[month]` first; fetch from GAS only on miss
- Write-through: `useEffect` in `HomePage` watches `transactions` — on every non-loading change, updates `txCache[currentMonthKey]`
- This covers all mutations (add, edit, delete) without prop drilling `onMutate` callbacks
- Cache is session-scoped (Zustand in-memory; lost on refresh, which is intentional)

### Bottom Nav Positioning
- `BottomNav` fixed at bottom; padding `pb-24` on scroll container ensures content isn't hidden
- FAB stays at `bottom: calc(1.5rem + env(safe-area-inset-bottom))` — sits above the tab bar

---

## Deviations from Plan

| Plan Said | Actual |
|---|---|
| Pass `onMutate` callback for cache invalidation | Used `useEffect` watching `transactions` instead — simpler, covers all mutation types automatically |
| `invalidateCache` + refetch pattern | Write-through sync pattern — no stale data, no extra network call |

---

## Files Changed
```
finance-tracker/src/App.tsx                       (modified)
finance-tracker/src/api/gas.ts                    (modified)
finance-tracker/src/types.ts                      (modified)
finance-tracker/src/store/useStore.ts             (modified)
finance-tracker/src/components/BottomNav.tsx      (new)
finance-tracker/src/components/SpendingChart.tsx  (new)
finance-tracker/src/pages/HomePage.tsx            (modified)
finance-tracker/src/pages/ReportsPage.tsx         (new)
```

---

## Next Steps
- Smoke test on GitHub Pages (https://trongld230289.github.io/GSD/)
- Create `.tests/phase-2-manual-tests.md` after smoke testing confirmed
