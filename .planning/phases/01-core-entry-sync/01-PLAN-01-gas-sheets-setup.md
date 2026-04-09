# Plan 1: Google Apps Script + Sheets Setup

**Phase:** 1 — Core Entry & Sync
**Plan:** 1 of 6
**Goal:** Create the Google Sheet with correct schema, write and deploy the GAS Web App with all 5 endpoints, verify CORS-safe API works with curl before any React code is written.

---

## Pre-conditions
- You have a Google account
- No prior code written yet

## Success Criteria
- [ ] Google Sheet exists with `Transactions` and `Categories` tabs, correct columns, all 16 categories seeded
- [ ] GAS Web App deployed (URL saved)
- [ ] `curl` test of each endpoint returns valid JSON
- [ ] POST with `Content-Type: text/plain` returns JSON without CORS error
- [ ] Token verification rejects invalid tokens

---

## Tasks

### 1.1 Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) → New spreadsheet
2. Name it: **Finance Tracker**
3. Rename `Sheet1` → `Transactions`
4. Add a second sheet → rename it `Categories`
5. In `Transactions`, add header row (Row 1, freeze it):
   ```
   A: id | B: date | C: type | D: category_id | E: amount | F: note | G: created_at | H: user_email
   ```
6. In `Categories`, add header row (Row 1, freeze it):
   ```
   A: id | B: name | C: type | D: icon | E: color | F: sort_order
   ```

### 1.2 Write the GAS Code

1. In the Sheet: **Extensions → Apps Script**
2. Rename the project: **Finance Tracker API**
3. Replace the default `Code.gs` content with:

