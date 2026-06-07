import { useAppStore } from '../store/useStore'

export default function FAB() {
  const { openDrawer } = useAppStore()

  return (
    // Wrapper mirrors the app container so the button stays inside max-w-md
    <div className="fixed inset-0 max-w-md mx-auto pointer-events-none z-40">
      <button
        onClick={() => openDrawer()}
        className="absolute right-4 w-14 h-14 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-full shadow-xl flex items-center justify-center transition-all pointer-events-auto"
        style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}
        aria-label="Add transaction"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  )
}
