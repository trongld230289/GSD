import { useAppStore } from '../store/useStore'
import { subMonths, addMonths } from 'date-fns'
import { formatMonth } from '../utils/date'

export default function MonthNav() {
  const { currentMonth, setCurrentMonth } = useAppStore()

  const prev = () => setCurrentMonth(subMonths(currentMonth, 1))
  const next = () => {
    const candidate = addMonths(currentMonth, 1)
    if (candidate <= new Date()) setCurrentMonth(candidate)
  }
  const isCurrentMonth =
    currentMonth.getMonth() === new Date().getMonth() &&
    currentMonth.getFullYear() === new Date().getFullYear()

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
      <button
        onClick={prev}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-600"
      >
        ‹
      </button>
      <span className="font-semibold text-gray-800">
        {formatMonth(currentMonth)}
      </span>
      <button
        onClick={next}
        disabled={isCurrentMonth}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-600 disabled:opacity-30"
      >
        ›
      </button>
    </div>
  )
}
