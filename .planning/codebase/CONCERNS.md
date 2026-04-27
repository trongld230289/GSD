# Concerns

**Analysis Date:** 2026-04-19

## Tech Debt

**Hardcoded GAS URL:**
- Location: `finance-tracker/src/api/gas.ts:11`
- Issue: GAS deployment URL is hardcoded — changing the backend requires a code change and redeploy
- Severity: Low (only one URL, but no env-var support in this Vite setup yet)

**Hardcoded Google Client ID:**
- Location: Referenced in `LoginPage.tsx` GSI script tag
- Issue: Client ID is embedded in source; should be an env variable
- Severity: Low (not a secret, but environment coupling)

**JWT Decoded Client-Side Without Validation:**
- Location: `LoginPage.tsx` credential handler
- Issue: Google ID token is decoded/trusted client-side; server (GAS) must re-verify — confirm GAS does this
- Severity: Medium if GAS skips verification

## Known Bugs

**Incomplete Transaction Reconstruction on Update:**
- Location: `finance-tracker/src/api/gas.ts:81`
- Issue: `apiUpdateTransaction` returns `tx as unknown as Transaction` — missing `created_at`, `user_email` fields that exist on the real record; could cause display issues if those fields are rendered
- Severity: Low (fields not currently displayed but fragile pattern)

**Add Response Missing Full Transaction:**
- Location: `finance-tracker/src/api/gas.ts:67`
- Issue: GAS returns `{id, success}` only; reconstructed Transaction uses empty string for `user_email` and `new Date()` for `created_at` which may drift from server timestamp
- Severity: Low

## Security

**No Token Refresh:**
- Google ID tokens expire in ~1 hour; app has no refresh mechanism
- Users will silently get 401-equivalent errors from GAS after token expiry
- Severity: Medium (bad UX, transactions may fail silently)

**No CSRF Protection:**
- GAS Web App is publicly accessible via GET; relies solely on token validation
- Severity: Low (GAS GET endpoints return user-scoped data only with valid token)

**Unvalidated Category IDs:**
- `category_id` sent to GAS is whatever the client supplies — GAS should validate against known categories
- Severity: Low (self-hosted, single user)

**`window.google` Global:**
- GSI injects `window.google` globally; tightly coupled to Google script loading order
- Severity: Low

## Performance

**No Pagination:**
- `apiGetTransactions` fetches all transactions for a month at once; could be slow with many entries
- Severity: Low (monthly scope limits volume)

**Naive Cache Invalidation:**
- On any add/update/delete, only the current month's cache is invalidated via `invalidateCache(month)`; if a transaction is added for a past month, the cache for that past month is stale
- Location: `finance-tracker/src/store/useStore.ts`
- Severity: Low (edit flow passes current month, but edge case exists)

**No API Debouncing:**
- Month navigation fires API calls on every tap without debounce
- Severity: Low (cache mitigates most cases)

**Chart Data Fetching in ReportsPage:**
- `ReportsPage` fetches 6 months of totals on mount; no loading state shown per-month
- Severity: Low

## Fragile Areas

**Drawer State Complexity:**
- `AddTransactionDrawer` manages form state + edit vs. add mode via `editingTransaction` in the global store; clearing state on close could have race conditions
- Location: `finance-tracker/src/components/AddTransactionDrawer.tsx`
- Severity: Medium

**Category Data Mismatch:**
- Categories are loaded from two places: `apiGetCategories()` (from GAS/Sheets) and `finance-tracker/src/data/categories.ts` (hardcoded)
- If Sheets data diverges from hardcoded data, UI inconsistencies arise
- Severity: Medium — needs a single source of truth decision

**GAS Cold Start Latency:**
- GAS Web Apps have cold start delays (~2–5s) after inactivity; no loading state specifically for this
- Severity: Low (UX degradation, not a bug)

**ReportsPage Data Sync:**
- Reports page fetches monthly totals independently of transaction cache; totals could be stale relative to recent edits if user navigates between pages
- Severity: Low

## Scaling Limits

**GAS Concurrency Caps:**
- Google Apps Script has execution quotas (6 min/execution, concurrent execution limits); not a concern for single-user but relevant if multi-user
- Severity: Low (single-user app)

**Unbounded Zustand txCache:**
- `txCache` grows indefinitely as user browses months; no eviction policy
- Severity: Low (bounded by session length)

**Hardcoded Category Coupling:**
- Adding new categories requires updating both `finance-tracker/src/data/categories.ts` AND the Google Sheet's Categories tab
- Severity: Medium (operational friction)

## Test Coverage Gaps

**Zero Automated Tests:**
- No unit tests, component tests, integration tests, or E2E tests configured
- Only manual test checklists in `.tests/`
- Severity: Medium — all verification is manual, regressions are likely as features grow

**No API Contract Tests:**
- GAS API shape is assumed but never validated; breaking changes to GAS responses would surface only at runtime
- Severity: Medium

**Missing Test Framework:**
- `package.json` has no test script or test dependencies configured
- Severity: Medium (needs setup before any automated testing can happen)

---

*Concerns analysis: 2026-04-19*
*Update as issues are resolved or discovered*
