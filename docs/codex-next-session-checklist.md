# Kujo Eval Codex Next Session Checklist

Date created: 2026-05-26
Source review: production-hardening pass after VM-first migration

## How to Use This Checklist

Work top to bottom.
Do not mark an item complete without validation evidence.
Each completed item should include exact command output evidence in the PR notes.

## Tier 1: Production Reliability

### [x] 1.1 Add canonical smoke script for all public CLI commands

Problem:
- CLI command examples are validated across multiple scripts, but there is no single canonical smoke command matrix for local and CI use.

Fix:
- Add one script under scripts/ that executes init/run/report/compare/list-checks/snapshots/version/lint/diff/export/verify-manifest.
- Keep all commands VM-first; add optional interpreter parity mode flag.

Verification:
- `scripts/cli_smoke_matrix.sh`
- Expected result: exits 0 in VM-first mode; optional interpreter parity mode emits clear pass/fail summary.

Completion notes (2026-05-26):
- Added `scripts/cli_smoke_matrix.sh` covering init/run/report/compare/list-checks/snapshots/version/watch/lint/diff/export/verify-manifest/completion in VM-first mode.
- Added optional interpreter parity mode via `--include-interpreter` and `KUJO_EVAL_CLI_SMOKE_INCLUDE_INTERPRETER=1`.
- Wired into CI (`.github/workflows/ci.yml`) and release gates (`scripts/release_quality_gates.sh`).

Files likely affected:
- `scripts/cli_smoke_matrix.sh`
- `.github/workflows/ci.yml`
- `README.md`

### [x] 1.2 Add deterministic artifact contract check in CI

Problem:
- Artifact contract (summary + manifest + channel paths) is validated in tests, but not as an isolated CI guard that fails early on packaging drift.

Fix:
- Add a lightweight script that runs one suite and validates artifact presence plus JSON shape fields.

Verification:
- `scripts/verify_artifact_contract.sh`
- Expected result: exits 0 and prints validated keys/paths.

Completion notes (2026-05-26):
- Added `scripts/verify_artifact_contract.sh` to run a checksum-enabled suite, verify summary/manifest/channel payload keys, and assert channel path pointers exist.
- Added explicit `verify-manifest` contract check in the same script.
- Wired into CI (`.github/workflows/ci.yml`) as a dedicated step before the CLI smoke matrix.

Files likely affected:
- `scripts/verify_artifact_contract.sh`
- `.github/workflows/ci.yml`

## Tier 2: Security Hardening

### [x] 2.1 Add explicit symlink-escape regression tests for path policy

Problem:
- Path policy already enforces allowed roots, but symlink traversal protections should be locked in with dedicated regression coverage.

Fix:
- Add tests that create symlinked paths attempting to escape allowed roots and assert rejection.

Verification:
- `kujo test-run tests/security_tests.ruff -v`
- Expected result: symlink-escape attempts are rejected with stable policy errors.

Completion notes (2026-05-26):
- Added policy enforcement in `src/checks.ruff` to reject candidate paths that resolve through symbolic-link segments when `allowed_paths` is active.
- Added regressions in `tests/security_tests.ruff` for both `check_file_exists` and `check_file_contains` symlink-escape attempts.
- Verified with `kujo test` and full release gates (`scripts/release_quality_gates.sh`).

Files likely affected:
- `tests/security_tests.ruff`
- `src/checks.ruff`

### [x] 2.2 Add redaction-policy regression for nested structured outputs

Problem:
- Redaction behavior exists, but nested object/array payloads should have explicit regression tests to prevent accidental secret leaks.

Fix:
- Add tests for deeply nested fields matching `redact_output_patterns` and ensure emitted artifacts are redacted consistently.

Verification:
- `kujo test-run tests/security_tests.ruff -v`
- Expected result: no raw secret token appears in result payload or persisted artifacts.

