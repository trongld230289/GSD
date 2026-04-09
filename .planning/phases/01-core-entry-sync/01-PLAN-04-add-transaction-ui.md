# Plan 4: Add Transaction UI

**Phase:** 1 — Core Entry & Sync
**Plan:** 4 of 6
**Goal:** Build the FAB button and bottom drawer for adding transactions — amount input, income/expense toggle, category grid, date picker, note field, and save logic that writes to GAS.

---

## Pre-conditions
- Plan 3 complete — user is signed in, `api.addTransaction` is wired with real token

## Success Criteria
- [ ] FAB visible at bottom-right of screen
- [ ] Tapping FAB opens bottom drawer with smooth slide-up animation
- [ ] Income / Expense toggle switches category grid between income and expense sets
- [ ] Amount field opens phone keyboard automatically, accepts integers only
- [ ] Category grid shows 4 columns with emoji + name, highlights selected
- [ ] Date defaults to today; user can change it
- [ ] Save button is disabled when amount is 0 or no category selected
- [ ] Saving adds transaction to Google Sheet (visible in Sheets after submit)
- [ ] Drawer closes after successful save
- [ ] New transaction appears immediately in the transaction list (optimistic update)

---

## Tasks

### 4.1 Create `AmountInput.tsx`

**`src/components/shared/AmountInput.tsx`**
```tsx
interface AmountInputProps {
  value: number;
  onChange: (amount: number) => void;
  type: 'income' | 'expense';
}

export default function AmountInput({ value, onChange, type }: AmountInputProps) {
  const colorClass = type === 'income' ? 'text-income' : 'text-expense';

  return (
    <div className="px-4 py-3 border-b border-gray-100">
      <div className={`flex items-baseline justify-end gap-1 ${colorClass}`}>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          className={`text-4xl font-bold text-right bg-transparent border-none outline-none w-full ${colorClass}`}
          value={value || ''}
          onChange={e => {
            const raw = parseInt(e.target.value.replace(/\D/g, '')) || 0;
            onChange(raw);
          }}
          placeholder="0"
          autoFocus
        />
        <span className="text-2xl font-semibold">₫</span>
      </div>
      {value > 0 && (
        <p className="text-right text-xs text-gray-400 mt-1">
          {new Intl.NumberFormat('vi-VN').format(value)} ₫
        </p>
      )}
    </div>
  );
}
```

### 4.2 Create `CategoryGrid.tsx`

**`src/components/shared/CategoryGrid.tsx`**
```tsx
import { Category } from '../../types';

interface CategoryGridProps {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string) => void;
  type: 'income' | 'expense';
}

export default function CategoryGrid({ categories, selected, onSelect, type }: CategoryGridProps) {
  const filtered = categories
    .filter(c => c.type === type)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="grid grid-cols-4 gap-2 px-4 py-3">
      {filtered.map(cat => {
        const isSelected = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="flex flex-col items-center py-2 px-1 rounded-xl transition-all active:scale-95"
            style={isSelected
              ? { backgroundColor: cat.color + '25', outline: `2px solid ${cat.color}` }
              : { backgroundColor: '#F3F4F6' }
            }
          >
            <span className="text-2xl leading-none">{cat.icon}</span>
            <span className="text-[10px] mt-1 text-center leading-tight text-gray-700 line-clamp-2">
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

### 4.3 Create `AddTransactionDrawer.tsx`

**`src/components/transactions/AddTransactionDrawer.tsx`**
```tsx
import { useState, useEffect } from 'react';
import { useTxStore } from '../../stores/txStore';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../api';
import { todayISO } from '../../utils/date';
import AmountInput from '../shared/AmountInput';
import CategoryGrid from '../shared/CategoryGrid';
import { Transaction } from '../../types';
import { generateId } from '../../utils/id';

interface Props {
  isOpen: boolean;
  editTx?: Transaction | null;
  onClose: () => void;
}

