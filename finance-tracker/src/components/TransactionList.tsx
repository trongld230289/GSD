import type { Category, Transaction } from '../types'
import { groupByDate, formatDisplay } from '../utils/date'
import TransactionItem from './TransactionItem'

interface Props {
  transactions: Transaction[]
  categories: Category[]
  onDeleteStart: (tx: Transaction) => void
}

export default function TransactionList({ transactions, categories, onDeleteStart }: Props) {
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))
  const groups = groupByDate(transactions)

  return (
    <div className="pb-4">
      {groups.map(({ date, items }) => (
        <div key={date}>
          {/* Date header */}
          <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {formatDisplay(date)}
            </span>
          </div>

          {/* Transactions for this date */}
          <div className="bg-white">
            {items.map((tx, idx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                category={catMap[tx.category_id]}
                isLast={idx === items.length - 1}
                onDeleteStart={onDeleteStart}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
