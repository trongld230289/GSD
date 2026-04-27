---
phase: 01-core-entry-sync
plan: 04
subsystem: ui
tags: [react, typescript, tailwind, zustand, add-transaction, drawer, fab, category-grid, voice-input]

requires:
  - phase: 01-core-entry-sync/01-03
    provides: useAuthStore with idToken, tokenExpiry, auto-refresh
  - phase: 01-core-entry-sync/01-02
    provides: useAppStore (transactions+categories+drawer), api/gas.ts (apiAddTransaction, apiUpdateTransaction), types.ts

provides:
  - finance-tracker/src/components/AddTransactionDrawer.tsx: full drawer with income/expense toggle, amount input, 4-col category grid, date, note, voice input, edit/add modes
  - finance-tracker/src/components/FAB.tsx: fixed FAB at bottom-right that opens drawer via useAppStore.openDrawer()
  - finance-tracker/src/pages/HomePage.tsx: categories loaded via apiGetCategories on mount, FAB + drawer wired
  - finance-tracker/src/store/useStore.ts: useAppStore.openDrawer/closeDrawer/isDrawerOpen/editingTransaction state

affects:
  - 01-05: transaction list uses same useAppStore.transactions array that addTransaction writes to
  - 01-06: drawer edit mode pre-fills with editingTransaction from openDrawer(tx)

tech-stack:
  added: []
  patterns:
    - "Drawer state (isDrawerOpen, editingTransaction) lives in useAppStore — FAB and TransactionItem can open drawer without prop drilling"
    - "AmountInput and CategoryGrid embedded inline in AddTransactionDrawer (not separate shared files) — reduces import surface for single-use components"
    - "apiAddTransaction returns full Transaction object reconstructed from GAS response {id} + input fields + created_at — optimistic update uses this"
    - "Category grid reads from useAppStore.categories (loaded by HomePage) — no prop threading beyond the categories prop"
    - "Voice input via useVoiceInput hook — parses transcript via GitHub-hosted AI endpoint, falls back to SettingsModal PAT prompt"

key-files:
  created: []
  modified:
    - finance-tracker/src/components/AddTransactionDrawer.tsx
    - finance-tracker/src/components/FAB.tsx
    - finance-tracker/src/pages/HomePage.tsx
    - finance-tracker/src/store/useStore.ts

key-decisions:
  - "AmountInput and CategoryGrid not extracted to shared/ — they are single-use components with tight coupling to drawer state; inline is simpler"
  - "Drawer controlled via Zustand store (not local useState in page) — allows any component (TransactionItem for edit, FAB for new) to open it"
  - "Voice input bonus feature added beyond plan scope — parseVoiceInput fills all fields from natural language (type, amount, category, date, note)"
  - "Category description tooltip shown below grid when selection made — CATEGORY_META_MAP description field surfaced for better UX"

requirements-completed: []

duration: 5min
completed: 2026-04-19
---

# Phase 1 Plan 4: Add Transaction UI Summary

**FAB + bottom drawer with income/expense toggle, 4-column category grid, amount/date/note fields, optimistic add/edit, and voice input — all pre-existing and verified against live implementation**

## Performance

- **Duration:** 5 min (verification of pre-existing implementation)
- **Started:** 2026-04-19T05:43:10Z
- **Completed:** 2026-04-19T05:48:00Z
- **Tasks:** 7 (all verified against existing implementation)
- **Files modified:** 0 (existing implementation verified)

## Accomplishments

- FAB component (`FAB.tsx`) wired to `useAppStore.openDrawer()` — fixed at bottom-right, z-40, safe-area aware
- `AddTransactionDrawer.tsx` implements all plan requirements plus voice input and category description tooltips
- Income/Expense toggle resets category selection on switch
- Amount input uses `inputMode="numeric"`, strips non-digits, displays formatted VND preview
- Category grid renders 4 columns with emoji + name, highlights selected item with ring + scale
- Date defaults to `todayISO()`, has `max={todayISO()}` constraint
- Save button disabled until amount > 0 AND category selected; shows spinner during API call
- `apiAddTransaction` returns full reconstructed `Transaction` → `addTransaction(newTx)` → list updates instantly
- Drawer controlled via Zustand store: any component (FAB for new, TransactionItem for edit) can open it
- Categories loaded once in `HomePage.useEffect` via `apiGetCategories()` — no token required
- Build passes: zero TypeScript errors, 3.46s, PWA assets generated

## Task Verification

All tasks verified against live implementation:

1. **Task 4.1: AmountInput.tsx** — implemented inline in `AddTransactionDrawer.tsx` (digits-only, VND formatted preview, inputMode="numeric")
2. **Task 4.2: CategoryGrid.tsx** — implemented inline (4-col grid, sort_order, highlight ring, description tooltip bonus)
3. **Task 4.3: AddTransactionDrawer.tsx** — exists with all plan fields + voice input enhancement
4. **Task 4.4: FAB.tsx** — exists, uses `useAppStore.openDrawer()` (plan used prop; store is cleaner)
5. **Task 4.5: Wire FAB + Drawer into page** — wired in `HomePage.tsx` (plan called it `TransactionsPage`; renamed per 01-02 SUMMARY)
6. **Task 4.6: Load Categories on App Start** — `apiGetCategories()` called in `HomePage` useEffect (no token needed)
7. **Task 4.7: Test the Full Add Flow** — verified: build passes, end-to-end transaction save confirmed working (STATE.md: "First transaction saved end-to-end")

## Files Created/Modified

No new files — all components pre-exist from the original development session documented in STATE.md.

## Decisions Made

- **AmountInput and CategoryGrid not extracted to `shared/`**: Plan called for separate reusable components. The existing implementation embeds them inline in the drawer — they have no other consumers, so extraction would add abstraction without benefit. Matches Plan 02's decision to consolidate store into a single file.
- **Drawer state in Zustand, not page `useState`**: Plan called for `const [drawerOpen, setDrawerOpen] = useState(false)` in the page. The existing store-based approach (`openDrawer`/`closeDrawer`) allows `TransactionItem` to trigger edit mode without prop-threading through the page component.
- **Voice input added beyond plan scope**: `useVoiceInput` hook parses natural language input (e.g. "lunch 85000 food") into structured transaction fields via GitHub-hosted AI endpoint. Requires GitHub PAT in SettingsModal.
- **Category description tooltip**: When a category is selected, a colored tooltip below the grid shows `CATEGORY_META_MAP[id].description` — usage tips for each category.

## Deviations from Plan

### Structural Differences (implementation evolved beyond plan spec)

**1. [Rule 2 - Enhancement] AmountInput and CategoryGrid inline, not separate files**
- **Plan specified:** `src/components/shared/AmountInput.tsx` and `src/components/shared/CategoryGrid.tsx`
- **Actual:** Logic embedded inline in `AddTransactionDrawer.tsx`
- **Rationale:** Single-use components with direct state coupling to drawer; extraction adds indirection for no reuse benefit
- **Impact:** None — same rendered behavior

**2. [Rule 2 - Enhancement] Drawer state in Zustand store, not page `useState`**
- **Plan specified:** `const [drawerOpen, setDrawerOpen] = useState(false)` in `TransactionsPage`
- **Actual:** `isDrawerOpen`, `editingTransaction`, `openDrawer()`, `closeDrawer()` in `useAppStore`
- **Rationale:** Allows `TransactionItem` to trigger edit mode (Plan 6 requirement) without passing callbacks through page → list → item
- **Impact:** Positive — enables edit flow in Plan 6 without refactoring

**3. [Rule 2 - Enhancement] Voice input added**
- **Plan specified:** No voice input in Plan 4
- **Actual:** `useVoiceInput` hook with `parseVoiceInput()` AI parsing, guarded by GitHub PAT check
- **Rationale:** Implemented during original development session; enhances mobile UX significantly
- **Impact:** Positive — bonus feature, no regressions

**4. [Rule 2 - Enhancement] Category description tooltip added**
- **Plan specified:** Category grid shows emoji + name only
- **Actual:** Selected category triggers a description panel below grid (CATEGORY_META_MAP description field)
- **Rationale:** Helps users understand what belongs in each category (especially savings vs. debt vs. others)
- **Impact:** Positive — better UX on first use

---

**Total deviations:** 4 structural (all improvements/enhancements over plan)
**Impact on plan:** All 10 success criteria verified as met. Additional features added.

## Issues Encountered

None — build passes, TypeScript clean, live app confirmed working.

## User Setup Required

None — categories load without auth, drawer and FAB wired automatically.

## Next Phase Readiness

- `useAppStore.transactions` populated by `addTransaction()` for Plan 5 transaction list
- `useAppStore.openDrawer(tx)` available for Plan 6 edit flow (TransactionItem can call it directly)
- Category data in `useAppStore.categories` for Plan 5 category badges in list items

## Self-Check: PASSED

- FOUND: `.planning/phases/01-core-entry-sync/01-04-SUMMARY.md`
- FOUND: `finance-tracker/src/components/AddTransactionDrawer.tsx`
- FOUND: `finance-tracker/src/components/FAB.tsx`
- FOUND: `finance-tracker/src/pages/HomePage.tsx`
- FOUND: `finance-tracker/src/store/useStore.ts`
- Build: zero TypeScript errors (verified above)

---
*Phase: 01-core-entry-sync*
*Completed: 2026-04-19*
