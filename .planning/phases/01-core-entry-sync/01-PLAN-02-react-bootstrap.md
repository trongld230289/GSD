# Plan 2: React Project Bootstrap

**Phase:** 1 — Core Entry & Sync
**Plan:** 2 of 6
**Goal:** Scaffold the React + Vite + TypeScript + Tailwind + Zustand project with all shared utilities, types, constants, and empty page shells. Everything compiles and runs before auth or API work begins.

---

## Pre-conditions
- Plan 1 complete (GAS URL saved in `.env.local`)
- Node.js ≥ 18 installed (`node -v`)
- npm ≥ 9 installed

## Success Criteria
- [ ] `npm run dev` starts without errors
- [ ] App displays a placeholder home screen in browser
- [ ] Tailwind styles applying (test with a colored div)
- [ ] `formatVND(85000)` returns `"85.000 ₫"` (unit test passes)
- [ ] All 16 categories present in `constants/categories.ts`
- [ ] TypeScript compiles with zero errors (`npm run build`)

---

## Tasks

### 2.1 Create Vite Project

```bash
npm create vite@latest finance-tracker -- --template react-ts
cd finance-tracker
npm install
```

### 2.2 Install Dependencies

```bash
# Core dependencies
npm install zustand react-router-dom date-fns

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2.3 Configure Tailwind

Replace `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        income: '#16A34A',     // green-600
        expense: '#DC2626',    // red-600
        primary: '#16A34A',
      },
    },
  },
  plugins: [],
}
```

Replace `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
```

### 2.4 Create Types

**`src/types/index.ts`**
```typescript
export interface User {
  email: string;
  name: string;
  picture: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  sort_order: number;
}

export interface Transaction {
  id: string;
  date: string;           // YYYY-MM-DD
  type: 'income' | 'expense';
  category_id: string;
  amount: number;         // VND integer, no decimals
  note: string;
  created_at: string;     // ISO datetime
}

export interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  data?: T;
}
```

### 2.5 Create Utilities

**`src/utils/currency.ts`**
```typescript
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}
```

**`src/utils/date.ts`**
```typescript
import { format, parseISO } from 'date-fns';
import { Transaction } from '../types';

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd MMM yyyy');
}

export function formatMonthYear(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), 'MMMM yyyy');
}

export function groupByDate(
  txs: Transaction[]
): { date: string; items: Transaction[] }[] {
  const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date));
  const map = new Map<string, Transaction[]>();
  sorted.forEach(tx => {
    if (!map.has(tx.date)) map.set(tx.date, []);
    map.get(tx.date)!.push(tx);
  });
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
```

**`src/utils/id.ts`**
```typescript
export function generateId(prefix = 'txn'): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
```

### 2.6 Create Constants (Default Categories)

**`src/constants/categories.ts`**
```typescript
import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense
  { id: 'food-dining',        name: 'Food & Dining',         type: 'expense', icon: '🍜', color: '#F59E0B', sort_order: 1  },
  { id: 'transportation',     name: 'Transportation',        type: 'expense', icon: '🚗', color: '#3B82F6', sort_order: 2  },
  { id: 'shopping-apparel',   name: 'Shopping & Apparel',    type: 'expense', icon: '👗', color: '#EC4899', sort_order: 3  },
  { id: 'online-shopping',    name: 'Online Shopping',       type: 'expense', icon: '📦', color: '#F97316', sort_order: 4  },
  { id: 'travel-vacation',    name: 'Travel & Vacation',     type: 'expense', icon: '✈️', color: '#06B6D4', sort_order: 5  },
  { id: 'personal-dev',       name: 'Personal Development',  type: 'expense', icon: '📚', color: '#8B5CF6', sort_order: 6  },
  { id: 'gifts-celebrations', name: 'Gifts & Celebrations',  type: 'expense', icon: '🎁', color: '#EF4444', sort_order: 7  },
  { id: 'bills-utilities',    name: 'Bills & Utilities',     type: 'expense', icon: '💡', color: '#6B7280', sort_order: 8  },
  { id: 'healthcare',         name: 'Healthcare',            type: 'expense', icon: '💊', color: '#10B981', sort_order: 9  },
  { id: 'entertainment',      name: 'Entertainment',         type: 'expense', icon: '🎬', color: '#F43F5E', sort_order: 10 },
  { id: 'savings-investment', name: 'Savings / Investment',  type: 'expense', icon: '💰', color: '#14B8A6', sort_order: 11 },
  { id: 'other-expense',      name: 'Other',                 type: 'expense', icon: '📝', color: '#9CA3AF', sort_order: 12 },
  // Income
  { id: 'salary-wages',       name: 'Salary / Wages',        type: 'income',  icon: '💼', color: '#22C55E', sort_order: 13 },
  { id: 'freelance',          name: 'Freelance / Side Income',type: 'income', icon: '🔧', color: '#84CC16', sort_order: 14 },
  { id: 'gifts-received',     name: 'Gifts Received',        type: 'income',  icon: '🧧', color: '#FB923C', sort_order: 15 },
  { id: 'other-income',       name: 'Other Income',          type: 'income',  icon: '📊', color: '#A3E635', sort_order: 16 },
];
```

### 2.7 Create Zustand Stores

**`src/stores/authStore.ts`**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  tokenExpiry: number | null;
  setUser: (user: User) => void;
  setToken: (token: string, expiry: number) => void;
  signOut: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      tokenExpiry: null,
      setUser: (user) => set({ user }),
      setToken: (token, expiry) => set({ token, tokenExpiry: expiry }),
      signOut: () => set({ user: null, token: null, tokenExpiry: null }),
      isAuthenticated: () => {
        const { token, tokenExpiry } = get();
        return !!token && !!tokenExpiry && tokenExpiry > Date.now();
      },
    }),
    { name: 'finance-auth' }
  )
);
```

