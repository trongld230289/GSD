# Phase 1 Research: Core Entry & Sync

**Phase:** 1 — Core Entry & Sync
**Research date:** 2026-04-09

---

## 1. Google Apps Script — CORS-Safe Setup

### Why CORS is the #1 blocker
A static app on GitHub Pages making `fetch()` calls to GAS will fail with CORS errors if you use `Content-Type: application/json` — GAS does not handle the browser's `OPTIONS` preflight.

### The solution: use `text/plain` on POST
```typescript
// ✅ Works — no preflight triggered
const res = await fetch(GAS_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({ action: 'addTransaction', token, data }),
  redirect: 'follow',
});

// ❌ Fails — triggers preflight, GAS can't respond to OPTIONS
const res = await fetch(GAS_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },  // BROKEN
  body: JSON.stringify(...),
});
```

GAS receives the body as `e.postData.contents` (a string) — parse with `JSON.parse()`.

For **GET** requests: encode all params as URL query params — no CORS issue.

### GAS response — always JSON with correct MIME type
```javascript
// Code.gs — always return this pattern
return ContentService
  .createTextOutput(JSON.stringify(result))
  .setMimeType(ContentService.MimeType.JSON);
// ↑ This sets Access-Control-Allow-Origin: * automatically
```

### Deployment settings (critical)
| Setting | Value |
|---|---|
| Execute as | **Me** (the spreadsheet owner) |
| Who has access | **Anyone** (auth handled by JWT in payload) |
| After code change | Must create **new version** — old deployment URL keeps old code |

---

## 2. Google Sheets Schema

### Sheet 1: `Transactions`
| Col | A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|---|
| **Name** | id | date | type | category_id | amount | note | created_at | user_email |
| **Type** | string UUID | YYYY-MM-DD | `income`/`expense` | string | integer (VND) | string | ISO datetime | string |
| **Example** | `txn-abc123` | `2026-04-09` | `expense` | `food-dining` | `85000` | `Phở` | `2026-04-09T08:30:00Z` | `user@gmail.com` |

Row 1 = header (frozen). Data starts Row 2.

### Sheet 2: `Categories`
| Col | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| **Name** | id | name | type | icon | color | sort_order |

Pre-populated on first GAS setup with all 16 categories. Never written to by the app after that.

### Row targeting pattern — always use range targeting
```javascript
// ✅ Fast — targets only populated rows
const sheet = ss.getSheetByName('Transactions');
const lastRow = sheet.getLastRow();
if (lastRow < 2) return []; // no data rows
const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();

// ❌ Slow — grabs entire sheet including thousands of blank rows
const data = sheet.getDataRange().getValues();
```

### Month-scoped reads (server-side filter in GAS)
Never send all rows to React. Filter in GAS before returning:
```javascript
function getTransactions(month, year, userEmail) {
  const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  return data.filter(row => {
    if (row[7] !== userEmail) return false; // user isolation
    const d = new Date(row[1]);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  }).map(row => ({
    id: row[0], date: row[1], type: row[2], category_id: row[3],
    amount: row[4], note: row[5], created_at: row[6]
  }));
}
```

---

## 3. GAS API — All 5 Endpoints

| Action | Method | Request params | Returns |
|---|---|---|---|
| `getTransactions` | GET | `?action=getTransactions&month=4&year=2026&token=JWT` | `Transaction[]` |
| `addTransaction` | POST | `{ action, token, data: Transaction }` | `{ id, success: true }` |
| `updateTransaction` | POST | `{ action, token, data: { id, ...fields } }` | `{ success: true }` |
| `deleteTransaction` | POST | `{ action, token, id }` | `{ success: true }` |
| `getCategories` | GET | `?action=getCategories&token=JWT` | `Category[]` |

### Token verification in GAS (per request)
```javascript
function verifyToken(idToken) {
  const res = UrlFetchApp.fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
  );
  const info = JSON.parse(res.getContentText());
  if (info.aud !== CLIENT_ID) throw new Error('Invalid audience');
  if (info.exp < Date.now() / 1000) throw new Error('Token expired');
  return info.email;
}
```

---

## 4. Google Sign-In (GSI v2) — OAuth Flow

### Setup in `index.html`
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

### `AuthProvider.tsx` initialization pattern
```typescript
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

useEffect(() => {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse,
    auto_select: true,           // silent re-sign for returning users
    cancel_on_tap_outside: false,
  });
  google.accounts.id.prompt();  // triggers One Tap on load

  // Render fallback button
  google.accounts.id.renderButton(
    document.getElementById('google-signin-btn')!,
    { theme: 'outline', size: 'large', width: 280 }
  );
}, []);

function handleCredentialResponse(res: CredentialResponse) {
  const payload = JSON.parse(atob(res.credential.split('.')[1]));
  authStore.setUser({ email: payload.email, name: payload.name, picture: payload.picture });
  authStore.setToken(res.credential);
  authStore.setTokenExpiry(Date.now() + 55 * 60 * 1000); // 55 min
}
```

### Token refresh (50-min interval)
```typescript
// In authStore or AuthProvider
function scheduleRefresh() {
  setTimeout(() => {
    google.accounts.id.prompt(); // triggers silent re-auth
  }, 50 * 60 * 1000);
}
```

### Session persistence
Store `{ token, user, tokenExpiry }` in `localStorage`. On app load:
1. Read from localStorage
2. If token exists and `tokenExpiry > Date.now()` → restore session
3. Else → show sign-in screen, prompt GSI

---

