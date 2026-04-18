import { useState } from 'react'
import { useSettingsStore } from '../store/useStore'

interface Props {
  onClose: () => void
}

export default function SettingsModal({ onClose }: Props) {
  const { githubPAT, setGithubPAT } = useSettingsStore()
  const [draft, setDraft] = useState(githubPAT)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setGithubPAT(draft.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto bg-white rounded-2xl z-50 shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800 text-base">Settings</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600 block">
            GitHub Personal Access Token
          </label>
          <p className="text-xs text-gray-400">
            Dùng để gọi GPT-4o cho voice input. Lưu trong máy bạn, không gửi đi đâu khác.
          </p>
          <input
            type="password"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="github_pat_..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:border-green-500 outline-none"
          />
          <a
            href="https://github.com/settings/tokens/new?scopes=&description=finance-voice"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-green-600 hover:underline block"
          >
            Tạo token tại github.com/settings/tokens →
          </a>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-all"
        >
          {saved ? '✓ Đã lưu' : 'Lưu'}
        </button>
      </div>
    </>
  )
}
