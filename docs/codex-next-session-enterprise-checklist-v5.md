# kujo-eval Next Session Enterprise Checklist (v5)

Date created: 2026-05-26
Context: Post-v4 completion review + hardening pass for command guardrails, mixed prefetch expansion, timeout override wiring, and docs alignment.

Purpose:
- Capture the next highest-value work items to move kujo-eval from production-ready to flagship-quality for broad enterprise adoption.
- Keep every item implementation-ready with measurable validation expectations.

## Priority Legend

- P0: Critical trust/safety/correctness risk
- P1: High-value enterprise hardening and adoption
- P2: Scale/performance/operability improvements
- P3: Product presentation and ecosystem growth polish

## Completed In This Session (Reference)

- Added command length guardrail in shell execution (`MAX_COMMAND_LENGTH`) to reject oversized command payloads.
- Expanded mixed prefetch cache usage to additional file-backed checks.
- Added cached-content support in checks (`file_matches_glob`, `file_matches_regex`, `file_line_count`, `json_matches_shape`, `json_value_equals`).
- Implemented per-test `timeout_seconds` override behavior in `run_suite`.
- Updated docs for modern path policy fields and timeout semantics.
- Added regression tests for cached content + command length guardrail + timeout override.

## Phase A: Correctness And Contract Integrity

### [ ] A1 - Normalize all check handlers to the standard result envelope (P0)
Why:
- Some checks still use legacy return shape (`ok/check/message/details`) instead of `{ok,error,data}` and can weaken downstream consistency.
Work:
- Refactor remaining legacy handlers to use `make_check_success` / `make_check_error`.
- Verify `run_suite`, report generation, and CLI JSON output maintain stable fields.
Files likely affected:
- `src/checks.ruff`
- `tests/coverage_tests.ruff`
- `tests/contract_tests.ruff`
Verification:
- Contract suite asserts envelope parity for all check handlers.
- No empty per-test messages/details in run artifacts for converted checks.

### [ ] A2 - Add deterministic contract fixtures for machine consumers (P1)
Why:
- Enterprise integrations need frozen example payloads for parser validation.
Work:
- Add fixture snapshots for `summary.json`, `cli-summary.json`, `artifact-manifest.json`, and `policy-explain` output.
- Validate fixtures in CI against generated artifacts.
Files likely affected:
- `scripts/verify_artifact_contract.sh`
- `tests/cli_integration_tests.ruff`
- `docs/API_REFERENCE.md`
- new fixtures under `examples/fixtures/`
Verification:
- Contract check fails if artifact shape drifts.

## Phase B: Security And Governance

### [ ] B1 - Add policy explain risk scoring hints (P1)
Why:
- Users need immediate understanding of policy strictness during onboarding.
Work:
- Extend `policy-explain` output with deterministic risk-tier hints based on effective policy.
- Include explicit warnings for open command/path posture in `ci` and `release` stages.
Files likely affected:
- `src/config.ruff`
- `main.ruff`
- `tests/cli_integration_tests.ruff`
Verification:
- CLI tests confirm stable warning/hint payloads for permissive and strict configs.

### [ ] B2 - Add optional denylist for outbound HTTP checks (P1)
Why:
- Universal enterprise deployments often require network egress constraints.
Work:
- Add optional `blocked_http_hosts` / `allowed_http_hosts` policy controls for `http_status` and `http_body_contains`.
- Enforce in check layer and document default behavior.
Files likely affected:
- `src/checks.ruff`
- `src/config.ruff`
- `schema/eval-suite.schema.json`
- `tests/security_tests.ruff`
Verification:
- Security tests cover allowed host, blocked host, and mixed policy precedence.

## Phase C: Performance And Scale

### [ ] C1 - Extend parallel fastpath beyond 4 file checks (P1)
Why:
- Current fastpath leaves throughput on the table for read-only file assertions.
Work:
- Expand fastpath support to deterministic file-backed checks (`file_line_count`, `file_matches_glob`, `file_matches_regex`) where safe.
- Preserve deterministic result order and policy semantics.
Files likely affected:
- `src/eval_core.ruff`
- `tests/stress_tests.ruff`
- `tests/benchmark_tests.ruff`
Verification:
- Benchmark suite shows wall-clock improvement on mixed file-only workloads without outcome changes.

### [ ] C2 - Add lightweight in-run file-content dedupe metrics (P2)
Why:
- Teams need observability proving prefetch/caching gains.
Work:
- Emit deterministic counters for cache hit/miss and bytes reused in run results + report summary.
Files likely affected:
- `src/eval_core.ruff`
- `src/report.ruff`
- `tests/benchmark_tests.ruff`
Verification:
- Tests assert cache metrics presence and monotonic behavior on repeated paths.

## Phase D: Product Presentation And Adoption

### [ ] D1 - Root-layout rationalization pass (P2)
Why:
- New users should clearly understand why some files stay at root while implementation lives in `src/`.
Work:
- Audit root files and remove/archive non-essential legacy docs/scripts.
- Add a concise root layout rationale section to README (entrypoint vs module ownership).
Files likely affected:
- `README.md`
- `docs/ARCHITECTURE.md`
- possibly legacy docs under `docs/`
Verification:
- No orphaned/dead root files; README reflects actual architecture and entrypoint model.

### [ ] D2 - Add enterprise “golden path” quickstart outcome screenshots/artifacts (P3)
Why:
- Adoption improves when users can see expected outputs immediately.
Work:
- Add concise examples of `policy-explain`, JSON summary envelope, and report artifacts in docs.
- Keep examples parity-validated.
Files likely affected:
- `README.md`
- `docs/QUICKREF.md`
- `docs/COMMAND_INVENTORY.md`
Verification:
- Docs parity script validates every included command snippet.

## Suggested Next Session Order

1. A1
2. C1
3. B1
4. B2
5. C2
6. D1
7. D2

## Next Session Definition Of Done

- Selected checklist items implemented with tests.
- `./kujo test` passes.
- `./kujo test --runtime interpreter` passes.
- `scripts/verify_docs_command_parity.sh` passes.
- `scripts/release_quality_gates.sh` passes.
- `scripts/supply_chain_policy_check.sh` passes.
