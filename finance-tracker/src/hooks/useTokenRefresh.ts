import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/useStore'

const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000  // refresh 5 min before expiry

/**
 * Schedules a silent Google One Tap prompt to refresh the token before it expires.
 * Must be rendered inside an authenticated component (user is non-null).
 */
export function useTokenRefresh() {
  const { tokenExpiry, setToken } = useAuthStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!tokenExpiry) return

    const msUntilRefresh = tokenExpiry - Date.now() - REFRESH_BEFORE_EXPIRY_MS

    if (msUntilRefresh <= 0) {
      // Token already expiring soon — trigger immediately
      console.log('[Auth] Token expiring soon — triggering silent refresh immediately')
      window.google?.accounts.id.prompt()
      return
    }

    console.log(`[Auth] Scheduling token refresh in ${Math.round(msUntilRefresh / 60000)} minutes`)

    timerRef.current = setTimeout(() => {
      console.log('[Auth] Token expiring soon — triggering silent refresh')
      window.google?.accounts.id.prompt()
    }, msUntilRefresh)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [tokenExpiry])

  // Expose setToken so callers can wire new credentials from prompt callback
  return { setToken }
}
