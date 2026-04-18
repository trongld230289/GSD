import { useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { useAuthStore, useAppStore, useBudgetStore } from '../store/useStore'
import { apiGetBudgets, apiGetTransactions } from '../api/gas'
import { formatVND } from '../utils/format'
import type { BudgetEntry, BudgetRow, Category, Transaction } from '../types'
import MonthNav from '../components/MonthNav'
import BudgetCategoryRow from '../components/BudgetCategoryRow'
import BottomNav from '../components/BottomNav'
import Header from '../components/Header'

function computeBudgetRows(
  budgets: BudgetEntry[],
  transactions: Transaction[],
  categories: Category[]
): BudgetRow[] {
  return categories
    .filter((c) => c.type === 'expense')
    .map((cat) => {
      const budgeted = budgets.find((b) => b.category_id === cat.id)?.budgeted ?? 0
      const spent = transactions
        .filter((t) => t.type === 'expense' && t.category_id === cat.id)
        .reduce((sum, t) => sum + t.amount, 0)
      return { category: cat, budgeted, spent, available: budgeted - spent }
    })
}

export default function BudgetPage() {
  const { user, idToken, clearUser } = useAuthStore()
  const {
    transactions,
    categories,
    currentMonth,
    txCache,
    setTransactions,
    setLoadingTx,
    setCachedTransactions,
  } = useAppStore()
  const {
    budgets,
    isLoadingBudgets,
    budgetCache,
    setBudgets,
    updateBudgetEntry,
    setLoadingBudgets,
  } = useBudgetStore()

  const monthKey = format(currentMonth, 'yyyy-MM')

  // Load budgets for the current month — use cache if available
  useEffect(() => {
    if (!idToken) return
    if (budgetCache[monthKey]) {
      setBudgets(monthKey, budgetCache[monthKey])
      return
    }
    setLoadingBudgets(true)
    apiGetBudgets(idToken, monthKey)
      .then((entries) => {
        setBudgets(monthKey, entries)
      })
      .catch(console.error)
      .finally(() => setLoadingBudgets(false))
  }, [idToken, monthKey])

  // Ensure transactions are loaded for this month — use cache if available
  useEffect(() => {
    if (!idToken) return
    if (txCache[monthKey]) {
      setTransactions(txCache[monthKey])
      return
    }
    setLoadingTx(true)
    apiGetTransactions(idToken, monthKey)
      .then((txs) => {
        setTransactions(txs)
        setCachedTransactions(monthKey, txs)
      })
      .catch(console.error)
      .finally(() => setLoadingTx(false))
  }, [idToken, monthKey])

  // Computed rows — only expense categories
  const budgetRows = useMemo(
    () => computeBudgetRows(budgets, transactions, categories),
    [budgets, transactions, categories]
  )

  // Ready to Assign calculations
  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  )

  const totalBudgeted = useMemo(
    () => budgetRows.reduce((sum, r) => sum + r.budgeted, 0),
    [budgetRows]
  )

  const readyToAssign = totalIncome - totalBudgeted

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      <Header user={user} onSignOut={clearUser} />

      <div className="pb-24">
        {/* Page title */}
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-xl font-bold text-gray-800">Budget</h1>
        </div>

        {/* Month navigation */}
        <MonthNav />

        {/* Ready to Assign banner */}
        <div className="mx-4 my-4">
          {readyToAssign >= 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">
                Ready to Assign
              </div>
              <div className="text-lg font-bold text-green-700">
                {formatVND(readyToAssign)}
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="text-xs text-red-600 font-medium uppercase tracking-wide mb-1">
                Over-budgeted by
              </div>
              <div className="text-lg font-bold text-red-700">
                {formatVND(Math.abs(readyToAssign))}
              </div>
            </div>
          )}
        </div>

        {/* Column headers */}
        <div className="flex items-center px-4 pb-1 gap-2">
          <div className="flex-1 text-xs text-gray-400">Category</div>
          <div className="w-28 text-right text-xs text-gray-400">Budgeted</div>
          <div className="w-24 text-right text-xs text-gray-400">Spent</div>
          <div className="w-24 text-right text-xs text-gray-400">Available</div>
        </div>

        {/* Budget rows */}
        {isLoadingBudgets ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : budgetRows.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-medium">No expense categories yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl mx-4 shadow-sm overflow-hidden">
            {budgetRows.map((row) => (
              <BudgetCategoryRow
                key={row.category.id}
                row={row}
                month={monthKey}
                token={idToken ?? ''}
                onSaved={(category_id, budgeted) =>
                  updateBudgetEntry(monthKey, category_id, budgeted)
                }
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
