# kujo-eval Codex Follow-Up Checklist

Date created: 2026-05-24
Source review: docs/codex-production-readiness-review.md

## How to Use This Checklist

Work from top to bottom.
Do not skip ahead unless an item is blocked.
Each item must include tests and validation evidence before being marked complete.

## Tier 1: Release Blockers

### [ ] 1.1 Fix interpreter-mode module import/export breakage

Problem:
- Interpreter execution fails with missing symbols (`dict_get_or`/`normalize_string`) when loading `src/eval_core.kujo`.

Fix:
- Correct import paths so utility symbols are imported from `src/common` (or exported consistently where intended).
- Verify no runtime-only unresolved imports remain across modules.

Verification:
- `./kujo run main.kujo --interpreter version`
- `./kujo run main.kujo --interpreter list-checks`
- `./kujo run main.kujo --interpreter run examples/basic_suite.json --json`
- Expected result: all commands exit 0 without `KUJORUN001` runtime symbol errors.

Files likely affected:
- `src/eval_core.kujo`
- `src/config.kujo`
- `src/common.kujo`
- `main.kujo`

### [ ] 1.2 Eliminate test-validity contradiction between `kujo test` and `test-run`

Problem:
- `kujo test` passes while `test-run tests/contract_tests.kujo -v` fails 136/136.

Fix:
- Align test execution expectations with real runtime behavior.
- Ensure contract tests pass in the same mode users execute CLI workflows.

Verification:
- `./kujo test`
- `./kujo test-run tests/contract_tests.kujo -v`
- Expected result: both pass with no setup/runtime symbol failures.

Files likely affected:
- `tests/contract_tests.kujo`
- `src/eval_core.kujo`
- `main.kujo`
- `.github/workflows/ci.yml`

### [ ] 1.3 Repair CI runtime pinning and CLI smoke reliability

Problem:
- CI uses literal `$(cat RUNTIME_VERSION)` in env and relies on interpreter CLI smoke paths currently failing.

Fix:
- Load runtime ref correctly in workflow shell step.
- Keep smoke commands strict (no masking fatal failures).

Verification:
- Re-run CI workflows in GitHub Actions:
  - `.github/workflows/ci.yml`
  - `.github/workflows/compatibility-matrix.yml`
- Expected result: workflows complete green, including contract and CLI smoke stages.

Files likely affected:
- `.github/workflows/ci.yml`
- `.github/workflows/compatibility-matrix.yml`
- `RUNTIME_VERSION`

### [ ] 1.4 Bring README to verified truth state

Problem:
- README contains materially misleading state/claim drift versus observed runtime behavior.

Fix:
- Update counts/claims/command examples to only reflect validated behavior.
- Add known limitations and runtime prerequisite clarity.

Verification:
- Execute all README Quick Start and command-reference commands in clean checkout.
- Expected result: no command in README fails unexpectedly.

Files likely affected:
- `README.md`
- `docs/eval-suite-reference.md`

## Tier 2: Security Hardening

### [ ] 2.1 Wire `allowed_commands`, `allowed_paths`, and related policy fields end-to-end

Problem:
- Schema/docs imply configurable allowlists, but check execution paths do not consistently consume those fields.

Fix:
- Thread allowlist config into all relevant checks and shell/path access points.
- Add explicit deny behavior and error messages.

Verification:
- Add tests with allowed/disallowed command/path scenarios.
- Run:
  - `./kujo test-run tests/security_tests.kujo -v`
- Expected result: policy fields are enforced exactly as documented.

Files likely affected:
- `src/config.kujo`
- `src/eval_core.kujo`
- `src/checks.kujo`
- `tests/security_tests.kujo`
- `schema/eval-suite.schema.json`

### [ ] 2.2 Fix undefined-variable path logic in file content checks

Problem:
- `check_file_contains` / `check_file_does_not_contain` reference `check_type` local that is not defined.

Fix:
- Remove undefined references and implement explicit path-missing branches.
- Add regression tests for missing-file behavior in both checks.

Verification:
- `./kujo test-run tests/contract_tests.kujo -v`
- Expected result: missing-file branches behave deterministically and tests pass.

Files likely affected:
- `src/checks.kujo`
- `tests/contract_tests.kujo`

## Tier 3: Test Coverage and Regression Safety

### [ ] 3.1 Add interpreter-mode CLI command matrix tests

Problem:
- Existing suite breadth did not catch interpreter-mode command breakage.

Fix:
- Add dedicated tests for each public CLI subcommand under interpreter mode.

Verification:
- Run command matrix test suite plus existing suites.
- Expected result: every documented subcommand has a passing test.

Files likely affected:
- `tests/cli_integration_tests.kujo`
- `tests/coverage_tests.kujo`
- `main.kujo`

### [ ] 3.2 Add docs-command parity test gate

Problem:
- README command examples drifted away from true behavior.

Fix:
- Introduce a maintained set of executable doc command checks.
- Fail CI when command examples no longer work.

Verification:
- CI gate executes docs command set.
- Expected result: docs and runtime stay synchronized.

