import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useAuthStore, useAppStore } from '../store/useStore'
import { apiGetTransactions, apiGetMonthlyTotals, lastNMonths } from '../api/gas'
import type { MonthlyTotals, Transaction, Category } from '../types'
import { formatVND } from '../utils/format'
import MonthNav from '../components/MonthNav'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'

function shortVND(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(value)
}

function buildBreakdown(txs: Transaction[], catMap: Map<string, Category>) {
  const total = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
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

export default function ReportsPage() {
  const { user, idToken, clearUser } = useAuthStore()
  const { categories, currentMonth, txCache, setCachedTransactions } = useAppStore()

  const [trendRange, setTrendRange] = useState<3 | 6 | 12>(6)
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals[]>([])
  const [isLoadingChart, setIsLoadingChart] = useState(true)
  const [chartError, setChartError] = useState<string | null>(null)
  const [monthTxs, setMonthTxs] = useState<Transaction[]>([])
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false)

  // Re-fetch whenever idToken or trendRange changes
  useEffect(() => {
    if (!idToken) return
    const months = lastNMonths(trendRange)
    setIsLoadingChart(true)
    setChartError(null)
    apiGetMonthlyTotals(idToken, months)
      .then((data) => setMonthlyTotals([...data].reverse()))
      .catch((err) => {
        console.error('getMonthlyTotals failed:', err)
        setChartError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => setIsLoadingChart(false))
  }, [idToken, trendRange])

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
  }, [idToken, currentMonth, txCache, setCachedTransactions])

  const catMap = new Map(categories.map((c) => [c.id, c]))
  const breakdown = buildBreakdown(monthTxs, catMap)

  const trendLabel: Record<number, string> = { 3: '3-Month', 6: '6-Month', 12: '1-Year' }

  const chartData = monthlyTotals.map((d) => ({
    ...d,
    // For 12-month range show "Jan '25" to distinguish years; otherwise just "Jan"
    label: trendRange === 12
      ? format(new Date(d.month + '-01'), "MMM ''yy")
      : format(new Date(d.month + '-01'), 'MMM'),
  }))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      <Header user={user} onSignOut={clearUser} />

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Trend bar chart */}
        <div className="mx-4 mt-4 bg-white rounded-2xl p-4">
          {/* Header row: title + range pills */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{trendLabel[trendRange]} Trend</h3>
            <div className="flex gap-1">
              {([3, 6, 12] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setTrendRange(n)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    trendRange === n
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {n === 12 ? '1Y' : `${n}M`}
                </button>
              ))}
            </div>
          </div>
          {isLoadingChart ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chartError ? (
            <div className="py-8 text-center">
              <p className="text-xs text-red-500 font-medium">Failed to load chart</p>
              <p className="text-xs text-gray-400 mt-1 break-all px-2">{chartError}</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <p className="text-sm">No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barCategoryGap={trendRange === 12 ? '20%' : '30%'} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="label" tick={{ fontSize: trendRange === 12 ? 9 : 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={shortVND}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatVND(value),
                    name === 'income' ? 'Income' : 'Expense',
                  ]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend
                  formatter={(v) => (v === 'income' ? 'Income' : 'Expense')}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
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
              <div className="text-3xl mb-2">📊</div>
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
