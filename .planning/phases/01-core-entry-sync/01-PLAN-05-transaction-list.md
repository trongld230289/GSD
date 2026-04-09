# Plan 5: Transaction List View

**Phase:** 1 — Core Entry & Sync
**Plan:** 5 of 6
**Goal:** Build the full home screen — balance summary cards at top, transaction list grouped by date below, and a month selector to navigate between months. Fetch data from GAS on load and when month changes.

---

## Pre-conditions
- Plan 4 complete — adding transactions works, data is in Google Sheets

## Success Criteria
- [ ] Home screen shows balance summary: total income (green), total expenses (red), net balance
- [ ] Net balance color: green when positive, red when negative
- [ ] Transactions grouped by date, newest date first, newest transaction first within each group
- [ ] Each transaction row shows: category icon, category name, note (if any), date, and amount (colored)
- [ ] Month selector shows current month/year (e.g. `← April 2026 →`)
- [ ] Tapping `←` or `→` changes the month and reloads transactions from GAS
- [ ] Empty state shown when no transactions for the selected month
- [ ] Loading skeleton shown while fetching
- [ ] Bottom navigation bar with Home / Reports / Settings tabs

---

## Tasks

### 5.1 Create `MonthSelector.tsx`

**`src/components/shared/MonthSelector.tsx`**
```tsx
import { formatMonthYear } from '../../utils/date';

interface MonthSelectorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export default function MonthSelector({ month, year, onChange }: MonthSelectorProps) {
  const prev = () => {
    if (month === 1) onChange(12, year - 1);
    else onChange(month - 1, year);
  };
  const next = () => {
    if (month === 12) onChange(1, year + 1);
    else onChange(month + 1, year);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
      <button onClick={prev} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-600 text-lg">
        ‹
      </button>
      <span className="font-semibold text-gray-800 text-sm">
        {formatMonthYear(year, month)}
      </span>
      <button onClick={next} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-600 text-lg">
        ›
      </button>
    </div>
  );
}
```

### 5.2 Create `BalanceSummary.tsx`

**`src/components/transactions/BalanceSummary.tsx`**
```tsx
import { Transaction } from '../../types';
import { formatVND } from '../../utils/currency';

interface Props {
  transactions: Transaction[];
}

export default function BalanceSummary({ transactions }: Props) {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const net = income - expenses;

  return (
    <div className="grid grid-cols-3 gap-0 bg-white border-b border-gray-100">
      <div className="flex flex-col items-center py-3 border-r border-gray-100">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Income</span>
        <span className="text-sm font-bold text-income">{formatVND(income)}</span>
      </div>
      <div className="flex flex-col items-center py-3 border-r border-gray-100">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Expenses</span>
        <span className="text-sm font-bold text-expense">{formatVND(expenses)}</span>
      </div>
      <div className="flex flex-col items-center py-3">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Balance</span>
        <span className={`text-sm font-bold ${net >= 0 ? 'text-income' : 'text-expense'}`}>
          {formatVND(Math.abs(net))}
          {net < 0 && <span className="text-xs"> −</span>}
        </span>
      </div>
    </div>
  );
}
```

### 5.3 Create `TransactionItem.tsx`

**`src/components/transactions/TransactionItem.tsx`**
```tsx
import { Transaction, Category } from '../../types';
import { formatVND } from '../../utils/currency';

interface Props {
  tx: Transaction;
  category?: Category;
  onEdit: (tx: Transaction) => void;
  onDeleteStart: (tx: Transaction) => void;
}

export default function TransactionItem({ tx, category, onEdit, onDeleteStart }: Props) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 bg-white active:bg-gray-50 cursor-pointer"
      onClick={() => onEdit(tx)}
    >
      {/* Category icon */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: (category?.color ?? '#9CA3AF') + '20' }}
      >
        {category?.icon ?? '📝'}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {category?.name ?? tx.category_id}
        </p>
        {tx.note && (
          <p className="text-xs text-gray-400 truncate">{tx.note}</p>
        )}
      </div>

      {/* Amount */}
      <div className="flex-shrink-0 text-right">
        <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
          {tx.type === 'income' ? '+' : '-'}{formatVND(tx.amount)}
        </span>
      </div>
    </div>
  );
}
```

### 5.4 Create `TransactionList.tsx`

