import { useEffect, useState } from 'react'
import { useAuthStore, useAppStore } from '../store/useStore'
import { apiGetTransactions, apiGetCategories, apiDeleteTransaction } from '../api/gas'
import { format } from 'date-fns'
import type { Transaction } from '../types'
import BalanceSummary from '../components/BalanceSummary'
import MonthNav from '../components/MonthNav'
import TransactionList from '../components/TransactionList'
import FAB from '../components/FAB'
import AddTransactionDrawer from '../components/AddTransactionDrawer'
import ConfirmDialog from '../components/ConfirmDialog'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import SpendingChart from '../components/SpendingChart'

export default function HomePage() {
  const { user, idToken, clearUser } = useAuthStore()
  const {
    transactions,
    categories,
    currentMonth,
    isLoadingTx,
    setTransactions,
    setCategories,
    setLoadingTx,
    removeTransaction,
    txCache,
    setCachedTransactions,
  } = useAppStore()

  const [catError, setCatError] = useState<string | null>(null)
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load categories once (no auth needed — categories are global)
  useEffect(() => {
    apiGetCategories()
      .then((cats) => { if (cats.length > 0) setCategories(cats) })
      .catch((err) => { console.error('Categories load failed:', err); setCatError(String(err)) })
  }, [setCategories])

  // Load transactions when month changes — use cache if available
  useEffect(() => {
    if (!idToken) return
    const month = format(currentMonth, 'yyyy-MM')
    if (txCache[month]) {
      setTransactions(txCache[month])
      return
    }
    setLoadingTx(true)
    apiGetTransactions(idToken, month)
      .then((txs) => {
        setTransactions(txs)
        setCachedTransactions(month, txs)
      })
      .catch(console.error)
      .finally(() => setLoadingTx(false))
  }, [idToken, currentMonth])

  const currentMonthKey = format(currentMonth, 'yyyy-MM')

  // Keep cache in sync whenever transactions change (add / edit / delete)
  useEffect(() => {
    if (!isLoadingTx) {
      setCachedTransactions(currentMonthKey, transactions)
    }
  }, [transactions, isLoadingTx])

  const handleDeleteConfirm = async () => {
    if (!deleteTx || !idToken) return
    setIsDeleting(true)
    try {
      await apiDeleteTransaction(idToken, deleteTx.id)
      removeTransaction(deleteTx.id)
      setDeleteTx(null)
    } catch (err) {
      console.error(err)
      alert('Failed to delete. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      <Header user={user} onSignOut={clearUser} />

      <div className="flex-1 overflow-y-auto pb-24">
        <MonthNav />
        <BalanceSummary transactions={transactions} />

        {!isLoadingTx && (
          <SpendingChart transactions={transactions} categories={categories} />
        )}

        {isLoadingTx ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-medium">No transactions this month</p>
            <p className="text-sm mt-1">Tap + to add your first one</p>
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            categories={categories}
            onDeleteStart={setDeleteTx}
          />
        )}
      </div>

      {catError && (
        <div className="fixed top-16 left-0 right-0 mx-4 bg-red-100 border border-red-300 text-red-700 text-xs p-2 rounded-lg z-50">
          API Error: {catError}
        </div>
      )}
      <FAB />
      <AddTransactionDrawer categories={categories} />
      <ConfirmDialog
        isOpen={!!deleteTx}
        title="Delete transaction?"
        message="This will permanently remove this transaction from your records."
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTx(null)}
        destructive
      />
      <BottomNav />
    </div>
  )
}
