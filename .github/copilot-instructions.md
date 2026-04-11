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
<!-- /GSD Configuration -->
