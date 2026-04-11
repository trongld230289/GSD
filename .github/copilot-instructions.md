<!-- GSD Configuration — managed by get-shit-done installer -->
# Instructions for GSD

- Use the get-shit-done skill when the user asks for GSD or uses a `gsd-*` command.
- Treat `/gsd-...` or `gsd-...` as command invocations and load the matching file from `.github/skills/gsd-*`.
- When a command says to spawn a subagent, prefer a matching custom agent from `.github/agents`.
- Do not apply GSD workflows unless the user explicitly asks for them.
- After completing any `gsd-*` command (or any deliverable it triggers: feature, bug fix, tests, docs, etc.), ALWAYS: (1) offer the user the next step by prompting via `ask_user`; repeat this feedback loop until the user explicitly indicates they are done.

## Finance Tracker — Project Rules

### Phase Test Suite Gate
Before declaring any phase complete and moving to the next phase, ALWAYS:
1. Ask the user: "Have you completed smoke testing of all main features in Phase [X]? If yes, I'll create the manual test suite before we move on."
2. Wait for confirmation.
3. Once confirmed, create `.tests/phase-[N]-manual-tests.md` covering all requirements from that phase — group by feature area, include step-by-step test cases and a regression checklist.
4. Commit and push the test file.
5. Only then proceed to the next phase.

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
- SUMMARY is written **after all plans are executed** — captures actual outcome, not intended
- SUMMARY replaces UAT.md — user testing is tracked in `.tests/phase-N-manual-tests.md` instead
- If a file was missed in a previous session, create it retroactively before continuing
<!-- /GSD Configuration -->