Files likely affected:
- `README.md`
- `.github/workflows/ci.yml`
- `scripts/release_quality_gates.sh`
- `tests/` (new docs-parity suite)

## Tier 4: Architecture and Maintainability

### [ ] 4.1 Enforce module-boundary import rules

Problem:
- Cross-module utility import confusion caused runtime breakage.

Fix:
- Define allowed import boundaries and add static check/lint rule for symbol ownership.

Verification:
- Add boundary validation command in CI.
- Expected result: no module imports common utility symbols from non-owner modules.

Files likely affected:
- `src/*.kujo`
- `scripts/release_quality_gates.sh`
- `.github/workflows/ci.yml`

### [ ] 4.2 Synchronize `describe_module()` metadata with actual command/report surface

Problem:
- Metadata in `main.kujo` drifts from implemented commands/report formats.

Fix:
- Generate metadata from single source of truth or add parity tests.

Verification:
- Add tests asserting describe metadata contains all current commands/formats.
- Expected result: metadata and implementation remain consistent.

Files likely affected:
- `main.kujo`
- `src/report.kujo`
- `tests/coverage_tests.kujo`

## Tier 5: Performance and Scalability

### [ ] 5.1 Replace busy-wait polling in `watch` command

Problem:
- `watch` uses manual busy loop (`time()` polling), which is inefficient.

Fix:
- Implement less CPU-intensive wait strategy supported by runtime.
- If runtime lacks sleep primitives, document and bound polling impact clearly.

Verification:
- Run `watch` with sampling and confirm lower idle CPU behavior.
- Expected result: stable watch behavior without tight busy loop.

Files likely affected:
- `main.kujo`
- `docs/ARCHITECTURE.md`

## Tier 6: Functionality and Product Completeness

### [ ] 6.1 Validate all public CLI workflows end-to-end in clean checkout

Problem:
- Core product workflows are currently not reliable despite broad feature set.

Fix:
- Create clean-checkout smoke script covering init/run/report/compare/list-checks/snapshots/version/watch/lint/diff/export/completion.

Verification:
- Execute smoke script locally and in CI.
- Expected result: script fully passes with deterministic outputs and expected exit codes.

Files likely affected:
- `scripts/` (new smoke script)
- `.github/workflows/ci.yml`
- `README.md`

## Tier 7: Documentation and Presentation

### [ ] 7.1 Clarify runtime prerequisites and binary selection

Problem:
- `kujo` name collision (Python linter vs Kujo runtime) causes command confusion.

Fix:
- Add explicit prerequisite and binary path guidance, with copy-paste verification command.

Verification:
- Fresh machine setup follows docs without ambiguity.
- Expected result: users can immediately run correct runtime commands.

Files likely affected:
- `README.md`
- `docs/TUTORIAL.md`
- `docs/QUICKREF.md`

### [ ] 7.2 Normalize count claims and auto-generate status badges

Problem:
- Manual claim counts in docs drift quickly.

Fix:
- Generate check/command/test counts from source in CI and update badges/reference table automatically.

Verification:
- CI job validates claim counts against computed values.
- Expected result: count claims never stale.

Files likely affected:
- `README.md`
- `scripts/` (count generator)
- `.github/workflows/ci.yml`

## Tier 8: Enterprise Readiness and Release Engineering

### [ ] 8.1 Add top-level `LICENSE` and legal metadata parity checks

Problem:
- License claims/badges exist without top-level license artifact.

Fix:
- Add `LICENSE` file and verify parity with package metadata.

Verification:
- `ls LICENSE` succeeds.
- CI check confirms license file existence.

Files likely affected:
- `LICENSE`
- `kennel.toml`
- `.github/workflows/ci.yml`

### [ ] 8.2 Resolve `.out` artifact policy drift

Problem:
- Repository tracks `.out` files while policy script rejects tracked `.out`.

Fix:
- Choose one policy and enforce consistently in git tracking, ignore rules, and policy scripts.

Verification:
- `bash scripts/supply_chain_policy_check.sh`
- Expected result: all policy checks pass.

Files likely affected:
- `.gitignore`
- `scripts/supply_chain_policy_check.sh`
- `tests/` tracked artifact set

### [ ] 8.3 Make release gates mandatory and green

Problem:
- Current release gate script fails and does not provide reliable release confidence.

Fix:
- Repair gate assumptions and wire gate execution into CI before release/tag.

Verification:
- `bash scripts/release_quality_gates.sh`
- Expected result: all gates pass cleanly on main branch.

Files likely affected:
- `scripts/release_quality_gates.sh`
- `.github/workflows/ci.yml`

## Completion Tracking

| Tier | Total | Completed |
|---|---:|---:|
| Tier 1 | 4 | 0 |
| Tier 2 | 2 | 0 |
| Tier 3 | 2 | 0 |
| Tier 4 | 2 | 0 |
| Tier 5 | 1 | 0 |
| Tier 6 | 1 | 0 |
| Tier 7 | 2 | 0 |
| Tier 8 | 3 | 0 |
