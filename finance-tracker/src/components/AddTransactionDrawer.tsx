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
  const { idToken, clearUser } = useAuthStore()
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
      const msg = err instanceof Error ? err.message : 'Failed to save'
      if (msg.includes('invalid_token') || msg.includes('Invalid token')) {
        closeDrawer()
        clearUser()
      } else {
        setError(msg)
      }
    } finally {
      setIsSaving(false)
    }
  }, [idToken, amountStr, categoryId, date, note, type, isEditing, editingTransaction,
      addTransaction, updateTransaction, closeDrawer, clearUser])

  if (!isDrawerOpen) return null

  const isExpense = type === 'expense'
  const parsedAmount = amountStr ? Number(amountStr) : 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 shadow-2xl overflow-hidden">

        {/* Colored top strip — visual type indicator */}
        <div className={`h-1 w-full transition-colors duration-300 ${isExpense ? 'bg-red-400' : 'bg-green-500'}`} />

        {/* Handle + top controls */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <span className="text-sm font-semibold text-gray-400 pt-1">
            {isEditing ? 'Edit' : 'New'}
          </span>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={handleVoiceClick}
                disabled={voiceState === 'processing'}
                title={!githubPAT ? 'Set GitHub PAT for voice' : voiceState === 'listening' ? 'Stop' : 'Voice input'}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all text-base
                  ${voiceState === 'listening'
                    ? 'bg-red-100 text-red-500 animate-pulse'
                    : voiceState === 'processing'
                    ? 'bg-gray-100 text-gray-400 cursor-wait'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
              >
                {voiceState === 'listening' ? '⏹' : voiceState === 'processing' ? '⏳' : '🎤'}
              </button>
            )}
            <button
              onClick={closeDrawer}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Type toggle — sliding pill */}
        <div className="relative flex bg-gray-100 mx-5 p-1 rounded-2xl mb-4">
          <div
            className={`absolute top-1 bottom-1 rounded-xl shadow-sm transition-all duration-200 ${
              isExpense
                ? 'left-1 bg-red-500 right-[calc(50%+2px)]'
                : 'right-1 bg-green-600 left-[calc(50%+2px)]'
            }`}
          />
          {(['expense', 'income'] as TransactionType[]).map((t) => (
            <button
              key={t}
              onClick={() => { setType(t); setCategoryId('') }}
              className={`relative flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 z-10 ${
                type === t ? 'text-white' : 'text-gray-400'
              }`}
            >
              {t === 'expense' ? '↑ Expense' : '↓ Income'}
            </button>
          ))}
        </div>

        {/* Amount — big centered display */}
        <div className={`mx-5 rounded-2xl py-5 px-4 text-center transition-colors duration-300 mb-4 ${
          isExpense ? 'bg-red-50' : 'bg-green-50'
        }`}>
          <input
            type="text"
            inputMode="numeric"
            value={amountStr ? Number(amountStr).toLocaleString('vi-VN') : ''}
            onChange={handleAmountChange}
            placeholder="0"
            className={`text-5xl font-bold bg-transparent text-center outline-none w-full tracking-tight transition-colors ${
              isExpense
                ? 'text-red-600 placeholder:text-red-200'
                : 'text-green-700 placeholder:text-green-200'
            }`}
          />
          <div className={`text-sm mt-1.5 font-medium transition-colors ${
            isExpense ? 'text-red-400' : 'text-green-500'
          }`}>
            {parsedAmount > 0 ? formatVND(parsedAmount) : 'Nhập số tiền'}
          </div>
        </div>

        <div className="px-5 pb-6 space-y-4" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>

          {/* Voice transcript hint */}
          {voiceHint && voiceState === 'idle' && !error && (
            <div className="px-3 py-1.5 bg-green-50 rounded-xl text-xs text-green-700 flex items-center gap-1.5 -mt-1">
              <span>🎤</span>
              <span className="italic">{voiceHint}</span>
            </div>
          )}

          {/* Category grid */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {filteredCategories
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center p-2 rounded-xl text-xs transition-all ${
                      categoryId === cat.id
                        ? 'ring-2 ring-offset-1 scale-105 shadow-sm'
                        : 'hover:opacity-80 active:scale-95'
                    }`}
                    style={{
                      backgroundColor: cat.color + '22',
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

          {/* Date + Note */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-green-500 outline-none bg-gray-50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Note</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="optional"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-green-500 outline-none bg-gray-50"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 text-center bg-red-50 py-2 rounded-xl">
              {error}
            </p>
          )}

          {/* Save button — type-aware color + shows amount */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-3.5 text-white font-bold rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-base ${
              isExpense
                ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              'Update'
            ) : parsedAmount > 0 ? (
              `Save ${formatVND(parsedAmount)}`
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
