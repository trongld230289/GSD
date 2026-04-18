# Testing Patterns

**Analysis Date:** 2026-04-19

## Test Framework

**Current Status:**
- No test framework configured or present in codebase
- No test files found (*.test.ts, *.spec.ts)
- Package.json contains no testing dependencies

**Recommended Setup:**
- Framework: Vitest (lightweight, Vite-native) or Jest
- Assertion Library: Vitest includes built-in assertion
- React Testing Library for component testing
- MSW (Mock Service Worker) for API mocking

## Test File Organization

**Recommended Pattern:**
- Co-located with source files
- Naming: [filename].test.ts or [filename].spec.ts
- Location structure:
  - src/components/TransactionItem.test.tsx
  - src/utils/format.test.ts
  - src/store/useStore.test.ts
  - src/api/gas.test.ts

## Test Structure

**Pattern for utilities:**
```typescript
import { describe, it, expect } from 'vitest'
import { formatVND, parseVNDInput } from '../src/utils/format'

describe('formatVND', () => {
  it('formats large numbers with Vietnamese currency', () => {
    expect(formatVND(1500000)).toBe('1.500.000 ₫')
  })

  it('handles zero', () => {
    expect(formatVND(0)).toBe('0 ₫')
  })

  it('handles negative numbers', () => {
    expect(formatVND(-500000)).toBe('-500.000 ₫')
  })
})

describe('parseVNDInput', () => {
  it('parses digit-only strings', () => {
    expect(parseVNDInput('1500000')).toBe(1500000)
  })

  it('ignores commas and dots', () => {
    expect(parseVNDInput('1.500.000')).toBe(1500000)
    expect(parseVNDInput('1,500,000')).toBe(1500000)
  })

  it('returns 0 for invalid input', () => {
    expect(parseVNDInput('abc')).toBe(0)
    expect(parseVNDInput('')).toBe(0)
  })
})
```

## Mocking

**Framework:** Vitest built-in vi object

**Patterns:**

**Mock fetch for API calls:**
```typescript
import { vi } from 'vitest'

global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ ok: true, data: [...] }),
  } as Response)
)

// After test:
vi.clearAllMocks()
```

**Mock Zustand stores:**
```typescript
import { useAppStore } from '../src/store/useStore'

// Option 1: Use getState() and setState() directly
const store = useAppStore.getState()
store.setTransactions(mockTransactions)

// Option 2: Create spy on actions
const setTransactionsSpy = vi.spyOn(store, 'setTransactions')
```

**What to Mock:**
- External API calls (always)
- Zustand store subscriptions (for isolated unit tests)
- Browser APIs like window.confirm()
- React Router only for integration tests

**What NOT to Mock:**
- Utility functions (formatVND, normalizeDate)
- Zustand store logic in store tests
- Component render logic
- Tailwind CSS classes
- TypeScript types

## Fixtures and Factories

**Test Data Pattern:**
```typescript
// test/fixtures/transactions.ts
import type { Transaction } from '../../src/types'

export const createTransaction = (overrides?: Partial<Transaction>): Transaction => ({
  id: '1',
  date: '2026-04-19',
  type: 'expense' as const,
  category_id: 'food',
  amount: 50000,
  note: 'Lunch',
  created_at: '2026-04-19T12:00:00Z',
  user_email: 'test@example.com',
  ...overrides,
})

export const mockTransactions = [
  createTransaction({ id: '1', amount: 50000 }),
  createTransaction({ id: '2', amount: 60000 }),
]
```

**Location:** test/fixtures/ or src/__fixtures__/

## Coverage

**Requirements:** Not enforced in current setup

**Recommended targets:**
- Utilities: 100% (critical path code)
- Stores: 90%+ (state management)
- Components: 70%+ (complex logic only)

**View Coverage:**
```bash
vitest --coverage
```

## Test Types

**Unit Tests:**
- Scope: Individual functions and store methods
- Approach: Test inputs and outputs with mocked dependencies
- Examples: format.test.ts, useStore.test.ts
- Async pattern: Use async/await

**Integration Tests:**
- Scope: Component rendering with real store and mocked API
- Approach: Test component interaction with stores
- Setup: Use renderHook() from React Testing Library

**E2E Tests:**
- Framework: Not currently used
- Recommended: Playwright or Cypress
- Not implemented in this codebase

## Common Patterns

**Async Testing:**
```typescript
it('handles async API calls', async () => {
  const result = await apiGetTransactions('token', '2026-04')
  expect(result).toBeDefined()
})

it('rejects on API error', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
  await expect(apiGetTransactions('token', '2026-04')).rejects.toThrow()
})
```

**Error Testing:**
```typescript
it('throws with descriptive error message', async () => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ ok: false, error: 'Invalid token' }),
    } as Response)
  )

  try {
    await apiGetTransactions('bad-token', '2026-04')
    expect.fail('Should have thrown')
  } catch (err) {
    expect(err.message).toBe('Invalid token')
  }
})
```

## Recommended Setup

1. Install Vitest: npm install -D vitest @testing-library/react
2. Create vitest.config.ts
3. Update package.json scripts:
   - test: vitest
   - test:coverage: vitest --coverage
4. Start with utility tests
5. Add store tests for state management
6. Add component tests for critical UI logic
