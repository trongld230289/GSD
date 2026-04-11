<!-- GSD Configuration — managed by get-shit-done installer -->
# Instructions for GSD

- Use the get-shit-done skill when the user asks for GSD or uses a `gsd-*` command.
- Treat `/gsd-...` or `gsd-...` as command invocations and load the matching file from `.github/skills/gsd-*`.
- When a command says to spawn a subagent, prefer a matching custom agent from `.github/agents`.
- Do not apply GSD workflows unless the user explicitly asks for them.
- After completing any `gsd-*` command (or any deliverable it triggers: feature, bug fix, tests, docs, etc.), ALWAYS: (1) offer the user the next step by prompting via `ask_user`; repeat this feedback loop until the user explicitly indicates they are done.

## Finance Tracker — Project Rules

### Phase Test Suite Gate
**Immediately after pushing the last execution commit**, ALWAYS:
1. List the main features/flows to smoke test (so the user knows what to test).
2. Ask the user to smoke test on device and report any bugs.
3. Fix any reported bugs; repeat until the user confirms all clear.
4. Write `NN-SUMMARY.md` — now that outcome is verified, capture what was actually built including any fixes.
5. Ask: "Ready for me to create the manual test suite?"
6. Once confirmed, create `.tests/phase-[N]-manual-tests.md` covering all requirements from that phase — group by feature area, include step-by-step test cases and a regression checklist.
7. Commit and push the summary + test file.
8. Only then proceed to the next phase.

Test suite files live in `.tests/` and are named `phase-1-manual-tests.md`, `phase-2-manual-tests.md`, etc.

### Phase Folder Structure
Every phase folder under `.planning/phases/NN-phase-name/` MUST contain these files — never skip any:

```
NN-CONTEXT.md      ← decisions captured during Discuss step (before planning)
NN-RESEARCH.md     ← research findings (technology choices, API constraints, codebase analysis)
NN-PLAN-NN-name.md ← one file per execution plan (as many as needed)
NN-SUMMARY.md      ← written AFTER execution completes (what was built, files changed, deviations from plan)
```

Rules:
- CONTEXT + RESEARCH must be created **before** writing any PLAN files
- SUMMARY is written **after smoke testing is confirmed** (not just after execution) — captures actual outcome including any fixes made during smoke testing, not intended outcome
- SUMMARY replaces UAT.md — user testing is tracked in `.tests/phase-N-manual-tests.md` instead
- If a file was missed in a previous session, create it retroactively before continuing

### Client↔Backend API Contract Rule
Any phase that adds or modifies a GAS API action MUST follow this sequence — no exceptions:

1. **Before writing any client code**, update `.planning/gas-api-contract.md` with the exact wire format table for the new/changed action — list every field, its type, and an example value.
2. **Cross-check rule:** Every field the GAS handler reads via `params.X` must exist at the **top level** of the client POST body or GET params — never nest data under a sub-key (e.g. `{ data: { type, amount } }`) unless the GAS handler explicitly unwraps it.
3. The PLAN file for that action must reference the contract: "See `.planning/gas-api-contract.md` — action `X`".
4. After implementation, verify the contract file is up-to-date before closing the phase.

> **Why this rule exists:** In Phase 2, `apiAddTransaction` sent `{ action, token, data: tx }` while GAS read `params.type` directly — the nested `data` key meant all transaction fields were `undefined`, creating rows with only id + timestamp. The contract file makes the wire format explicit and prevents this class of bug.

### GAS Code Review Rule
Before writing or suggesting **any** new or modified GAS function:

1. **Read the full `Code.gs`** — check what patterns are already established: how the spreadsheet is accessed (`getActive()` vs `openById()`), how dates are read, how errors are returned.
2. **Never write GAS code in isolation** — every new function must be consistent with the existing ones.
3. **After writing a GAS function**, run through this checklist before finalizing:
   - [ ] All variables referenced are declared in the same scope
   - [ ] Spreadsheet access matches the pattern used by all other functions
   - [ ] Every date column read uses `Utilities.formatDate(new Date(row[N]), Session.getScriptTimeZone(), "yyyy-MM-dd")` — not `String(row[N])` or raw `row[N]`
   - [ ] No undefined constants (e.g. `SPREADSHEET_ID`) unless declared at the top of the file
4. **Ask the user to paste the relevant section of `Code.gs`** if you don't already have it — never guess at patterns.

> **Why this rule exists:** In Phase 2, three bugs were introduced in GAS functions written without reading the full file — `newRow` variable referenced before declaration, `SPREADSHEET_ID` used instead of `getActive()`, and `String(row[1]).slice(0,7)` used for date parsing (returns `"Fri Apr"` for Date objects, not `"2026-04"`). All three were avoidable by reading the existing code first.

### GAS Date Handling Rule
Google Sheets auto-converts date strings into internal Date objects. When GAS reads them back, the raw cell value serializes inconsistently (e.g. `"Fri Apr 09 2026 07:00:00 GMT+0700"`) causing wrong dates and broken grouping on the client.

**One rule — fix at the source in GAS:**

**In every GAS function that reads a date column**, always serialize using:
   ```javascript
   Utilities.formatDate(new Date(row[N]), Session.getScriptTimeZone(), "yyyy-MM-dd")
   ```
   Never return `row[N]` raw for any date field. Since you own both GAS and the client, fixing at the source is sufficient — no client-side normalization needed.

> **Why this rule exists:** Sheets stored the date as a Date object; GAS returned `"Fri Apr 09 2026 07:00:00 GMT+0700"`; the client used the raw string as a grouping key — two transactions on the same day landed in two groups → duplicate date headers. The timezone shift also caused April 10 to appear as April 9 in the sheet.
<!-- /GSD Configuration -->
