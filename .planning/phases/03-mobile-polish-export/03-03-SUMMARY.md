---
phase: 03-mobile-polish-export
plan: "03"
subsystem: export
tags: [csv, export, download, rfc4180, header, tdd]
dependency_graph:
  requires: []
  provides: [csv-export, export-button]
  affects: [Header.tsx, exportCsv.ts]
tech_stack:
  added: [vitest, jsdom, "@testing-library/react", "@testing-library/jest-dom"]
  patterns: [rfc4180-csv, blob-download, zustand-store-in-component]
key_files:
  created:
    - finance-tracker/src/utils/exportCsv.ts
    - finance-tracker/src/utils/exportCsv.test.ts
  modified:
    - finance-tracker/src/components/Header.tsx
    - finance-tracker/vite.config.ts
    - finance-tracker/tsconfig.json
    - finance-tracker/package.json
key_decisions:
  - "UTF-8 BOM included in CSV via \\uFEFF prefix — required for Excel on Windows to correctly read VND/Vietnamese text"
  - "Category ID resolved to human-readable name via Map for O(1) lookup per row, falls back to raw ID if no match"
  - "RFC 4180 cell escaping: cells containing comma/quote/newline wrapped in double-quotes, inner quotes doubled"
  - "vitest + jsdom installed as first test infrastructure in the project — test files excluded from main tsconfig"
  - "BOM test uses arrayBuffer() not text() because blob.text() in Node.js/jsdom strips the BOM character automatically"
metrics:
  duration_minutes: 15
  completed_date: "2026-04-19"
  tasks_completed: 2
  files_changed: 6
requirements_closed: [EXPORT-01, EXPORT-02]
---

# Phase 03 Plan 03: CSV Export Summary

**One-liner:** RFC 4180 CSV export with UTF-8 BOM and Excel compatibility, triggered from a new Header download button that reads from Zustand store.

## Tasks Completed

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | Create exportCsv.ts utility (TDD) | 1eabbe9, 339b8d4 | exportCsv.ts, exportCsv.test.ts, vite.config.ts |
| 2 | Add export button to Header.tsx | 6715e0c | Header.tsx |

## Implementation Details

### exportCsv.ts

**Function signature:**
```typescript
export function exportTransactionsCsv(
  transactions: Transaction[],
  categories: Category[],
  month: string  // 'YYYY-MM'
): void
```

**Key implementation decisions:**

1. **UTF-8 BOM (`\uFEFF`)** — Prepended to CSV content. Without this, Excel on Windows opens UTF-8 files as Western encoding and garbles Vietnamese category names and notes.

2. **Category name lookup** — `Map(categories.map(c => [c.id, c.name]))` gives O(1) lookup. Falls back to raw `category_id` string if no match (no crash).

3. **RFC 4180 escaping** — `escapeCell()` wraps any cell containing `,`, `"`, `\n`, or `\r` in double-quotes. Inner double-quotes are doubled (`""` escape).

4. **CRLF line endings** — `\r\n` used as row separator per RFC 4180 spec.

5. **Browser download** — `URL.createObjectURL` + anchor click pattern. `URL.revokeObjectURL` called after click to prevent memory leak.

6. **Empty array handling** — produces valid CSV with only header row, no crash.

### Header.tsx Changes

**Imports added:**
```typescript
import { format } from 'date-fns'
import { useAppStore } from '../store/useStore'
import { exportTransactionsCsv } from '../utils/exportCsv'
```

**Store reads added inside component body:**
```typescript
const { transactions, categories, currentMonth } = useAppStore()
```

**Handler added:**
```typescript
const handleExport = () => {
  const month = format(currentMonth, 'yyyy-MM')
  exportTransactionsCsv(transactions, categories, month)
}
```

**Button placement:** Inserted before the existing `⚙️` settings button. Button order: `[⬇️ Export] [⚙️ Settings] [avatar] [Sign out]`.

**Disabled state:** Button is `disabled` when `transactions.length === 0` (inert on empty months).

## Test Infrastructure Added

- **vitest** + **jsdom** installed as first test framework in project
- `vite.config.ts` updated with `test: { environment: 'jsdom', globals: true }`
- `tsconfig.json` updated to exclude `*.test.ts` files (prevents `global` type errors in main build)
- `package.json` got `"test": "vitest run"` script

**10 tests cover:**
- Browser download trigger (mockClick called once)
- Filename format (transactions-YYYY-MM.csv)
- UTF-8 BOM bytes (verified via arrayBuffer)
- Correct header row
- Category name resolution
- Category_id fallback for unknown categories
- Comma escaping per RFC 4180
- Double-quote escaping per RFC 4180
- CRLF line endings
- Empty array produces only header row

## Verification

- `npx tsc --noEmit` exits 0
- `npm run build` exits 0 (3.35s)
- `grep "exportTransactionsCsv" Header.tsx` returns match
- `grep "\\uFEFF" exportCsv.ts` returns match
- All 10 vitest tests pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed vitest test infrastructure**
- **Found during:** Task 1 (TDD requires runnable tests, project had none)
- **Issue:** No test runner existed; `tdd="true"` requires RED/GREEN/REFACTOR cycle with actual test execution
- **Fix:** Installed vitest, jsdom, @testing-library/react, @testing-library/jest-dom; added `test: { environment: 'jsdom', globals: true }` to vite.config.ts; added `test` script to package.json; excluded test files from tsconfig
- **Files modified:** vite.config.ts, package.json, tsconfig.json, package-lock.json
- **Commit:** 1eabbe9

**2. [Rule 1 - Bug] Fixed BOM test to use arrayBuffer() not text()**
- **Found during:** Task 1 GREEN phase
- **Issue:** Node.js/jsdom `Blob.text()` strips the BOM character automatically, causing the BOM presence test to fail and the header-row test to strip one character from "Date"
- **Fix:** BOM test reads raw bytes via `arrayBuffer()` and checks `0xEF 0xBB 0xBF`; header/empty-array tests use `.replace(/^\uFEFF/, '')` as safety strip before splitting lines
- **Files modified:** exportCsv.test.ts
- **Commit:** 339b8d4 (test updates included)
