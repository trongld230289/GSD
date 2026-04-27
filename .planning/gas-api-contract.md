# GAS API Contract — Finance Tracker

This is the **authoritative wire format reference** for all client↔GAS communication.
Every new API action added in any phase MUST be documented here before the plan is executed.

---

## Transport Rules

| | Detail |
|---|---|
| Endpoint | Single GAS deployment URL in `src/api/gas.ts` → `GAS_URL` |
| Reads (GET) | `gasGet(params)` — fields passed as URL query params |
| Writes (POST) | `gasPost(payload)` — JSON body, `Content-Type: text/plain` to avoid CORS preflight |
| Response shape | `{ ok: boolean, data?: T, error?: string }` |
| Auth | Every action except `ping` and `getCategories` requires `token` (Google ID token) |

**Critical rule:** GAS reads all values from the **top-level `params` object** (for GET) or the **parsed JSON body** (for POST). Never nest the data under a sub-key (e.g. `params.data.field`) unless the GAS handler explicitly unwraps it.

---

## Actions

### `ping` — GET or POST
No auth required. Used for CORS/health checks.

**Params:** _(none)_  
**Response:** `{ ok: true, status: 'ok' }`

---

### `getCategories` — GET
No auth required.

**Params:** `action=getCategories`  
**Response:** `{ ok: true, data: Category[] }`

```
Category { id, name, type, icon, color }
```

---

### `getTransactions` — GET
**Params:**

| Key | Type | Example |
|---|---|---|
| `action` | string | `"getTransactions"` |
| `token` | string | Google ID token |
| `month` | string (numeric) | `"04"` |
| `year` | string (numeric) | `"2026"` |

**Response:** `{ ok: true, data: Transaction[] }`

```
Transaction { id, date, type, category_id, amount, note, created_at, user_email }
```

---

### `addTransaction` — POST
**Body (flat — all fields at top level):**

| Key | Type | Example |
|---|---|---|
| `action` | string | `"addTransaction"` |
| `token` | string | Google ID token |
| `type` | string | `"expense"` \| `"income"` |
| `category_id` | string | `"food-dining"` |
| `amount` | number | `70000` |
| `date` | string | `"2026-04-09"` |
| `note` | string | `"dinner"` |

**Response:** `{ ok: true, data: { id: string, success: boolean } }`

> ⚠️ **Past bug:** Client originally sent `{ action, token, data: tx }` — GAS read `params.type` as `undefined` because it was nested under `params.data`. Fixed to `{ action, token, ...tx }` (flat). Never wrap transaction fields under a sub-key.

---

### `updateTransaction` — POST
**Body (flat — all fields at top level):**

| Key | Type | Example |
|---|---|---|
| `action` | string | `"updateTransaction"` |
| `token` | string | Google ID token |
| `id` | string | `"txn-abc123"` |
| `type` | string | `"expense"` \| `"income"` |
| `category_id` | string | `"food-dining"` |
| `amount` | number | `70000` |
| `date` | string | `"2026-04-09"` |
| `note` | string | `"dinner"` |

**Response:** `{ ok: true, data: { success: boolean } }`

> ⚠️ **Past bug (Phase 2):** Client sent `{ action, token, data: tx }` (nested). GAS reads `params.id`, `params.type`, etc. at top level — all were `undefined`, so nothing was written to the sheet. Fixed to `{ action, token, ...tx }` flat spread.

---

### `deleteTransaction` — POST
**Body:**

| Key | Type | Example |
|---|---|---|
| `action` | string | `"deleteTransaction"` |
| `token` | string | Google ID token |
| `id` | string | `"txn-abc123"` |

**Response:** `{ ok: true }`

---

### `getMonthlyTotals` — GET
**Params:**

| Key | Type | Example |
|---|---|---|
| `action` | string | `"getMonthlyTotals"` |
| `token` | string | Google ID token |
| `months` | string (comma-separated) | `"2026-04,2026-03,2026-02"` |

**Response:** `{ ok: true, data: MonthlyTotals[] }`

```
MonthlyTotals { month: "YYYY-MM", income: number, expense: number }
```

---

### `getBudgets` — GET
**Params:**

| Key | Type | Example |
|---|---|---|
| `action` | string | `"getBudgets"` |
| `token` | string | Google ID token |
| `month` | string (`YYYY-MM`) | `"2026-04"` |

**Response:** `{ ok: true, data: BudgetEntry[] }`

```
BudgetEntry { category_id: string, budgeted: number }
```

Returns empty array (not error) when no budget rows exist for the month.

---

### `setBudget` — POST
**Body:**

| Key | Type | Example |
|---|---|---|
| `action` | string | `"setBudget"` |
| `token` | string | Google ID token |
| `month` | string (`YYYY-MM`) | `"2026-04"` |
| `category_id` | string | `"food-drink"` |
| `budgeted` | number | `3000000` |

**Response:** `{ ok: true, data: { success: true } }`

Upsert behavior: finds existing row for `month + category_id`, updates `budgeted`; appends new row if not found. Never creates duplicates.

---

## How to Add a New Action

1. Define the action in GAS (`Code.gs`) — add a `case` to the switch, write the handler function.
2. Add the wire format table to this file **before writing any client code**.
3. Implement `gasGet()` or `gasPost()` call in `src/api/gas.ts` following the table exactly.
4. Cross-check: every field the GAS handler reads via `params.X` must exist at the **top level** of the client payload.
5. Create a new GAS deployment and update `GAS_URL` in `src/api/gas.ts`.

---

## Lesson Learned: Date Handling in GAS/Sheets

### The Problem
Google Sheets auto-converts any date-like string written to a cell into an internal **Date object** (unless the cell is explicitly formatted as Plain Text). When GAS reads that cell back via `getValues()` and serializes it to JSON, it outputs a locale/timezone-dependent string like:
```
"Fri Apr 09 2026 07:00:00 GMT+0700"
```
…instead of the clean `"2026-04-10"` you originally stored. This causes two classes of bug:

1. **Wrong date displayed / stored** — `"2026-04-10"` written as a Date cell is interpreted as UTC midnight, which shifts to April 9 in timezones behind UTC (e.g. UTC-5) or can shift forward in UTC+7 depending on how Sheets applies the timezone.
2. **Broken grouping/sorting on the client** — two transactions on the same day return two different raw date strings → `groupByDate` creates two separate groups → duplicate date headers in the list.

### The Fix

**In GAS**, always serialize dates using `Utilities.formatDate` when reading from a sheet:
```javascript
date: Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), "yyyy-MM-dd")
```
This works correctly whether the cell holds a Date object or a plain text string, and always returns `YYYY-MM-DD` in the sheet's local timezone. Since you own both GAS and the client, fixing at the source is sufficient — no client-side normalization needed.

### Rules going forward
- **Any GAS function that reads a date column** must serialize using `Utilities.formatDate(new Date(row[N]), Session.getScriptTimeZone(), "yyyy-MM-dd")` — never return `row[N]` raw. This is the authoritative fix — fix at the source.
- Since you own both the GAS backend and the client, fixing in GAS is sufficient. Client-side normalization (`normalizeDate`) is redundant when the contract guarantees `YYYY-MM-DD` from GAS, and adds unnecessary code to maintain.
- **Never rely on Sheets cell format** (plain text vs Date) as a correctness guarantee — the GAS serialization layer must always be explicit.
