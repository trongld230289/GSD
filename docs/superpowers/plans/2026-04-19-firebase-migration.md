# Firebase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Finance Tracker from Google Apps Script + Google Sheets to a 3-tier architecture: React FE → Express BE → Firestore, with household sharing and GitHub Actions auto-deploy.

**Architecture:** FE (GitHub Pages) calls Express BE (Render) via REST; BE verifies Firebase ID tokens and reads/writes Firestore via Admin SDK. Firebase Auth replaces Google One Tap on the FE.

**Tech Stack:** Express 4, firebase-admin 12, TypeScript 5, Vitest (FE tests), Jest + supertest (BE tests), Firebase Auth (Google provider), Firestore, Render (free), GitHub Actions.

---

## File Map

**New — `finance-tracker-api/`**
- `package.json` — BE dependencies + scripts
- `tsconfig.json` — CommonJS TypeScript config
- `src/index.ts` — Express app entry, routes wired
- `src/db/firestore.ts` — Firebase Admin init, exports `db`
- `src/middleware/verifyToken.ts` — extracts `uid` + `email` from Bearer token
- `src/routes/auth.ts` — `POST /api/auth/register`
- `src/routes/transactions.ts` — CRUD + totals
- `src/routes/budget.ts` — GET + POST budget
- `src/routes/households.ts` — GET info + POST invite
- `src/__tests__/transactions.test.ts` — supertest integration tests
- `src/__tests__/verifyToken.test.ts` — middleware unit tests
- `.env.example` — required env vars

**New — `finance-tracker/src/`**
- `firebase.ts` — Firebase app + auth init
- `api/api.ts` — new API client (same signatures as gas.ts)

**Modified — `finance-tracker/src/`**
- `types.ts` — replace `GoogleUser` with `AppUser`; add `createdBy` to `Transaction`
- `store/useStore.ts` — update `AuthStore` to use `AppUser`
- `pages/LoginPage.tsx` — Firebase signInWithPopup replaces Google One Tap
- `App.tsx` — add `onAuthStateChanged` listener
- `pages/HomePage.tsx` — import from api.ts; categories local
- `pages/ReportsPage.tsx` — import from api.ts
- `pages/BudgetPage.tsx` — import from api.ts
- `components/AddTransactionDrawer.tsx` — import from api.ts
- `components/BudgetCategoryRow.tsx` — import from api.ts
- `index.html` — remove Google One Tap script tag

**Deleted**
- `finance-tracker/src/api/gas.ts`
- `finance-tracker/src/hooks/useTokenRefresh.ts`

**New — `.github/workflows/`**
- `deploy-fe.yml`
- `deploy-be.yml`

---

## Phase 1: Express Backend

### Task 1: BE project scaffold + health endpoint

**Files:**
- Create: `finance-tracker-api/package.json`
- Create: `finance-tracker-api/tsconfig.json`
- Create: `finance-tracker-api/src/index.ts`
- Create: `finance-tracker-api/.env.example`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "finance-tracker-api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "firebase-admin": "^12.1.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.4",
    "ts-jest": "^29.1.4",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.5"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testMatch": ["**/__tests__/**/*.test.ts"]
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create .env.example**

```
PORT=3000
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FE_ORIGIN=https://<your-github-username>.github.io
```

- [ ] **Step 4: Create src/index.ts**

```typescript
import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors({ origin: process.env.FE_ORIGIN ?? '*' }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

const PORT = process.env.PORT ?? 3000
if (require.main === module) {
  app.listen(PORT, () => console.log(`API running on :${PORT}`))
}

export default app
```

- [ ] **Step 5: Install dependencies**

Run in `finance-tracker-api/`:
```bash
npm install
```

- [ ] **Step 6: Verify health endpoint**

```bash
npx ts-node-dev --transpile-only src/index.ts &
curl http://localhost:3000/health
```
Expected: `{"ok":true}`

- [ ] **Step 7: Commit**

```bash
git add finance-tracker-api/
git commit -m "feat(api): scaffold Express BE with health endpoint"
```

---

### Task 2: Firestore init

**Files:**
- Create: `finance-tracker-api/src/db/firestore.ts`

- [ ] **Step 1: Create src/db/firestore.ts**

```typescript
import admin from 'firebase-admin'

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? '{}')
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

export const db = admin.firestore()
export { admin }
```

- [ ] **Step 2: Commit**

```bash
git add finance-tracker-api/src/db/
git commit -m "feat(api): add Firestore init via Admin SDK"
```

---

### Task 3: verifyToken middleware

**Files:**
- Create: `finance-tracker-api/src/middleware/verifyToken.ts`
- Create: `finance-tracker-api/src/__tests__/verifyToken.test.ts`

- [ ] **Step 1: Write the failing test**

