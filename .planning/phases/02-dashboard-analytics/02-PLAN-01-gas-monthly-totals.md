# Plan 1: GAS — getMonthlyTotals Endpoint

**Phase:** 2 — Dashboard & Analytics
**Plan:** 1 of 4
**Goal:** Add a `getMonthlyTotals` function to Code.gs that returns aggregated `{month, income, expense}` for the last N months in a single API call, then create a new GAS deployment.

---

## Pre-conditions
- Phase 1 GAS deployment is working
- Access to the Apps Script editor at script.google.com

## Success Criteria
- [ ] `getMonthlyTotals` function exists in Code.gs
- [ ] GET `?action=getMonthlyTotals&token=...&months=2026-04,2026-03,2026-02,2026-01,2025-12,2025-11` returns `{ ok: true, data: [{month, income, expense}, ...] }`
- [ ] Response only includes months that have data (empty months may be omitted or return 0s)
- [ ] New deployment URL saved and updated in `src/api/gas.ts`
- [ ] Tested in browser before React integration

---

## Tasks

### 1.1 Add `getMonthlyTotals` to Code.gs

Open Apps Script editor → open `Code.gs` → add this function before the closing of the file:

```javascript
function getMonthlyTotals(months, userEmail) {
  // months: array of "YYYY-MM" strings
  // Returns [{month, income, expense}] for each requested month
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
    .getSheetByName('Transactions');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return months.map(m => ({ month: m, income: 0, expense: 0 }));

  const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  // Columns: id(0) date(1) type(2) category_id(3) amount(4) note(5) created_at(6) user_email(7)

  const totals = {};
  months.forEach(m => { totals[m] = { month: m, income: 0, expense: 0 }; });

  for (const row of data) {
    if (row[7] !== userEmail) continue;          // filter by user
    const dateStr = row[1] ? String(row[1]).slice(0, 7) : ''; // YYYY-MM
    if (!totals[dateStr]) continue;              // not in requested months
    const amount = Number(row[4]) || 0;
    if (row[2] === 'income') totals[dateStr].income += amount;
    else totals[dateStr].expense += amount;
  }

  return Object.values(totals);
}
```

### 1.2 Wire into `handleRequest`

Inside the `handleRequest` switch statement, add a new case **before** the default/unknown case:

```javascript
case 'getMonthlyTotals': {
  const monthsParam = params.months || '';
  const monthsArr = monthsParam.split(',').map(m => m.trim()).filter(Boolean);
  if (!monthsArr.length) return json({ ok: false, error: 'months param required' });
  return json({ ok: true, data: getMonthlyTotals(monthsArr, tokenInfo.email) });
}
```

> `tokenInfo` is already available at this point in `handleRequest` (after token verification).

### 1.3 Generate the months param helper (for reference)

The frontend will call this with the last 6 months. Logic to generate them (for reference when building `api/gas.ts`):
```typescript
// Generate last N months as ["YYYY-MM", ...] starting from current
function lastNMonths(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = subMonths(new Date(), i)
    return format(d, 'yyyy-MM')
  })
}
```

### 1.4 Create new GAS deployment

> **IMPORTANT:** Always create a NEW deployment — never update existing — to avoid GAS execution cache.

1. In Apps Script editor: **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Click **Deploy** → copy the new URL
6. Update `GAS_URL` constant in `finance-tracker/src/api/gas.ts`
7. Update `STATE.md` with new deployment URL

### 1.5 Verify with browser

Open in browser (replace TOKEN with a real token from DevTools → Application → localStorage → `finance-auth`):
```
https://script.google.com/macros/s/NEW_URL/exec?action=getMonthlyTotals&token=TOKEN&months=2026-04,2026-03,2026-02
```
Expected: `{"ok":true,"data":[{"month":"2026-04","income":...,"expense":...}, ...]}`

---

## Notes
- `String(row[1]).slice(0, 7)` handles both `"2026-04-10"` string dates and `Date` objects that GAS sometimes returns
- Empty months return `{ month, income: 0, expense: 0 }` — frontend treats 0s as valid
- This endpoint requires token auth (user email needed for filtering)
