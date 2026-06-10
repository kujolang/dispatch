# kujo-eval Next Session Enterprise Checklist (v2)

Date created: 2026-05-25
Context: Post-review hardening pass after loops A1/A2/B2/C1/C2/D1 plus overwrite-safe artifacts and summary-only output mode.

Purpose:
- Capture the next highest-value work to improve enterprise trust, universality, and product presentation.
- Keep backlog execution-ready with explicit verification targets.

## Priority Legend

- P0: Critical reliability/security gap
- P1: High enterprise hardening value
- P2: Broad product utility improvement
- P3: Presentation and adoption polish

## Completed In This Session (Reference)

- Command pattern policy controls (`allowed_command_patterns`, `blocked_arg_patterns`)
- Path normalization guardrails for policy checks
- Filter/tag hot-loop normalization optimization
- JUnit/TAP docs parity automation coverage
- Explicit CLI exit-code contract docs + tests
- Enterprise deployment patterns docs
- Overwrite-safe run/report artifact writes in shared output directories
- New `--summary-only` compact run output mode

## Phase A: Security & Governance

### [x] A1 — Add redaction audit metadata mode (P1)
Why:
- Enterprises need observability on what was redacted and how often.
Work:
- Add optional redaction metadata (`redaction_hits`, `redaction_patterns`) to command-check details.
- Keep payloads sanitized while exposing safe telemetry.
Files likely affected:
- src/checks.kujo
- src/report.kujo
- tests/security_tests.kujo
- docs/SECURITY.md
Verification:
- Security tests validate metadata presence without leaking original secrets.

### [x] A2 — Token-aware command policy matching (P1)
Why:
- Substring matching can be either too broad or too weak for strict policy enforcement.
Work:
- Add token-aware mode for allow/deny argument checks.
- Preserve existing substring mode for backward compatibility.
Files likely affected:
- src/checks.kujo
- src/config.kujo
- schema/eval-suite.schema.json
- tests/security_tests.kujo
Verification:
- False-positive/false-negative cases covered by new tests.

### [x] A3 — Policy profile presets for enterprise onboarding (P2)
Why:
- Teams want a known-good baseline without writing policy from scratch.
Work:
- Add optional named policy profiles (e.g., strict-ci, local-dev, release-gate).
Files likely affected:
- src/config.kujo
- examples/
- README.md
Verification:
- Profile examples execute successfully in both runtimes.

## Phase B: Performance & Scale

### [x] B1 — Emit benchmark trend artifact (P1)
Why:
- Current benchmarks pass/fail, but trend visibility is limited.
Work:
- Generate `eval_results/benchmarks.json` with run-to-run timing summaries.
Files likely affected:
- tests/benchmark_tests.kujo
- tests/stress_tests.kujo
- scripts/release_quality_gates.sh
Verification:
- Artifact generated consistently and validated by gate script.

### [x] B2 — Large-suite fixture and accounting test (P1)
Why:
- Need explicit confidence at practical enterprise suite sizes.
Work:
- Add realistic mixed-check fixture with tags, dependencies, retries, and skips.
Files likely affected:
- tests/stress_tests.kujo
- examples/
Verification:
- Stable pass/fail/skipped totals in dual and interpreter runtimes.

### [x] B3 — Cache/history retention controls (P2)
Why:
- Long-running CI installations need bounded artifact growth.
Work:
- Add configurable retention for `history.json` and auxiliary run artifacts.
Files likely affected:
- main.kujo
- src/config.kujo
- README.md
Verification:
- Integration test confirms pruning behavior without data corruption.

## Phase C: Functionality & Integrations

### [x] C1 — CI artifact manifest output (P1)
Why:
- External systems need deterministic artifact discovery.
Work:
- Emit `artifact-manifest.json` listing generated report/checkpoint files.
Files likely affected:
- main.kujo
- src/report.kujo
- tests/cli_integration_tests.kujo
Verification:
- Manifest paths are accurate and exist on disk.

### [x] C2 — JUnit/TAP schema conformance tests (P2)
Why:
- Enterprise CI parsers can be strict on format details.
Work:
- Add fixture-driven tests that validate key structural expectations of JUnit XML and TAP outputs.
Files likely affected:
- src/report.kujo
- tests/contract_tests.kujo
Verification:
- Conformance tests pass in both runtimes.

### [x] C3 — Deterministic summary payload file (`summary.json`) (P2)
Why:
- Human summary and machine summary should be equally accessible.
Work:
- Write a normalized summary artifact for dashboards and status collectors.
Files likely affected:
- main.kujo
- tests/cli_integration_tests.kujo
Verification:
- Summary file always produced on successful run.

## Phase D: Presentation & Adoption

### [ ] D1 — Add Universal Fit vs Best Fit matrix (P1)
Why:
- Honest scope guidance increases trust and reduces misuse.
Work:
- Add matrix for strong-fit/partial-fit/not-yet-fit use cases.
Files likely affected:
- README.md
Verification:
- Matrix aligns with current runtime constraints and implemented checks.

### [ ] D2 — Add eval execution flow diagram (P2)
Why:
- Visual architecture clarity helps onboarding and ecosystem adoption.
Work:
- Add concise architecture flow diagram and cross-link from README.
Files likely affected:
- docs/ARCHITECTURE.md
- README.md
Verification:
- Diagram renders and links resolve.

### [ ] D3 — Enterprise quickstart bundle (P2)
Why:
- Teams adopt faster with copy/paste-ready secure defaults.
Work:
- Provide a full secure sample suite + CI snippets for GitHub Actions and generic runners.
Files likely affected:
- examples/
- README.md
- docs/
Verification:
- Snippets run against example suite and pass parity checks.

## Suggested Next Session Order

1. A1
2. A2
3. B1
4. B2
5. C1
6. D1
7. Remaining items

## Next Session Definition Of Done

- Selected checklist items implemented with tests.
- `./kujo test` passes.
- `./kujo test --runtime interpreter` passes.
- `scripts/release_quality_gates.sh` passes.
- `scripts/supply_chain_policy_check.sh` passes.
- README command references remain executable via docs parity script.
