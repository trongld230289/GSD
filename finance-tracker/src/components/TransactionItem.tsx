import { useRef, useState } from 'react'
import type { Category, Transaction } from '../types'
import { formatVND } from '../utils/format'
import { useAuthStore, useAppStore } from '../store/useStore'
import { apiDeleteTransaction } from '../api/gas'

interface Props {
  transaction: Transaction
  category: Category | undefined
  isLast: boolean
}

export default function TransactionItem({ transaction, category, isLast }: Props) {
  const { idToken } = useAuthStore()
  const { removeTransaction, openDrawer } = useAppStore()
  const [swipeX, setSwipeX] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const startX = useRef(0)
  const isDragging = useRef(false)

  const SWIPE_THRESHOLD = 60

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    isDragging.current = true
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const dx = startX.current - e.touches[0].clientX
    if (dx > 0) {
      setSwipeX(Math.min(dx, 80))
    } else {
      // swipe right — close the delete reveal
      setSwipeX(Math.max(0, swipeX + dx))
    }
  }

  const handleTouchEnd = () => {
    isDragging.current = false
    if (swipeX < SWIPE_THRESHOLD) setSwipeX(0)
  }

  const handleDelete = async () => {
    if (!idToken) return
    if (!window.confirm('Delete this transaction?')) {
      setSwipeX(0)
      return
    }
    setIsDeleting(true)
    try {
      await apiDeleteTransaction(idToken, transaction.id)
      removeTransaction(transaction.id)
    } catch (err) {
      console.error(err)
      setIsDeleting(false)
      setSwipeX(0)
    }
  }

  const handleTap = () => {
    if (swipeX > 0) {
      setSwipeX(0)
      return
    }
    openDrawer(transaction)
  }

  const isIncome = transaction.type === 'income'
  const icon = category?.icon ?? '📝'
  const color = category?.color ?? '#9CA3AF'

  return (
    <div className={`relative overflow-hidden ${!isLast ? 'border-b border-gray-100' : ''}`}>
      {/* Delete button (revealed on swipe) */}
      <div
        className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center"
        onClick={handleDelete}
      >
        {isDeleting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="text-white text-sm font-medium">Delete</span>
        )}
      </div>

      {/* Transaction row */}
      <div
        className="relative bg-white flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-all"
        style={{ transform: `translateX(-${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        {/* Category icon circle */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
          style={{ backgroundColor: color + '22' }}
        >
          {icon}
        </div>

        {/* Name + note */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 text-sm truncate">
            {category?.name ?? transaction.category_id}
          </p>
          {transaction.note && (
            <p className="text-xs text-gray-400 truncate">{transaction.note}</p>
          )}
        </div>

        {/* Amount */}
        <p className={`font-semibold text-sm flex-shrink-0 ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
          {isIncome ? '+' : '-'}{formatVND(transaction.amount)}
        </p>
      </div>
    </div>
  )
}
