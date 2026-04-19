# Design: Migrate Finance Tracker from GAS/Google Sheets to Firebase + Express BE

**Date:** 2026-04-19  
**Status:** Approved  

---

## Overview

Migrate the Finance Tracker PWA from Google Apps Script + Google Sheets to a proper 3-tier architecture: React FE → Express BE → Firestore. The migration enables household sharing (multiple users sharing one wallet), easier DB management, and a real backend that can handle complex business logic. Both FE and BE live in the same monorepo and auto-deploy via GitHub Actions on push to `main`.

---

## Architecture

```
FE (GitHub Pages)
  → Express BE (Render, free tier)
      → Firestore (Firebase, database only)

Auth: Firebase Auth (Google Sign-In) → ID token → BE verifies via Admin SDK
```

**Monorepo structure:**
```
finance-tracker/          ← existing React/Vite FE
finance-tracker-api/      ← new Express BE
  src/
    routes/
      transactions.ts
      households.ts
      auth.ts
    middleware/
      verifyToken.ts
    db/
      firestore.ts
    index.ts
  package.json
.github/
  workflows/
    deploy-fe.yml
    deploy-be.yml
```

---

## Auth Flow

1. FE uses Firebase Auth SDK — Google Sign-In
2. On sign-in, FE gets a Firebase ID token
3. Every API request includes `Authorization: Bearer <ID token>`
4. BE `verifyToken` middleware calls Firebase Admin SDK to verify token and extract `uid`
5. Stateless — no sessions, no cookies

---

## Firestore Data Model

```
households/{householdId}
  name: string
  members: { [uid]: 'owner' | 'member' }
  createdAt: timestamp

households/{householdId}/transactions/{txId}
  type: 'income' | 'expense'
  amount: number
  category_id: string
  date: string                ← YYYY-MM-DD
  note: string
  createdBy: uid
  createdAt: timestamp

users/{uid}
  email: string
  displayName: string
  householdId: string         ← FK to household
  createdAt: timestamp
```

Transactions are a subcollection of household — queries are simple, security is clear, data is naturally partitioned by household.

---

## Household Sharing

- First sign-in → BE auto-creates a household, user becomes `owner`
- Owner can invite another user by email via `POST /api/household/invite`
- All household members share one transaction list
- Edit/delete permission: the transaction creator OR the household owner

---

## API Endpoints

All routes require `Authorization: Bearer <Firebase ID token>`.

```
Auth
  POST /api/auth/register         ← create user doc + new household in Firestore

Household
  GET  /api/household             ← get current user's household info
  POST /api/household/invite      ← invite member by email { email }

Transactions
  GET  /api/transactions?month=YYYY-MM
  POST /api/transactions
  PUT  /api/transactions/:id      ← tx creator or household owner only
  DELETE /api/transactions/:id    ← tx creator or household owner only

Budget
  GET  /api/budget?month=YYYY-MM
  POST /api/budget
```

**FE migration:** `finance-tracker/src/api/gas.ts` → replaced by `api.ts` calling the Express endpoints above. Function signatures (`apiGetTransactions`, `apiAddTransaction`, etc.) stay the same — only the URL and `Authorization` header change.

---

## CI/CD — GitHub Actions

Two independent workflows, both triggered on push to `main` with path filtering:

**`deploy-fe.yml`** — triggers on changes to `finance-tracker/**`
1. `npm ci && npm run build`
2. Deploy `dist/` to `gh-pages` branch → GitHub Pages

**`deploy-be.yml`** — triggers on changes to `finance-tracker-api/**`
1. `curl $RENDER_DEPLOY_HOOK_URL` — Render pulls new code and restarts

Path filtering ensures FE push doesn't trigger BE deploy and vice versa.

**GitHub Secrets required:**
```
RENDER_DEPLOY_HOOK_URL        ← from Render dashboard
FIREBASE_SERVICE_ACCOUNT      ← JSON key for Admin SDK (BE)
VITE_FIREBASE_CONFIG          ← public config for FE (apiKey, projectId, etc.)
```

---

## Migration Strategy

1. Set up Firebase project + Firestore + Firebase Auth
2. Build Express BE with all endpoints
3. Replace `gas.ts` in FE with new `api.ts`
4. Replace Google Sign-In flow with Firebase Auth SDK
5. Set up Render service + GitHub Actions workflows
6. Smoke test end-to-end
7. Decommission GAS script + Google Sheets

---

## Out of Scope

- Real-time listeners (Firestore onSnapshot) — polling per navigation is sufficient for v1
- Push notifications — v2
- Budget alerts — v2
- Offline mode / service worker sync — existing PWA install behavior unchanged
