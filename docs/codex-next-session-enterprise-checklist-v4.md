# kujo-eval Next Session Enterprise Checklist (v4)

Date created: 2026-05-26
Context: Post-review hardening pass with command-policy normalization, stale artifact cleanup, and Linux+macOS CI matrix coverage.

Purpose:
- Identify the next highest-impact work to improve enterprise readiness, universal usefulness, performance, and product presentation.
- Keep the backlog implementation-ready with explicit validation expectations.

## Priority Legend

- P0: Critical security/correctness risk
- P1: High-value enterprise hardening
- P2: Scale/performance and broad utility
- P3: Product presentation and adoption polish

## Completed In This Session (Reference)

- Hardened command safety checks with case/whitespace normalization in `src/checks.kujo`
- Added security regression test for uppercase dangerous command bypass attempt
- Removed stale tracked `tests/*.out` files and enforced untracked artifact hygiene
- Expanded CI workflow coverage to Linux + macOS
- Added CI guard that fails when `tests/*.out` artifacts are tracked
- Updated README/CHANGELOG to reflect current behavior and repository hygiene

## Phase A: Security And Governance

### [x] A1 - Add optional strict command mode that requires allowlist/profile in CI/release stages (P0)
Why:
- Enterprise gates should fail closed when no explicit command policy is provided.
Work:
- Add config option (for example `require_command_policy`) and enforce in stage overlays.
- Ensure default local experience stays backwards-compatible.
Files likely affected:
- `src/config.kujo`
- `src/eval_core.kujo`
- `schema/eval-suite.schema.json`
- `tests/security_tests.kujo`
Verification:
- Tests show CI/release stage fails when command checks run without an effective command policy.

### [x] A2 - Add path allowlist policy profiles for stage overlays with deny-by-default release profile (P1)
Why:
- Path control should be strict in release gates and explicit across teams.
Work:
- Expand profile defaults and overlays for path policy presets.
- Document recommended path profile usage.
Files likely affected:
- `src/config.kujo`
- `docs/SECURITY.md`
- `tests/security_tests.kujo`
Verification:
- Stage overlay tests validate local/ci/release behavior and precedence.

### [x] A3 - Add optional redaction policy extensions for organization-specific secrets (P1)
Why:
- Enterprises need custom secret patterns beyond built-ins.
Work:
- Support config-driven redaction pattern additions.
- Keep default behavior deterministic and safe.
Files likely affected:
- `src/checks.kujo`
- `schema/eval-suite.schema.json`
- `tests/security_tests.kujo`
Verification:
- Tests confirm custom patterns redact output while preserving command result semantics.

## Phase B: Performance And Scale

### [x] B1 - Improve parallel scheduling heuristics for mixed check types (P1)
Why:
Current parallel mode should prioritize independent, high-latency checks for better throughput.
Work:
- Add deterministic grouping/ordering heuristics with explicit guardrails.
Files likely affected:
- `src/eval_core.kujo`
- `tests/stress_tests.kujo`
- `tests/benchmark_tests.kujo`
Verification:
- Benchmark and stress suites show improved wall-clock performance with identical pass/fail outcomes.

### [x] B2 - Add benchmark trend gate for regression slope across recent runs (P2)
Why:
Single-run budgets can miss gradual regressions.
Work:
- Persist simple trend data and fail when regression slope exceeds threshold.
Files likely affected:
- `scripts/release_quality_gates.sh`
- `eval_results/benchmarks.json` (artifact shape)
- `docs/release-candidate-runbook.md`
Verification:
- Simulated regression trend causes gate failure; stable trend passes.

### [x] B3 - Add report generation incremental mode for unchanged sections (P2)
Why:
Large suites should avoid re-rendering full reports when only small deltas change.
Work:
- Add content-aware section caching for report backends.
Files likely affected:
- `src/report.kujo`
- `main.kujo`
- `tests/cli_integration_tests.kujo`
Verification:
- Repeated report runs with minor deltas show reduced render time and unchanged output correctness.

## Phase C: Functionality And Universal Utility

### [x] C1 - Add policy explain command to debug effective command/path/env controls (P1)
Why:
- Users need transparent policy introspection for enterprise onboarding.
Work:
- Add CLI command (for example `policy-explain`) to print effective merged policy by stage.
Files likely affected:
- `main.kujo`
- `src/config.kujo`
- `src/cli.kujo`
- `tests/cli_integration_tests.kujo`
Verification:
- CLI tests validate deterministic output for each stage overlay.

### [x] C2 - Add schema-driven suite lint diagnostics with actionable fix hints (P2)
Why:
- Better lint diagnostics improve adoption and reduce support burden.
Work:
- Expand `lint` output to include structured error code + suggested fix text.
Files likely affected:
- `src/config.kujo`
- `main.kujo`
- `tests/coverage_tests.kujo`
Verification:
- Invalid suite fixtures produce stable, actionable diagnostic payloads.

### [x] C3 - Add richer JSON path checks for arrays and nested type assertions (P2)
Why:
- Enterprise API contract gating often needs deeper shape/value coverage.
Work:
- Extend JSON path checks to cover array indices and type assertions.
Files likely affected:
- `src/checks.kujo`
- `src/config.kujo`
- `tests/coverage_tests.kujo`
Verification:
- New fixtures validate pass/fail behavior for nested arrays and mixed object paths.

## Phase D: Presentation And Adoption

### [x] D1 - Create enterprise quickstart matrix with copy/paste profiles by risk tier (P3)
Why:
- Better onboarding funnels users into Kujo language adoption.
Work:
- Add profile-specific quickstarts (local dev, ci strict, release gate) with minimal edits needed.
Files likely affected:
- `README.md`
- `docs/QUICKREF.md`
- `docs/COOKBOOK.md`
Verification:
- All quickstart commands are parity-script validated.

### [x] D2 - Add generated command inventory doc and parity gate (P3)
Why:
- Command docs should stay synchronized with CLI help output.
Work:
- Generate command inventory from help output and validate freshness in CI.
Files likely affected:
- `scripts/verify_docs_command_parity.sh`
- `docs/API_REFERENCE.md`
- new generator script under `scripts/`
Verification:
- CI fails when command inventory is stale.

## Suggested Next Session Order

1. A1
2. A2
3. B1
4. C1
5. C3
6. D1

## Next Session Definition Of Done

- Selected checklist items implemented with tests.
- `./kujo test` passes.
- `./kujo test --runtime interpreter` passes.
- `scripts/release_quality_gates.sh` passes.
- `scripts/supply_chain_policy_check.sh` passes.
- `scripts/verify_docs_command_parity.sh` passes.
