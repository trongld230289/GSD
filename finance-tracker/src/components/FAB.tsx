import { useAppStore } from '../store/useStore'

export default function FAB() {
  const { openDrawer } = useAppStore()

  return (
    <button
      onClick={() => openDrawer()}
      className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-full shadow-lg flex items-center justify-center text-3xl transition-transform active:scale-95 z-40"
      style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      aria-label="Add transaction"
    >
      +
    </button>
  )
}