`finance-tracker-api/src/__tests__/verifyToken.test.ts`:
```typescript
import { Request, Response, NextFunction } from 'express'

// Mock firebase-admin BEFORE importing middleware
jest.mock('../db/firestore', () => ({
  admin: {
    auth: () => ({
      verifyIdToken: jest.fn(),
    }),
  },
  db: {},
}))

import { verifyToken, AuthRequest } from '../middleware/verifyToken'
import { admin } from '../db/firestore'

const mockVerifyIdToken = admin.auth().verifyIdToken as jest.Mock

function makeReq(authHeader?: string): Partial<Request> {
  return { headers: { authorization: authHeader } }
}
function makeRes(): Partial<Response> {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() }
}
const next: NextFunction = jest.fn()

beforeEach(() => jest.clearAllMocks())

test('returns 401 when no Authorization header', async () => {
  const req = makeReq() as Request
  const res = makeRes() as Response
  await verifyToken(req, res, next)
  expect(res.status).toHaveBeenCalledWith(401)
  expect(next).not.toHaveBeenCalled()
})

test('returns 401 when token is invalid', async () => {
  mockVerifyIdToken.mockRejectedValueOnce(new Error('invalid'))
  const req = makeReq('Bearer bad-token') as Request
  const res = makeRes() as Response
  await verifyToken(req, res, next)
  expect(res.status).toHaveBeenCalledWith(401)
  expect(next).not.toHaveBeenCalled()
})

test('calls next() and sets uid + email when token is valid', async () => {
  mockVerifyIdToken.mockResolvedValueOnce({ uid: 'user-123', email: 'a@b.com' })
  const req = makeReq('Bearer valid-token') as Request
  const res = makeRes() as Response
  await verifyToken(req, res, next)
  expect((req as AuthRequest).uid).toBe('user-123')
  expect((req as AuthRequest).email).toBe('a@b.com')
  expect(next).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd finance-tracker-api && npx jest src/__tests__/verifyToken.test.ts
```
Expected: FAIL — `Cannot find module '../middleware/verifyToken'`

- [ ] **Step 3: Create src/middleware/verifyToken.ts**

```typescript
import { Request, Response, NextFunction } from 'express'
import { admin } from '../db/firestore'

export interface AuthRequest extends Request {
  uid: string
  email: string
}

export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' })
    return
  }
  const token = authHeader.slice(7)
  try {
    const decoded = await admin.auth().verifyIdToken(token)
    ;(req as AuthRequest).uid = decoded.uid
    ;(req as AuthRequest).email = decoded.email ?? ''
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/verifyToken.test.ts
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add finance-tracker-api/src/middleware/ finance-tracker-api/src/__tests__/verifyToken.test.ts
git commit -m "feat(api): add verifyToken middleware with tests"
```

---

### Task 4: Auth route — POST /api/auth/register

**Files:**
- Create: `finance-tracker-api/src/routes/auth.ts`
- Modify: `finance-tracker-api/src/index.ts`

- [ ] **Step 1: Create src/routes/auth.ts**

```typescript
import { Router, Request, Response } from 'express'
import { db } from '../db/firestore'
import { verifyToken, AuthRequest } from '../middleware/verifyToken'

const router = Router()

router.post('/register', verifyToken, async (req: Request, res: Response): Promise<void> => {
  const { uid, email } = req as AuthRequest
  const userRef = db.collection('users').doc(uid)
  const userSnap = await userRef.get()

  if (userSnap.exists) {
    res.json({ householdId: userSnap.data()!.householdId })
    return
  }

  const householdRef = db.collection('households').doc()
  const householdId = householdRef.id
  const batch = db.batch()

  batch.set(householdRef, {
    name: `${email.split('@')[0]}'s household`,
    members: { [uid]: 'owner' },
    createdAt: new Date().toISOString(),
  })

  batch.set(userRef, {
    email,
    displayName: email.split('@')[0],
    householdId,
    createdAt: new Date().toISOString(),
  })

  await batch.commit()
  res.status(201).json({ householdId })
})

export default router
```

- [ ] **Step 2: Wire route into src/index.ts**

Replace the content of `finance-tracker-api/src/index.ts`:
```typescript
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth'

const app = express()

app.use(cors({ origin: process.env.FE_ORIGIN ?? '*' }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRouter)

const PORT = process.env.PORT ?? 3000
if (require.main === module) {
  app.listen(PORT, () => console.log(`API running on :${PORT}`))
}

export default app
```

- [ ] **Step 3: Commit**

```bash
git add finance-tracker-api/src/routes/auth.ts finance-tracker-api/src/index.ts
git commit -m "feat(api): add POST /api/auth/register"
```

---

### Task 5: Transactions routes (CRUD + totals)

**Files:**
- Create: `finance-tracker-api/src/routes/transactions.ts`
- Create: `finance-tracker-api/src/__tests__/transactions.test.ts`
- Modify: `finance-tracker-api/src/index.ts`

- [ ] **Step 1: Write failing tests**

`finance-tracker-api/src/__tests__/transactions.test.ts`:
```typescript
jest.mock('../db/firestore', () => ({ db: {}, admin: { auth: () => ({ verifyIdToken: jest.fn() }) } }))
jest.mock('../middleware/verifyToken', () => ({
  verifyToken: (req: any, _res: any, next: any) => {
    req.uid = 'uid-alice'
    req.email = 'alice@test.com'
    next()
  },
}))

import request from 'supertest'
import express from 'express'
import { db } from '../db/firestore'
import transactionsRouter from '../routes/transactions'

const app = express()
app.use(express.json())
app.use('/api/transactions', transactionsRouter)

const mockDb = db as any

beforeEach(() => jest.clearAllMocks())

function mockUserDoc(householdId = 'hh-1') {
  mockDb.collection = jest.fn().mockReturnValue({
    doc: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ householdId }) }),
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      id: 'new-tx-id',
    }),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ docs: [] }),
    add: jest.fn(),
  })
}