Completion notes (2026-05-26):
- Expanded `redact_sensitive_with_audit` in `src/checks.ruff` to detect JSON-style nested secrets (for example `"token":`, `"access_token":`, `"password":`, `"secret":`, `"api_key":`) with case-insensitive matching.
- Added security regression in `tests/security_tests.ruff` for nested JSON token/api_key masking and redaction audit metadata.
- Added artifact persistence regression in `tests/cli_integration_tests.ruff` to assert `last_run.json` never stores raw nested secret values.
- Verified with `kujo test` and full release gates (`scripts/release_quality_gates.sh`).

Files likely affected:
- `tests/security_tests.ruff`
- `src/checks.ruff`
- `src/eval_core.ruff`

## Tier 3: Performance and Scale

### [x] 3.1 Add benchmark budget gates for medium and large suites

Problem:
- Benchmarks are emitted, but there is no configurable pass/fail budget gate for medium/large suite durations.

Fix:
- Add threshold fields for benchmark suite duration budgets and fail when exceeded.

Verification:
- `kujo test-run tests/benchmark_tests.ruff -v`
- `scripts/release_quality_gates.sh`
- Expected result: benchmark budget failures are explicit and actionable.

Completion notes (2026-05-26):
- Added medium and large fixture runtime benchmarks in `tests/benchmark_tests.ruff` (`medium_fixture_suite_x1`, `large_fixture_suite_x1`).
- Added configurable benchmark budget gates in `scripts/release_quality_gates.sh`:
	- `KUJO_EVAL_BENCH_SUITE_BUDGET_MS`
	- `KUJO_EVAL_BENCH_MEDIUM_SUITE_BUDGET_MS`
	- `KUJO_EVAL_BENCH_LARGE_SUITE_BUDGET_MS`
- Gate now fails with explicit budget messages when suite, medium fixture, or large fixture durations exceed configured thresholds.

Files likely affected:
- `tests/benchmark_tests.ruff`
- `scripts/release_quality_gates.sh`
- `README.md`

### [x] 3.2 Add fixture-heavy run to catch I/O regression drift

Problem:
- Most suites are lightweight; heavy file-list and artifact workloads need repeatable regression coverage.

Fix:
- Introduce a larger fixture suite that stresses file checks, manifest generation, and report rendering.

Verification:
- `kujo run main.ruff run examples/io_heavy_regression_suite.json --output-dir .eval_perf_probe --json`
- `kujo test`
- Expected result: no regression in pass/fail behavior and bounded runtime increase.

Completion notes (2026-05-26):
- Added `examples/io_heavy_regression_suite.json` with fixture-heavy file, directory, JSON-shape, and command checks to increase I/O and artifact pressure while remaining deterministic.
- Added benchmark regression coverage in `tests/benchmark_tests.ruff` (`io_heavy_fixture_suite_x1`).
- Extended release gates in `scripts/release_quality_gates.sh` with `KUJO_EVAL_BENCH_IO_HEAVY_SUITE_BUDGET_MS` and explicit pass/fail output for I/O-heavy suite duration.
- Documented probe workflow in `docs/ARCHITECTURE.md` and benchmark budget env var in `README.md`.

Files likely affected:
- `tests/benchmark_tests.ruff`
- `examples/`
- `docs/ARCHITECTURE.md`

## Tier 4: Product Completeness

### [x] 4.1 Add policy profile examples for strict-enterprise and sandbox-adjacent patterns

Problem:
- Existing examples are strong, but strict enterprise onboarding still needs clearer copy-paste policy presets.

Fix:
- Add new examples showing minimum-privilege `allowed_commands`, `allowed_paths`, `allowed_env_vars`, and redaction defaults.

Verification:
- `kujo run main.ruff run examples/strict_enterprise_policy_gate.json --output-dir .eval_enterprise_strict --json`
- `kujo run main.ruff run examples/sandbox_adjacent_policy_gate.json --output-dir .eval_sandbox_adjacent --json`
- Expected result: examples execute and demonstrate locked-down policy defaults.

