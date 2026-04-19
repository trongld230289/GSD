import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Transaction, Category } from '../types'

// We need to mock DOM APIs before importing the module
const mockClick = vi.fn()
const mockAppendChild = vi.fn()
const mockRemoveChild = vi.fn()
const mockRevokeObjectURL = vi.fn()
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')

beforeEach(() => {
  vi.clearAllMocks()

  // Mock document.createElement to return a fake anchor
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') {
      return {
        href: '',
        download: '',
        click: mockClick,
      } as unknown as HTMLAnchorElement
    }
    return document.createElement(tag)
  })

  vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild)
  vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild)

  global.URL.createObjectURL = mockCreateObjectURL
  global.URL.revokeObjectURL = mockRevokeObjectURL
})

const categories: Category[] = [
  { id: 'cat-food', name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#f00', sort_order: 1 },
  { id: 'cat-salary', name: 'Salary', type: 'income', icon: '💰', color: '#0f0', sort_order: 2 },
]

const transactions: Transaction[] = [
  {
    id: 'tx-1',
    date: '2024-01-15',
    type: 'expense',
    category_id: 'cat-food',
    amount: 150000,
    note: 'Lunch',
    created_at: '2024-01-15T10:00:00Z',
    user_email: 'test@example.com',
  },
  {
    id: 'tx-2',
    date: '2024-01-01',
    type: 'income',
    category_id: 'cat-salary',
    amount: 5000000,
    note: 'Monthly salary',
    created_at: '2024-01-01T08:00:00Z',
    user_email: 'test@example.com',
  },
]

// ---- tests ----

describe('exportTransactionsCsv', () => {
  it('should trigger a browser download', async () => {
    const { exportTransactionsCsv } = await import('./exportCsv')
    exportTransactionsCsv(transactions, categories, '2024-01')
    expect(mockClick).toHaveBeenCalledTimes(1)
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1)
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('sets download filename to transactions-YYYY-MM.csv', async () => {
    const { exportTransactionsCsv } = await import('./exportCsv')
    let capturedDownload = ''
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const el = { href: '', download: '', click: mockClick }
        Object.defineProperty(el, 'download', {
          get: () => capturedDownload,
          set: (v: string) => { capturedDownload = v },
        })
        return el as unknown as HTMLAnchorElement
      }
      return document.createElement(tag)
    })
    exportTransactionsCsv(transactions, categories, '2024-01')
    expect(capturedDownload).toBe('transactions-2024-01.csv')
  })

  it('CSV starts with UTF-8 BOM', async () => {
    const { exportTransactionsCsv } = await import('./exportCsv')
    let capturedBlob: Blob | null = null
    global.URL.createObjectURL = (blob: Blob) => {
      capturedBlob = blob
      return 'blob:mock-url'
    }
    exportTransactionsCsv(transactions, categories, '2024-01')
    expect(capturedBlob).not.toBeNull()
    const text = await capturedBlob!.text()
    expect(text.startsWith('\uFEFF')).toBe(true)
  })

  it('CSV has correct header row', async () => {
    const { exportTransactionsCsv } = await import('./exportCsv')
    let capturedBlob: Blob | null = null
    global.URL.createObjectURL = (blob: Blob) => {
      capturedBlob = blob
      return 'blob:mock-url'
    }
    exportTransactionsCsv(transactions, categories, '2024-01')
    const text = await capturedBlob!.text()
    const lines = text.slice(1).split('\r\n') // skip BOM
    expect(lines[0]).toBe('Date,Type,Category,Amount (VND),Note')
  })

  it('uses category name (not ID) in CSV', async () => {
    const { exportTransactionsCsv } = await import('./exportCsv')
    let capturedBlob: Blob | null = null
    global.URL.createObjectURL = (blob: Blob) => {
      capturedBlob = blob
      return 'blob:mock-url'
    }
    exportTransactionsCsv(transactions, categories, '2024-01')
    const text = await capturedBlob!.text()
    expect(text).toContain('Food & Dining')
    expect(text).not.toContain('cat-food')
  })

  it('falls back to raw category_id if no match', async () => {
    const { exportTransactionsCsv } = await import('./exportCsv')
    let capturedBlob: Blob | null = null
    global.URL.createObjectURL = (blob: Blob) => {
      capturedBlob = blob
      return 'blob:mock-url'
    }
    const txUnknown: Transaction[] = [
      { ...transactions[0], category_id: 'unknown-cat' },
    ]
    exportTransactionsCsv(txUnknown, categories, '2024-01')
    const text = await capturedBlob!.text()
    expect(text).toContain('unknown-cat')
  })

  it('escapes cells containing commas with double quotes', async () => {
    const { exportTransactionsCsv } = await import('./exportCsv')
    let capturedBlob: Blob | null = null
    global.URL.createObjectURL = (blob: Blob) => {
      capturedBlob = blob
      return 'blob:mock-url'
    }
    const txComma: Transaction[] = [
      { ...transactions[0], note: 'Coffee, pastry' },
    ]
    exportTransactionsCsv(txComma, categories, '2024-01')
    const text = await capturedBlob!.text()
    expect(text).toContain('"Coffee, pastry"')
  })

  it('escapes double-quote characters inside cells as two double-quotes', async () => {
    const { exportTransactionsCsv } = await import('./exportCsv')
    let capturedBlob: Blob | null = null
    global.URL.createObjectURL = (blob: Blob) => {
      capturedBlob = blob
      return 'blob:mock-url'
    }
    const txQuote: Transaction[] = [
      { ...transactions[0], note: 'He said "hello"' },
    ]
    exportTransactionsCsv(txQuote, categories, '2024-01')
    const text = await capturedBlob!.text()
    expect(text).toContain('"He said ""hello"""')
  })

  it('uses CRLF line endings', async () => {
    const { exportTransactionsCsv } = await import('./exportCsv')
    let capturedBlob: Blob | null = null
    global.URL.createObjectURL = (blob: Blob) => {
      capturedBlob = blob
      return 'blob:mock-url'
    }
    exportTransactionsCsv(transactions, categories, '2024-01')
    const text = await capturedBlob!.text()
    // Should have CRLF separators (not just LF)
    expect(text).toContain('\r\n')
  })

  it('produces only header row for empty transactions array', async () => {
    const { exportTransactionsCsv } = await import('./exportCsv')
    let capturedBlob: Blob | null = null
    global.URL.createObjectURL = (blob: Blob) => {
      capturedBlob = blob
      return 'blob:mock-url'
    }
    exportTransactionsCsv([], categories, '2024-01')
    const text = await capturedBlob!.text()
    const lines = text.slice(1).split('\r\n').filter(Boolean) // skip BOM
    expect(lines).toHaveLength(1)
    expect(lines[0]).toBe('Date,Type,Category,Amount (VND),Note')
  })
})
