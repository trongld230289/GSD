# Plan 4: Reports Page

**Phase:** 2 — Dashboard & Analytics
**Plan:** 4 of 4
**Goal:** Build the Reports page with a 6-month income vs expense bar chart (using `getMonthlyTotals`) and a per-category spending breakdown list for the selected month.

---

## Pre-conditions
- Plans 1–3 complete
- `apiGetMonthlyTotals`, `MonthlyTotals` type, `lastNMonths` helper all exist
- `BottomNav` is wired and `/reports` route exists

## Success Criteria
- [ ] Reports page loads when tapping Reports tab
- [ ] 6-month bar chart renders with green (income) and red (expense) bars side-by-side
- [ ] X-axis shows short month labels (e.g. "Nov", "Dec", "Jan")
- [ ] Y-axis values formatted in millions (e.g. "1M", "2.5M")
- [ ] Loading spinner shown while fetching 6-month data
- [ ] Per-category breakdown list below chart, sorted by amount (highest first)
- [ ] Month navigation on Reports page changes breakdown list (same MonthNav component)
- [ ] Empty state shown if no data for selected month
- [ ] No TypeScript errors

---

## Tasks

### 4.1 Create `ReportsPage` (`src/pages/ReportsPage.tsx`)

```tsx
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useAuthStore, useAppStore } from '../store/useStore'
import { apiGetTransactions, apiGetMonthlyTotals, lastNMonths } from '../api/gas'
import type { MonthlyTotals, Transaction, Category } from '../types'
import { formatVND } from '../utils/format'
import MonthNav from '../components/MonthNav'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'

// ─── Y-axis formatter ────────────────────────────────────────────────────────
function shortVND(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(value)
}

export default function ReportsPage() {
  const { user, idToken, clearUser } = useAuthStore()
  const { categories, currentMonth, txCache, setCachedTransactions } = useAppStore()

  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals[]>([])
  const [isLoadingChart, setIsLoadingChart] = useState(true)
  const [monthTxs, setMonthTxs] = useState<Transaction[]>([])
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false)

  // Fetch 6-month totals once on mount
  useEffect(() => {
    if (!idToken) return
    const months = lastNMonths(6)
    setIsLoadingChart(true)
    apiGetMonthlyTotals(idToken, months)
      .then((data) => {
        // Sort chronologically (oldest first for chart)
        setMonthlyTotals([...data].reverse())
      })
      .catch(console.error)
      .finally(() => setIsLoadingChart(false))
  }, [idToken])

  // Fetch current month transactions for breakdown (with cache)
  useEffect(() => {
    if (!idToken) return
    const month = format(currentMonth, 'yyyy-MM')
    if (txCache[month]) {
      setMonthTxs(txCache[month])
      return
    }
    setIsLoadingBreakdown(true)
    apiGetTransactions(idToken, month)
      .then((txs) => {
        setMonthTxs(txs)
        setCachedTransactions(month, txs)
      })
      .catch(console.error)
      .finally(() => setIsLoadingBreakdown(false))
  }, [idToken, currentMonth])

  // Per-category breakdown from monthTxs
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const breakdown = buildBreakdown(monthTxs, catMap)

  // Chart data: add short month label
  const chartData = monthlyTotals.map((d) => ({
    ...d,
    label: format(new Date(d.month + '-01'), 'MMM'),
  }))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      <Header user={user} onSignOut={clearUser} />

      <div className="flex-1 overflow-y-auto pb-24">
        {/* 6-month trend bar chart */}
        <div className="mx-4 mt-4 bg-white rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">6-Month Trend</h3>
          {isLoadingChart ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barCategoryGap="30%" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={shortVND} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  formatter={(value: number, name: string) => [formatVND(value), name === 'income' ? 'Income' : 'Expense']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend formatter={(v) => v === 'income' ? 'Income' : 'Expense'} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="income" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Per-category breakdown */}
        <MonthNav />
        <div className="mx-4 mb-4 bg-white rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Spending Breakdown</h3>
          </div>
          {isLoadingBreakdown ? (
            <div className="flex justify-center py-8">
              <div className="w-7 h-7 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : breakdown.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-sm">No expenses this month</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {breakdown.map((item) => (
                <div key={item.catId} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: item.color + '22' }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      <span className="text-sm font-semibold text-gray-900">{formatVND(item.amount)}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{item.pct}% of total expenses</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

// ─── Helper ──────────────────────────────────────────────────────────────────
function buildBreakdown(
  txs: Transaction[],
  catMap: Map<string, Category>
) {
  const total = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  if (total === 0) return []

  const grouped: Record<string, number> = {}
  for (const tx of txs) {
    if (tx.type !== 'expense') continue
    grouped[tx.category_id] = (grouped[tx.category_id] ?? 0) + tx.amount
  }

  return Object.entries(grouped)
    .map(([catId, amount]) => ({
      catId,
      amount,
      name: catMap.get(catId)?.name ?? 'Other',
      icon: catMap.get(catId)?.icon ?? '📝',
      color: catMap.get(catId)?.color ?? '#9CA3AF',
      pct: Math.round((amount / total) * 100),
    }))
    .sort((a, b) => b.amount - a.amount)
}
```

### 4.2 Verify final TypeScript

```bash
cd finance-tracker && npx tsc --noEmit
```

### 4.3 Build and smoke test locally

```bash
npm run dev
```

- Open `http://localhost:5173/GSD/`
- Check Home tab → donut chart visible
- Check Reports tab → bar chart + breakdown list
- Toggle months → breakdown updates

---

## Notes
- `lastNMonths(6)` returns months newest-first; reverse for chart so oldest is on the left
- `barCategoryGap` and `barGap` control spacing between groups and within groups
- `shortVND` on Y-axis keeps labels readable on narrow mobile screens
- The `MonthNav` on Reports only controls the breakdown list, NOT the 6-month chart (chart always shows last 6 from today)
- If `getMonthlyTotals` is slow on first call (GAS cold start), the spinner makes it feel intentional
