# Architecture Research — Finance Tracker PWA

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                   USER (Phone / Browser)                  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│            React 18 PWA — GitHub Pages                    │
│                                                           │
│  ┌──────────┐  ┌─────────────┐  ┌────────────────────┐  │
│  │  Auth    │  │ Transactions │  │   Reports          │  │
│  │ (GSI)    │  │  (CRUD)      │  │  (Charts)          │  │
│  └──────────┘  └─────────────┘  └────────────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Zustand Store (auth state + transaction cache)   │    │
│  └──────────────────────────────────────────────────┘    │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Service Worker (Workbox) — offline read cache    │    │
│  └──────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS (fetch with Bearer token)
┌────────────────────────▼────────────────────────────────┐
│         Google Apps Script Web App (REST API)             │
│                                                           │
│  POST /exec?action=addTransaction    → append row         │
│  GET  /exec?action=getTransactions   → read rows          │
│  POST /exec?action=updateTransaction → update row by id   │
│  POST /exec?action=deleteTransaction → delete row by id   │
│  GET  /exec?action=getCategories     → read categories    │
│                                                           │
│  · Verifies Google ID Token (JWT) via tokeninfo endpoint  │
│  · Identifies user by email from token                    │
└────────────────────────┬────────────────────────────────┘
                         │ Sheets API (internal)
┌────────────────────────▼────────────────────────────────┐
│                   Google Sheets                           │
│                                                           │
│  Sheet 1: "Transactions"                                  │
│  Sheet 2: "Categories"                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Frontend Component Tree

```
App
├── AuthProvider (Google GSI context)
├── Router
│   ├── /login          → LoginPage
│   └── (authenticated)
│       ├── /           → DashboardPage
│       │   ├── MonthSelector
│       │   ├── BalanceSummaryCard (income / expenses / net)
│       │   └── SpendingBreakdownChart (Recharts PieChart)
│       ├── /transactions → TransactionsPage
│       │   ├── MonthSelector
│       │   ├── TransactionList
│       │   │   └── TransactionItem[]
│       │   └── AddTransactionFAB
│       ├── /add        → AddTransactionSheet (bottom drawer)
│       │   ├── AmountInput (numpad)
│       │   ├── TypeToggle (Income / Expense)
│       │   ├── CategoryGrid (4-per-row icon grid)
│       │   ├── DatePicker
│       │   └── NoteInput
│       ├── /reports    → ReportsPage
│       │   ├── MonthSelector
│       │   ├── CategoryBreakdownChart (BarChart/PieChart)
│       │   ├── TrendChart (6-month LineChart)
│       │   └── ExportCSVButton
│       └── /settings   → SettingsPage
│           └── SignOutButton
└── BottomNavBar (Home / Transactions / + / Reports / Settings)
```

---

## Google Apps Script API Design

### Single endpoint (doGet + doPost)
```javascript
// All requests go to one URL:
// https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec

function doGet(e)  { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  // 1. Verify Google ID token
  // 2. Route by action param
  // 3. Return JSON response
}
```

### Action routing
| Action | Method | Params | Returns |
|---|---|---|---|
| `getTransactions` | GET | `month`, `year` | Array of transaction rows |
| `addTransaction` | POST | transaction object | `{ id, success }` |
| `updateTransaction` | POST | id + updated fields | `{ success }` |
| `deleteTransaction` | POST | id | `{ success }` |
| `getCategories` | GET | — | Array of category rows |

---

## Build & Deployment Pipeline

```
Developer pushes to main branch
          │
          ▼
GitHub Actions workflow
  1. npm run build  (Vite → dist/)
  2. Deploy dist/ → gh-pages branch
          │
          ▼
GitHub Pages serves at:
  https://[username].github.io/finance-tracker/

Google Apps Script:
  · Deployed manually as Web App
  · "Execute as: Me"
  · "Who has access: Anyone with Google account"
  · URL stored in React app's .env
```

---

## Phase Build Order

Build in this order to avoid blockers:

1. **GAS API layer** (Sheets schema + all endpoints) — Phase 1
2. **Auth flow** (Google Sign-In → store token) — Phase 1
3. **Add Transaction form** (core writing UI) — Phase 1
4. **Transaction list view** (read what was added) — Phase 1
5. **Dashboard summary cards** (income/expenses/net) — Phase 2
6. **Category breakdown chart** (pie/bar) — Phase 2
7. **Trend chart** (6-month line) — Phase 2
8. **PWA setup + mobile polish** — Phase 3
9. **CSV export** — Phase 3

---
*Research date: 2026-04-07*