```javascript
// ============================================================
// CONFIGURATION — update CLIENT_ID after creating OAuth app
// ============================================================
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

// ============================================================
// ENTRY POINTS
// ============================================================
function doGet(e) {
  return handleRequest(e.parameter, null);
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  return handleRequest(payload, payload.data || null);
}

function handleRequest(params, data) {
  try {
    const token = params.token;
    const action = params.action;

    if (!token) return error('Missing token');
    const userEmail = verifyToken(token);

    switch (action) {
      case 'getTransactions':
        return json(getTransactions(
          parseInt(params.month), parseInt(params.year), userEmail
        ));
      case 'addTransaction':
        return json(addTransaction(data, userEmail));
      case 'updateTransaction':
        return json(updateTransaction(data, userEmail));
      case 'deleteTransaction':
        return json(deleteTransaction(params.id || data.id, userEmail));
      case 'getCategories':
        return json(getCategories());
      case 'ping':
        return json({ status: 'ok', email: userEmail });
      default:
        return error('Unknown action: ' + action);
    }
  } catch (e) {
    return error(e.message);
  }
}

// ============================================================
// TOKEN VERIFICATION
// ============================================================
function verifyToken(idToken) {
  const res = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + idToken,
    { muteHttpExceptions: true }
  );
  const info = JSON.parse(res.getContentText());
  if (info.error) throw new Error('Token invalid: ' + info.error);
  if (info.aud !== CLIENT_ID) throw new Error('Token audience mismatch');
  return info.email;
}

// ============================================================
// TRANSACTIONS CRUD
// ============================================================
function getTransactions(month, year, userEmail) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Transactions');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  return data
    .filter(row => {
      if (!row[0]) return false; // skip empty rows
      if (row[7] !== userEmail) return false;
      const d = new Date(row[1]);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    })
    .map(row => ({
      id: row[0], date: row[1], type: row[2], category_id: row[3],
      amount: row[4], note: row[5], created_at: row[6]
    }));
}

function addTransaction(data, userEmail) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Transactions');
  const id = 'txn-' + Utilities.getUuid();
  const now = new Date().toISOString();
  sheet.appendRow([id, data.date, data.type, data.category_id, data.amount, data.note || '', now, userEmail]);
  return { id, success: true };
}

function updateTransaction(data, userEmail) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Transactions');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: false, error: 'Not found' };

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const rowIndex = ids.indexOf(data.id);
  if (rowIndex === -1) return { success: false, error: 'Not found' };

  // Verify ownership
  const ownerEmail = sheet.getRange(rowIndex + 2, 8).getValue();
  if (ownerEmail !== userEmail) return { success: false, error: 'Forbidden' };

  const row = rowIndex + 2;
  sheet.getRange(row, 2).setValue(data.date);
  sheet.getRange(row, 3).setValue(data.type);
  sheet.getRange(row, 4).setValue(data.category_id);
  sheet.getRange(row, 5).setValue(data.amount);
  sheet.getRange(row, 6).setValue(data.note || '');
  return { success: true };
}

function deleteTransaction(id, userEmail) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Transactions');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: false, error: 'Not found' };

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const rowIndex = ids.indexOf(id);
  if (rowIndex === -1) return { success: false, error: 'Not found' };

  const row = rowIndex + 2;
  const ownerEmail = sheet.getRange(row, 8).getValue();
  if (ownerEmail !== userEmail) return { success: false, error: 'Forbidden' };

  sheet.deleteRow(row);
  return { success: true };
}

// ============================================================
// CATEGORIES
// ============================================================
function getCategories() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Categories');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return seedCategories();

  const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  return data
    .filter(row => row[0])
    .map(row => ({
      id: row[0], name: row[1], type: row[2],
      icon: row[3], color: row[4], sort_order: row[5]
    }));
}

function seedCategories() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Categories');
  const categories = [
    // Expense categories
    ['food-dining',       'Food & Dining',          'expense', '🍜', '#F59E0B', 1],
    ['transportation',    'Transportation',          'expense', '🚗', '#3B82F6', 2],
    ['shopping-apparel',  'Shopping & Apparel',      'expense', '👗', '#EC4899', 3],
    ['online-shopping',   'Online Shopping',         'expense', '📦', '#F97316', 4],
    ['travel-vacation',   'Travel & Vacation',       'expense', '✈️', '#06B6D4', 5],
    ['personal-dev',      'Personal Development',    'expense', '📚', '#8B5CF6', 6],
    ['gifts-celebrations','Gifts & Celebrations',    'expense', '🎁', '#EF4444', 7],
    ['bills-utilities',   'Bills & Utilities',       'expense', '💡', '#6B7280', 8],
    ['healthcare',        'Healthcare',              'expense', '💊', '#10B981', 9],
    ['entertainment',     'Entertainment',           'expense', '🎬', '#F43F5E', 10],
    ['savings-investment','Savings / Investment',    'expense', '💰', '#14B8A6', 11],
    ['other-expense',     'Other',                   'expense', '📝', '#9CA3AF', 12],
    // Income categories
    ['salary-wages',      'Salary / Wages',          'income',  '💼', '#22C55E', 13],
    ['freelance',         'Freelance / Side Income', 'income',  '🔧', '#84CC16', 14],
    ['gifts-received',    'Gifts Received',          'income',  '🧧', '#FB923C', 15],
    ['other-income',      'Other Income',            'income',  '📊', '#A3E635', 16],
  ];
  sheet.getRange(2, 1, categories.length, 6).setValues(categories);
  return categories.map(row => ({
    id: row[0], name: row[1], type: row[2],
    icon: row[3], color: row[4], sort_order: row[5]
  }));
}

// ============================================================
// HELPERS
// ============================================================
function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function error(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 1.3 Deploy as Web App

1. Click **Deploy → New deployment**
2. Type: **Web app**
3. Description: `Finance Tracker v1`
4. Execute as: **Me**
5. Who has access: **Anyone**
6. Click **Deploy** → copy and save the Web App URL

### 1.4 Seed the Categories

1. In the GAS editor, run the `seedCategories` function once manually:
   - Select `seedCategories` in the function dropdown → click Run
   - Grant permissions when prompted
2. Check the `Categories` sheet — 16 rows should be populated

### 1.5 Test with curl

Replace `{GAS_URL}` with your deployed URL.

```bash
# Test ping (GET — no token needed for this test)
curl "{GAS_URL}?action=ping&token=DUMMY" 

# Test CORS-safe POST
curl -X POST "{GAS_URL}" \
  -H "Content-Type: text/plain;charset=utf-8" \
  -d '{"action":"getCategories","token":"DUMMY"}'
```

> Note: `verifyToken` will fail with DUMMY token — that's expected. The goal here is to confirm the endpoint is reachable and returns JSON without a network/CORS error. Full auth testing happens in Plan 3.

### 1.6 Save the GAS URL

Create `.env.local` in the project root (Plan 2 will create the React project):
```
VITE_GOOGLE_CLIENT_ID=     ← fill in Plan 3
VITE_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

---

## Notes

- Every time you edit `Code.gs`, you must create a **new deployment version** for changes to take effect. The URL stays the same if you use "Manage deployments → edit → new version."
- The `seedCategories` function only needs to run once. After that, `getCategories` reads from the sheet.
- Keep the Spreadsheet ID and deployment URL private (in `.env.local`, gitignored).
