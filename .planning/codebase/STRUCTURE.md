# Codebase Structure

**Analysis Date:** 2026-04-19

## Directory Layout

```
GSD/                          # Repo root
├── finance-tracker/          # Main application (Vite + React)
│   ├── src/                  # All source code
│   │   ├── api/              # GAS API communication layer
│   │   ├── components/       # Reusable UI components
│   │   ├── data/             # Static data (categories)
│   │   ├── pages/            # Route-level page components
│   │   ├── store/            # Zustand state stores
│   │   ├── utils/            # Pure utility functions
│   │   ├── App.tsx           # Root component + routing
│   │   ├── index.css         # Global styles + Tailwind imports
│   │   ├── main.tsx          # React entry point
│   │   └── types.ts          # All shared TypeScript types
│   ├── index.html            # HTML shell
│   ├── package.json          # Dependencies + scripts
│   ├── tailwind.config.js    # Tailwind configuration
│   ├── tsconfig.json         # TypeScript config (app)
│   ├── tsconfig.node.json    # TypeScript config (build tools)
│   └── vite.config.ts        # Vite build config
├── src/                      # Legacy/alternate HTML (minimal, not used by app)
│   └── index.html
├── .planning/                # GSD planning documents
│   ├── codebase/             # Codebase map (this document set)
│   ├── phases/               # Per-phase planning files
│   ├── PROJECT.md            # Project definition
│   ├── ROADMAP.md            # Phase roadmap
│   └── STATE.md              # Current session state
├── .tests/                   # Manual test suites
│   ├── phase-1-manual-tests.md
│   └── phase-2-manual-tests.md
├── .github/                  # GSD tooling + agent definitions
│   └── get-shit-done/        # GSD workflow system
└── vang-data-2026-04-02.json # Sample/seed data file
```

## Directory Purposes

**`finance-tracker/src/api/`**
- Purpose: All communication with the Google Apps Script backend
- Contains: `gas.ts` — typed API functions + low-level fetch helpers
- Key files: `gas.ts`

**`finance-tracker/src/components/`**
- Purpose: Reusable UI building blocks used by pages
- Contains: `AddTransactionDrawer.tsx`, `BalanceSummary.tsx`, `BottomNav.tsx`, `FAB.tsx`, `Header.tsx`, `MonthNav.tsx`, `SpendingChart.tsx`, `TransactionItem.tsx`, `TransactionList.tsx`
- Key files: `AddTransactionDrawer.tsx` (add/edit form), `TransactionList.tsx` (main list view)

**`finance-tracker/src/data/`**
- Purpose: Static data bundled with the app (not fetched from server)
- Contains: `categories.ts` — hardcoded category definitions (name, icon, color, sort_order)
- Key files: `categories.ts`

**`finance-tracker/src/pages/`**
- Purpose: Top-level route components
- Contains: `LoginPage.tsx`, `HomePage.tsx`, `ReportsPage.tsx`
- Key files: `HomePage.tsx` (transaction list + month nav), `ReportsPage.tsx` (charts)

**`finance-tracker/src/store/`**
- Purpose: Global client state via Zustand
- Contains: `useStore.ts` — exports `useAuthStore` and `useAppStore`
- Key files: `useStore.ts`

**`finance-tracker/src/utils/`**
- Purpose: Pure helper functions
- Contains: `date.ts` (month formatting), `format.ts` (VND currency formatting)
- Key files: `format.ts`, `date.ts`

## Key File Locations

**Entry Points:**
- `finance-tracker/src/main.tsx` — React app mount
- `finance-tracker/src/App.tsx` — Router + auth guards
- `finance-tracker/index.html` — HTML shell

**Configuration:**
- `finance-tracker/vite.config.ts` — Build config (base path `/GSD`)
- `finance-tracker/tailwind.config.js` — Tailwind content paths
- `finance-tracker/tsconfig.json` — TypeScript compiler settings
- `finance-tracker/package.json` — Dependencies + dev scripts

**Core Logic:**
- `finance-tracker/src/api/gas.ts` — All backend communication
- `finance-tracker/src/store/useStore.ts` — All client state
- `finance-tracker/src/types.ts` — Shared types (Transaction, Category, GasResponse, etc.)
- `finance-tracker/src/data/categories.ts` — Category definitions

**Testing:**
- `.tests/phase-1-manual-tests.md` — Manual test checklist for Phase 1
- `.tests/phase-2-manual-tests.md` — Manual test checklist for Phase 2
- No automated test framework currently configured

**Documentation:**
- `.planning/PROJECT.md` — Project goals, constraints, personas
- `.planning/ROADMAP.md` — Phase plan

## Naming Conventions

**Files:**
- `PascalCase.tsx`: React components (pages and components directories)
- `camelCase.ts`: Non-component modules (`useStore.ts`, `gas.ts`, `format.ts`)
- `UPPERCASE.md`: Planning documents (`STATE.md`, `ROADMAP.md`, `PROJECT.md`)

**Directories:**
- Lowercase plural: `components/`, `pages/`, `utils/`, `data/`
- Lowercase singular: `api/`, `store/`

**Special Patterns:**
- `use*.ts`: Zustand store hooks (`useStore.ts`)
- `api*.ts` functions: API functions prefixed with `api` (`apiGetTransactions`, `apiAddTransaction`)

## Where to Add New Code

**New UI Component:**
- Implementation: `finance-tracker/src/components/ComponentName.tsx`
- Types: Add to `finance-tracker/src/types.ts` if new interfaces needed

**New Page/Route:**
- Implementation: `finance-tracker/src/pages/PageName.tsx`
- Route: Register in `finance-tracker/src/App.tsx`

**New API Endpoint:**
- Client function: Add to `finance-tracker/src/api/gas.ts`
- Types: Add request/response types to `finance-tracker/src/types.ts`

**New Store State:**
- Add fields + actions to `useAppStore` in `finance-tracker/src/store/useStore.ts`
- If auth-related: add to `useAuthStore`

**New Static Data:**
- Add to `finance-tracker/src/data/` as a new `.ts` file

**Utility Functions:**
- Add to `finance-tracker/src/utils/` (new file per concern)

## Special Directories

**`.planning/`**
- Purpose: GSD project planning documents
- Source: Created and maintained by GSD workflow
- Committed: Yes

**`.github/get-shit-done/`**
- Purpose: GSD tooling, agent definitions, workflows, templates
- Source: Installed by GSD, not modified by app development
- Committed: Yes

**`finance-tracker/node_modules/`**
- Purpose: npm dependencies
- Source: `npm install`
- Committed: No (gitignored)

**`finance-tracker/dist/`**
- Purpose: Vite build output (deployed to GitHub Pages)
- Source: `npm run build`
- Committed: Only via gh-pages branch (not main)

---

*Structure analysis: 2026-04-19*
*Update when directory structure changes*
