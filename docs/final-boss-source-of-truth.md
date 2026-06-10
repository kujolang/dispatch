# Kujo Eval Final-Boss Source Of Truth

Date: 2026-05-26
Repository: `kujo-eval`
Scope: Every unchecked checkbox in `docs/*checklist*.md`

## Objective

Create a single actionable list for the next session by reconciling all unchecked checklist items and removing stale noise.

## Audit Method

1. Enumerated every unchecked checkbox across checklist files.
2. Validated each candidate against current code/docs/tests.
3. Classified each candidate as one of:
   - `REAL_OPEN`: still requires implementation/work.
   - `RESOLVED_UNCHECKED`: implemented but never checked off.
   - `NON_ACTIONABLE`: placeholder/example text or intentionally archived/superseded checklist item.

## Inventory Summary

- Raw unchecked entries found: `39`
- Real open items: `1`
- Resolved-but-unchecked items: `35`
- Non-actionable placeholders/examples: `3`

## Real Open Items (Authoritative Backlog)

### FB-001 - Add demo recording asset to README

- Source: `docs/production-polish-checklist.md` (P1.1)
- Status: `REAL_OPEN`
- Why still open:
  - `demo.gif` is not present at repo root.
  - Existing checklist explicitly documents this as a manual blocker requiring external recording tooling.
- Required outcome:
  - Record a 20-30s terminal walkthrough and add `demo.gif` to repository root.
  - Ensure README references `![Demo](demo.gif)`.
- Suggested validation:
  - `test -f demo.gif`
  - Verify README image renders in GitHub preview.

## Resolved But Never Checked Off

These items were found unchecked in historical checklists but are already implemented in the current tree.

### Group R1 - Enterprise v5 unchecked items (8) are implemented

- Source: `docs/codex-next-session-enterprise-checklist-v5.md`
- Classification: `RESOLVED_UNCHECKED`
- Evidence highlights:
  - A1 envelope normalization present via `make_check_success`/`make_check_error` usage in `src/checks.ruff`.
  - A2 deterministic contract fixtures exist under `examples/fixtures/contracts/`.
  - B1 policy risk hints/risk tier implemented in `src/config.ruff` and surfaced in `main.ruff`.
  - B2 outbound host allow/deny policy implemented (`allowed_http_hosts`, `blocked_http_hosts`) in `src/config.ruff`, `src/checks.ruff`, schema, and security tests.
  - C1 fastpath coverage expanded to `file_line_count`, `file_matches_glob`, `file_matches_regex` in `src/eval_core.ruff` and stress tests.
  - C2 cache metrics emitted (`cache_metric_*`) in `src/eval_core.ruff` and reflected in `src/report.ruff` with benchmark assertions.
  - D1 root layout rationale present in README (`Repository Layout` section).
  - D2 enterprise quickstart artifact guidance present in README/QUICKREF/COMMAND_INVENTORY.

### Group R2 - Follow-up checklist (17) is superseded by later completed enterprise passes

- Source: `docs/codex-follow-up-checklist.md`
- Classification: `RESOLVED_UNCHECKED`
- Rationale:
  - Checklist remained as historical planning artifact while later enterprise checklists and implementation passes landed.
  - Current test matrix and docs parity are passing in this tree:
    - `kujo test` -> pass
    - `kujo test --runtime interpreter` -> pass
    - `scripts/verify_docs_command_parity.sh` -> pass

### Group R3 - Enhancement checklist residuals (6) are superseded/absorbed

- Source: `docs/codex-next-session-enhancement-checklist.md`
- Classification: `RESOLVED_UNCHECKED`
- Rationale:
  - Items are either implemented in later enterprise hardening work or superseded by newer checklist versions used for execution.

### Group R4 - Enterprise v2 residuals (3) are superseded by later docs

- Source: `docs/codex-next-session-enterprise-checklist-v2.md`
- Classification: `RESOLVED_UNCHECKED`
- Rationale:
  - Later checklist iterations and docs now contain the expected outcomes (fit matrix/flow/quickstart material).

### Group R5 - One unchecked entry is instructional text, not a task

- Source: `docs/blocked-items-checklist.md`
- Classification: `NON_ACTIONABLE`
- Rationale:
  - The unchecked marker appears inside example text explaining how to mark another checklist item.

## Non-Actionable Placeholders

- Source: `docs/codex-comprehensive-remediation-checklist.md`
- Entries:
  - `Risk 1`
  - `Risk 2`
  - `Risk 3`
- Classification: `NON_ACTIONABLE`
- Rationale:
  - These are blank risk-capture placeholders, not concrete implementation tasks.

## Next Session Working Contract

Use this file as the only actionable backlog source for unchecked-item cleanup.

1. Complete FB-001 (demo recording).
2. Update original checklist rows that are `RESOLVED_UNCHECKED` so historical docs no longer report false-open work.
3. Re-run parity checks after doc updates:
   - `./kujo test`
   - `./kujo test --runtime interpreter`
   - `scripts/verify_docs_command_parity.sh`