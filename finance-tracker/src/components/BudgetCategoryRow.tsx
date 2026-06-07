import { useEffect, useRef, useState, useCallback } from 'react'
import type { BudgetRow } from '../types'
import { apiSetBudget } from '../api/gas'
import { formatVND, parseVNDInput } from '../utils/format'

interface BudgetCategoryRowProps {
  row: BudgetRow
  month: string
  token: string
  onSaved: (category_id: string, budgeted: number) => void
}

function formatInput(value: number): string {
  if (value === 0) return '0'
  return value.toLocaleString('vi-VN')
}

export default function BudgetCategoryRow({ row, month, token, onSaved }: BudgetCategoryRowProps) {
  const [inputStr, setInputStr] = useState(formatInput(row.budgeted))
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  // Ref tracks latest parsed value to avoid stale closure on blur
  const pendingValue = useRef(row.budgeted)

  useEffect(() => {
    pendingValue.current = row.budgeted
    setInputStr(formatInput(row.budgeted))
  }, [row.budgeted])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseVNDInput(e.target.value)
    pendingValue.current = raw
    setInputStr(formatInput(raw))
  }

  const handleFocus = () => {
    inputRef.current?.select()
  }

  const handleSave = useCallback(async () => {
    const value = pendingValue.current
    setInputStr(formatInput(value))
    if (value === row.budgeted) return
    setIsSaving(true)
    try {
      await apiSetBudget(token, month, row.category.id, value)
      onSaved(row.category.id, value)
    } catch {
      pendingValue.current = row.budgeted
      setInputStr(formatInput(row.budgeted))
    } finally {
      setIsSaving(false)
    }
  }, [token, month, row.budgeted, row.category.id, onSaved])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') e.currentTarget.blur()
  }

  const isOverspent = row.available < 0
  const pct = row.budgeted > 0 ? Math.min((row.spent / row.budgeted) * 100, 100) : 0
  const isOver100 = row.budgeted > 0 && row.spent > row.budgeted

  return (
    <div className="px-4 py-3 border-b border-gray-100 last:border-0">
      {/* Line 1: icon + name + input */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl flex-shrink-0">{row.category.icon}</span>
        <span className="flex-1 text-sm font-semibold text-gray-800">{row.category.name}</span>
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={inputStr}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`w-24 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-opacity ${
              isSaving ? 'opacity-40' : ''
            }`}
            disabled={isSaving}
          />
          <span className="text-xs text-gray-400">đ</span>
        </div>
      </div>

      {/* Line 2: progress bar + spent / left */}
      <div className="ml-8">
        {row.budgeted > 0 && (
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOver100 ? 'bg-red-400' : 'bg-green-400'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">
            {row.spent > 0 ? `Spent ${formatVND(row.spent)}` : 'No spending yet'}
          </span>
          {row.budgeted > 0 && (
            <span className={`font-medium ${isOverspent ? 'text-red-500' : 'text-green-600'}`}>
              {isOverspent
                ? `Over ${formatVND(Math.abs(row.available))}`
                : `Left ${formatVND(row.available)}`}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
