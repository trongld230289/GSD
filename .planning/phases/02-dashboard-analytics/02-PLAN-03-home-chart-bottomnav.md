# Plan 3: Home Screen Chart + Bottom Nav

**Phase:** 2 — Dashboard & Analytics
**Plan:** 3 of 4
**Goal:** Add a donut spending chart below the transaction list on the Home screen. Add a fixed bottom tab bar (Home | Reports) and wire up routing for the Reports page.

---

## Pre-conditions
- Plan 2 complete — store cache working, types added
- Recharts already installed (`recharts@2.12.7`)

## Success Criteria
- [ ] Bottom tab bar fixed at bottom with Home and Reports tabs
- [ ] Active tab highlighted; FAB only visible on Home tab
- [ ] Donut chart renders on Home screen below balance cards (above transaction list or at bottom — below list is fine)
- [ ] Chart shows expense categories only, with color-coded slices
- [ ] Legend below chart: category name + amount + percentage
- [ ] Chart shows "No expenses this month" state when expense total is 0
- [ ] `/reports` route exists and loads `ReportsPage` (can be placeholder for now)
- [ ] No TypeScript errors

---

## Tasks

### 3.1 Create `BottomNav` component (`src/components/BottomNav.tsx`)

```tsx
import { NavLink } from 'react-router-dom'

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 z-30 flex">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
            isActive ? 'text-green-600' : 'text-gray-400'
          }`
        }
      >
        <span className="text-xl mb-0.5">🏠</span>
        Home
      </NavLink>
      <NavLink
        to="/reports"
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
            isActive ? 'text-green-600' : 'text-gray-400'
          }`
        }
      >
        <span className="text-xl mb-0.5">📊</span>
        Reports
      </NavLink>
    </nav>
  )
}
```

### 3.2 Update `App.tsx` routing

Add `/reports` route:
```tsx
import ReportsPage from './pages/ReportsPage'
// ...
<Route path="/reports" element={user ? <ReportsPage /> : <Navigate to="/login" replace />} />
```

### 3.3 Create `SpendingChart` component (`src/components/SpendingChart.tsx`)

```tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { Category, Transaction } from '../types'
import { formatVND } from '../utils/format'

interface Props {
  transactions: Transaction[]
  categories: Category[]
}

export default function SpendingChart({ transactions, categories }: Props) {
  // Aggregate expenses by category
  const expenseTxs = transactions.filter((t) => t.type === 'expense')
  const total = expenseTxs.reduce((sum, t) => sum + t.amount, 0)

  if (total === 0) {
    return (
      <div className="mx-4 my-3 bg-white rounded-2xl p-6 text-center text-gray-400">
        <div className="text-3xl mb-2">📊</div>
        <p className="text-sm">No expenses this month</p>
      </div>
    )
  }

  const catMap = new Map(categories.map((c) => [c.id, c]))
  const grouped: Record<string, number> = {}
  for (const tx of expenseTxs) {
    grouped[tx.category_id] = (grouped[tx.category_id] ?? 0) + tx.amount
  }

  const data = Object.entries(grouped)
    .map(([catId, amount]) => ({
      catId,
      amount,
      name: catMap.get(catId)?.name ?? 'Other',
      color: catMap.get(catId)?.color ?? '#9CA3AF',
      pct: Math.round((amount / total) * 100),
    }))
    .sort((a, b) => b.amount - a.amount)

  return (
    <div className="mx-4 my-3 bg-white rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Spending by Category</h3>

      {/* Donut chart */}
      <div className="flex items-center gap-4">
        <div className="w-36 h-36 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                innerRadius={42}
                outerRadius={65}
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry) => (
                  <Cell key={entry.catId} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatVND(value), '']}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1.5 min-w-0">
          {data.map((entry) => (
            <div key={entry.catId} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs text-gray-600 truncate">{entry.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{entry.pct}%</span>
                </div>
                <p className="text-xs font-medium text-gray-800">{formatVND(entry.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 3.4 Integrate `SpendingChart` in `HomePage.tsx`

Add below `<BalanceSummary>` and above `<TransactionList>`:
```tsx
import SpendingChart from '../components/SpendingChart'
// ...
<BalanceSummary transactions={transactions} />
{!isLoadingTx && transactions.some(t => t.type === 'expense') && (
  <SpendingChart transactions={transactions} categories={categories} />
)}
```

### 3.5 Add `BottomNav` to both pages

In `HomePage.tsx` and `ReportsPage.tsx`, render `<BottomNav />` at the bottom (it's `position: fixed` so it renders over content — ensure `pb-24` on the scroll container to avoid content hidden behind it).

### 3.6 Update `HomePage.tsx` bottom padding

The existing `pb-24` class accounts for FAB. With BottomNav added, the nav is ~60px tall. Keep `pb-24` (96px) — this covers both the nav bar and the FAB.

---

## Notes
- `innerRadius` > 0 makes it a donut chart in Recharts
- `startAngle={90} endAngle={-270}` makes it start from the top (12 o'clock)
- Keep chart hidden when loading (avoid flash of empty chart)
- Total spending shown as center text is optional for now — add in Phase 3 polish
