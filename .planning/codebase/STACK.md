# Technology Stack

**Analysis Date:** 2026-04-19

## Languages

**Primary:**
- TypeScript 5.4.5 - All source code (`.ts`, `.tsx` files throughout `src/`)
- CSS/Tailwind - Styling via Tailwind configuration at `tailwind.config.js`
- JavaScript - Build configuration and dependencies

**Secondary:**
- HTML5 - Application shell in `index.html`

## Runtime

**Environment:**
- Node.js (version not specified in `.nvmrc`, inferred from package.json)
- Browser (modern ES2020 target)

**Package Manager:**
- npm (lockfile present: `package-lock.json`)
- Lockfile: present (`package-lock.json` v3)

## Frameworks

**Core:**
- React 18.3.1 - UI component framework, entry point at `src/main.tsx`
- React Router DOM 6.23.1 - Client-side routing in `src/App.tsx` with BrowserRouter

**Styling:**
- Tailwind CSS 3.4.4 - Utility-first CSS framework, configured in `tailwind.config.js`
- PostCSS 8.4.38 - CSS processing pipeline (`postcss.config.js`)
- Autoprefixer 10.4.19 - Vendor prefix generation

**Build/Dev:**
- Vite 5.3.1 - Fast build tool and dev server (`vite.config.ts`)
- @vitejs/plugin-react 4.3.1 - React Fast Refresh for Vite
- vite-plugin-pwa 0.20.0 - Progressive Web App support (`vite.config.ts`)

**State Management:**
- Zustand 4.5.2 - Lightweight state management library
  - Auth store: `src/store/useStore.ts` - `useAuthStore`
  - App store: `src/store/useStore.ts` - `useAppStore`
  - Persistent storage via Zustand middleware

**Utilities:**
- date-fns 3.6.0 - Date manipulation and formatting (`src/utils/date.ts`, `src/api/gas.ts`)
- Recharts 2.12.7 - React charting library for spending visualization (`src/components/SpendingChart.tsx`)

**Dev Dependencies:**
- @types/react 18.3.3 - TypeScript type definitions for React
- @types/react-dom 18.3.0 - TypeScript type definitions for ReactDOM

## Key Dependencies

**Critical:**
- zustand 4.5.2 - Manages both authentication and application state across pages
- react-router-dom 6.23.1 - Protects authenticated pages (HomePage, ReportsPage) from unauthenticated access
- date-fns 3.6.0 - Handles month navigation and date formatting in transaction views

**UI & Visualization:**
- recharts 2.12.7 - Renders spending category pie charts in `SpendingChart.tsx`

## Configuration

**Environment:**
- No `.env` files detected
- Hard-coded Google OAuth Client ID in `src/pages/LoginPage.tsx` (GOOGLE_CLIENT_ID = `993101146522-rn89slm3464o5d60qrq1hj5spf264vh8.apps.googleusercontent.com`)
- Hard-coded Google Apps Script URL in `src/api/gas.ts` (GAS_URL)
- Base path: `/GSD/` (configured in `vite.config.ts` and `src/App.tsx`)

**Build:**
- TypeScript compilation: `tsc && vite build`
- Development: `vite`
- Preview: `vite preview`
- TypeScript config: `tsconfig.json` (target ES2020, JSX react-jsx, strict mode)
- Path alias: `@/*` → `./src/*` (configured in `tsconfig.json`)

**Style Processing:**
- Tailwind CSS configuration: `tailwind.config.js`
  - Custom colors: `income` (#16a34a), `expense` (#dc2626)
  - Custom font: Inter with system-ui fallback
- PostCSS plugins: tailwindcss, autoprefixer

## Platform Requirements

**Development:**
- Node.js (version unspecified)
- npm (for dependency installation)
- TypeScript compiler (`tsc`)
- Vite dev server (runs on default port)

**Production:**
- Modern browser with ES2020 support
- Service Worker support for PWA features (configured in `vite-plugin-pwa`)
- Google OAuth 2.0 support (GSI script loaded in `index.html`)
- HTTPS for OAuth authentication (recommended for production)

---

*Stack analysis: 2026-04-19*
