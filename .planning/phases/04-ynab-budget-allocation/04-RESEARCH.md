# Phase 4: YNAB Budget Allocation — Research

**Researched:** 2026-04-19
**Domain:** Budget allocation UI + Google Sheets data model + GAS endpoints
**Confidence:** HIGH (based on direct codebase analysis + YNAB's well-documented methodology)

---

## Summary

Phase 4 adds a budget screen where the user assigns income to expense categories each month. The core YNAB equation is: **Available = Budgeted - Spent**. "Spent" is derived from existing transaction data already in Sheets — no new transaction schema is needed. Only budget allocations (how much the user intends to spend per category per month) need a new data store.

The backend change is minimal: one new Sheets tab (`Budgets`) and two new GAS endpoints (`getBudgets`, `setBudget`). The frontend adds one new page (`BudgetPage`), one new Zustand store slice, two new API functions, and a set of per-category row components. All existing patterns (gasGet/gasPost envelope, txCache-style caching, Tailwind, Zustand) apply directly — no new libraries needed.

**Primary recommendation:** Store budgets in a separate `Budgets` tab (columns: `month`, `category_id`, `budgeted`). Compute Available client-side from budgets + already-loaded transactions. Keep v1 scope to: set budget per category, see Budgeted / Spent / Available per row, see "Ready to Assign" total, highlight negative Available in red. No rollover in v1.

---

## Standard Stack

All existing — no new dependencies required.

### Core (already installed)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| Zustand | 4.5.2 | Budget store slice | Add `useBudgetStore` or extend `useAppStore` |
| React + Tailwind | 18.3.1 / 3.4.4 | Budget page UI | Existing patterns apply |
| date-fns | 3.6.0 | Month key formatting (`YYYY-MM`) | Already used in gas.ts |
| GAS Web App | — | getBudgets / setBudget endpoints | Extend existing script |

### No New Dependencies
Budget math (Available = Budgeted - Spent) is integer arithmetic. No charting library needed for v1. No new npm packages required.

---

## Architecture Patterns

### New Sheets Tab: `Budgets`

```
Tab name: Budgets
Columns:  month (YYYY-MM) | category_id | budgeted (integer VND)
Example:  2026-04        | food-drink  | 3000000
```

- One row per (month, category_id) pair
- No row = 0 budgeted for that category
- No `user_email` column needed if the sheet is already user-scoped (single-user app)
- Primary key: `month + category_id` composite (enforced in GAS upsert logic)

### New GAS Endpoints

**`getBudgets` (GET)**
```
params: action=getBudgets, token, month=YYYY-MM
returns: { ok: true, data: [{ category_id, budgeted }] }
```
GAS filters Budgets tab where column A = month, returns array.

**`setBudget` (POST)**
```
body: { action: "setBudget", token, month, category_id, budgeted }
returns: { ok: true, data: { success: true } }
```
GAS upserts: find row where month+category_id match, update budgeted; if no match, append row.

### Computed Values (client-side, no new endpoint)

```typescript
// "Spent" per category comes from already-loaded transactions
function computeBudgetRows(
  budgets: BudgetEntry[],        // from getBudgets
  transactions: Transaction[],   // from existing txCache
  categories: Category[]
): BudgetRow[] {
  return categories
    .filter(c => c.type === 'expense')
    .map(cat => {
      const budgeted = budgets.find(b => b.category_id === cat.id)?.budgeted ?? 0
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category_id === cat.id)
        .reduce((sum, t) => sum + t.amount, 0)
      return {
        category: cat,
        budgeted,
        spent,
        available: budgeted - spent,   // negative = overspent
      }
    })
}
```

### "Ready to Assign" Computation

```typescript
// Total income this month minus total budgeted across all categories
const totalIncome = transactions
  .filter(t => t.type === 'income')
  .reduce((sum, t) => sum + t.amount, 0)

const totalBudgeted = budgetRows.reduce((sum, r) => sum + r.budgeted, 0)

const readyToAssign = totalIncome - totalBudgeted
// Negative = over-budgeted (user assigned more than they earned)
```

### New File Structure

```
src/
├── pages/
│   └── BudgetPage.tsx          # new — budget allocation screen
├── components/
│   └── BudgetCategoryRow.tsx   # new — per-category row (name | budgeted input | spent | available)
├── store/
│   └── useStore.ts             # extend — add useBudgetStore
├── api/
│   └── gas.ts                  # extend — add apiGetBudgets, apiSetBudget
└── types.ts                    # extend — add BudgetEntry, BudgetRow types
```

### New Route

```typescript
// In App.tsx — add alongside existing routes
<Route path="/budget" element={<ProtectedRoute><BudgetPage /></ProtectedRoute>} />
```

Add "Budget" tab to `BottomNav` (currently has Home and Reports).

### Budget Store Slice

```typescript
// New store — useBudgetStore
interface BudgetStore {
  budgets: BudgetEntry[]          // raw from GAS: [{ category_id, budgeted }]
  budgetMonth: string             // YYYY-MM currently viewing
  isLoadingBudgets: boolean
  budgetCache: Record<string, BudgetEntry[]>  // month-keyed, mirrors txCache pattern

  setBudgets: (month: string, entries: BudgetEntry[]) => void
  updateBudgetEntry: (category_id: string, budgeted: number) => void
  invalidateBudgetCache: (month: string) => void
}
```

### Anti-Patterns to Avoid

- **Don't compute Spent server-side in getBudgets.** GAS would need to join two tabs (Budgets + Transactions) which is slow and fragile. Spent is already available client-side from the existing txCache.
- **Don't store Available in Sheets.** It's a derived value — storing it creates sync risk if transactions change.
- **Don't allow budgeting income categories.** Filter to `type === 'expense'` categories only in the budget UI.
- **Don't require a budget row to exist before showing a category.** Default budgeted=0 for any category with no row.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Sheet upsert logic | Custom row-merge code | GAS: find row by composite key, overwrite or append |
| Currency display | Custom VND formatter | Existing `formatVND()` in `src/utils/format.ts` |
| Month navigation | New month picker | Existing `MonthNav` component + `currentMonth` from store |
| Auth header | Repeat token-passing code | Existing `gasGet`/`gasPost` pattern — just add `token` param |

---

## Common Pitfalls

### Pitfall 1: Transactions not loaded when budget page mounts
**What goes wrong:** BudgetPage mounts, calls `computeBudgetRows()`, but `transactions` in store is empty (user navigated directly to /budget without visiting home first).
**How to avoid:** BudgetPage must independently trigger `apiGetTransactions` for the current month if `txCache[month]` is empty — same logic as `HomePage`. Reuse the same cache-check pattern.

### Pitfall 2: GAS upsert finds wrong row
**What goes wrong:** GAS searches Budgets tab for `month+category_id` match but finds a partial match on month only (e.g., "2026-04" matches "2026-04-01" if not exact).
**How to avoid:** Use exact string equality check in GAS (`=== month` not `.includes(month)`). Store month always as `YYYY-MM` (6 chars), never as a date.

### Pitfall 3: Budget input loses focus on every keystroke
**What goes wrong:** Inline-editing the budgeted amount in a list row causes the whole list to re-render (store update triggers re-render), blurring the input.
**How to avoid:** Use local component state for the input value while editing; only call `apiSetBudget` and update store on `onBlur` or on Enter keypress (not on every `onChange`).

### Pitfall 4: "Ready to Assign" goes negative without explanation
**What goes wrong:** User sees a negative "Ready to Assign" number and thinks the app is broken.
**How to avoid:** Show distinct UI state: green when positive ("you have X to assign"), red when negative ("you've over-budgeted by X — reduce a category"). Label clearly.

### Pitfall 5: setBudget called for every category on page load
**What goes wrong:** Page initializes with budgeted=0 for all categories and fires a `setBudget` POST for each, writing 15 empty rows to Sheets.
**How to avoid:** Only POST to `setBudget` when the user explicitly changes a value. Never write zeros on mount.

### Pitfall 6: BottomNav now has 3 tabs — layout breaks on narrow screens
**What goes wrong:** Adding "Budget" as third tab makes BottomNav items too cramped on 320px width.
**How to avoid:** Keep labels short (Home / Budget / Reports). Test at 320px. Use `text-xs` for labels if needed.

---

## Code Examples

### New Types (extend types.ts)
```typescript
// Budget entry as stored in GAS / returned by getBudgets
export interface BudgetEntry {
  category_id: string
  budgeted: number   // VND, whole integer
}

// Computed row for UI display
export interface BudgetRow {
  category: Category
  budgeted: number
  spent: number
  available: number   // budgeted - spent; negative = overspent
}
```

### New API Functions (extend gas.ts)
```typescript
export async function apiGetBudgets(
  token: string,
  month: string  // YYYY-MM
): Promise<BudgetEntry[]> {
  const [year, mon] = month.split('-')
  const res = await gasGet<BudgetEntry[]>({
    action: 'getBudgets',
    token,
    month: `${year}-${mon}`,
  })
  if (!res.ok) throw new Error(res.error ?? 'Failed to load budgets')
  return res.data ?? []
}

export async function apiSetBudget(
  token: string,
  month: string,
  category_id: string,
  budgeted: number
): Promise<void> {
  const res = await gasPost<{ success: boolean }>({
    action: 'setBudget',
    token,
    month,
    category_id,
    budgeted,
  })
  if (!res.ok) throw new Error(res.error ?? 'Failed to save budget')
}
```

### GAS Handler Skeleton (for reference when writing GAS code)
```javascript
// In GAS Code.gs — add to doGet / doPost switch
case 'getBudgets': {
  const month = params.month  // "YYYY-MM"
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Budgets')
  const rows = sheet.getDataRange().getValues()
  const data = rows
    .filter(r => r[0] === month)
    .map(r => ({ category_id: r[1], budgeted: Number(r[2]) }))
  return respond({ ok: true, data })
}

case 'setBudget': {
  const { month, category_id, budgeted } = body
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Budgets')
  const rows = sheet.getDataRange().getValues()
  const idx = rows.findIndex(r => r[0] === month && r[1] === category_id)
  if (idx >= 0) {
    sheet.getRange(idx + 1, 3).setValue(Number(budgeted))  // col C = budgeted
  } else {
    sheet.appendRow([month, category_id, Number(budgeted)])
  }
  return respond({ ok: true, data: { success: true } })
}
```

---

## Minimal v1 Feature Set (avoid scope creep)

| Feature | In v1 | Rationale |
|---------|-------|-----------|
| Set budgeted amount per expense category | YES | Core |
| See Budgeted / Spent / Available per row | YES | Core |
| "Ready to Assign" banner | YES | Core YNAB concept |
| Negative available shown in red | YES | Core |
| Month navigation (same as home) | YES | Needed for multi-month |
| Budget rolls over to next month | NO | Complex, deferred |
| Auto-fill budget from last month | NO | Nice-to-have, deferred |
| Budget for income categories | NO | YNAB doesn't do this |
| Alerts at 80% budget | NO | Phase 4 backlog item |
| Overspend must be covered by pulling from another | NO | Pure YNAB, too complex for v1 |

For overspend in v1: show the negative Available in red and display a total "overspent" banner. Don't force user to re-allocate (that's YNAB's "move money" feature — too complex for v1).

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Compute Spent in GAS (server join) | Compute Spent client-side from txCache | Simpler GAS, faster, no extra endpoint |
| Separate budget page per category | Single page with inline-editable rows | Mobile-friendly, fewer taps |
| Budget resets every month | Explicit per-month rows in Sheets | Clean audit trail, supports future rollover |

---

## Open Questions

1. **Does the user want budget to default to last month's values or zero?**
   - What we know: Rolling over is more convenient but adds complexity
   - What's unclear: User preference
   - Recommendation: Default to zero for v1, add "Copy from last month" button in v2

2. **Should BottomNav get a third tab or should Budget be accessible from the header menu?**
   - What we know: Three tabs fit at 375px+ but are tight at 320px
   - Recommendation: Three-tab BottomNav with short labels; test at 320px before committing

3. **Single-user or multi-user budgets?**
   - What we know: The app is single-user (one Google account, one Sheets file)
   - Recommendation: No `user_email` column in Budgets tab needed — simplifies GAS queries

---

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `finance-tracker/src/api/gas.ts`, `src/store/useStore.ts`, `src/types.ts`
- Direct codebase analysis: `finance-tracker/src/` architecture (ARCHITECTURE.md, STACK.md)
- YNAB methodology: well-established budgeting method, no library needed

### Secondary (MEDIUM confidence)
- YNAB's published "Four Rules" documentation (Available = Budgeted - Spent is canonical)
- Google Apps Script Spreadsheet API — `appendRow`, `getDataRange`, `getValues` are stable V8 GAS APIs

---

## Metadata

**Confidence breakdown:**
- Sheets schema: HIGH — direct analogy to existing Transactions tab pattern
- GAS endpoints: HIGH — direct analogy to existing getTransactions/addTransaction
- Client-side computation: HIGH — pure arithmetic from already-available data
- UI patterns: HIGH — direct reuse of existing Tailwind + Zustand patterns
- YNAB feature set: HIGH — methodology is well-documented and scoped conservatively

**Research date:** 2026-04-19
**Valid until:** 2026-06-01 (stable stack, no fast-moving dependencies)