test('GET /api/transactions returns 400 without month param', async () => {
  mockUserDoc()
  const res = await request(app).get('/api/transactions')
  expect(res.status).toBe(400)
})

test('GET /api/transactions returns 200 with valid month', async () => {
  const mockCollection = jest.fn()
  let callCount = 0
  mockCollection.mockImplementation(() => ({
    doc: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ householdId: 'hh-1' }) }),
      collection: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: [
          { id: 'tx-1', data: () => ({ type: 'expense', amount: 50000, category_id: 'food', date: '2026-04-10', note: '' }) }
        ]}),
      }),
    }),
  }))
  mockDb.collection = mockCollection
  const res = await request(app).get('/api/transactions?month=2026-04')
  expect(res.status).toBe(200)
  expect(res.body).toHaveLength(1)
  expect(res.body[0].id).toBe('tx-1')
})

test('POST /api/transactions returns 201 with valid body', async () => {
  const mockTxRef = { id: 'new-id', set: jest.fn().mockResolvedValue(undefined) }
  mockDb.collection = jest.fn().mockReturnValue({
    doc: jest.fn((id?: string) => {
      if (!id) return mockTxRef
      return { get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ householdId: 'hh-1' }) }) }
    }),
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue(mockTxRef),
    }),
  })
  const res = await request(app).post('/api/transactions').send({
    type: 'expense', amount: 50000, category_id: 'food', date: '2026-04-10', note: ''
  })
  expect(res.status).toBe(201)
  expect(res.body.id).toBeDefined()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/transactions.test.ts
```
Expected: FAIL — cannot find `../routes/transactions`

- [ ] **Step 3: Create src/routes/transactions.ts**

```typescript
import { Router, Request, Response } from 'express'
import { db } from '../db/firestore'
import { verifyToken, AuthRequest } from '../middleware/verifyToken'

const router = Router()
router.use(verifyToken)

async function getHouseholdId(uid: string): Promise<string | null> {
  const snap = await db.collection('users').doc(uid).get()
  return snap.exists ? (snap.data()!.householdId as string) : null
}

// GET /api/transactions?month=YYYY-MM
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { uid } = req as AuthRequest
  const month = req.query.month as string
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    res.status(400).json({ error: 'month param required (YYYY-MM)' })
    return
  }
  const householdId = await getHouseholdId(uid)
  if (!householdId) { res.status(404).json({ error: 'User not registered' }); return }

  const snap = await db
    .collection('households').doc(householdId)
    .collection('transactions')
    .where('date', '>=', `${month}-01`)
    .where('date', '<=', `${month}-31`)
    .orderBy('date', 'desc')
    .get()

  res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })))
})

// GET /api/transactions/totals?months=YYYY-MM,YYYY-MM,...
router.get('/totals', async (req: Request, res: Response): Promise<void> => {
  const { uid } = req as AuthRequest
  const monthsParam = req.query.months as string
  if (!monthsParam) { res.status(400).json({ error: 'months param required' }); return }
  const months = monthsParam.split(',')
  const householdId = await getHouseholdId(uid)
  if (!householdId) { res.status(404).json({ error: 'User not registered' }); return }

  const results = await Promise.all(months.map(async (month) => {
    const snap = await db
      .collection('households').doc(householdId)
      .collection('transactions')
      .where('date', '>=', `${month}-01`)
      .where('date', '<=', `${month}-31`)
      .get()
    let income = 0, expense = 0
    snap.docs.forEach(d => {
      const tx = d.data()
      if (tx.type === 'income') income += tx.amount
      else expense += tx.amount
    })
    return { month, income, expense }
  }))
  res.json(results)
})

// POST /api/transactions
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { uid } = req as AuthRequest
  const householdId = await getHouseholdId(uid)
  if (!householdId) { res.status(404).json({ error: 'User not registered' }); return }

  const { type, amount, category_id, date, note } = req.body
  if (!type || !amount || !category_id || !date) {
    res.status(400).json({ error: 'type, amount, category_id, date required' })
    return
  }

  const ref = db.collection('households').doc(householdId).collection('transactions').doc()
  const now = new Date().toISOString()
  const tx = { type, amount, category_id, date, note: note ?? '', createdBy: uid, createdAt: now }
  await ref.set(tx)
  res.status(201).json({ id: ref.id, ...tx })
})

