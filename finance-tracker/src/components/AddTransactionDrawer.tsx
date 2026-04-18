import { useState, useEffect, useCallback, useRef } from 'react'
import type { Category, TransactionType } from '../types'
import { useAuthStore, useAppStore, useSettingsStore } from '../store/useStore'
import { apiAddTransaction, apiUpdateTransaction } from '../api/gas'
import { parseVoiceInput } from '../api/voice'
import { useVoiceInput } from '../hooks/useVoiceInput'
import { todayISO, normalizeDate } from '../utils/date'
import { formatVND, parseVNDInput } from '../utils/format'
import { CATEGORY_META_MAP } from '../data/categories'
import SettingsModal from './SettingsModal'

interface Props {
  categories: Category[]
}

export default function AddTransactionDrawer({ categories }: Props) {
  const { idToken } = useAuthStore()
  const { githubPAT } = useSettingsStore()
  const { isDrawerOpen, editingTransaction, closeDrawer, addTransaction, updateTransaction } =
    useAppStore()

  const isEditing = !!editingTransaction

  const [type, setType] = useState<TransactionType>('expense')
  const [categoryId, setCategoryId] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [voiceHint, setVoiceHint] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const voiceResetRef = useRef<() => void>(() => {})

  const handleTranscript = useCallback(async (text: string) => {
    setVoiceHint(`"${text}"`)
    if (!githubPAT) {
      setShowSettings(true)
      voiceResetRef.current()
      return
    }
    try {
      const parsed = await parseVoiceInput(text, githubPAT)
      setType(parsed.type)
      setCategoryId(parsed.category_id)
      setAmountStr(parsed.amount.toString())
      setDate(parsed.date)
      setNote(parsed.note)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Voice parse failed')
    } finally {
      voiceResetRef.current()
    }
  }, [githubPAT])

  const { state: voiceState, start: voiceStart, stop: voiceStop, reset: voiceReset } =
    useVoiceInput({
      onTranscript: handleTranscript,
      onError: (msg) => setError(msg),
    })

  voiceResetRef.current = voiceReset

  const handleVoiceClick = useCallback(() => {
    if (!githubPAT) { setShowSettings(true); return }
    if (voiceState === 'listening') voiceStop()
    else voiceStart()
  }, [githubPAT, voiceState, voiceStart, voiceStop])

  // Prefill form when editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type)
      setCategoryId(editingTransaction.category_id)
      setAmountStr(editingTransaction.amount.toString())
      setDate(normalizeDate(editingTransaction.date))
      setNote(editingTransaction.note)
    } else {
      setType('expense')
      setCategoryId('')
      setAmountStr('')
      setDate(todayISO())
      setNote('')
    }
    setError('')
    setVoiceHint('')
  }, [editingTransaction, isDrawerOpen])

  const filteredCategories = categories.filter((c) => c.type === type)

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow digits only
    const raw = e.target.value.replace(/\D/g, '')
    setAmountStr(raw)
  }

  const handleSave = useCallback(async () => {
    if (!idToken) return
    const amount = parseVNDInput(amountStr)
    if (!categoryId) { setError('Please select a category'); return }
    if (amount <= 0) { setError('Please enter a valid amount'); return }
    if (!date) { setError('Please select a date'); return }

    setError('')
    setIsSaving(true)
    try {
      if (isEditing && editingTransaction) {
        const updated = await apiUpdateTransaction(idToken, {
          id: editingTransaction.id,
          type,
          category_id: categoryId,
          amount,
          date,
          note,
        })
        updateTransaction(updated)
      } else {
        const newTx = await apiAddTransaction(idToken, {
          type,
          category_id: categoryId,
          amount,
          date,
          note,
        })
        addTransaction(newTx)
      }
      closeDrawer()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }, [idToken, amountStr, categoryId, date, note, type, isEditing, editingTransaction,
      addTransaction, updateTransaction, closeDrawer])

  if (!isDrawerOpen) return null

  return (
    <>
    {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-2xl z-50 shadow-2xl">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Title + voice + close */}
        <div className="flex items-center justify-between px-5 py-2">
          <h2 className="text-base font-bold text-gray-800">
            {isEditing ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={handleVoiceClick}
                disabled={voiceState === 'processing'}
                title={!githubPAT ? 'Cài GitHub PAT để dùng voice' : voiceState === 'listening' ? 'Dừng' : 'Voice input'}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all text-base
                  ${voiceState === 'listening'
                    ? 'bg-red-100 text-red-500 animate-pulse'
                    : voiceState === 'processing'
                    ? 'bg-gray-100 text-gray-400 cursor-wait'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
              >
                {voiceState === 'listening' ? '⏹' : voiceState === 'processing' ? '⏳' : '🎤'}
              </button>
            )}
            <button
              onClick={closeDrawer}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Voice transcript hint */}
        {voiceHint && voiceState === 'idle' && !error && (
          <div className="mx-5 -mt-1 mb-1 px-3 py-1.5 bg-green-50 rounded-lg text-xs text-green-700 flex items-center gap-1.5">
            <span>🎤</span>
            <span className="italic">{voiceHint}</span>
          </div>
        )}

        <div className="px-5 pb-6 space-y-4" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
          {/* Income / Expense toggle */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['expense', 'income'] as TransactionType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setType(t); setCategoryId('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                  type === t
                    ? t === 'income'
                      ? 'bg-green-600 text-white shadow'
                      : 'bg-red-500 text-white shadow'
                    : 'text-gray-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount input */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Amount (VND)</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={amountStr ? Number(amountStr).toLocaleString('vi-VN') : ''}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full text-3xl font-bold text-gray-900 text-right pr-8 pt-2 pb-2 pl-2 border-b-2 border-gray-200 focus:border-green-500 outline-none bg-transparent"
              />
              <span className="absolute right-0 bottom-3 text-lg text-gray-400">₫</span>
            </div>
            {amountStr && Number(amountStr) > 0 && (
              <p className="text-xs text-gray-400 text-right mt-1">
                {formatVND(Number(amountStr))}
              </p>
            )}
          </div>

          {/* Category grid */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {filteredCategories
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center p-2 rounded-xl text-xs transition-all ${
                      categoryId === cat.id
                        ? 'ring-2 ring-offset-1 scale-105'
                        : 'hover:opacity-80 active:scale-95'
                    }`}
                    style={{
                      backgroundColor: cat.color + '22',
                      outlineColor: cat.color,
                      // @ts-ignore
                      '--tw-ring-color': cat.color,
                    }}
                  >
                    <span className="text-xl mb-1">{cat.icon}</span>
                    <span
                      className="text-center leading-tight font-medium"
                      style={{ color: cat.color, fontSize: '10px' }}
                    >
                      {cat.name}
                    </span>
                  </button>
                ))}
            </div>

            {/* Category description tip */}
            {categoryId && CATEGORY_META_MAP[categoryId] && (
              <div
                className="mt-2 px-3 py-2 rounded-xl text-xs text-gray-700 flex items-start gap-2"
                style={{ backgroundColor: (CATEGORY_META_MAP[categoryId].color) + '18' }}
              >
                <span className="text-base leading-none mt-0.5">
                  {CATEGORY_META_MAP[categoryId].icon}
                </span>
                <span>
                  <span className="font-semibold" style={{ color: CATEGORY_META_MAP[categoryId].color }}>
                    {CATEGORY_META_MAP[categoryId].name}:{' '}
                  </span>
                  {CATEGORY_META_MAP[categoryId].description}
                </span>
              </div>
            )}
          </div>

          {/* Date + Note row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. lunch with team"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 outline-none"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 text-center bg-red-50 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSaving && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </>
    </>
  )
}
