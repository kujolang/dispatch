# kujo-eval Next Session Enhancement Checklist

Date created: 2026-05-24
Context: Post-remediation review with all current tests and quality gates green.

Purpose:
- Capture the next highest-value improvements for enterprise robustness, universal usefulness, and presentation quality.
- Provide an execution-ready backlog for the next coding session.

## Priority Legend

- P0: High-impact reliability/security gap
- P1: Strong enterprise hardening value
- P2: Product capability and UX improvements
- P3: Presentation or polish

## Phase A: Security Hardening

### [x] A1 — Add command argument policy mode (P0)
Why:
- Current command policy controls executable allowlisting only; argument-level risk controls are coarse.
Work:
- Add optional `allowed_command_patterns` and `blocked_arg_patterns` policy fields.
- Enforce in `run_shell_with_policy` before execution.
Files likely affected:
- src/checks.kujo
- src/config.kujo
- schema/eval-suite.schema.json
- docs/SECURITY.md
Verification:
- Add positive/negative tests in `tests/security_tests.kujo`.
- `kujo test` and `kujo test --runtime interpreter` pass.

### [x] A2 — Add explicit path normalization guardrails (P0)
Why:
- Path checks should be stable across relative forms (`./`, repeated separators, trailing slashes).
Work:
- Normalize candidate paths before `is_path_safe` prefix checks.
- Add tests for normalization edge cases.
Files likely affected:
- src/checks.kujo
- tests/security_tests.kujo
Verification:
- Traversal and out-of-bound attempts still fail; valid normalized paths pass.

### [ ] A3 — Add redaction audit mode (P1)
Why:
- Teams need observability for when/why output was redacted.
Work:
- Add optional metadata fields for redaction hit count and pattern tags in check details.
Files likely affected:
- src/checks.kujo
- src/report.kujo
- docs/SECURITY.md
Verification:
- Security tests assert metadata is present without leaking original secrets.

## Phase B: Performance & Scale

### [ ] B1 — Add baseline performance report artifact (P1)
Why:
- Current benchmark tests protect thresholds but do not produce trend-friendly artifacts.
Work:
- Add optional perf summary JSON output under `eval_results/benchmarks.json`.
- Include mean/total timings for benchmark and stress suites.
Files likely affected:
- tests/benchmark_tests.kujo
- tests/stress_tests.kujo
- scripts/release_quality_gates.sh
Verification:
- Artifact generated and validated in gates.

### [x] B2 — Optimize repeated tag/filter matching in run_suite (P1)
Why:
- Per-test repeated string operations can scale poorly for large suites.
Work:
- Pre-normalize filter/tag lists once and avoid repeated `trim` inside hot loops.
Files likely affected:
- src/eval_core.kujo
- tests/benchmark_tests.kujo
Verification:
- No behavior changes; benchmark trend shows non-regression or improvement.

### [ ] B3 — Add large-suite fixture test (P2)
Why:
- Need explicit guardrail for practical enterprise suite sizes (not only synthetic stress check).
Work:
- Add fixture with mixed check types and dependency graph.
- Validate stable pass/fail/skipped accounting.
Files likely affected:
- tests/stress_tests.kujo
- examples/
Verification:
- New fixture passes in both runtimes.

## Phase C: Functionality & Product Utility

### [x] C1 — Add JUnit/TAP parity command checks to docs parity script (P1)
Why:
- Report format breadth is a differentiator; command parity should cover more than md/html/json paths.
Work:
- Extend `verify_docs_command_parity.sh` to validate JUnit and TAP generation paths.
Files likely affected:
- scripts/verify_docs_command_parity.sh
- README.md
Verification:
- Script and release gates remain green.

### [x] C2 — Add machine-readable CLI exit-code contract section (P2)
Why:
- Enterprise automation benefits from explicit exit behavior documentation.
Work:
- Document exit code semantics for success, assertion failure, usage/config errors.
- Add integration tests for each class.
Files likely affected:
- README.md
- tests/cli_integration_tests.kujo
Verification:
- Tests and docs parity checks pass.

### [ ] C3 — Add `--summary-only` output mode (P2)
Why:
- Users want compact human output without full JSON payloads.
Work:
- Add `--summary-only` to print deterministic single-screen status.
Files likely affected:
- main.kujo
- src/report.kujo
- src/cli.kujo
- tests/cli_integration_tests.kujo
Verification:
- New mode tested; existing JSON/report behavior unchanged.

## Phase D: Presentation & Adoption

### [x] D1 — Add “Enterprise Deployment Patterns” section in README (P1)
Why:
- Improves trust and onboarding for teams evaluating Kujo language ecosystem maturity.
Work:
- Document recommended deployment topologies (local dev, CI runner, gated release pipelines).
- Include example policy configurations.
Files likely affected:
- README.md
- docs/SECURITY.md
Verification:
- README command references remain executable.

### [ ] D2 — Add “Universal Fit vs Best Fit” matrix (P2)
Why:
- Honest scoping improves credibility and reduces misuse.
Work:
- Add matrix mapping use-case fit levels (strong fit / partial fit / not yet fit).
Files likely affected:
- README.md
Verification:
- Matrix aligns with current runtime limitations and tests.

### [ ] D3 — Add architecture diagram for eval execution flow (P3)
Why:
- Visual clarity helps funnel users into Kujo language by showcasing architecture quality.
Work:
- Add simple flow diagram in docs and link from README.
Files likely affected:
- docs/ARCHITECTURE.md
- README.md
Verification:
- Diagram and links render correctly.

## Suggested Next Session Order

1. A1
2. A2
3. B2
4. C1
5. C2
6. D1
7. Remaining items

## Next Session Definition Of Done

- All selected checklist items implemented with tests.
- `kujo test` and `kujo test --runtime interpreter` pass.
- `bash scripts/release_quality_gates.sh` and `bash scripts/supply_chain_policy_check.sh` pass.
- README remains command-accurate via docs parity script.
