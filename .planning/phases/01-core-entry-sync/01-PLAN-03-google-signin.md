# Plan 3: Google Sign-In Flow

**Phase:** 1 — Core Entry & Sync
**Plan:** 3 of 6
**Goal:** Implement Google OAuth sign-in (One Tap + button fallback), wire token into the API module, persist session across refresh, and auto-refresh before expiry.

---

## Pre-conditions
- Plan 2 complete — React project running
- Google Cloud Console access

## Success Criteria
- [ ] Clicking sign-in opens Google One Tap or popup
- [ ] After sign-in, user name and avatar appear in the app
- [ ] Refreshing the page keeps the user signed in (session persists)
- [ ] Sign-out clears session and returns to login screen
- [ ] `api.getCategories(token)` call succeeds with real token (returns 16 categories from GAS)
- [ ] After 50 minutes, token silently refreshes (verify via console.log)

---

## Tasks

### 3.1 Create Google OAuth Client ID

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project: **Finance Tracker**
3. APIs & Services → **OAuth consent screen**
   - User type: **External**
   - App name: Finance Tracker
   - Support email: your email
   - Save (no scopes needed — we only need profile/email from the ID token)
4. APIs & Services → **Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: Finance Tracker Web
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `https://YOUR_GITHUB_USERNAME.github.io` (add now, update with real URL later)
   - Click **Create** → copy the **Client ID**
5. Paste into `.env.local`:
   ```
   VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
   ```
6. Also paste the same Client ID into `Code.gs` in GAS:
   ```javascript
   const CLIENT_ID = 'xxxxx.apps.googleusercontent.com';
   ```
   Then create a new GAS deployment version.

### 3.2 Add GSI Script to `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Finance Tracker</title>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 3.3 Add GSI TypeScript Types

```bash
npm install -D @types/google.accounts
```

Or add a declaration file `src/types/gsi.d.ts`:
```typescript
declare namespace google {
  namespace accounts {
    namespace id {
      function initialize(config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }): void;
      function prompt(): void;
      function renderButton(element: HTMLElement, config: object): void;
      function disableAutoSelect(): void;
      function revoke(email: string, done: () => void): void;
    }
  }
}
```

### 3.4 Create `LoginPage.tsx`

**`src/pages/LoginPage.tsx`**
```tsx
import { useEffect, useRef } from 'react';

interface LoginPageProps {
  onCredential: (credential: string) => void;
}

export default function LoginPage({ onCredential }: LoginPageProps) {
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.google || !btnRef.current) return;
    google.accounts.id.renderButton(btnRef.current, {
      theme: 'outline',
      size: 'large',
      width: 280,
      text: 'signin_with',
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6">
      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3">💰</div>
        <h1 className="text-2xl font-bold text-gray-800">Finance Tracker</h1>
        <p className="text-sm text-gray-500 mt-1">Track income & expenses across all devices</p>
      </div>

      {/* Sign-in button */}
      <div ref={btnRef} className="mt-4" />

      <p className="text-xs text-gray-400 mt-6 text-center max-w-xs">
        Your data is stored in your own Google Sheet. We never see it.
      </p>
    </div>
  );
}
```

### 3.5 Create `AuthProvider.tsx`

**`src/components/auth/AuthProvider.tsx`**
```tsx
import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import LoginPage from '../../pages/LoginPage';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const TOKEN_LIFETIME_MS = 55 * 60 * 1000; // 55 min (refresh before 60-min expiry)

function parseJwtPayload(token: string) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setToken, isAuthenticated } = useAuthStore();
  let refreshTimer: ReturnType<typeof setTimeout>;

  const scheduleRefresh = useCallback(() => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      console.log('[Auth] Token expiring soon — triggering silent refresh');
      google.accounts.id.prompt();
    }, TOKEN_LIFETIME_MS);
  }, []);

  const handleCredentialResponse = useCallback((response: { credential: string }) => {
    const payload = parseJwtPayload(response.credential);
    setUser({ email: payload.email, name: payload.name, picture: payload.picture });
    setToken(response.credential, Date.now() + TOKEN_LIFETIME_MS);
    scheduleRefresh();
    console.log('[Auth] Signed in as', payload.email);
  }, [setUser, setToken, scheduleRefresh]);

  useEffect(() => {
    // Wait for GSI script to load
    const initGSI = () => {
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true,           // silent re-sign for returning users
        cancel_on_tap_outside: false,
      });
      // Only show One Tap if not already authenticated
      if (!isAuthenticated()) {
        google.accounts.id.prompt();
      } else {
        scheduleRefresh(); // reschedule refresh for existing session
      }
    };

    if (window.google?.accounts?.id) {
      initGSI();
    } else {
      // Script not yet loaded — wait for it
      window.addEventListener('load', initGSI, { once: true });
    }

    return () => clearTimeout(refreshTimer);
  }, []);

  if (!isAuthenticated()) {
    return <LoginPage onCredential={(cred) => handleCredentialResponse({ credential: cred })} />;
  }

  return <>{children}</>;
}
```

### 3.6 Wrap App with AuthProvider

Update **`src/App.tsx`**:
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './components/auth/AuthProvider';
import TransactionsPage from './pages/TransactionsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TransactionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### 3.7 Add Sign-Out to Settings Page

Update **`src/pages/SettingsPage.tsx`**:
```tsx
import { useAuthStore } from '../stores/authStore';

export default function SettingsPage() {
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    google.accounts.id.disableAutoSelect();
    signOut();
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Settings</h2>
      {user && (
        <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-xl">
          <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
          <div>
            <p className="font-medium text-gray-800">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      )}
      <button
        onClick={handleSignOut}
        className="w-full py-3 text-red-600 font-medium border border-red-200 rounded-xl hover:bg-red-50 transition"
      >
        Sign out
      </button>
    </div>
  );
}
```

### 3.8 Verify End-to-End Auth

1. `npm run dev`
2. Open `http://localhost:5173` — should see Login page with Google button
3. Click Sign in with Google → complete OAuth
4. Should redirect to Transactions placeholder page
5. Refresh page — should stay signed in (not go back to login)
6. Open browser console and verify: `[Auth] Signed in as your@email.com`
7. In Settings, click Sign out — should return to Login page
8. Verify `api.getCategories` call works with real token:
   ```typescript
   // Temporarily in browser console (after sign-in):
   // Access token from Zustand store
   const token = JSON.parse(localStorage.getItem('finance-auth')).state.token;
   fetch(`${GAS_URL}?action=getCategories&token=${token}`)
     .then(r => r.json()).then(console.log);
   // Should return array of 16 categories
   ```

---

## Notes
- The `auto_select: true` option silently re-authenticates returning users — no button tap needed on repeat visits.
- `disableAutoSelect()` on sign-out prevents GSI from immediately re-signing the user in.
- If One Tap doesn't appear on mobile, the fallback `renderButton` will always be shown on the login page.
