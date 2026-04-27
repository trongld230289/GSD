# Phase 3: Mobile Polish & Export - Research

**Researched:** 2026-04-19
**Domain:** PWA (vite-plugin-pwa / Workbox), iOS safe area CSS, CSV export, GitHub Actions CI/CD
**Confidence:** HIGH (stack already partially configured; confirmed against official docs and live codebase)

---

## Summary

The project already has `vite-plugin-pwa` ^0.20.0 installed and partially configured in `vite.config.ts`, but the configuration has three critical gaps that will prevent a successful Lighthouse PWA audit: (1) `start_url` and `scope` in the manifest are set to `/` instead of `/GSD/`, breaking installability on GitHub Pages; (2) no PWA icon assets exist in `public/`; (3) no Workbox runtime caching strategy is defined, so offline support (PWA-03) won't work.

The iOS safe area foundation is already in place (`safe-pb`/`safe-pt` classes in `index.css`, `apple-mobile-web-app-capable` in `index.html`), but the `viewport` tag is missing `viewport-fit=cover` and the `BottomNav` component does not apply the `safe-pb` class. These are targeted, small fixes.

CSV export requires no library — a pure browser Blob + anchor download with a UTF-8 BOM prefix is the correct approach for VND amounts and Excel compatibility. The GitHub Actions `deploy.yml` is already complete and functional; this plan item is "verify it works" not "build from scratch."

**Primary recommendation:** Fix the base-path PWA config, generate icons with `@vite-pwa/assets-generator`, apply safe-area padding to BottomNav, add runtimeCaching for GAS API calls, implement a 20-line CSV utility, then run Lighthouse.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite-plugin-pwa | ^0.20.0 (already installed) | Service worker + manifest generation | Official Vite PWA plugin by the Vite PWA org; zero-config with escape hatches |
| workbox-window | bundled via vite-plugin-pwa | SW lifecycle management | Google's production-grade SW toolkit, used by vite-plugin-pwa under the hood |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vite-pwa/assets-generator | ^0.2.x | Generate all required PWA icon sizes from one SVG | Needed because `public/` has no icons at all — must run once before build |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @vite-pwa/assets-generator | Manual icon creation in Figma/GIMP | Manual is fine if a designer provides assets; generator is faster for dev-only projects |
| Pure Blob CSV | csv-stringify, papaparse | Libraries add 10–40 KB bundle size for a 20-line utility; not justified here |

### Installation
```bash
# Already installed — no new runtime deps needed
# Dev tool for icon generation (run once):
npm install -D @vite-pwa/assets-generator
npx pwa-assets-generator --preset minimal2023 public/logo.svg
```

---

## Architecture Patterns

### Recommended Project Structure (additions only)
```
finance-tracker/
├── public/
│   ├── pwa-64x64.png          # generated
│   ├── pwa-192x192.png        # generated (manifest icon)
│   ├── pwa-512x512.png        # generated (manifest icon)
│   ├── maskable-icon-512x512.png  # generated (Android adaptive)
│   ├── apple-touch-icon.png   # generated (180x180 for iOS)
│   └── favicon.ico            # generated (replaces favicon.svg reference)
├── src/
│   └── utils/
│       └── exportCsv.ts       # new: CSV export utility
```

### Pattern 1: vite-plugin-pwa with GitHub Pages base path

**What:** vite-plugin-pwa automatically reads Vite's `base` config for the service worker scope. The `manifest.start_url` and `manifest.scope` must be set explicitly to match the base path, and icon `src` values must be relative (no leading `/`) so the plugin prepends the base correctly.

**When to use:** Any deployment to a GitHub Pages subdirectory (`https://username.github.io/repo/`).

**Critical fix for this project:**
```typescript
// vite.config.ts — Source: https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-64x64.png'],
  manifest: {
    name: 'Finance Tracker',
    short_name: 'Finance',
    description: 'Track your income and expenses',
    theme_color: '#16a34a',
    background_color: '#ffffff',
    display: 'standalone',
    scope: '/GSD/',        // MUST match Vite base
    start_url: '/GSD/',    // MUST match Vite base
    icons: [
      {
        src: 'pwa-192x192.png',      // relative — plugin prepends /GSD/
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',    // separate entry — never combine "any maskable"
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [
      {
        // Cache GAS API responses with NetworkFirst (offline shows last data)
        urlPattern: /^https:\/\/script\.google\.com\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'gas-api-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }, // 1 day
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // Cache Google Fonts with CacheFirst
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
})
```

