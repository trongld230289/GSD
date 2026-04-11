# Plan 2: Store Cache, Types & API

**Phase:** 2 — Dashboard & Analytics
**Plan:** 2 of 4
**Goal:** Add a transaction cache to Zustand (avoid re-fetching visited months), add `MonthlyTotals` type, add `apiGetMonthlyTotals()` to gas.ts, and wire cache invalidation on add/edit/delete.

---

## Pre-conditions
- Plan 1 complete — new GAS URL updated in `src/api/gas.ts`
- Existing store in `src/store/useStore.ts`

## Success Criteria
- [ ] `txCache: Record<string, Transaction[]>` in Zustand store
- [ ] Month navigation uses cache when available — no spinner on revisited months
- [ ] Cache invalidated correctly after add/edit/delete
- [ ] `MonthlyTotals` type added to `src/types.ts`
- [ ] `apiGetMonthlyTotals()` in `src/api/gas.ts` compiles without errors
- [ ] No TypeScript errors (`npx tsc --noEmit` clean)

---

## Tasks

### 2.1 Add `MonthlyTotals` type to `src/types.ts`

```typescript
export interface MonthlyTotals {
  month: string   // "YYYY-MM"
  income: number
  expense: number
}
```

### 2.2 Add `apiGetMonthlyTotals` to `src/api/gas.ts`

```typescript
export async function apiGetMonthlyTotals(
  token: string,
  months: string[]   // ["YYYY-MM", ...]
): Promise<MonthlyTotals[]> {
  const res = await gasGet<MonthlyTotals[]>({
    action: 'getMonthlyTotals',
    token,
    months: months.join(','),
  })
  if (!res.ok) throw new Error(res.error ?? 'Failed to load monthly totals')
  return res.data ?? []
}
```

Also add a helper to generate last N months:
```typescript
import { subMonths, format } from 'date-fns'

export function lastNMonths(n: number): string[] {
  return Array.from({ length: n }, (_, i) =>
    format(subMonths(new Date(), i), 'yyyy-MM')
  )
}
```

### 2.3 Add tx cache to Zustand store (`src/store/useStore.ts`)

Add to `AppStore` interface:
```typescript
txCache: Record<string, Transaction[]>   // key = "YYYY-MM"
setCachedTransactions: (month: string, txs: Transaction[]) => void
invalidateCache: (month: string) => void
```

Add implementations:
```typescript
txCache: {},
setCachedTransactions: (month, txs) =>
  set((s) => ({ txCache: { ...s.txCache, [month]: txs } })),
invalidateCache: (month) =>
  set((s) => {
    const { [month]: _, ...rest } = s.txCache
    return { txCache: rest }
  }),
```

### 2.4 Update `HomePage.tsx` to use cache

Replace the current `useEffect` that fetches transactions:

```typescript
useEffect(() => {
  if (!idToken) return
  const month = format(currentMonth, 'yyyy-MM')

  // Serve from cache if available
  if (txCache[month]) {
    setTransactions(txCache[month])
    return
  }

  setLoadingTx(true)
  apiGetTransactions(idToken, month)
    .then((txs) => {
      setTransactions(txs)
      setCachedTransactions(month, txs)   // store in cache
    })
    .catch(console.error)
    .finally(() => setLoadingTx(false))
}, [idToken, currentMonth])
```

### 2.5 Invalidate cache on mutations

In `HomePage.tsx` (or wherever add/edit/delete is triggered), invalidate cache for the affected month after a successful mutation:

```typescript
// After addTransaction succeeds:
invalidateCache(format(currentMonth, 'yyyy-MM'))

// After updateTransaction succeeds:
invalidateCache(format(currentMonth, 'yyyy-MM'))

// After deleteTransaction succeeds:
invalidateCache(format(currentMonth, 'yyyy-MM'))
```

The simplest approach: call `invalidateCache` inside `addTransaction`, `updateTransaction`, `removeTransaction` in the store itself — they already know the current month isn't passed in, so do it in `HomePage.tsx` callbacks instead.

### 2.6 Verify

```bash
npx tsc --noEmit
```

Manually test:
- Navigate to a month → data loads (spinner shown)
- Navigate back → data instant (no spinner, no API call)
- Add a transaction → navigate away → come back → new transaction visible (cache was busted)

---

## Notes
- Cache lives in memory only (not persisted) — refreshing the page clears it, which is fine
- `txCache` is NOT in the `persist` middleware — keep it in the non-persisted `useAppStore`
- Cache key is `"YYYY-MM"` string, matching the `format(date, 'yyyy-MM')` pattern used throughout