export default function AddTransactionDrawer({ isOpen, editTx, onClose }: Props) {
  const { categories, addTransaction, updateTransaction } = useTxStore();
  const { token } = useAuthStore();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Pre-populate when editing
  useEffect(() => {
    if (editTx) {
      setType(editTx.type);
      setAmount(editTx.amount);
      setCategoryId(editTx.category_id);
      setDate(editTx.date);
      setNote(editTx.note);
    } else {
      setType('expense');
      setAmount(0);
      setCategoryId(null);
      setDate(todayISO());
      setNote('');
    }
  }, [editTx, isOpen]);

  const canSave = amount > 0 && !!categoryId;

  const handleSave = async () => {
    if (!canSave || !token) return;
    setSaving(true);
    try {
      const txData = { type, amount, category_id: categoryId!, date, note };

      if (editTx) {
        await api.updateTransaction({ ...editTx, ...txData }, token);
        updateTransaction({ ...editTx, ...txData });
      } else {
        const { id } = await api.addTransaction(txData, token);
        addTransaction({ id, ...txData, created_at: new Date().toISOString() });
      }
      onClose();
    } catch (err) {
      alert('Failed to save. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto pb-safe"
        style={{ animation: 'slideUp 0.25s ease-out' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          <h2 className="text-base font-semibold text-gray-800">
            {editTx ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Income / Expense toggle */}
        <div className="flex mx-4 mb-1 bg-gray-100 rounded-xl p-1">
          {(['expense', 'income'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setType(t); setCategoryId(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                type === t
                  ? t === 'expense'
                    ? 'bg-expense text-white shadow-sm'
                    : 'bg-income text-white shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Amount input */}
        <AmountInput value={amount} onChange={setAmount} type={type} />

        {/* Category grid */}
        <CategoryGrid
          categories={categories}
          selected={categoryId}
          onSelect={setCategoryId}
          type={type}
        />

        {/* Date */}
        <div className="px-4 py-2 border-t border-gray-100">
          <label className="block text-xs text-gray-400 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-income"
          />
        </div>

        {/* Note */}
        <div className="px-4 py-2 border-t border-gray-100">
          <label className="block text-xs text-gray-400 mb-1">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What was this for?"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-income"
          />
        </div>

        {/* Save button */}
        <div className="px-4 py-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all ${
              canSave ? 'bg-income active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving…' : editTx ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      {/* Slide-up animation */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
      `}</style>
    </>
  );
}
```

### 4.4 Create FAB Component

**`src/components/shared/FAB.tsx`**
```tsx
interface FABProps {
  onClick: () => void;
}

export default function FAB({ onClick }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-5 w-14 h-14 bg-income text-white rounded-full shadow-lg flex items-center justify-center text-2xl active:scale-90 transition-transform z-30"
      aria-label="Add transaction"
    >
      +
    </button>
  );
}
```

### 4.5 Wire FAB + Drawer into `TransactionsPage`

Initial wiring in **`src/pages/TransactionsPage.tsx`** (will be expanded in Plan 5):
```tsx
import { useState } from 'react';
import AddTransactionDrawer from '../components/transactions/AddTransactionDrawer';
import FAB from '../components/shared/FAB';

export default function TransactionsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="p-4 text-center text-gray-400">Transactions list coming in Plan 5</div>

      <FAB onClick={() => setDrawerOpen(true)} />
      <AddTransactionDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
```

### 4.6 Load Categories on App Start

In **`src/App.tsx`**, add a categories fetch after sign-in:
```tsx
import { useEffect } from 'react';
import { useTxStore } from './stores/txStore';
import { useAuthStore } from './stores/authStore';
import { api } from './api';
import { DEFAULT_CATEGORIES } from './constants/categories';

// Inside App, inside AuthProvider children:
function AppContent() {
  const { token } = useAuthStore();
  const { setCategories } = useTxStore();

  useEffect(() => {
    if (!token) return;
    api.getCategories(token)
      .then(setCategories)
      .catch(() => setCategories(DEFAULT_CATEGORIES)); // fallback
  }, [token]);

  return ( /* BrowserRouter + Routes */ );
}
```

### 4.7 Test the Full Add Flow

1. Open app, sign in
2. Tap FAB → drawer slides up from bottom
3. Toggle to **Expense** (default)
4. Type `85000` in amount field → shows `85.000 ₫`
5. Tap **Food & Dining** category → highlights with orange ring
6. Today's date is pre-filled
7. Add note: "Phở"
8. Tap **Save** → loading state, then drawer closes
9. Open Google Sheet → new row visible in `Transactions` tab
10. Test with **Income** toggle → income categories shown

---

## Notes
- The drawer uses `position: fixed` — it overlays everything including the bottom nav.
- `autoFocus` on the amount input opens the phone keyboard immediately when the drawer opens.
- Optimistic update: transaction added to Zustand store immediately, before GAS responds, for instant UI feedback.
