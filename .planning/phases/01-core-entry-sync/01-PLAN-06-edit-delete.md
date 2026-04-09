# Plan 6: Edit & Delete Transactions

**Phase:** 1 — Core Entry & Sync
**Plan:** 6 of 6
**Goal:** Complete the CRUD loop — tap a transaction to edit it in the existing drawer (pre-populated), swipe left to reveal a delete button, confirm dialog before permanent deletion.

---

## Pre-conditions
- Plan 5 complete — transaction list is fully displayed
- `AddTransactionDrawer` already accepts `editTx` prop and `updateTransaction` is wired in Plan 4

## Success Criteria
- [ ] Tapping a transaction row opens the drawer pre-filled with its data
- [ ] Editing any field and saving updates the transaction in the list AND in Google Sheets
- [ ] Swiping a transaction item left partially reveals a red Delete button
- [ ] Tapping Delete shows a confirmation dialog ("Delete this transaction?")
- [ ] Confirming delete removes the transaction from the list AND from Google Sheets
- [ ] Cancelling the delete dialog leaves the transaction unchanged
- [ ] After delete, the balance summary updates immediately

---

## Tasks

### 6.1 Upgrade `TransactionItem` for Swipe-to-Delete

Replace `src/components/transactions/TransactionItem.tsx` with swipe-enabled version:

```tsx
import { useState, useRef } from 'react';
import { Transaction, Category } from '../../types';
import { formatVND } from '../../utils/currency';

interface Props {
  tx: Transaction;
  category?: Category;
  onEdit: (tx: Transaction) => void;
  onDeleteStart: (tx: Transaction) => void;
}

const SWIPE_THRESHOLD = 60; // px — how far to swipe before Delete reveals
const DELETE_REVEAL = 80;    // px — size of delete button area

export default function TransactionItem({ tx, category, onEdit, onDeleteStart }: Props) {
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const startX = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (dx < 0) {
      // Swipe left — clamp to DELETE_REVEAL max
      setOffset(Math.max(dx, -DELETE_REVEAL));
    } else if (revealed) {
      // Swipe right to close
      setOffset(Math.min(0, -DELETE_REVEAL + dx));
    }
  };

  const handlePointerUp = () => {
    if (offset < -SWIPE_THRESHOLD) {
      setOffset(-DELETE_REVEAL);
      setRevealed(true);
    } else {
      setOffset(0);
      setRevealed(false);
    }
    startX.current = null;
  };

  const handleTap = () => {
    if (revealed) {
      // Close swipe if tapping row
      setOffset(0);
      setRevealed(false);
    } else {
      onEdit(tx);
    }
  };

  return (
    <div className="relative overflow-hidden bg-white">
      {/* Delete button (revealed by swipe) */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center"
        style={{ width: DELETE_REVEAL }}>
        <button
          onClick={() => onDeleteStart(tx)}
          className="w-full h-full bg-red-500 flex flex-col items-center justify-center text-white text-xs font-medium gap-0.5"
        >
          <span className="text-lg">🗑</span>
          Delete
        </button>
      </div>

      {/* Transaction row (slides left) */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white cursor-pointer select-none"
        style={{
          transform: `translateX(${offset}px)`,
          transition: startX.current ? 'none' : 'transform 0.2s ease-out',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleTap}
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
        <span className={`text-sm font-semibold flex-shrink-0 ${
          tx.type === 'income' ? 'text-income' : 'text-expense'
        }`}>
          {tx.type === 'income' ? '+' : '-'}{formatVND(tx.amount)}
        </span>
      </div>
    </div>
  );
}
```

### 6.2 Create `ConfirmDialog.tsx`

**`src/components/shared/ConfirmDialog.tsx`**
```tsx
interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export default function ConfirmDialog({
  isOpen, title, message, confirmLabel = 'Confirm',
  onConfirm, onCancel, destructive = false
}: Props) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onCancel} />
      <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 bg-white rounded-2xl shadow-xl p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 text-sm text-white rounded-xl font-medium ${
              destructive ? 'bg-red-500 hover:bg-red-600' : 'bg-income hover:bg-green-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
```