// PUT /api/transactions/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const { uid } = req as AuthRequest
  const householdId = await getHouseholdId(uid)
  if (!householdId) { res.status(404).json({ error: 'User not registered' }); return }

  const txRef = db.collection('households').doc(householdId).collection('transactions').doc(req.params.id)
  const txSnap = await txRef.get()
  if (!txSnap.exists) { res.status(404).json({ error: 'Transaction not found' }); return }

  const householdSnap = await db.collection('households').doc(householdId).get()
  const members = householdSnap.data()!.members as Record<string, string>
  if (members[uid] !== 'owner' && txSnap.data()!.createdBy !== uid) {
    res.status(403).json({ error: 'Forbidden' }); return
  }

  const { type, amount, category_id, date, note } = req.body
  await txRef.update({ type, amount, category_id, date, note: note ?? '' })
  res.json({ id: req.params.id, ...txSnap.data(), type, amount, category_id, date, note: note ?? '' })
})

// DELETE /api/transactions/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { uid } = req as AuthRequest
  const householdId = await getHouseholdId(uid)
  if (!householdId) { res.status(404).json({ error: 'User not registered' }); return }

  const txRef = db.collection('households').doc(householdId).collection('transactions').doc(req.params.id)
  const txSnap = await txRef.get()
  if (!txSnap.exists) { res.status(404).json({ error: 'Transaction not found' }); return }

  const householdSnap = await db.collection('households').doc(householdId).get()
  const members = householdSnap.data()!.members as Record<string, string>
  if (members[uid] !== 'owner' && txSnap.data()!.createdBy !== uid) {
    res.status(403).json({ error: 'Forbidden' }); return
  }

  await txRef.delete()
  res.status(204).send()
})

export default router
```

- [ ] **Step 4: Wire route into src/index.ts**

```typescript
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth'
import transactionsRouter from './routes/transactions'

const app = express()

