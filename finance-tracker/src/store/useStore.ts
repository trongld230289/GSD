import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState, Category, Transaction, GoogleUser } from '../types'

// ─── Auth Store ───────────────────────────────────────────────────────────────

interface AuthStore extends AuthState {
  setUser: (user: GoogleUser, idToken: string) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      idToken: null,
      isLoading: false,
      setUser: (user, idToken) => set({ user, idToken }),
      clearUser: () => set({ user: null, idToken: null }),
    }),
    { name: 'finance-auth' }
  )
)

// ─── App Store ────────────────────────────────────────────────────────────────

interface AppStore {
  transactions: Transaction[]
  categories: Category[]
  currentMonth: Date
  isLoadingTx: boolean
  isDrawerOpen: boolean
  editingTransaction: Transaction | null
  txCache: Record<string, Transaction[]>

  setTransactions: (txs: Transaction[]) => void
  addTransaction: (tx: Transaction) => void
  updateTransaction: (tx: Transaction) => void
  removeTransaction: (id: string) => void
  setCategories: (cats: Category[]) => void
  setCurrentMonth: (date: Date) => void
  setLoadingTx: (v: boolean) => void
  openDrawer: (tx?: Transaction) => void
  closeDrawer: () => void
  setCachedTransactions: (month: string, txs: Transaction[]) => void
  invalidateCache: (month: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  transactions: [],
  categories: [],
  currentMonth: new Date(),
  isLoadingTx: false,
  isDrawerOpen: false,
  editingTransaction: null,
  txCache: {},

  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (tx) =>
    set((s) => ({ transactions: [tx, ...s.transactions] })),
  updateTransaction: (tx) =>
    set((s) => ({
      transactions: s.transactions.map((t) => (t.id === tx.id ? tx : t)),
    })),
  removeTransaction: (id) =>
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
  setCategories: (categories) => set({ categories }),
  setCurrentMonth: (date) => set({ currentMonth: date }),
  setLoadingTx: (v) => set({ isLoadingTx: v }),
  openDrawer: (tx) =>
    set({ isDrawerOpen: true, editingTransaction: tx ?? null }),
  closeDrawer: () =>
    set({ isDrawerOpen: false, editingTransaction: null }),
  setCachedTransactions: (month, txs) =>
    set((s) => ({ txCache: { ...s.txCache, [month]: txs } })),
  invalidateCache: (month) =>
    set((s) => {
      const { [month]: _, ...rest } = s.txCache
      return { txCache: rest }
    }),
}))