## 5. React Project Structure

```
src/
├── api/
│   └── index.ts              ← all GAS calls, typed, centralized
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx
│   │   └── AppShell.tsx
│   ├── transactions/
│   │   ├── TransactionItem.tsx
│   │   ├── TransactionList.tsx
│   │   ├── DateGroup.tsx
│   │   └── AddTransactionDrawer.tsx
│   ├── shared/
│   │   ├── MonthSelector.tsx
│   │   ├── CategoryGrid.tsx
│   │   ├── AmountInput.tsx
│   │   └── ConfirmDialog.tsx
│   └── auth/
│       └── LoginPage.tsx
├── stores/
│   ├── authStore.ts           ← Zustand: user, token, expiry
│   └── txStore.ts             ← Zustand: transactions[], selectedMonth, loading
├── hooks/
│   ├── useTransactions.ts     ← fetch + mutate transactions
│   └── useCategories.ts       ← fetch + cache categories
├── types/
│   └── index.ts               ← Transaction, Category, User, ApiResponse
├── utils/
│   ├── currency.ts            ← formatVND()
│   ├── date.ts                ← formatDate(), groupByDate()
│   └── id.ts                  ← generateId() → crypto.randomUUID()
├── constants/
│   └── categories.ts          ← default 16 categories (seed / fallback)
├── pages/
│   ├── TransactionsPage.tsx
│   └── SettingsPage.tsx
├── App.tsx
└── main.tsx
```

### Environment variables
```
# .env.local (gitignored)
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_GAS_URL=https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

---

## 6. VND Currency Formatting — Define First

```typescript
// src/utils/currency.ts
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
  // Output: "85.000 ₫"  (vi-VN uses . as thousands separator)
}
```

Use `formatVND()` everywhere. Never format amounts inline in components.

---

## 7. Add Transaction Drawer — UX Implementation

### Drawer behavior
- Opens from bottom of screen, slides up with spring animation
- Covers ~85% of screen height
- Drag handle at top — drag down to dismiss, or tap outside overlay
- Keyboard-aware: when Note field is focused, drawer shifts up with keyboard

### Amount input pattern
```tsx
// Right-aligned, no decimals, large font
<input
  type="number"
  inputMode="numeric"  // shows numeric keyboard on mobile
  className="text-4xl font-bold text-right w-full bg-transparent border-none focus:outline-none"
  value={amount || ''}
  onChange={e => setAmount(parseInt(e.target.value) || 0)}
  placeholder="0"
  autoFocus  // open keyboard immediately when drawer opens
/>
```

### Category grid — 4 per row
```tsx
<div className="grid grid-cols-4 gap-2">
  {categories
    .filter(c => c.type === txType) // show only expense or income categories
    .map(cat => (
      <button
        key={cat.id}
        onClick={() => setSelectedCategory(cat.id)}
        className={cn(
          "flex flex-col items-center p-2 rounded-xl transition-all",
          selectedCategory === cat.id
            ? "ring-2 ring-offset-1"
            : "bg-gray-100 hover:bg-gray-200"
        )}
        style={selectedCategory === cat.id ? { ringColor: cat.color, backgroundColor: cat.color + '20' } : {}}
      >
        <span className="text-2xl">{cat.icon}</span>
        <span className="text-[10px] mt-1 text-center leading-tight">{cat.name}</span>
      </button>
    ))}
</div>
```

---

## 8. Transaction List — Grouping & Swipe-to-Delete

### Group by date
```typescript
// src/utils/date.ts
export function groupByDate(txs: Transaction[]): { date: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  txs
    .sort((a, b) => b.date.localeCompare(a.date)) // newest first
    .forEach(tx => {
      if (!map.has(tx.date)) map.set(tx.date, []);
      map.get(tx.date)!.push(tx);
    });
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}
```

### Swipe-to-delete
Use CSS `transform: translateX(Xpx)` driven by `onPointerMove` events — no library needed for a simple swipe:
```
Swipe left → item slides left → red Delete button reveals from right
Tap Delete → confirm dialog → GAS deleteTransaction → remove from store
```

Alternative: use `react-swipeable` (very lightweight, ~3KB).

---

## 9. Build Order for Phase 1 Plans

Execute in this order — each plan depends on the previous:

1. **GAS API + Sheets setup** → all 5 endpoints working, tested with curl
2. **React project bootstrap** → Vite + TS + Tailwind + Zustand + Router + formatVND
3. **Google Sign-In** → auth flow, session persistence, api.ts wrapper with token
4. **Add Transaction UI** → FAB, drawer, amount input, category grid, form submit
5. **Transaction list** → fetch from GAS, group by date, month selector
6. **Edit & delete** → tap to edit (pre-fill drawer), swipe to delete

---

## 10. Validation Checklist for Phase 1

| Test | How to verify |
|---|---|
| GAS CORS | `curl -X POST {GAS_URL} -H "Content-Type: text/plain" -d '{"action":"ping"}'` returns JSON |
| Auth | Sign in, refresh page — still signed in |
| Token expiry | After 50 min, silent refresh fires (check console log) |
| Add expense | Appears in list + visible in Google Sheet |
| Add income | Appears in list with green color |
| Month filter | Changing month shows correct transactions |
| Edit | Changes saved in Sheets |
| Delete | Row removed from Sheets after confirm |
| Categories | All 12 expense + 4 income show in picker |
| User isolation | Two different Google accounts see only their own data |
| VND format | `85000` displays as `85.000 ₫` |

---
## RESEARCH COMPLETE