app.use(cors({ origin: process.env.FE_ORIGIN ?? '*' }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRouter)
app.use('/api/transactions', transactionsRouter)

const PORT = process.env.PORT ?? 3000
if (require.main === module) {
  app.listen(PORT, () => console.log(`API running on :${PORT}`))
}

export default app
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest src/__tests__/transactions.test.ts
```
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add finance-tracker-api/src/routes/transactions.ts finance-tracker-api/src/__tests__/transactions.test.ts finance-tracker-api/src/index.ts
git commit -m "feat(api): add transaction CRUD routes with tests"
```

---

### Task 6: Budget + Household routes

**Files:**
- Create: `finance-tracker-api/src/routes/budget.ts`
- Create: `finance-tracker-api/src/routes/households.ts`
- Modify: `finance-tracker-api/src/index.ts`

- [ ] **Step 1: Create src/routes/budget.ts**

```typescript
import { Router, Request, Response } from 'express'
import { db } from '../db/firestore'
import { verifyToken, AuthRequest } from '../middleware/verifyToken'

const router = Router()
router.use(verifyToken)

async function getHouseholdId(uid: string): Promise<string | null> {
  const snap = await db.collection('users').doc(uid).get()
  return snap.exists ? (snap.data()!.householdId as string) : null
}

// GET /api/budget?month=YYYY-MM
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { uid } = req as AuthRequest
  const month = req.query.month as string
  if (!month) { res.status(400).json({ error: 'month param required' }); return }
  const householdId = await getHouseholdId(uid)
  if (!householdId) { res.status(404).json({ error: 'User not registered' }); return }

  const snap = await db
    .collection('households').doc(householdId)
    .collection('budgets').doc(month).get()
  res.json(snap.exists ? snap.data()!.entries ?? [] : [])
})

// POST /api/budget — body: { month, category_id, budgeted }
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { uid } = req as AuthRequest
  const { month, category_id, budgeted } = req.body
  if (!month || !category_id || budgeted === undefined) {
    res.status(400).json({ error: 'month, category_id, budgeted required' })
    return
  }
  const householdId = await getHouseholdId(uid)
  if (!householdId) { res.status(404).json({ error: 'User not registered' }); return }

  const ref = db.collection('households').doc(householdId).collection('budgets').doc(month)
  const snap = await ref.get()
  const entries: Array<{ category_id: string; budgeted: number }> = snap.exists ? snap.data()!.entries ?? [] : []
  const idx = entries.findIndex(e => e.category_id === category_id)
  if (idx >= 0) entries[idx] = { category_id, budgeted }
  else entries.push({ category_id, budgeted })

  await ref.set({ entries })
  res.json({ ok: true })
})

export default router
```

- [ ] **Step 2: Create src/routes/households.ts**

```typescript
import { Router, Request, Response } from 'express'
import { db } from '../db/firestore'
import { verifyToken, AuthRequest } from '../middleware/verifyToken'

const router = Router()
router.use(verifyToken)

// GET /api/household
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { uid } = req as AuthRequest
  const userSnap = await db.collection('users').doc(uid).get()
  if (!userSnap.exists) { res.status(404).json({ error: 'User not registered' }); return }
  const { householdId } = userSnap.data()!
  const hhSnap = await db.collection('households').doc(householdId).get()
  res.json({ id: householdId, ...hhSnap.data() })
})

// POST /api/household/invite — body: { email }
router.post('/invite', async (req: Request, res: Response): Promise<void> => {
  const { uid } = req as AuthRequest
  const { email } = req.body
  if (!email) { res.status(400).json({ error: 'email required' }); return }

  const userSnap = await db.collection('users').doc(uid).get()
  if (!userSnap.exists) { res.status(404).json({ error: 'User not registered' }); return }
  const { householdId } = userSnap.data()!

  const hhSnap = await db.collection('households').doc(householdId).get()
  const members = hhSnap.data()!.members as Record<string, string>
  if (members[uid] !== 'owner') { res.status(403).json({ error: 'Only owner can invite' }); return }

  const inviteSnap = await db.collection('users').where('email', '==', email).limit(1).get()
  if (inviteSnap.empty) {
    res.status(404).json({ error: 'User not found. They must sign in to the app first.' })
    return
  }
  const invitedUid = inviteSnap.docs[0].id

  const batch = db.batch()
  batch.update(db.collection('households').doc(householdId), { [`members.${invitedUid}`]: 'member' })
  batch.update(db.collection('users').doc(invitedUid), { householdId })
  await batch.commit()

  res.json({ ok: true })
})

export default router
```

- [ ] **Step 3: Wire both routes into src/index.ts**

```typescript
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth'
import transactionsRouter from './routes/transactions'
import budgetRouter from './routes/budget'
import householdRouter from './routes/households'

const app = express()

app.use(cors({ origin: process.env.FE_ORIGIN ?? '*' }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/budget', budgetRouter)
app.use('/api/household', householdRouter)

const PORT = process.env.PORT ?? 3000
if (require.main === module) {
  app.listen(PORT, () => console.log(`API running on :${PORT}`))
}

export default app
```

- [ ] **Step 4: Run all BE tests**

```bash
cd finance-tracker-api && npx jest
```
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add finance-tracker-api/src/routes/budget.ts finance-tracker-api/src/routes/households.ts finance-tracker-api/src/index.ts
git commit -m "feat(api): add budget + household routes"
```

---

## Phase 2: Frontend Migration

### Task 7: Add Firebase SDK + create firebase.ts

**Files:**
- Create: `finance-tracker/src/firebase.ts`
- Create: `finance-tracker/.env.example`

- [ ] **Step 1: Install Firebase SDK**

```bash
cd finance-tracker && npm install firebase
```

- [ ] **Step 2: Create src/firebase.ts**

```typescript
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
```

- [ ] **Step 3: Create .env.example**

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=http://localhost:3000
```

- [ ] **Step 4: Create .env.local with real values from Firebase console**

Copy `.env.example` to `.env.local` and fill in the values from Firebase console → Project settings → Your apps → Web app config.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add finance-tracker/src/firebase.ts finance-tracker/.env.example finance-tracker/package.json finance-tracker/package-lock.json
git commit -m "feat(fe): add Firebase SDK + firebase.ts init"
```

---

### Task 8: Replace Google One Tap auth with Firebase Auth

**Files:**
- Modify: `finance-tracker/src/types.ts`
- Modify: `finance-tracker/src/store/useStore.ts`
- Modify: `finance-tracker/src/pages/LoginPage.tsx`
- Modify: `finance-tracker/src/App.tsx`
- Modify: `finance-tracker/index.html`

- [ ] **Step 1: Update types.ts — replace GoogleUser with AppUser**

In `finance-tracker/src/types.ts`, replace:
```typescript
export interface GoogleUser {
  email: string
  name: string
  picture: string
  sub: string
}
```
With:
```typescript
export interface AppUser {
  uid: string
  email: string
  displayName: string
  photoURL: string
}
```

Also update `AuthState`:
```typescript
export interface AuthState {
  user: AppUser | null
  idToken: string | null
  isLoading: boolean
}
```

Also update `Transaction` — make legacy GAS fields optional (BE doesn't return them) and add `createdBy`:
```typescript
export interface Transaction {
  id: string
  date: string
  type: TransactionType
  category_id: string
  amount: number
  note: string
  created_at?: string    // optional: GAS used this; BE uses createdAt
  createdAt?: string     // BE camelCase timestamp
  user_email?: string    // optional: not used in UI, removed from BE
  createdBy?: string     // uid of who added it (from BE)
}
```

- [ ] **Step 2: Update store/useStore.ts — AuthStore**

Replace the entire `AuthStore` section (keep SettingsStore, AppStore, BudgetStore unchanged). Change the import and the interface:

```typescript
import type { AuthState, AppUser, Category, Transaction, BudgetEntry } from '../types'

interface AuthStore extends AuthState {
  setUser: (user: AppUser, idToken: string) => void
  clearUser: () => void
  setToken: (idToken: string) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      idToken: null,
      isLoading: false,
      setUser: (user, idToken) => set({ user, idToken }),
      clearUser: () => set({ user: null, idToken: null }),
      setToken: (idToken) => set({ idToken }),
    }),
    { name: 'finance-auth' }
  )
)
```

(Remove `tokenExpiry` — Firebase handles token refresh internally.)

- [ ] **Step 3: Rewrite pages/LoginPage.tsx**

```typescript
import { useState } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuthStore } from '../store/useStore'

