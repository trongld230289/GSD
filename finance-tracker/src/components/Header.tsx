import { useState } from 'react'
import type { GoogleUser } from '../types'
import SettingsModal from './SettingsModal'

interface HeaderProps {
  user: GoogleUser | null
  onSignOut: () => void
}

export default function Header({ user, onSignOut }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      <header className="bg-green-600 text-white px-4 py-3 flex items-center justify-between safe-pt shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <span className="font-bold text-lg tracking-tight">Finance</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-base"
            title="Settings"
          >
            ⚙️
          </button>
          {user && (
            <>
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full border-2 border-white/50"
              />
              <button
                onClick={onSignOut}
                className="text-xs text-white/70 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </header>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
