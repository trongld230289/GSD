import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { Category, Transaction } from '../types'
import { formatVND } from '../utils/format'

interface Props {
  transactions: Transaction[]
  categories: Category[]
}

export default function SpendingChart({ transactions, categories }: Props) {
  const expenseTxs = transactions.filter((t) => t.type === 'expense')
  const total = expenseTxs.reduce((sum, t) => sum + t.amount, 0)

  if (total === 0) return null

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

      <div className="flex items-center gap-4">
        {/* Donut chart */}
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
