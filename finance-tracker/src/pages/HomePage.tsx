import { useEffect } from 'react'
import { useAuthStore, useAppStore } from '../store/useStore'
import { apiGetTransactions, apiGetCategories } from '../api/gas'
import { format } from 'date-fns'
import BalanceSummary from '../components/BalanceSummary'
import MonthNav from '../components/MonthNav'
import TransactionList from '../components/TransactionList'
import FAB from '../components/FAB'
import AddTransactionDrawer from '../components/AddTransactionDrawer'
import Header from '../components/Header'

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
  } = useAppStore()

  // Load categories once
  useEffect(() => {
    if (!idToken || categories.length > 0) return
    apiGetCategories(idToken)
      .then(setCategories)
      .catch(console.error)
  }, [idToken, categories.length, setCategories])

  // Load transactions when month changes
  useEffect(() => {
    if (!idToken) return
    setLoadingTx(true)
    const month = format(currentMonth, 'yyyy-MM')
    apiGetTransactions(idToken, month)
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setLoadingTx(false))
  }, [idToken, currentMonth, setTransactions, setLoadingTx])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      <Header user={user} onSignOut={clearUser} />

      <div className="flex-1 overflow-y-auto pb-24">
        <MonthNav />
        <BalanceSummary transactions={transactions} />

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
          <TransactionList transactions={transactions} categories={categories} />
        )}
      </div>

      <FAB />
      <AddTransactionDrawer categories={categories} />
    </div>
  )
}
