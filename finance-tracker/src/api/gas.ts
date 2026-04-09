import type { Category, GasResponse, Transaction } from '../types'

const GAS_URL =
  'https://script.google.com/macros/s/AKfycbysl0gDewDC6fr-7eiqpO0nlK5olVbNyy5DnGghkSSpDdQcB01MHOy3XLCrSUYo66Ui/exec'

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

export async function apiGetCategories(
  token: string
): Promise<Category[]> {
  const res = await gasGet<Category[]>({ action: 'getCategories', token })
  if (!res.ok) throw new Error(res.error ?? 'Failed to load categories')
  return res.data ?? []
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function apiGetTransactions(
  token: string,
  month: string  // YYYY-MM
): Promise<Transaction[]> {
  const res = await gasGet<Transaction[]>({
    action: 'getTransactions',
    token,
    month,
  })
  if (!res.ok) throw new Error(res.error ?? 'Failed to load transactions')
  return res.data ?? []
}

export async function apiAddTransaction(
  token: string,
  tx: Omit<Transaction, 'id' | 'created_at' | 'user_email'>
): Promise<Transaction> {
  const res = await gasPost<Transaction>({ action: 'addTransaction', token, ...tx })
  if (!res.ok || !res.data) throw new Error(res.error ?? 'Failed to add transaction')
  return res.data
}

export async function apiUpdateTransaction(
  token: string,
  tx: Pick<Transaction, 'id' | 'date' | 'type' | 'category_id' | 'amount' | 'note'>
): Promise<Transaction> {
  const res = await gasPost<Transaction>({ action: 'updateTransaction', token, ...tx })
  if (!res.ok || !res.data) throw new Error(res.error ?? 'Failed to update transaction')
  return res.data
}

export async function apiDeleteTransaction(
  token: string,
  id: string
): Promise<void> {
  const res = await gasPost<void>({ action: 'deleteTransaction', token, id })
  if (!res.ok) throw new Error(res.error ?? 'Failed to delete transaction')
}