Completion notes (2026-05-26):
- Added `examples/strict_enterprise_policy_gate.json` for minimum-privilege enterprise defaults with explicit `allowed_commands`, `allowed_command_patterns`, `allowed_paths`, `allowed_env_vars`, and `redaction_audit_mode`.
- Added `examples/sandbox_adjacent_policy_gate.json` for constrained fixture-only local boundaries with explicit allowlists and blocked argument patterns.
- Updated `README.md` and `docs/COOKBOOK.md` quickstart bundles to include both new policy examples.
- Extended `scripts/verify_docs_command_parity.sh` to execute and verify both new quickstart commands (`strict` and `sandbox-adjacent`) as part of docs parity automation.

Files likely affected:
- `examples/`
- `README.md`
- `docs/COOKBOOK.md`

### [x] 4.2 Add migration note for legacy interpreter-era guidance

Problem:
- Historical docs still contain interpreter-era references that may confuse new users.

Fix:
- Add a dedicated migration section documenting VM-first commands and when interpreter mode is still useful.

Verification:
- `scripts/verify_docs_command_parity.sh`
- Expected result: docs remain executable and internally consistent.

Completion notes (2026-05-26):
- Added dedicated VM-first migration guidance in `README.md` explaining how to translate legacy interpreter-era invocations.
- Added contributor-facing migration notes in `docs/agent-notes.md` with explicit preferred and optional parity command forms.
- Added runtime mode migration section in `docs/eval-suite-reference.md` so command reference remains consistent and executable.
- Verified via `scripts/verify_docs_command_parity.sh` (including strict/sandbox quickstart commands).

Files likely affected:
- `README.md`
- `docs/agent-notes.md`
- `docs/eval-suite-reference.md`

## Tier 5: Release Discipline

### [x] 5.1 Add changelog automation check for user-visible behavior changes

Problem:
- Behavioral changes can land without a changelog note, reducing release clarity.

Fix:
- Add a release gate check requiring a CHANGELOG.md entry for user-visible functionality, security, or CLI behavior changes.

Verification:
- `scripts/release_quality_gates.sh`
- Expected result: gate fails when a behavior-changing PR lacks changelog coverage.

Completion notes (2026-05-26):
- Added Gate 13 in `scripts/release_quality_gates.sh` to enforce changelog coverage for behavior-affecting file changes.
- Gate computes diff scope from `KUJO_EVAL_CHANGELOG_BASE_REF` (default `origin/main`) with local fallback (`HEAD~1...HEAD`) and also checks staged/unstaged worktree deltas.
- Gate classifies behavior changes across `main.ruff`, `kennel.toml`, and files under `src/`, `scripts/`, `examples/`, `schema/`, and `tests/`; if any are present without `CHANGELOG.md`, release gating fails.
- Added an `Unreleased` section in `CHANGELOG.md` covering recent feature/tweak/docs changes.
- Updated `docs/CONTRIBUTING.md` with changelog gate expectations and base-ref override guidance.

Files likely affected:
- `scripts/release_quality_gates.sh`
- `CHANGELOG.md`
- `docs/CONTRIBUTING.md`

### [x] 5.2 Add release candidate checklist runbook

Problem:
- Quality gates exist, but there is no concise release-candidate runbook for humans.

Fix:
- Add a single runbook doc with exact pre-tag command sequence and expected artifacts.

Verification:
- Follow runbook commands in a clean clone.
- Expected result: all commands succeed without undocumented steps.

Completion notes (2026-05-26):
- Added `docs/release-candidate-runbook.md` with explicit runtime setup, validation command sequence, expected outputs, and release evidence checklist.
- Updated `README.md` repository layout section to reference the runbook.
- Updated `scripts/release_quality_gates.sh` docs freshness gate to require runbook presence.

Files likely affected:
- `docs/release-candidate-runbook.md`
- `README.md`
