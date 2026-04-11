import type { Category, GasResponse, MonthlyTotals, Transaction } from '../types'
import { format, subMonths } from 'date-fns'

export function lastNMonths(n: number): string[] {
  return Array.from({ length: n }, (_, i) =>
    format(subMonths(new Date(), i), 'yyyy-MM')
  )
}

const GAS_URL =
  'https://script.google.com/macros/s/AKfycbx7NcOGdYgPjTc0UetmluXlc1g2wEzy2Xk8raL-7bH4y9R9m7uCQq1bU4PyRLfEamzX/exec'

// GAS requires Content-Type: text/plain to avoid CORS preflight on POST
async function gasPost<T>(
  payload: Record<string, unknown>
): Promise<GasResponse<T>> {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  })
  const json = await res.json()
  return json as GasResponse<T>
}

async function gasGet<T>(params: Record<string, string>): Promise<GasResponse<T>> {
  const url = new URL(GAS_URL)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { redirect: 'follow' })
  const json = await res.json()
  return json as GasResponse<T>
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function apiGetCategories(): Promise<Category[]> {
  const res = await gasGet<Category[]>({ action: 'getCategories' })
  if (!res.ok) throw new Error(res.error ?? 'Failed to load categories')
  return res.data ?? []
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function apiGetTransactions(
  token: string,
  month: string  // YYYY-MM
): Promise<Transaction[]> {
  const [year, mon] = month.split('-')
  const res = await gasGet<Transaction[]>({
    action: 'getTransactions',
    token,
    month: mon,
    year,
  })
  if (!res.ok) throw new Error(res.error ?? 'Failed to load transactions')
  return res.data ?? []
}

export async function apiAddTransaction(
  token: string,
  tx: Omit<Transaction, 'id' | 'created_at' | 'user_email'>
): Promise<Transaction> {
  const res = await gasPost<{ id: string; success: boolean }>({ action: 'addTransaction', token, ...tx })
  if (!res.ok || !res.data) throw new Error(res.error ?? 'Failed to add transaction')
  // GAS returns {id, success} — reconstruct full transaction for local state
  return {
    ...tx,
    id: res.data.id,
    created_at: new Date().toISOString(),
    user_email: '',
  } as Transaction
}

export async function apiUpdateTransaction(
  token: string,
  tx: Pick<Transaction, 'id' | 'date' | 'type' | 'category_id' | 'amount' | 'note'>
): Promise<Transaction> {
  const res = await gasPost<{ success: boolean }>({ action: 'updateTransaction', token, data: tx })
  if (!res.ok || !res.data) throw new Error(res.error ?? 'Failed to update transaction')
  // GAS returns {success} — reconstruct from input for local state
  return tx as unknown as Transaction
}

export async function apiDeleteTransaction(
  token: string,
  id: string
): Promise<void> {
  const res = await gasPost<void>({ action: 'deleteTransaction', token, id })
  if (!res.ok) throw new Error(res.error ?? 'Failed to delete transaction')
}

// ─── Monthly Totals ───────────────────────────────────────────────────────────

export async function apiGetMonthlyTotals(
  token: string,
  months: string[]  // ["YYYY-MM", ...]
): Promise<MonthlyTotals[]> {
  const res = await gasGet<MonthlyTotals[]>({
    action: 'getMonthlyTotals',
    token,
    months: months.join(','),
  })
  if (!res.ok) throw new Error(res.error ?? 'Failed to load monthly totals')
  return res.data ?? []
}
