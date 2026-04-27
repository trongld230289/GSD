import { useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/useStore'

const GOOGLE_CLIENT_ID = '993101146522-rn89slm3464o5d60qrq1hj5spf264vh8.apps.googleusercontent.com'
const TOKEN_LIFETIME_MS = 60 * 60 * 1000  // 60 min (Google JWT expiry)

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void
          prompt: () => void
          renderButton: (el: HTMLElement, config: object) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

export default function LoginPage() {
  const { setUser, setToken } = useAuthStore()

  const handleCredentialResponse = useCallback(
    (response: { credential: string }) => {
      const token = response.credential
      // Decode JWT payload (middle part)
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser(
        {
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          sub: payload.sub,
        },
        token
      )
      // Record expiry for auto-refresh scheduling
      setToken(token, Date.now() + TOKEN_LIFETIME_MS)
      console.log('[Auth] Signed in as', payload.email)
    },
    [setUser, setToken]
  )

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true,
        cancel_on_tap_outside: false,
      })
      // Try One Tap first
      window.google.accounts.id.prompt()
      // Render the fallback button
      const btn = document.getElementById('google-sign-in-btn')
      if (btn) {
        window.google.accounts.id.renderButton(btn, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          width: 280,
          text: 'continue_with',
        })
      }
    }

    // GSI might already be loaded or needs a moment
    if (window.google) {
      initGoogle()
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval)
          initGoogle()
        }
      }, 200)
      return () => clearInterval(interval)
    }
  }, [handleCredentialResponse])

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-600 to-green-800 flex flex-col items-center justify-center px-6">
      {/* Logo / Hero */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-4xl">💰</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Finance Tracker</h1>
        <p className="text-green-200 mt-2 text-sm">
          Track income & expenses anywhere
        </p>
      </div>

      {/* Sign-in card */}
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Welcome back</h2>
        <p className="text-gray-500 text-sm mb-6">
          Sign in with Google to sync your data across all devices
        </p>

        {/* Google Sign-In button rendered by GSI */}
        <div className="flex justify-center">
          <div id="google-sign-in-btn"></div>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Your data is stored securely in your own Google account
        </p>
      </div>
    </div>
  )
}
