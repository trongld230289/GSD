# Architecture

**Analysis Date:** 2026-04-19

## Pattern Overview

**Overall:** Single-Page Application (SPA) with Serverless Backend

**Key Characteristics:**
- React SPA deployed to GitHub Pages (`basename="/GSD"`)
- Google Apps Script (GAS) Web App as the sole backend — no Node.js server
- Google Sheets as the database
- Google OAuth via GSI (Google Sign-In) for authentication
- All client state managed via Zustand stores

## Layers

**Page Layer:**
- Purpose: Route-level UI components, compose feature components
- Contains: `LoginPage`, `HomePage`, `ReportsPage`
- Location: `finance-tracker/src/pages/`
- Depends on: Component layer, store layer, API layer
- Used by: React Router routes in `App.tsx`

**Component Layer:**
- Purpose: Reusable UI building blocks
- Contains: `AddTransactionDrawer`, `BalanceSummary`, `BottomNav`, `FAB`, `Header`, `MonthNav`, `SpendingChart`, `TransactionItem`, `TransactionList`
- Location: `finance-tracker/src/components/`
- Depends on: Store layer (reads/writes state), API layer (via pages or internally)
- Used by: Page layer

**Store Layer:**
- Purpose: Client-side state management with persistence
- Contains: `useAuthStore` (persisted via localStorage), `useAppStore` (in-memory with txCache)
- Location: `finance-tracker/src/store/useStore.ts`
- Depends on: Nothing (pure Zustand)
- Used by: Pages and components

**API Layer:**
- Purpose: All HTTP communication with the GAS Web App
- Contains: `gasGet`, `gasPost` helpers; `apiGetCategories`, `apiGetTransactions`, `apiAddTransaction`, `apiUpdateTransaction`, `apiDeleteTransaction`, `apiGetMonthlyTotals`
- Location: `finance-tracker/src/api/gas.ts`
- Depends on: Native `fetch` only
- Used by: Pages and components

**Data/Types Layer:**
- Purpose: Static data and shared TypeScript interfaces
- Contains: `categories.ts` (hardcoded category list), `types.ts` (all TS interfaces)
- Location: `finance-tracker/src/data/`, `finance-tracker/src/types.ts`
- Depends on: Nothing
- Used by: All layers

## Data Flow

**Transaction Load Flow:**

1. User selects month via `MonthNav`
2. `useAppStore.setCurrentMonth()` updates store
3. `HomePage` reads `currentMonth`, checks `txCache` for existing data
4. On cache miss: calls `apiGetTransactions(token, month)`
5. GAS Web App queries Google Sheet by month/year, returns JSON
6. Results stored in `txCache[month]` and `transactions` in `useAppStore`
7. `TransactionList` renders from `transactions`

**Add/Edit Transaction Flow:**

1. User taps FAB or edit icon → `openDrawer(tx?)` called on store
2. `AddTransactionDrawer` renders with form
3. On submit: `apiAddTransaction` or `apiUpdateTransaction` POSTed to GAS
4. GAS writes/updates row in Google Sheet, returns `{id, success}`
5. Store updated optimistically via `addTransaction` / `updateTransaction`
6. Cache for current month invalidated via `invalidateCache(month)`

**Auth Flow:**

1. Google GSI renders sign-in button on `LoginPage`
2. On success: `credential` (JWT) returned by Google
3. `useAuthStore.setUser(user, idToken)` persists user + token to localStorage
4. `App.tsx` routes to `/` (protected pages read `user` from `useAuthStore`)
5. All API calls pass `idToken` as `token` param for server-side verification

**State Management:**
- `useAuthStore`: persisted to localStorage (survives refresh), holds Google user + idToken
- `useAppStore`: in-memory only, holds transactions, categories, month navigation, drawer state, and txCache (month-keyed cache)

## Key Abstractions

**Zustand Stores:**
- Purpose: Single source of truth for all client state
- Examples: `useAuthStore`, `useAppStore` in `finance-tracker/src/store/useStore.ts`
- Pattern: Flat stores with action methods; `persist` middleware for auth only

**GAS API Module:**
- Purpose: All communication with the Google Apps Script backend
- Examples: `gasGet`, `gasPost` in `finance-tracker/src/api/gas.ts`
- Pattern: Typed wrapper functions; `Content-Type: text/plain` on POST to avoid CORS preflight

**Transaction Cache:**
- Purpose: Avoid re-fetching data for already-viewed months
- Location: `txCache` field in `useAppStore`
- Pattern: Month-keyed record (`Record<string, Transaction[]>`), invalidated on write

## Entry Points

**App Entry:**
- Location: `finance-tracker/src/main.tsx`
- Triggers: Browser loads page
- Responsibilities: Mount React tree, render `<App />`

**Router:**
- Location: `finance-tracker/src/App.tsx`
- Triggers: Route navigation
- Responsibilities: Auth-guarded route definitions; redirects unauthenticated users to `/login`

## Error Handling

**Strategy:** API functions throw on non-OK GAS responses; callers handle via try/catch or let errors bubble to component error boundaries (not yet implemented).

**Patterns:**
- `gasGet`/`gasPost` parse GAS `{ok, data, error}` envelope; throw `Error(res.error)` on failure
- No global error boundary yet — uncaught errors surface as blank/broken UI

## Cross-Cutting Concerns

**Authentication:**
- Google GSI for sign-in; idToken passed as query param / POST field on every GAS request
- GAS verifies token server-side before executing queries

**CORS:**
- GAS requires `Content-Type: text/plain` on POST to avoid preflight (GAS does not handle OPTIONS)
- GET requests use query params only

**Currency:**
- All amounts stored and computed in VND (whole integers); formatting in `finance-tracker/src/utils/format.ts`

---

*Architecture analysis: 2026-04-19*
*Update when major patterns change*