**`src/components/transactions/TransactionList.tsx`**
```tsx
import { Transaction, Category } from '../../types';
import { groupByDate, formatDate } from '../../utils/date';
import TransactionItem from './TransactionItem';
import { formatVND } from '../../utils/currency';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (tx: Transaction) => void;
  onDeleteStart: (tx: Transaction) => void;
}

export default function TransactionList({ transactions, categories, onEdit, onDeleteStart }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-300">
        <span className="text-5xl mb-3">📭</span>
        <p className="text-sm">No transactions this month</p>
        <p className="text-xs mt-1">Tap + to add one</p>
      </div>
    );
  }

  const catMap = new Map(categories.map(c => [c.id, c]));
  const groups = groupByDate(transactions);

  return (
    <div className="divide-y divide-gray-100">
      {groups.map(({ date, items }) => {
        const dayNet = items.reduce(
          (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0
        );
        return (
          <div key={date}>
            {/* Date group header */}
            <div className="flex justify-between items-center px-4 py-2 bg-gray-50">
              <span className="text-xs text-gray-500">{formatDate(date)}</span>
              <span className={`text-xs font-medium ${dayNet >= 0 ? 'text-income' : 'text-expense'}`}>
                {dayNet >= 0 ? '+' : ''}{formatVND(dayNet)}
              </span>
            </div>
            {/* Transactions for this date */}
            {items.map(tx => (
              <TransactionItem
                key={tx.id}
                tx={tx}
                category={catMap.get(tx.category_id)}
                onEdit={onEdit}
                onDeleteStart={onDeleteStart}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
```

### 5.5 Create `useTransactions` Hook

**`src/hooks/useTransactions.ts`**
```typescript
import { useEffect } from 'react';
import { api } from '../api';
import { useAuthStore } from '../stores/authStore';
import { useTxStore } from '../stores/txStore';

export function useTransactions() {
  const { token } = useAuthStore();
  const { selectedMonth, selectedYear, setTransactions, setLoading } = useTxStore();

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.getTransactions(selectedMonth, selectedYear, token)
      .then(setTransactions)
      .catch(err => {
        console.error('Failed to load transactions:', err);
        setTransactions([]);
      })
      .finally(() => setLoading(false));
  }, [token, selectedMonth, selectedYear]);
}
```

### 5.6 Create `BottomNav.tsx`

**`src/components/layout/BottomNav.tsx`**
```tsx
import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/',         icon: '🏠', label: 'Home'     },
  { to: '/reports',  icon: '📊', label: 'Reports'  },
  { to: '/settings', icon: '⚙️',  label: 'Settings' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-20"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2.5 text-xs font-medium transition-colors ${
              isActive ? 'text-income' : 'text-gray-400'
            }`
          }
        >
          <span className="text-xl mb-0.5">{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

### 5.7 Build the Full `TransactionsPage.tsx`

Replace the placeholder with the complete page:

```tsx
import { useState } from 'react';
import { useTxStore } from '../stores/txStore';
import { useTransactions } from '../hooks/useTransactions';
import MonthSelector from '../components/shared/MonthSelector';
import BalanceSummary from '../components/transactions/BalanceSummary';
import TransactionList from '../components/transactions/TransactionList';
import AddTransactionDrawer from '../components/transactions/AddTransactionDrawer';
import FAB from '../components/shared/FAB';
import { Transaction } from '../types';

export default function TransactionsPage() {
  const { transactions, categories, selectedMonth, selectedYear, setMonth, loading } = useTxStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);

  // Fetch transactions when month changes
  useTransactions();

  const openAdd = () => { setEditTx(null); setDrawerOpen(true); };
  const openEdit = (tx: Transaction) => { setEditTx(tx); setDrawerOpen(true); };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Sticky header */}
      <div className="sticky top-0 z-10">
        <MonthSelector
          month={selectedMonth}
          year={selectedYear}
          onChange={(m, y) => setMonth(m, y)}
        />
        <BalanceSummary transactions={transactions} />
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-income border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <TransactionList
          transactions={transactions}
          categories={categories}
          onEdit={openEdit}
          onDeleteStart={setDeleteTx}
        />
      )}

      <FAB onClick={openAdd} />
      <AddTransactionDrawer
        isOpen={drawerOpen}
        editTx={editTx}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
```

### 5.8 Update `App.tsx` with Layout + Bottom Nav

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './components/auth/AuthProvider';
import BottomNav from './components/layout/BottomNav';
import TransactionsPage from './pages/TransactionsPage';
import SettingsPage from './pages/SettingsPage';
import { useEffect } from 'react';
import { useTxStore } from './stores/txStore';
import { useAuthStore } from './stores/authStore';
import { api } from './api';
import { DEFAULT_CATEGORIES } from './constants/categories';

function AppContent() {
  const { token } = useAuthStore();
  const { setCategories } = useTxStore();

  useEffect(() => {
    if (!token) return;
    api.getCategories(token)
      .then(setCategories)
      .catch(() => setCategories(DEFAULT_CATEGORIES));
  }, [token]);

  return (
    <div className="max-w-md mx-auto relative">
      <Routes>
        <Route path="/" element={<TransactionsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### 5.9 Test Transaction List

1. Open app, sign in
2. Add 2–3 test transactions via the drawer (Plan 4)
3. Home screen shows correct income / expenses / balance totals
4. Transactions appear grouped by date, newest first
5. Tap `←` — changes to previous month, shows empty state (or previous data)
6. Tap `›` — returns to current month, transactions reload
7. Verify amounts are green (income) / red (expense)
8. Loading spinner shows briefly while fetching

---

## Notes
- `max-w-md mx-auto` on the app container centers content on desktop while keeping mobile layout.
- `groupByDate` sorts transactions by date descending — newest date group first.
- The balance summary is sticky — it stays visible as you scroll through transactions.