const provider = new GoogleAuthProvider()

export default function LoginPage() {
  const { setUser } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await signInWithPopup(auth, provider)
      const fbUser = result.user
      const token = await fbUser.getIdToken()
      setUser(
        {
          uid: fbUser.uid,
          email: fbUser.email ?? '',
          displayName: fbUser.displayName ?? '',
          photoURL: fbUser.photoURL ?? '',
        },
        token
      )
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch (err) {
      setError('Đăng nhập thất bại. Vui lòng thử lại.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Finance Tracker</h1>
        <p className="text-gray-500 mb-8">Theo dõi thu chi của bạn</p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 px-4 text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 transition disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập với Google'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Update App.tsx — add onAuthStateChanged**

```typescript
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { useAuthStore } from './store/useStore'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import ReportsPage from './pages/ReportsPage'
import BudgetPage from './pages/BudgetPage'

export default function App() {
  const { user, setUser, clearUser } = useAuthStore()

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const token = await fbUser.getIdToken()
        setUser(
          {
            uid: fbUser.uid,
            email: fbUser.email ?? '',
            displayName: fbUser.displayName ?? '',
            photoURL: fbUser.photoURL ?? '',
          },
          token
        )
      } else {
        clearUser()
      }
    })
  }, [setUser, clearUser])

  return (
    <BrowserRouter basename="/GSD">
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/reports" element={user ? <ReportsPage /> : <Navigate to="/login" replace />} />
        <Route path="/budget" element={user ? <BudgetPage /> : <Navigate to="/login" replace />} />
        <Route path="/*" element={user ? <HomePage /> : <Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 5: Remove Google One Tap script from index.html**

In `finance-tracker/index.html`, remove this line:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd finance-tracker && npx tsc --noEmit
```
Expected: no errors (fix any `GoogleUser` references that remain)

- [ ] **Step 7: Commit**

```bash
git add finance-tracker/src/types.ts finance-tracker/src/store/useStore.ts finance-tracker/src/pages/LoginPage.tsx finance-tracker/src/App.tsx finance-tracker/index.html
git commit -m "feat(fe): replace Google One Tap with Firebase Auth"
```

---

### Task 9: Create api.ts (new API client, replaces gas.ts)

**Files:**
- Create: `finance-tracker/src/api/api.ts`

- [ ] **Step 1: Write the failing test**

`finance-tracker/src/api/api.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { apiGetTransactions, apiAddTransaction, apiDeleteTransaction, apiGetMonthlyTotals, apiGetBudgets, apiSetBudget } from './api'

const TOKEN = 'test-token'
const BASE = 'http://localhost:3000'

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', BASE)
  mockFetch.mockReset()
})

function mockOk(body: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => body,
  })
}

describe('apiGetTransactions', () => {
  it('calls GET /api/transactions?month=', async () => {
    mockOk([{ id: 'tx-1', amount: 50000 }])
    const result = await apiGetTransactions(TOKEN, '2026-04')
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/api/transactions?month=2026-04`,
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }) })
    )
    expect(result).toHaveLength(1)
  })
})

