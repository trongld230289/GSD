import type { Transaction, Category } from '../types'

/**
 * Generates an RFC 4180 CSV from the given transactions and triggers a browser download.
 *
 * @param transactions - Transactions to export (for the selected month)
 * @param categories   - All categories (used to resolve category_id to a human-readable name)
 * @param month        - 'YYYY-MM' string — used in the downloaded filename
 */
export function exportTransactionsCsv(
  transactions: Transaction[],
  categories: Category[],
  month: string
): void {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  const headers = ['Date', 'Type', 'Category', 'Amount (VND)', 'Note']

  const rows = transactions.map((tx) => [
    tx.date,
    tx.type,
    categoryMap.get(tx.category_id) ?? tx.category_id,
    String(tx.amount),
    tx.note ?? '',
  ])

  const csvContent =
    '\uFEFF' +
    [headers, ...rows]
      .map((row) => row.map(escapeCell).join(','))
      .join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `transactions-${month}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** RFC 4180 cell escaping: wrap in quotes if cell contains comma, quote, or newline. */
function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
