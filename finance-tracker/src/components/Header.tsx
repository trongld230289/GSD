import { useState } from 'react'
import { format } from 'date-fns'
import type { GoogleUser } from '../types'
import SettingsModal from './SettingsModal'
import { useTokenRefresh } from '../hooks/useTokenRefresh'
import { useAppStore } from '../store/useStore'
import { exportTransactionsCsv } from '../utils/exportCsv'

interface HeaderProps {
  user: GoogleUser | null
  onSignOut: () => void
}

export default function Header({ user, onSignOut }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false)
  const { transactions, categories, currentMonth } = useAppStore()
  useTokenRefresh()

  const handleExport = () => {
    const month = format(currentMonth, 'yyyy-MM')
    exportTransactionsCsv(transactions, categories, month)
  }

  const handleSignOut = () => {
    window.google?.accounts.id.disableAutoSelect()
    onSignOut()
  }

  return (
    <>
      <header
        className="bg-green-600 text-white px-4 flex items-center justify-between"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
      >
        {/* Left: brand */}
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">💰</span>
          <span className="font-bold text-lg tracking-tight leading-none">Finance</span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {/* Export */}
          <button
            onClick={handleExport}
            disabled={transactions.length === 0}
            title="Export CSV"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 transition-colors disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 w-[18px] h-[18px]">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            title="Settings"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>

          {/* Avatar + sign out */}
          {user && (
            <button
              onClick={handleSignOut}
              title={`Sign out (${user.name})`}
              className="flex items-center ml-1"
            >
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full border-2 border-white/40 hover:border-white/70 transition-colors"
              />
            </button>
          )}
        </div>
      </header>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
