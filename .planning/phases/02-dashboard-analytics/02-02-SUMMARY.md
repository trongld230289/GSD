---
phase: 02-dashboard-analytics
plan: 02
subsystem: store
tags: [typescript, zustand, cache, monthly-totals, api]

requires:
  - phase: 02-dashboard-analytics
    plan: 01
    provides: getMonthlyTotals GAS endpoint

provides:
  - MonthlyTotals: TypeScript interface {month: string, income: number, expense: number}
  - apiGetMonthlyTotals: gas.ts function wrapping getMonthlyTotals endpoint
  - monthlyTotals cache: Zustand map keyed by month string to avoid redundant fetches
  - fetchMonthlyTotals: store action that checks cache before calling API
  - cache invalidation: add/edit/delete clear affected month from cache

affects:
  - 02-03: HomePage uses fetchMonthlyTotals for donut chart data
  - 02-04: ReportsPage uses fetchMonthlyTotals for bar chart

tech-stack:
  added: []
  patterns:
    - "Session cache in Zustand — Map<string, MonthlyTotals> keyed by 'yyyy-MM'"
    - "Cache invalidation on mutation — add/edit/delete clear the affected month entry"
    - "lastNMonths() helper in gas.ts — returns array of 'yyyy-MM' strings for N prior months"

key-files:
  created: []
  modified:
    - finance-tracker/src/types.ts
    - finance-tracker/src/api/gas.ts
    - finance-tracker/src/store/useStore.ts

key-decisions:
  - "monthlyTotals stored as Map in Zustand rather than re-fetching on every render"
  - "Cache invalidation strategy: clear by month key on mutation, not full cache flush"

requirements-completed: []

duration: completed-prior
completed: 2026-04-11
---

# Phase 2 Plan 2: Store Cache, Types & API Summary

**MonthlyTotals type added, apiGetMonthlyTotals wired in gas.ts, Zustand session cache prevents redundant GAS calls across month navigation.**

## Accomplishments
- `MonthlyTotals` interface added to `src/types.ts`
- `apiGetMonthlyTotals(months)` + `lastNMonths(n)` added to `src/api/gas.ts`
- `monthlyTotals` Map cache added to `useAppStore` in `useStore.ts`
- `fetchMonthlyTotals` action checks cache first, calls API on miss
- Cache invalidation: add/edit/delete mutations clear the affected month

---
*Phase: 02-dashboard-analytics | Completed: 2026-04-11*
