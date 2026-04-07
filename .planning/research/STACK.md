# Stack Research — Personal Finance PWA (2025)

## Recommended Stack

### Frontend
| Layer | Technology | Why |
|---|---|---|
| Framework | **React 18 + Vite + TypeScript** | Industry standard, fast HMR, strong typing, excellent PWA support |
| Styling | **Tailwind CSS** | Utility-first, mobile-first responsive design, small bundle |
| Charts | **Recharts** | React-native, composable, responsive, free |
| State | **Zustand** | Lightweight global state (auth + transactions) |
| PWA | **vite-plugin-pwa (Workbox)** | Auto-generates service worker, manifest, offline caching |
| Routing | **React Router v6** | Standard SPA routing |
| Date handling | **date-fns** | Lightweight, treeshakeable (avoid heavy moment.js) |
| Icons | **Heroicons or Lucide React** | Clean, free, React-ready |

### Backend / API
| Layer | Technology | Why |
|---|---|---|
| API server | **Google Apps Script (GAS) Web App** | Free, integrates directly with Sheets, no server to host |
| Database | **Google Sheets** | Free, visible to user, no setup, 10M cells per sheet |
| Auth | **Google Identity Services (GSI) v2** | Popup OAuth, no redirect needed, JWT verification in GAS |

### Hosting
| Layer | Technology | Why |
|---|---|---|
| Frontend host | **GitHub Pages** | Free, custom domain support, CI/CD via GitHub Actions |
| Backend host | **Google Apps Script** | Deployed as Web App, always-on, Google-managed |

---

## Key Dependency Versions (April 2026)
- React: 18.x
- Vite: 5.x
- TypeScript: 5.x
- Tailwind CSS: 3.x
- Recharts: 2.x
- vite-plugin-pwa: 0.20.x
- date-fns: 3.x

---

## Data Flow

```
[User on Phone/Browser]
       │
       ▼
[React PWA — GitHub Pages]
  · Google Sign-In popup (GSI)
  · Gets Google ID Token (JWT)
       │
       ▼ HTTPS POST/GET
[Google Apps Script Web App]
  · Verifies ID Token
  · Reads/writes Google Sheets
       │
       ▼
[Google Sheets]
  · Sheet: "Transactions"  ← main data
  · Sheet: "Categories"    ← category list
```

---

## Google Sheets Schema

### Transactions Sheet
| Column | Type | Example |
|---|---|---|
| id | UUID string | `txn-abc123` |
| date | ISO date | `2026-04-07` |
| type | `income` / `expense` | `expense` |
| category | string | `Food & Dining` |
| amount | number (VND, no decimals) | `85000` |
| note | string (optional) | `Phở Hà Nội` |
| created_at | ISO datetime | `2026-04-07T08:30:00Z` |

### Categories Sheet
| Column | Type | Example |
|---|---|---|
| id | string | `food-dining` |
| name | string | `Food & Dining` |
| type | `income` / `expense` | `expense` |
| icon | emoji | 🍜 |
| color | hex | `#F59E0B` |

---

## Alternatives Considered

| Option | Pros | Cons | Decision |
|---|---|---|---|
| Firebase Firestore | Excellent sync, offline, SDK | More complex setup, free tier limits | Not selected — GAS simpler |
| Supabase | PostgreSQL, real-time | Requires account, server setup | Not selected — user chose GAS |
| Airtable | Nice UI | Paid for API access | Not selected |
| PocketBase | Self-hosted | Requires VPS hosting cost | Not selected |

---
*Research date: 2026-04-07*
