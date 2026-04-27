import { useEffect, useState } from 'react'
import type { BudgetRow } from '../types'
import { apiSetBudget } from '../api/gas'
import { formatVND } from '../utils/format'

interface BudgetCategoryRowProps {
  row: BudgetRow
  month: string          // YYYY-MM — passed down for apiSetBudget call
  token: string
  onSaved: (category_id: string, budgeted: number) => void  // called after successful save
}

export default function BudgetCategoryRow({ row, month, token, onSaved }: BudgetCategoryRowProps) {
  const [localValue, setLocalValue] = useState<number>(row.budgeted)
  const [isSaving, setIsSaving] = useState(false)

  // Sync local state when row.budgeted changes externally (e.g. month change)
  useEffect(() => {
    setLocalValue(row.budgeted)
  }, [row.budgeted])

  const handleSave = async () => {
    if (localValue === row.budgeted) return  // no change, skip API call
    setIsSaving(true)
    try {
      await apiSetBudget(token, month, row.category.id, localValue)
      onSaved(row.category.id, localValue)
    } catch (err) {
      console.error('Failed to save budget:', err)
      // Revert to original on error
      setLocalValue(row.budgeted)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  const isOverspent = row.available < 0

  return (
    <div className="flex items-center px-4 py-3 border-b border-gray-50 gap-2">
      {/* Category icon + name */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-lg flex-shrink-0">{row.category.icon}</span>
        <span className="text-sm font-medium text-gray-700 truncate">{row.category.name}</span>
      </div>

      {/* Budgeted input */}
      <input
        type="number"
        inputMode="numeric"
        value={localValue}
        onChange={(e) => setLocalValue(Number(e.target.value))}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`w-28 text-right border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-400 transition-opacity ${
          isSaving ? 'opacity-50' : 'opacity-100'
        }`}
        disabled={isSaving}
      />

      {/* Spent (read-only) */}
      <div className="w-24 text-right text-xs text-gray-600">
        {formatVND(row.spent)}
      </div>

      {/* Available (read-only) */}
      <div className={`w-24 text-right text-xs font-medium ${
        isOverspent ? 'text-red-500' : 'text-green-600'
      }`}>
        {formatVND(row.available)}
      </div>
    </div>
  )
}
