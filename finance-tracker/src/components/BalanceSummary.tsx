import { useMemo } from 'react'
import type { Transaction } from '../types'
import { formatVND } from '../utils/format'

interface Props {
  transactions: Transaction[]
}

export default function BalanceSummary({ transactions }: Props) {
  const { income, expense, net } = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of transactions) {
      if (t.type === 'income') income += t.amount
      else expense += t.amount
    }
    return { income, expense, net: income - expense }
  }, [transactions])

  return (
    <div className="grid grid-cols-3 gap-2 p-4 bg-white border-b border-gray-100">
      <Card label="Income" amount={income} color="text-green-600" bg="bg-green-50" />
      <Card label="Expense" amount={expense} color="text-red-500" bg="bg-red-50" />
      <Card
        label="Balance"
        amount={net}
        color={net >= 0 ? 'text-blue-600' : 'text-orange-600'}
        bg="bg-blue-50"
      />
    </div>
  )
}

function Card({
  label,
  amount,
  color,
  bg,
}: {
  label: string
  amount: number
  color: string
  bg: string
}) {
  return (
    <div className={`${bg} rounded-xl p-3 text-center`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-bold ${color} leading-tight`}>
        {formatVND(Math.abs(amount))}
      </p>
    </div>
  )
}