### 6.3 Wire Delete into `TransactionsPage`

Update **`src/pages/TransactionsPage.tsx`** to handle delete:

```tsx
import { useState } from 'react';
import { useTxStore } from '../stores/txStore';
import { useAuthStore } from '../stores/authStore';
import { useTransactions } from '../hooks/useTransactions';
import { api } from '../api';
import MonthSelector from '../components/shared/MonthSelector';
import BalanceSummary from '../components/transactions/BalanceSummary';
import TransactionList from '../components/transactions/TransactionList';
import AddTransactionDrawer from '../components/transactions/AddTransactionDrawer';
import FAB from '../components/shared/FAB';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { Transaction } from '../types';

export default function TransactionsPage() {
  const { transactions, categories, selectedMonth, selectedYear, setMonth, loading, removeTransaction } = useTxStore();
  const { token } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  useTransactions();

  const handleDelete = async () => {
    if (!deleteTx || !token) return;
    setDeleting(true);
    try {
      await api.deleteTransaction(deleteTx.id, token);
      removeTransaction(deleteTx.id);
    } catch (err) {
      alert('Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
      setDeleteTx(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-10">
        <MonthSelector month={selectedMonth} year={selectedYear} onChange={setMonth} />
        <BalanceSummary transactions={transactions} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-income border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <TransactionList
          transactions={transactions}
          categories={categories}
          onEdit={(tx) => { setEditTx(tx); setDrawerOpen(true); }}
          onDeleteStart={setDeleteTx}
        />
      )}

      <FAB onClick={() => { setEditTx(null); setDrawerOpen(true); }} />

      <AddTransactionDrawer
        isOpen={drawerOpen}
        editTx={editTx}
        onClose={() => setDrawerOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!deleteTx}
        title="Delete transaction?"
        message={`This will permanently remove this transaction from your records.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTx(null)}
        destructive
      />
    </div>
  );
}
```

### 6.4 Test Edit Flow

1. Open app, view a transaction in the list
2. **Tap** the transaction row → drawer opens pre-filled with its data
3. Change the amount (e.g. add `5000`)
4. Tap **Update** → drawer closes, list shows updated amount
5. Open Google Sheet → row shows updated values

### 6.5 Test Delete Flow

1. **Swipe left** on a transaction item → red Delete button slides into view
2. Tap **Delete** → confirm dialog appears
3. Tap **Cancel** → dialog closes, transaction remains
4. Swipe left again → tap Delete → tap **Delete** in dialog
5. Transaction disappears from list, balance summary updates
6. Open Google Sheet → row is gone

### 6.6 Edge Case Tests

| Scenario | Expected behavior |
|---|---|
| Edit with amount = 0 | Save/Update button stays disabled |
| Delete last transaction in a date group | Date group header disappears too |
| Swipe right on swiped item | Item snaps back, Delete hidden |
| Network error during delete | Error alert shown, transaction stays in list |
| Network error during edit | Error alert shown, original values preserved |

---

## Phase 1 Complete ✅

After Plan 6, Phase 1 is done. Verify all Phase 1 success criteria:

- [ ] AUTH-01–04: Sign in, session persists, user-scoped data, sign out ✓
- [ ] TRANS-01–12: Add income/expense, drawer, amount, category, date, note, validation, list, month nav, item display, delete, edit ✓
- [ ] CAT-01–03: 12 expense + 4 income categories, separated by type ✓

**Next:** Run `/gsd-plan-phase 2` to plan Phase 2: Dashboard & Analytics.

---

## Notes
- Edit uses the same `AddTransactionDrawer` component — `editTx` prop pre-fills it and switches "Save" to "Update".
- Swipe uses native pointer events (not touch events) — works on both mobile and desktop.
- `removeTransaction` from Zustand store is synchronous, so the list updates immediately before GAS confirms deletion.