**Why `scope: '/GSD/'` matters:** Without it, the service worker scope defaults to `/`, but it's served from `/GSD/sw.js`. Chrome will refuse to install the PWA because the SW scope doesn't cover `start_url`. This is the #1 reason GitHub Pages PWAs fail Lighthouse.

### Pattern 2: iOS Safe Area — BottomNav

**What:** `env(safe-area-inset-bottom)` is already defined as `.safe-pb` in `index.css`. The `BottomNav` component must use it, and the viewport must include `viewport-fit=cover` for iOS to expose the inset value.

**Current gap in `index.html`:**
```html
<!-- WRONG — iOS ignores env() without viewport-fit=cover -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

<!-- CORRECT -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

Note: `maximum-scale=1.0, user-scalable=no` should be removed — it fails WCAG accessibility audit and is flagged by Lighthouse.

**BottomNav fix:**
```tsx
// src/components/BottomNav.tsx
<nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 z-30 flex pb-safe">
  {/* pb-safe = padding-bottom: env(safe-area-inset-bottom) */}
  {/* Already defined as .safe-pb in index.css — rename or use inline style */}
```

**iOS behavior:** When installed as PWA, `env(safe-area-inset-bottom)` = ~34px (iPhone with home indicator). When opened in Safari browser, it = 0px. So applying it unconditionally is safe and correct.

### Pattern 3: CSV Export (pure browser, no library)

**What:** Convert transaction array to CSV string, prepend UTF-8 BOM `\uFEFF` for Excel compatibility with VND numbers, create Blob, trigger anchor download.

```typescript
// src/utils/exportCsv.ts
export function exportTransactionsCsv(
  transactions: Transaction[],
  month: string   // 'YYYY-MM'
): void {
  const headers = ['Date', 'Type', 'Category', 'Amount (VND)', 'Note']

  const rows = transactions.map((tx) => [
    tx.date,
    tx.type,
    tx.category,
    String(tx.amount),
    tx.note ?? '',
  ])

  const csvContent =
    '\uFEFF' +                    // UTF-8 BOM — required for Excel to read VND correctly
    [headers, ...rows]
      .map((row) => row.map(escapeCell).join(','))
      .join('\r\n')               // CRLF is the CSV standard (RFC 4180)

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `transactions-${month}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)        // prevent memory leak
}

function escapeCell(value: string): string {
  // RFC 4180: wrap in quotes if contains comma, quote, or newline
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
```

**Excel note:** VND amounts are integers; no special formatting needed. The BOM ensures Google Sheets and Excel both read the file as UTF-8 without prompting encoding selection.

### Anti-Patterns to Avoid

- **`purpose: 'any maskable'` on a single icon:** Causes excessive padding on Android adaptive icons. Use two separate icon entries with `'any'` and `'maskable'` respectively.
- **`scope: '/'` when base is `/GSD/`:** Service worker won't cover `start_url`, Chrome DevTools shows "No matching service worker detected", Lighthouse fails installability.
- **`user-scalable=no` in viewport:** Fails WCAG 1.4.4 (Resize Text), flagged by Lighthouse as accessibility issue.
- **No `\uFEFF` BOM in CSV:** Excel opens UTF-8 CSV as Western encoding on Windows; VND numbers with non-ASCII category names corrupt.
- **Caching GAS API with CacheFirst:** GAS responses change with new transactions; must use NetworkFirst so stale data is served only when offline.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker precaching | Manual `fetch` event handlers | vite-plugin-pwa generateSW + Workbox | Workbox handles cache versioning, update detection, and stale content eviction — 1,000+ edge cases |
| PWA icon generation | Photoshop/manual resize | @vite-pwa/assets-generator | One command generates all sizes, maskable variant, apple-touch-icon from a single SVG |
| SW registration lifecycle | Custom SW registration script | `registerType: 'autoUpdate'` in vite-plugin-pwa | Handles SW update detection, reload prompt, and skipWaiting automatically |

**Key insight:** The service worker layer is the hardest part of PWA to get right. Workbox is Google's own solution; vite-plugin-pwa wires it into Vite's build pipeline with zero custom SW code required for this use case.

---

## Common Pitfalls

### Pitfall 1: scope/start_url Mismatch with GitHub Pages
**What goes wrong:** Lighthouse PWA audit fails with "No matching service worker detected" or "start_url does not respond with a 200 when offline."
**Why it happens:** Vite's `base: '/GSD/'` affects asset URLs but the current vite.config.ts manifest has `scope: '/'` and `start_url: '/'` — these don't match the actual deployment origin path.
**How to avoid:** Always set `manifest.scope` and `manifest.start_url` to match Vite's `base` value exactly.
**Warning signs:** Chrome DevTools Application tab shows manifest with `start_url: "/"` while app is served from `https://...github.io/GSD/`.

### Pitfall 2: Icon Files Not in `public/`
**What goes wrong:** Build succeeds but browser 404s on manifest icon URLs; Chrome shows empty icon in install prompt.
**Why it happens:** `public/` directory in this project is currently empty — no icon files exist.
**How to avoid:** Run `@vite-pwa/assets-generator` before first build with PWA config active. Check `public/` after running.
**Warning signs:** Lighthouse "Manifest does not have a maskable icon" or 404 in Network tab for `pwa-192x192.png`.

### Pitfall 3: Safe Area Not Activating on iOS
**What goes wrong:** Bottom nav is obscured by iPhone home indicator when installed as PWA.
**Why it happens:** `env(safe-area-inset-bottom)` returns `0` unless `viewport-fit=cover` is present in the viewport meta tag, even if the CSS class is defined.
**How to avoid:** Update `index.html` viewport tag to include `viewport-fit=cover`.
**Warning signs:** Test by installing to home screen on a real iPhone; safe area gap absent = fix needed.

### Pitfall 4: CSV Encoding Issue for Excel on Windows
**What goes wrong:** VND amounts and category names (containing emoji or Vietnamese text if added) appear as garbled characters in Excel.
**Why it happens:** Excel on Windows defaults to system encoding (often Windows-1252) when opening CSV files without a BOM.
**How to avoid:** Always prepend `\uFEFF` (UTF-8 BOM) to the CSV string.
**Warning signs:** Test by opening the downloaded CSV in Excel on Windows; check that the "Food & Dining" column header shows correctly.

### Pitfall 5: Workbox `maximumFileSizeToCacheInBytes` Build Error
**What goes wrong:** `vite build` throws error about file exceeding maximum cache size (from vite-plugin-pwa 0.20.2+).
**Why it happens:** Recharts or other large chunks may exceed Workbox's default 2 MB limit per file.
**How to avoid:** Add `workbox: { maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 }` (5 MB) or configure manual Vite chunking to split Recharts into its own chunk under 2 MB.
**Warning signs:** `npm run build` fails with a Workbox-related error about file size limits.

---

## Code Examples

### Complete vite.config.ts (production-ready)
```typescript
// Source: https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-64x64.png'],
      manifest: {
        name: 'Finance Tracker',
        short_name: 'Finance',
        description: 'Track your income and expenses',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/GSD/',
        start_url: '/GSD/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/script\.google\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gas-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 31536000 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  base: '/GSD/',
})
```

### index.html — corrected viewport + iOS meta tags
```html
<!-- Source: https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#16a34a" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Finance" />
<link rel="apple-touch-icon" href="/GSD/apple-touch-icon.png" />
```

Note: change `status-bar-style` from `default` to `black-translucent` so the status bar overlays the green header rather than pushing it down, consistent with `viewport-fit=cover`.

### BottomNav safe area padding
```tsx
// src/components/BottomNav.tsx — add safe-pb class
<nav
  className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 z-30 flex"
  style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
>
```

Using `style` directly is more explicit than the `.safe-pb` class (avoids Tailwind purge concerns). Both approaches are equivalent.

### Icon generation command
```bash
# Run once from finance-tracker/
# Requires a source SVG at public/logo.svg (create a simple green money icon)
npx @vite-pwa/assets-generator --preset minimal2023 public/logo.svg
# Outputs: pwa-64x64.png, pwa-192x192.png, pwa-512x512.png,
#          maskable-icon-512x512.png, apple-touch-icon.png into public/
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual SW registration + cache manifest | vite-plugin-pwa generateSW | 2021+ | No custom SW code needed |
| `purpose: 'any maskable'` combined | Separate `any` and `maskable` entries | 2020 (Android Adaptive Icons) | Correct icon shape on Android home screen |
| `user-scalable=no` in viewport | Remove it; only `viewport-fit=cover` needed | WCAG 2.1 (2018), Lighthouse flags it | Passes accessibility audit |
| Apple requires `apple-mobile-web-app-capable` | Still useful for iOS < iOS 26; optional but keep it | 2025 iOS 26 | Harmless to keep; still needed for iOS 15–17 |

**Deprecated/outdated:**
- Combining `purpose: 'any maskable'` on one icon: produces poor results on Android, flagged by Lighthouse.
- `maximum-scale=1.0, user-scalable=no`: fails Lighthouse accessibility audit; remove from viewport.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual QA + Lighthouse CLI (no automated test framework in this project) |
| Config file | none |
| Quick run command | `npx lighthouse https://trongld230289.github.io/GSD/ --output=json --only-categories=pwa` |
| Full suite command | `npx lighthouse https://trongld230289.github.io/GSD/ --output=html --output-path=lighthouse-report.html` |

There is no existing test infrastructure (`jest`, `vitest`, `playwright`) in `package.json`. All phase 3 validation is manual + Lighthouse.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| PWA-01 | App usable at 320px–430px | Manual | Chrome DevTools → Device toolbar, test at 320/375/390/430px | Check all 4 pages, bottom nav not cut off |
| PWA-02 | Installable on Android + iOS | Manual | Android: Chrome "Add to Home Screen" prompt appears. iOS: Safari share sheet → "Add to Home Screen" | Must be tested on real devices after deploy |
| PWA-02 | Lighthouse installability | Automated | `npx lighthouse https://trongld230289.github.io/GSD/ --only-categories=pwa --output=json` | Score ≥ 90 is the gate |
| PWA-03 | Offline: cached data viewable | Manual | Chrome DevTools → Application → Service Workers → Offline checkbox → reload | Transactions list from last fetch should render |
| EXPORT-01 | Export button triggers CSV download | Manual | Click export button → browser download dialog appears | Filename should be `transactions-YYYY-MM.csv` |
| EXPORT-02 | CSV columns correct | Manual | Open CSV in Google Sheets → verify 5 columns: Date, Type, Category, Amount (VND), Note | Check column order and header names exactly |
| EXPORT-03 | CSV opens in Excel without encoding issue | Manual | Download on Windows → open in Excel → confirm VND amounts readable, no garbled text | Tests the `\uFEFF` BOM |
| CI/CD | Auto-deploy on push to main | Automated | `git push origin main` + check GitHub Actions tab | Existing `deploy.yml` already handles this |

### Sampling Rate
- **Per task commit:** Manually verify the specific feature changed (e.g., after PWA config change, check `dist/manifest.webmanifest` content)
- **Per wave merge:** Run Lighthouse against deployed URL
- **Phase gate:** Lighthouse PWA score ≥ 90 AND manual iOS install test passes before closing phase

### Wave 0 Gaps
- [ ] `public/logo.svg` — source image needed before icon generation can run
- [ ] `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/maskable-icon-512x512.png`, `public/apple-touch-icon.png` — generated from logo.svg via `@vite-pwa/assets-generator`
- Framework install: `npm install -D @vite-pwa/assets-generator` — run once, then `npx pwa-assets-generator --preset minimal2023 public/logo.svg`

---

## Open Questions

1. **App icon / logo source**
   - What we know: `public/` is empty; `@vite-pwa/assets-generator` requires a source SVG
   - What's unclear: No logo exists in the project; will need to create a simple one (green circle with "$" or piggy bank glyph)
   - Recommendation: Create a minimal SVG in `public/logo.svg` as the first task of Plan 1; this unblocks all icon generation

2. **`apple-mobile-web-app-status-bar-style` value**
   - What we know: Currently `default`; with `viewport-fit=cover` the recommended value is `black-translucent`
   - What's unclear: `black-translucent` overlays the status bar on the green header — user should confirm this looks good visually
   - Recommendation: Change to `black-translucent` and test on real iPhone; if it looks wrong, revert to `default` and remove `viewport-fit=cover` from the safe-area handling (they go together)

3. **GitHub Actions workflow completeness**
   - What we know: `deploy.yml` exists, triggers on `push` to `main` for `finance-tracker/**` changes, uses `actions/deploy-pages@v4`
   - What's unclear: Whether `package-lock.json` exists (required for `npm ci`)
   - Recommendation: Verify `finance-tracker/package-lock.json` exists; if not, run `npm install` locally to generate it and commit

---

## Sources

### Primary (HIGH confidence)
- [vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html) — manifest fields, icon requirements, base path handling
- [developer.chrome.com/docs/lighthouse/pwa/installable-manifest](https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest) — Chrome installability criteria
- [vite-pwa-org.netlify.app/assets-generator/](https://vite-pwa-org.netlify.app/assets-generator/) — icon generation CLI and presets
- [developer.apple.com/library/archive/.../ConfiguringWebApplications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html) — iOS meta tags
- Codebase: `vite.config.ts`, `index.html`, `index.css`, `BottomNav.tsx`, `.github/workflows/deploy.yml` — confirmed current state

### Secondary (MEDIUM confidence)
- [dev.to/progressier — "any maskable" icon pitfall](https://dev.to/progressier/why-a-pwa-app-icon-shouldnt-have-a-purpose-set-to-any-maskable-4c78) — confirmed by Chrome docs
- [MDN env() CSS reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env) — safe area inset behavior
- [GitHub issue vite-pwa/vite-plugin-pwa #713](https://github.com/vite-pwa/vite-plugin-pwa/issues/713) — base path icon issue, confirmed root cause
- [vite-pwa workbox/generate-sw docs](https://vite-pwa-org.netlify.app/workbox/generate-sw) — runtimeCaching strategy configuration

### Tertiary (LOW confidence)
- WebSearch finding: `apple-mobile-web-app-capable` no longer required on iOS 26+ — single source, not verified against Apple release notes; keeping the tag is harmless

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — vite-plugin-pwa already installed; docs verified via official site
- Architecture: HIGH — base path fix and safe area patterns confirmed against official docs and live codebase
- CSV export: HIGH — pure Web API, no library, BOM approach is standard and verified
- Pitfalls: HIGH — scope/start_url mismatch verified via GitHub issues and Lighthouse docs; safe area gap confirmed by reading actual `index.html`
- GitHub Actions: HIGH — `deploy.yml` read directly from codebase; already functional

**Research date:** 2026-04-19
**Valid until:** 2026-07-19 (stable — vite-plugin-pwa 0.20.x has been stable; GitHub Pages deploy patterns don't change often)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EXPORT-01 | User can export all transactions for the selected month as a CSV file | `exportTransactionsCsv()` utility pattern documented in Code Examples; pure Blob + anchor approach, no library needed |
| EXPORT-02 | CSV columns: Date, Type (income/expense), Category, Amount (VND), Note | Column order and header names specified in `exportTransactionsCsv()` example; RFC 4180 escaping handled |
| EXPORT-03 | Data is also directly accessible in the user's Google Sheet (already true by design) | No new work required — GAS writes to Sheets on every `addTransaction`; this requirement is satisfied by Phase 1 architecture |
| PWA-01 | App fully usable on mobile screen sizes (320px–430px width) | Responsive QA at 4 breakpoints; BottomNav safe-area fix ensures nav is not obscured; viewport fix removes user-scalable block |
| PWA-02 | Installable on Android and iOS via "Add to Home Screen" | `scope`/`start_url` fix to `/GSD/`, icon generation, maskable icon — all documented; iOS requires `apple-touch-icon.png` in public/ |
| PWA-03 | Previously loaded transaction data viewable offline | Workbox `runtimeCaching` with `NetworkFirst` for GAS API documented; `globPatterns` for precaching app shell documented |
</phase_requirements>
