# Phase 1: Core Entry & Sync — Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Source:** /gsd-discuss-phase 1 (user decisions)

<domain>
## Phase Boundary

Phase 1 delivers a working app where the user can:
- Sign in with their Google account
- Add income and expense transactions
- Browse and edit/delete their transaction history by month
- Have all data persist in Google Sheets (synced across devices)

Everything in Phase 1 is foundational — no charts, no reports, no PWA install. Just the core data entry and sync loop working end-to-end.

</domain>

<decisions>
## Implementation Decisions

### Visual Design
- **Style:** Colorful & energetic — vibrant category colors, bold amounts (reference: Money Lover)
- **Color scheme:** Green & white primary. Income amounts = green (`#16A34A`). Expense amounts = red (`#DC2626`). Category icons use their own distinct colors.
- **Typography:** Bold, large amount displays. Clear hierarchy: amount > category > date > note.

### Navigation & Layout
- **Home screen:** Transactions list is home — balance summary cards (income/expenses/net) pinned at top, scrollable transaction list below.
- **Bottom navigation bar:** 4 tabs — Home (transactions) / Add (FAB center) / Reports / Settings
- **Language:** English only throughout the UI.

### Adding Transactions
- **Entry point:** Floating Action Button (FAB) at bottom-center → bottom drawer slides up
- **Drawer layout (top to bottom):**
  1. Drag handle
  2. Income / Expense toggle (two tabs)
  3. Amount input — large text field, phone keyboard, right-aligned, no decimals
  4. Category grid — 4 columns, emoji icon + label, scrollable
  5. Date input — defaults to today, user can change
  6. Note input — optional, single line
  7. Save button — disabled until amount > 0 AND category selected

### Amount Input
- Large font input field (not a custom in-app numpad)
- Phone keyboard pops up automatically when drawer opens
- Amount stored as integer VND (no decimals)
- Displayed with `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })` → `85.000 ₫`

### Deleting Transactions
- **Swipe left** on a transaction item to reveal a red Delete button
- Tapping Delete shows a confirmation dialog before removing
- Edit is accessed by tapping the transaction row (opens same drawer pre-populated)

### Category Picker
- Expense and income categories shown in separate sections based on the current Income/Expense toggle
- 4 per row grid layout
- Selected category: highlighted with colored ring matching category color
- 12 expense categories + 4 income categories (all from REQUIREMENTS.md CAT-01 / CAT-02)

### Data & Sync
- Google Sheets as the database (user's own Google Sheet)
- Google Apps Script Web App as the API layer
- All reads are month-scoped (server-side filter in GAS)
- All writes go directly to Sheets on save (no local-only queue in Phase 1)

### Authentication
- Google Sign-In: One Tap prompt on load + standard sign-in button fallback
- Session persists via localStorage (token + user info)
- Token auto-refreshed at 50-minute intervals (before 60-min expiry)

### Claude's Discretion
- Exact Tailwind class names and spacing values
- Drawer animation timing and easing
- Error message copy
- Loading state skeleton vs spinner choice
- Exact GAS deployment configuration steps

</decisions>

<canonical_refs>
## Canonical References

**Agents MUST read these before planning or implementing.**

### Project foundation
- `.planning/PROJECT.md` — project context, constraints, decisions
- `.planning/REQUIREMENTS.md` — AUTH-01–04, TRANS-01–12, CAT-01–03 (Phase 1 scope)

### Research
- `.planning/research/STACK.md` — locked tech stack (React 18, Vite, Tailwind, Zustand, GAS)
- `.planning/research/ARCHITECTURE.md` — GAS API design, Sheets schema, component tree, data flow
- `.planning/research/PITFALLS.md` — CORS setup, token refresh, VND formatting, GAS quotas
- `.planning/research/FEATURES.md` — category set (12 expense + 4 income), Money Lover UX patterns

</canonical_refs>

<specifics>
## Specific Ideas

- Money Lover is the direct UX reference — mirror its transaction entry flow and visual feel
- The category grid is the "hero" UI element — make it feel fast and satisfying to tap
- Amount should feel like a financial app: bold, right-aligned, formatted as you type
- Green = positive/income, Red = negative/expense — consistent everywhere

</specifics>

<deferred>
## Deferred to Later Phases

- Dashboard charts and reports (Phase 2)
- PWA install / service worker (Phase 3)
- CSV export (Phase 3)
- Budget limits, recurring transactions, custom categories (v2)
- Offline write queue (v2)

</deferred>

---
*Phase: 01-core-entry-sync*
*Context gathered: 2026-04-09 via /gsd-discuss-phase 1*