describe('apiAddTransaction', () => {
  it('calls POST /api/transactions', async () => {
    const tx = { type: 'expense' as const, amount: 50000, category_id: 'food', date: '2026-04-10', note: '' }
    mockOk({ id: 'new-id', ...tx, createdBy: 'uid', createdAt: '' })
    await apiAddTransaction(TOKEN, tx)
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/api/transactions`,
      expect.objectContaining({ method: 'POST' })
    )
  })
})

describe('apiDeleteTransaction', () => {
  it('calls DELETE /api/transactions/:id', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    await apiDeleteTransaction(TOKEN, 'tx-1')
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/api/transactions/tx-1`,
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})

describe('apiGetMonthlyTotals', () => {
  it('calls GET /api/transactions/totals', async () => {
    mockOk([{ month: '2026-04', income: 0, expense: 0 }])
    await apiGetMonthlyTotals(TOKEN, ['2026-04', '2026-03'])
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/api/transactions/totals?months=2026-04,2026-03`,
      expect.anything()
    )
  })
})

describe('apiGetBudgets', () => {
  it('calls GET /api/budget?month=', async () => {
    mockOk([])
    await apiGetBudgets(TOKEN, '2026-04')
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/api/budget?month=2026-04`,
      expect.anything()
    )
  })
})

describe('apiSetBudget', () => {
  it('calls POST /api/budget', async () => {
    mockOk({ ok: true })
    await apiSetBudget(TOKEN, '2026-04', 'food', 500000)
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/api/budget`,
      expect.objectContaining({ method: 'POST' })
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd finance-tracker && npx vitest run src/api/api.test.ts
```
Expected: FAIL — cannot find `./api`

- [ ] **Step 3: Create src/api/api.ts**

```typescript
import type { BudgetEntry, MonthlyTotals, Transaction } from '../types'
import { format, subMonths } from 'date-fns'

export function lastNMonths(n: number): string[] {
  return Array.from({ length: n }, (_, i) =>
    format(subMonths(new Date(), i), 'yyyy-MM')
  )
}

const BASE = import.meta.env.VITE_API_URL ?? ''

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? 'API error')
  }
  return res.json() as Promise<T>
}

export async function apiGetTransactions(token: string, month: string): Promise<Transaction[]> {
  return apiFetch(`/api/transactions?month=${month}`, token)
}

export async function apiAddTransaction(
  token: string,
  tx: Omit<Transaction, 'id' | 'created_at' | 'user_email' | 'createdBy'>
): Promise<Transaction> {
  return apiFetch('/api/transactions', token, { method: 'POST', body: JSON.stringify(tx) })
}

export async function apiUpdateTransaction(
  token: string,
  tx: Pick<Transaction, 'id' | 'date' | 'type' | 'category_id' | 'amount' | 'note'>
): Promise<Transaction> {
  const { id, ...rest } = tx
  return apiFetch(`/api/transactions/${id}`, token, { method: 'PUT', body: JSON.stringify(rest) })
}

export async function apiDeleteTransaction(token: string, id: string): Promise<void> {
  await apiFetch(`/api/transactions/${id}`, token, { method: 'DELETE' })
}

export async function apiGetMonthlyTotals(token: string, months: string[]): Promise<MonthlyTotals[]> {
  return apiFetch(`/api/transactions/totals?months=${months.join(',')}`, token)
}

export async function apiGetBudgets(token: string, month: string): Promise<BudgetEntry[]> {
  return apiFetch(`/api/budget?month=${month}`, token)
}

export async function apiSetBudget(
  token: string,
  month: string,
  category_id: string,
  budgeted: number
): Promise<void> {
  await apiFetch('/api/budget', token, { method: 'POST', body: JSON.stringify({ month, category_id, budgeted }) })
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/api/api.test.ts
```
Expected: PASS (6 describe blocks, 6 tests)

- [ ] **Step 5: Commit**

```bash
git add finance-tracker/src/api/api.ts finance-tracker/src/api/api.test.ts
git commit -m "feat(fe): add api.ts — new REST client replacing gas.ts"
```

---

### Task 10: Update all page imports + remove deprecated files

**Files:**
- Modify: `finance-tracker/src/pages/HomePage.tsx`
- Modify: `finance-tracker/src/pages/ReportsPage.tsx`
- Modify: `finance-tracker/src/pages/BudgetPage.tsx`
- Modify: `finance-tracker/src/components/AddTransactionDrawer.tsx`
- Modify: `finance-tracker/src/components/BudgetCategoryRow.tsx`
- Delete: `finance-tracker/src/api/gas.ts`
- Delete: `finance-tracker/src/hooks/useTokenRefresh.ts`

- [ ] **Step 1: Update HomePage.tsx imports**

Replace:
```typescript
import { apiGetTransactions, apiGetCategories, apiDeleteTransaction } from '../api/gas'
```
With:
```typescript
import { apiGetTransactions, apiDeleteTransaction } from '../api/api'
import { CATEGORY_META } from '../data/categories'
```

Remove the `useEffect` that calls `apiGetCategories()` and replace it with:
```typescript
useEffect(() => {
  if (categories.length === 0) setCategories(CATEGORY_META)
}, [])
```

- [ ] **Step 2: Update ReportsPage.tsx imports**

Replace:
```typescript
import { apiGetTransactions, apiGetMonthlyTotals, lastNMonths } from '../api/gas'
```
With:
```typescript
import { apiGetTransactions, apiGetMonthlyTotals, lastNMonths } from '../api/api'
```

- [ ] **Step 3: Update BudgetPage.tsx imports**

Replace:
```typescript
import { apiGetBudgets, apiGetTransactions } from '../api/gas'
```
With:
```typescript
import { apiGetBudgets, apiGetTransactions } from '../api/api'
```

- [ ] **Step 4: Update AddTransactionDrawer.tsx imports**

Replace:
```typescript
import { apiAddTransaction, apiUpdateTransaction } from '../api/gas'
```
With:
```typescript
import { apiAddTransaction, apiUpdateTransaction } from '../api/api'
```

- [ ] **Step 5: Update BudgetCategoryRow.tsx imports**

Replace:
```typescript
import { apiSetBudget } from '../api/gas'
```
With:
```typescript
import { apiSetBudget } from '../api/api'
```

- [ ] **Step 6: Delete deprecated files**

```bash
rm finance-tracker/src/api/gas.ts
rm finance-tracker/src/hooks/useTokenRefresh.ts
```

- [ ] **Step 7: Remove useTokenRefresh usage from any component that imports it**

Search for imports:
```bash
grep -r "useTokenRefresh" finance-tracker/src --include="*.tsx" --include="*.ts" -l
```
For each file found, remove the import line and any call to `useTokenRefresh()`.

- [ ] **Step 8: Verify TypeScript compiles with no errors**

```bash
cd finance-tracker && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 9: Run all FE tests**

```bash
npx vitest run
```
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add finance-tracker/src/
git commit -m "feat(fe): migrate all pages from gas.ts to api.ts"
```

---

## Phase 3: Deployment

### Task 11: GitHub Actions workflows

**Files:**
- Create: `.github/workflows/deploy-fe.yml`
- Create: `.github/workflows/deploy-be.yml`

- [ ] **Step 1: Create .github/workflows/deploy-fe.yml**

```yaml
name: Deploy FE

on:
  push:
    branches: [main]
    paths:
      - 'finance-tracker/**'

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: finance-tracker/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: finance-tracker

      - name: Build
        run: npm run build
        working-directory: finance-tracker
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: finance-tracker/dist
```

- [ ] **Step 2: Create .github/workflows/deploy-be.yml**

```yaml
name: Deploy BE

on:
  push:
    branches: [main]
    paths:
      - 'finance-tracker-api/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render deploy
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-fe.yml .github/workflows/deploy-be.yml
git commit -m "ci: add GitHub Actions workflows for FE + BE auto-deploy"
```

---

### Task 12: Manual setup — Firebase + Render + GitHub Secrets

This task is manual configuration, not code.

- [ ] **Step 1: Create Firebase project**

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create new project: `finance-tracker`
3. Enable **Authentication** → Sign-in providers → Google → Enable
4. Enable **Firestore Database** → Start in production mode → choose region (asia-southeast1 for Vietnam)
5. Go to **Project settings** → Service accounts → Generate new private key → save JSON

- [ ] **Step 2: Get Firebase web config for FE**

In Firebase console → Project settings → Your apps → Add web app → register → copy the config object. Values map to:
- `apiKey` → `VITE_FIREBASE_API_KEY`
- `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
- `projectId` → `VITE_FIREBASE_PROJECT_ID`
- `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
- `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `appId` → `VITE_FIREBASE_APP_ID`

- [ ] **Step 3: Create Render web service**

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect GitHub repo
3. Settings:
   - Root directory: `finance-tracker-api`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Environment: Node
4. Add environment variable: `FIREBASE_SERVICE_ACCOUNT` = (paste the entire service account JSON as a single-line string)
5. Add environment variable: `FE_ORIGIN` = `https://<your-github-username>.github.io`
6. Deploy → copy the service URL (e.g. `https://finance-tracker-api-xxxx.onrender.com`)
7. Go to Settings → Deploy Hook → copy the URL

- [ ] **Step 4: Add all GitHub Secrets**

In GitHub repo → Settings → Secrets and variables → Actions → New repository secret, add:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_API_URL         ← the Render service URL
RENDER_DEPLOY_HOOK_URL
```

- [ ] **Step 5: Update .env.local with Render URL and verify local dev works**

Add to `finance-tracker/.env.local`:
```
VITE_API_URL=https://finance-tracker-api-xxxx.onrender.com
```

Start the BE locally (with your real Firebase service account in `.env`) and test:
```bash
cd finance-tracker-api
cp .env.example .env   # fill in FIREBASE_SERVICE_ACCOUNT
npm run dev
# in another terminal:
curl http://localhost:3000/health
```
Expected: `{"ok":true}`

- [ ] **Step 6: Push to main and verify both workflows run**

```bash
git push origin main
```

Check GitHub Actions tab — both `Deploy FE` and `Deploy BE` should run and pass.

- [ ] **Step 7: Smoke test end-to-end**

1. Open the deployed FE URL
2. Click "Đăng nhập với Google" — sign in
3. App loads home page — no errors in console
4. Add a transaction — appears in the list
5. Navigate to next month and back — transaction still visible (it's in Firestore now)
6. Check Firestore console — verify `users`, `households`, and `transactions` subcollection exist

---

## Firestore Indexes Required

After first deploy, Firestore may prompt to create a composite index for the transactions query. When it does:

1. Open the error URL from the browser console — it links directly to Firestore index creation
2. Click "Create index" — takes ~2 minutes

The query that needs it: `transactions` collection filtered by `date >= X` and `date <= Y`, ordered by `date desc`.
