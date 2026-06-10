# kujo-eval Next Session Enterprise Checklist (v3)

Date created: 2026-05-25
Context: Post-hardening pass with deterministic Gate 4 and Gate 11 watchdogs, dual-runtime green, and release/supply-chain gates passing.

Purpose:
- Define the next highest-value work to improve enterprise trust, universal usefulness, and product presentation.
- Keep backlog execution-ready with explicit validation expectations.

## Priority Legend

- P0: Critical correctness/reliability risk
- P1: High enterprise hardening value
- P2: Broad utility and adoption value
- P3: Presentation and ecosystem polish

## Completed In This Session (Reference)

- Deterministic Gate 4 watchdog based on PASS artifacts and summary verification
- Deterministic README parity watchdog flow for Gate 11
- Time-based watchdog controls via env vars (`KUJO_EVAL_GATE_TIMEOUT_SECONDS`, `KUJO_EVAL_DOCS_WATCHDOG_TIMEOUT_SECONDS`)
- Safer temp-log handling and process cleanup in gate/parity scripts
- README updates for operational watchdog controls and current validation date

## Phase A: Runtime Reliability And Determinism

### [x] A1 - Add native process timeout/kill support in Kujo runtime integration (P0)
Why:
- Current evaluation timeout behavior detects slow commands but cannot guarantee subprocess termination.
Work:
- Introduce hard-kill timeout semantics in runtime command execution path.
- Keep backward-compatible behavior for existing suites.
Files likely affected:
- `src/checks.kujo`
- `src/eval_core.kujo`
- `tests/security_tests.kujo`
- `tests/cli_integration_tests.kujo`
Verification:
- Add tests that prove timed-out commands are actually terminated and do not leak child processes.

### [x] A2 - Eliminate shell-capture lifecycle edge cases in CLI runtime path (P1)
Why:
- Interpreter command output capture can stall in automation contexts.
Work:
- Add first-class machine-readable summary channel that does not rely on stdout capture timing.
- Keep human-readable output unchanged for local users.
Files likely affected:
- `main.kujo`
- `src/report.kujo`
- `tests/contract_tests.kujo`
Verification:
- New tests verify deterministic completion for run/report in captured output contexts.

## Phase B: Security And Governance

### [x] B1 - Add signed artifact metadata option (P1)
Why:
- Enterprises often require provenance and tamper-evidence for CI artifacts.
Work:
- Add optional manifest checksum block (`sha256` for generated artifacts).
- Add verification mode for manifest integrity.
Files likely affected:
- `main.kujo`
- `src/common.kujo`
- `tests/cli_integration_tests.kujo`
- `README.md`
Verification:
- Integration test validates checksum generation and mismatch detection.

### [x] B2 - Expand command policy to support deny-by-default profiles per suite stage (P1)
Why:
- Large organizations need staged policy strictness between local, CI, and release gates.
Work:
- Add per-stage policy overlays without breaking current profile defaults.
Files likely affected:
- `src/config.kujo`
- `schema/eval-suite.schema.json`
- `tests/security_tests.kujo`
- `docs/SECURITY.md`
Verification:
- Policy tests confirm stage overlay precedence and safe defaults.

## Phase C: Performance And Scale

### [x] C1 - Add parallel execution mode for independent tests (P2)
Why:
- Large suites can become slow in CI without controlled concurrency.
Work:
- Add opt-in parallel scheduler for tests without dependency constraints.
- Preserve deterministic ordering for reporting.
Files likely affected:
- `src/eval_core.kujo`
- `src/report.kujo`
- `tests/stress_tests.kujo`
Verification:
- Stress tests compare serial vs parallel result equivalence and timing improvements.

### [x] C2 - Introduce report generation caching for unchanged result payloads (P2)
Why:
- Repeated report runs re-render identical outputs unnecessarily.
Work:
- Add content hash checks to skip redundant report writes where safe.
Files likely affected:
- `main.kujo`
- `src/report.kujo`
- `tests/cli_integration_tests.kujo`
Verification:
- Integration test proves unchanged reruns avoid redundant writes while preserving correctness.

## Phase D: Product Utility And Adoption

### [x] D1 - Publish enterprise quickstart bundles for common workflows (P2)
Why:
- Faster onboarding increases adoption and showcases Kujo language capabilities.
Work:
- Add production-ready examples for CLI quality gate, API contract gate, and agent output gate.
- Include policy-first defaults in each bundle.
Files likely affected:
- `examples/`
- `README.md`
- `docs/COOKBOOK.md`
Verification:
- Quickstart commands execute and pass in both default and interpreter runtimes.

### [x] D2 - Add architecture flow diagram and lifecycle docs for run/report/watch (P3)
Why:
- Visual explanations improve trust and reduce setup errors.
Work:
- Add sequence/flow diagrams for suite execution lifecycle and artifact generation.
Files likely affected:
- `docs/ARCHITECTURE.md`
- `README.md`
Verification:
- Diagram links resolve and match actual command behavior.

### [x] D3 - Replace remaining static command examples with parity-verified snippets (P3)
Why:
- Documentation should be executable truth, not aspirational text.
Work:
- Align README/docs commands with parity script scope and validation process.
Files likely affected:
- `README.md`
- `docs/QUICKREF.md`
- `scripts/verify_docs_command_parity.sh`
Verification:
- Parity script covers all documented primary command paths.

## Suggested Next Session Order

1. A1
2. A2
3. B1
4. C1
5. D1
6. Remaining items

## Next Session Definition Of Done

- Selected checklist items implemented with tests.
- `./kujo test` passes.
- `./kujo test --runtime interpreter` passes.
- `scripts/release_quality_gates.sh` passes.
- `scripts/supply_chain_policy_check.sh` passes.
- README and docs parity checks pass with watchdog controls.
