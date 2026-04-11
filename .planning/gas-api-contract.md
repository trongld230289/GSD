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

## How to Add a New Action

1. Define the action in GAS (`Code.gs`) — add a `case` to the switch, write the handler function.
2. Add the wire format table to this file **before writing any client code**.
3. Implement `gasGet()` or `gasPost()` call in `src/api/gas.ts` following the table exactly.
4. Cross-check: every field the GAS handler reads via `params.X` must exist at the **top level** of the client payload.
5. Create a new GAS deployment and update `GAS_URL` in `src/api/gas.ts`.
