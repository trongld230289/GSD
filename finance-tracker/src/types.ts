// ─── Core Types ───────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  type: TransactionType
  icon: string
  color: string
  sort_order: number
}

export interface Transaction {
  id: string
  date: string            // ISO date string YYYY-MM-DD
  type: TransactionType
  category_id: string
  amount: number          // in VND (whole number)
  note: string
  created_at: string      // ISO datetime
  user_email: string
}

export interface MonthlyBalance {
  income: number
  expense: number
  net: number
}

export interface MonthlyTotals {
  month: string   // "YYYY-MM"
  income: number
  expense: number
}

// ─── Store Shape ──────────────────────────────────────────────────────────────

export interface AuthState {
  user: GoogleUser | null
  idToken: string | null
  isLoading: boolean
}

export interface GoogleUser {
  email: string
  name: string
  picture: string
  sub: string
}

// ─── API Shapes ───────────────────────────────────────────────────────────────

export interface GasResponse<T> {
  ok: boolean
  data?: T
  error?: string
}

// ─── Budget Types ─────────────────────────────────────────────────────────────

// Raw entry as stored in GAS / returned by getBudgets
export interface BudgetEntry {
  category_id: string
  budgeted: number   // VND, whole integer
}

// Computed row for budget UI display
export interface BudgetRow {
  category: Category
  budgeted: number
  spent: number
  available: number   // budgeted - spent; negative = overspent
}
