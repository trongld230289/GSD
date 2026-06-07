import { useMemo } from 'react'
import { useAppStore } from '../store/useStore'
import { subMonths, addMonths } from 'date-fns'
import { formatMonth } from '../utils/date'
import { formatVNDCompact } from '../utils/format'
import type { Transaction } from '../types'

interface Props {
  transactions: Transaction[]
}

export default function BalanceSummary({ transactions }: Props) {
  const { currentMonth, setCurrentMonth } = useAppStore()

  const { income, expense, net } = useMemo(() => {
    let income = 0, expense = 0
    for (const t of transactions) {
      if (t.type === 'income') income += t.amount
      else expense += t.amount
    }
    return { income, expense, net: income - expense }
  }, [transactions])

  const prev = () => setCurrentMonth(subMonths(currentMonth, 1))
  const next = () => {
    const candidate = addMonths(currentMonth, 1)
    if (candidate <= new Date()) setCurrentMonth(candidate)
  }
  const isCurrentMonth =
    currentMonth.getMonth() === new Date().getMonth() &&
    currentMonth.getFullYear() === new Date().getFullYear()

  return (
    <div>
      <div className="bg-green-600 px-4 pt-1 pb-8">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={prev}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/20 text-white text-2xl leading-none transition-colors"
          >
            ‹
          </button>
          <span className="text-white/80 font-semibold text-sm tracking-wide">
            {formatMonth(currentMonth)}
          </span>
          <button
            onClick={next}
            disabled={isCurrentMonth}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/20 text-white disabled:opacity-25 text-2xl leading-none transition-colors"
          >
            ›
          </button>
        </div>

        {/* Big balance */}
        <div className="text-center mb-6">
          <p className="text-white/50 text-[11px] uppercase tracking-[0.15em] mb-2 font-medium">
            Balance
          </p>
          <p className={`text-5xl font-bold tracking-tight leading-none ${
            net < 0 ? 'text-red-200' : 'text-white'
          }`}>
            {net < 0 ? '−' : ''}{formatVNDCompact(Math.abs(net))}
          </p>
        </div>

        {/* Income / Expense mini cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-5 h-5 rounded-full bg-green-400/40 flex items-center justify-center text-white text-[10px] font-bold">↓</div>
              <span className="text-white/60 text-xs font-medium">Income</span>
            </div>
            <p className="text-white font-bold text-lg leading-none">{formatVNDCompact(income)}</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-5 h-5 rounded-full bg-red-400/40 flex items-center justify-center text-white text-[10px] font-bold">↑</div>
              <span className="text-white/60 text-xs font-medium">Expense</span>
            </div>
            <p className="text-white font-bold text-lg leading-none">{formatVNDCompact(expense)}</p>
          </div>
        </div>
      </div>

      {/* Curved white reveal */}
      <div className="h-6 bg-gray-50 rounded-t-3xl -mt-4 shadow-[0_-6px_16px_rgba(0,0,0,0.08)]" />
    </div>
  )
}
