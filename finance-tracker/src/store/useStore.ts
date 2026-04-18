import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState, Category, Transaction, GoogleUser, BudgetEntry } from '../types'

// ─── Settings Store ───────────────────────────────────────────────────────────

interface SettingsStore {
  githubPAT: string
  setGithubPAT: (pat: string) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      githubPAT: '',
      setGithubPAT: (githubPAT) => set({ githubPAT }),
    }),
    { name: 'finance-settings' }
  )
)

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

// ─── Budget Store ─────────────────────────────────────────────────────────────

interface BudgetStore {
  budgets: BudgetEntry[]                        // raw from GAS for current budgetMonth
  budgetMonth: string                           // YYYY-MM currently viewing
  isLoadingBudgets: boolean
  budgetCache: Record<string, BudgetEntry[]>    // month-keyed cache, mirrors txCache pattern

  setBudgetMonth: (month: string) => void
  setBudgets: (month: string, entries: BudgetEntry[]) => void
  updateBudgetEntry: (month: string, category_id: string, budgeted: number) => void
  setLoadingBudgets: (v: boolean) => void
}

export const useBudgetStore = create<BudgetStore>()((set, get) => ({
  budgets: [],
  budgetMonth: new Date().toISOString().slice(0, 7),  // "YYYY-MM"
  isLoadingBudgets: false,
  budgetCache: {},

  setBudgetMonth: (month) => {
    const cached = get().budgetCache[month]
    set({ budgetMonth: month, budgets: cached ?? [] })
  },

  setBudgets: (month, entries) =>
    set((state) => ({
      budgets: entries,
      budgetCache: { ...state.budgetCache, [month]: entries },
    })),

  updateBudgetEntry: (month, category_id, budgeted) =>
    set((state) => {
      const existing = state.budgetCache[month] ?? []
      const updated = existing.some(e => e.category_id === category_id)
        ? existing.map(e => e.category_id === category_id ? { ...e, budgeted } : e)
        : [...existing, { category_id, budgeted }]
      return {
        budgets: state.budgetMonth === month ? updated : state.budgets,
        budgetCache: { ...state.budgetCache, [month]: updated },
      }
    }),

  setLoadingBudgets: (v) => set({ isLoadingBudgets: v }),
}))
