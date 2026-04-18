# Coding Conventions

**Analysis Date:** 2026-04-19

## Naming Patterns

**Files:**
- Component files: PascalCase (e.g., `TransactionItem.tsx`, `AddTransactionDrawer.tsx`)
- Utility files: camelCase (e.g., `format.ts`, `date.ts`)
- Type/data files: camelCase (e.g., `types.ts`, `categories.ts`)
- Page files: PascalCase in `pages/` directory (e.g., `HomePage.tsx`, `LoginPage.tsx`)
- Store files: camelCase (e.g., `useStore.ts`)
- API files: camelCase (e.g., `gas.ts`)

**Functions:**
- React components: PascalCase (default exports)
- Helper functions: camelCase (e.g., `formatVND()`, `normalizeDate()`, `groupByDate()`)
- Event handlers: camelCase with `handle` prefix (e.g., `handleTouchStart`, `handleDelete`, `handleSave`)
- API functions: camelCase with `api` prefix (e.g., `apiGetCategories()`, `apiAddTransaction()`)
- Store methods: camelCase descriptive names (e.g., `setTransactions()`, `removeTransaction()`, `invalidateCache()`)

**Variables:**
- State hooks: camelCase (e.g., `swipeX`, `isDeleting`, `isSaving`)
- Boolean flags: `is` or `has` prefix (e.g., `isEditing`, `isLoadingTx`, `isDragging`, `isLastMonth`)
- Component props: camelCase (e.g., `categories`, `transaction`, `idToken`)
- Object destructuring: short names (e.g., `{ user, idToken }`, `{ transactions, categories }`)

**Types:**
- Interfaces: PascalCase (e.g., `Transaction`, `Category`, `AuthState`, `AppStore`)
- Type aliases: PascalCase (e.g., `TransactionType`)
- Generic parameters: Single uppercase letters or descriptive (e.g., `T`, `GasResponse<T>`)

## Code Style

**Formatting:**
- Tool: Vite with React default setup (no explicit formatter configured)
- Indentation: 2 spaces
- Line length: No hard limit enforced, but pragmatic wrapping observed in components
- Semicolons: Always present
- Trailing commas: Not consistently used in multiline objects (mixed style observed)

**Linting:**
- No explicit ESLint or Prettier configuration present
- TypeScript strict mode enabled in `tsconfig.json`:
  - `strict: true`
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `noFallthroughCasesInSwitch: true`

## Import Organization

**Order:**
1. External libraries (React, date-fns, zustand)
2. Type imports from local modules
3. Component/store imports from local modules
4. Utility and API imports

**Examples from codebase:**
- `src/components/TransactionItem.tsx`: React hooks first, then types, utilities, stores
- `src/pages/HomePage.tsx`: React hooks, stores, API calls, date-fns, then components

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json` but not actively used — relative imports preferred)

## Error Handling

**Patterns:**
- Try-catch for async operations with error state management
- Error message extraction: `err instanceof Error ? err.message : 'Failed to save'`
- User feedback: error messages stored in state and displayed in UI
- API errors: wrapped in `GasResponse<T>` with `ok` boolean and optional `error` string
- Console logging: `console.error()` for exceptions
- Silent fallbacks: empty arrays/null defaults when data fails

## Logging

**Framework:** `console` object (no logging library)

**Patterns:**
- Error logging: `console.error(err)` for exceptions and API failures
- Conditional logging in error handlers with context messages
- Example: `.catch((err) => { console.error('Categories load failed:', err); setCatError(String(err)) })`

## Comments

**When to Comment:**
- Section headers: `// ─── Section Name ──────────────────` (ASCII dividers for organization)
- API behavior explanations: document quirks like GAS CORS requirements
- Complex logic: regex patterns and date format conversions
- Business logic: cache invalidation strategies and state synchronization

**JSDoc/TSDoc:**
- Used for utility functions with complex behavior
- Single-line format for simple functions: `/** Format a number as VND currency: 1500000 → "1.500.000 ₫" */`
- Multi-line for complex functions with multiple format examples or edge cases

## Function Design

**Size:** 
- Event handlers: 10-60 lines typical
- Utility functions: 5-30 lines
- Components: 50-200 lines depending on complexity (includes JSX)

**Parameters:** 
- Components use Props interface pattern then destructure in function signature
- API functions: explicit named parameters (no config objects)
- Store methods: immutable updates using `set((state) => ({ ... }))` pattern

**Return Values:**
- React components: JSX elements or null
- Utility functions: explicit return types
- Async functions: typed promises (e.g., `Promise<Transaction[]>`)

## Module Design

**Exports:**
- Default exports for React components: `export default function ComponentName()`
- Named exports for utilities and types
- Type exports use `export type`, interface exports use `export interface`

**Barrel Files:** 
- Not used in codebase
- Direct imports from specific modules preferred
- Re-exports in `src/store/useStore.ts` for convenience

## Conditional Rendering Patterns

**Ternary for simple conditions:**
```typescript
const isIncome = transaction.type === 'income'
className={isIncome ? 'text-green-600' : 'text-red-500'}
```

**Short-circuit AND for presence checks:**
```typescript
{transaction.note && <p className="text-xs text-gray-400">{transaction.note}</p>}
```

**Conditional rendering with null:**
```typescript
if (!isDrawerOpen) return null
```

## State Management Patterns

**Zustand stores in `src/store/useStore.ts`:**
- Store interface extends state interface
- Methods return immutable state updates: `set((state) => ({ ... }))`
- Auth store uses persist middleware: `persist(store, { name: 'finance-auth' })`
- App store includes cache strategy: `txCache: Record<string, Transaction[]>` for month-based caching
- Example immutable update pattern:
  ```typescript
  updateTransaction: (tx) =>
    set((s) => ({
      transactions: s.transactions.map((t) => (t.id === tx.id ? tx : t)),
    })),
  ```

## Styling

**Framework:** Tailwind CSS with inline classes

**Patterns:**
- Utility classes: direct class names for layout and spacing
- State-based styling: conditional classes with template literals
- Inline styles for dynamic values: computed colors with `style={{ backgroundColor: color + '22' }}`
- Responsive design: mobile-first approach with `max-w-md mx-auto`
- Animations: `animate-spin`, `transition-all`, `active:scale-95` for interactions