**`src/stores/txStore.ts`**
```typescript
import { create } from 'zustand';
import { Transaction, Category } from '../types';

interface TxState {
  transactions: Transaction[];
  categories: Category[];
  selectedMonth: number;
  selectedYear: number;
  loading: boolean;
  setTransactions: (txs: Transaction[]) => void;
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (tx: Transaction) => void;
  removeTransaction: (id: string) => void;
  setCategories: (cats: Category[]) => void;
  setMonth: (month: number, year: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useTxStore = create<TxState>((set) => ({
  transactions: [],
  categories: [],
  selectedMonth: new Date().getMonth() + 1,
  selectedYear: new Date().getFullYear(),
  loading: false,
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (tx) => set((s) => ({ transactions: [tx, ...s.transactions] })),
  updateTransaction: (tx) => set((s) => ({
    transactions: s.transactions.map(t => t.id === tx.id ? tx : t),
  })),
  removeTransaction: (id) => set((s) => ({
    transactions: s.transactions.filter(t => t.id !== id),
  })),
  setCategories: (categories) => set({ categories }),
  setMonth: (month, year) => set({ selectedMonth: month, selectedYear: year }),
  setLoading: (loading) => set({ loading }),
}));
```

### 2.8 Create API Module (Stub)

**`src/api/index.ts`**
```typescript
import { Transaction, Category } from '../types';

const GAS_URL = import.meta.env.VITE_GAS_URL as string;

async function get<T>(action: string, params: Record<string, string>, token: string): Promise<T> {
  const query = new URLSearchParams({ action, token, ...params }).toString();
  const res = await fetch(`${GAS_URL}?${query}`, { redirect: 'follow' });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data as T;
}

async function post<T>(action: string, token: string, body?: object): Promise<T> {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, token, ...body }),
    redirect: 'follow',
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data as T;
}

export const api = {
  getTransactions: (month: number, year: number, token: string) =>
    get<Transaction[]>('getTransactions', { month: String(month), year: String(year) }, token),

  addTransaction: (data: Omit<Transaction, 'id' | 'created_at'>, token: string) =>
    post<{ id: string; success: boolean }>('addTransaction', token, { data }),

  updateTransaction: (data: Transaction, token: string) =>
    post<{ success: boolean }>('updateTransaction', token, { data }),

  deleteTransaction: (id: string, token: string) =>
    post<{ success: boolean }>('deleteTransaction', token, { id }),

  getCategories: (token: string) =>
    get<Category[]>('getCategories', {}, token),
};
```

### 2.9 Create Page Shells + App Router

**`src/pages/TransactionsPage.tsx`** — placeholder
```tsx
export default function TransactionsPage() {
  return <div className="p-4 text-gray-500">Transactions coming in Plan 5</div>;
}
```

**`src/pages/SettingsPage.tsx`** — placeholder
```tsx
export default function SettingsPage() {
  return <div className="p-4 text-gray-500">Settings coming soon</div>;
}
```

**`src/App.tsx`**
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import TransactionsPage from './pages/TransactionsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  if (!isAuthenticated()) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">
      Sign-in coming in Plan 3
    </div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TransactionsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**`src/main.tsx`**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 2.10 Configure `.env.local`

In the project root (alongside `package.json`):
```
VITE_GOOGLE_CLIENT_ID=     ← fill in Plan 3
VITE_GAS_URL=https://script.google.com/macros/s/YOUR_ID/exec
```

Add to `.gitignore`:
```
.env.local
```

### 2.11 Verify Build

```bash
npm run dev     # should open on http://localhost:5173
npm run build   # should complete with zero TypeScript errors
```

---

## Notes
- The API module is complete but won't make real calls until the token is wired in Plan 3.
- `DEFAULT_CATEGORIES` serves as offline fallback — the app fetches from GAS on load but falls back to these constants if the request fails.
- `persist` middleware in `authStore` saves auth state to `localStorage` — session survives page refresh.
