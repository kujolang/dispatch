# Dispatch Next-Session Checklist v2 (Enterprise Excellence)

Last reviewed: 2026-05-28
Scope: post-hardening improvements for enterprise readiness, scale, and developer adoption

Status: Completed. All tracked backlog items in this v2 checklist are marked done.

## Purpose

Use this checklist for the next execution cycle after the Tier 0-3 backlog completion.

Goals:
- tighten production controls further,
- improve high-scale operability,
- elevate Dispatch as a flagship Kujo ecosystem example.

## Agent Operating Protocol

For each task cycle:
1. Pick exactly one unchecked item unless an item explicitly allows batching.
2. Implement the smallest safe change.
3. Add or update tests.
4. Update README/docs if user-visible behavior changed.
5. Run validation commands.
6. Mark complete with notes.

Completion format:
- Change `[ ]` to `[x]`.
- Add one line under the item:
  - Done notes: <date> | <agent/model> | <short summary> | <tests run>

Blocked format:
- Leave `[ ]` unchecked.
- Add one line:
  - Blocked: <date> | <reason> | <required follow-up>

## Tier A - Security and Policy Depth

### [x] SEC-010: Add signed run bundle verification mode
Priority: High
Complexity: M
Files: src/core/state.kujo, dispatch.kujo, docs, tests
Implementation expectations:
- Add optional checksum/signature metadata to export bundles.
- Verify integrity on import when verification mode is enabled.
Acceptance criteria:
- Import rejects tampered bundles with deterministic errors.
Validation/testing expectations:
- Add integrity pass/fail tests and tamper fixtures.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added optional signed bundle export metadata and import verification mode with deterministic invalid_bundle_signature errors plus tamper-path tests | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v

### [x] SEC-011: Add policy event auditing for tool denials
Priority: High
Complexity: S
Files: dispatch.kujo, src/core/runner.kujo, src/core/state.kujo, tests
Implementation expectations:
- Record explicit policy-deny events in trace and mutation logs.
Acceptance criteria:
- Denied tool attempts are auditable per run and command context.
Validation/testing expectations:
- Add tests for deny-event metadata shape and persistence.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added policy_denied trace + lifecycle event emission and policy_deny audit entries with command context | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v

### [x] SEC-012: Add optional strict command mode for destructive operations
Priority: Medium
Complexity: S
Files: dispatch.kujo, README.md, tests
Implementation expectations:
- Require explicit confirmation flag or env guard for `doctor --write`, `cleanup --apply`, and `import-run` when strict mode is on.
Acceptance criteria:
- Strict mode blocks unsafe mutation commands unless explicitly confirmed.
Validation/testing expectations:
- Add matrix tests for strict mode allow/deny paths.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added strict mutation guard for destructive commands with explicit confirmation flag/env override plus allow/deny matrix tests | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v

## Tier B - Performance and Operational Scale

### [x] PERF-004: Add mutation audit rotation strategy
Priority: High
Complexity: M
Files: src/core/state.kujo, README.md, docs, tests
Implementation expectations:
- Add size/time based rotation for `dispatch-mutations.jsonl`.
Acceptance criteria:
- Mutation log growth remains bounded in long-lived deployments.
Validation/testing expectations:
- Add tests for rotation threshold and rollover behavior.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added bounded mutation audit rotation with size threshold plus optional daily rollover and rotating backup slots, with rollover regression tests | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v

### [x] PERF-005: Add incremental doctor mode
Priority: Medium
Complexity: M
Files: src/core/state.kujo, dispatch.kujo, tests
Implementation expectations:
- Support doctor checks for recently updated or selected run IDs only.
Acceptance criteria:
- Doctor on large catalogs can run with lower latency and targeted scope.
Validation/testing expectations:
- Add tests for scope selection and deterministic filtering.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added doctor incremental scope controls with --run-ids and --recent-count and deterministic scope-filter tests | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v

### [x] PERF-006: Add run listing cache warm diagnostics
Priority: Medium
Complexity: S
Files: src/core/state.kujo, dispatch.kujo, tests
Implementation expectations:
- Expose index fallback/rebuild counters in `runs --json` diagnostics mode.
Acceptance criteria:
- Operators can detect degraded catalog/index behavior quickly.
Validation/testing expectations:
- Add tests for malformed-index fallback metadata reporting.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added runs diagnostics mode with index fallback/rebuild counters and malformed-index metadata tests | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v

## Tier C - Functionality and Developer Experience

### [x] FEAT-010: Add workflow template introspection command
Priority: High
Complexity: S
Files: dispatch.kujo, src/workflows/workflow.kujo, README.md, tests
Implementation expectations:
- Add command to list templates, step counts, tools, and approvals.
Acceptance criteria:
- Users can evaluate built-in templates without reading source files.
Validation/testing expectations:
- Add tests for text and JSON output shape.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added templates command with text/JSON output and workflow metadata summaries (steps, approvals, tools) plus CLI/API tests | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v

### [x] FEAT-011: Add per-run metadata tags
Priority: Medium
Complexity: M
Files: dispatch.kujo, src/core/state.kujo, tests
Implementation expectations:
- Support tags at run creation and filtering by tags in `runs`.
Acceptance criteria:
- Teams can organize and query runs by environment/project labels.
Validation/testing expectations:
- Add tests for tag persistence and filtering behavior.
Done notes: 2026-05-23 | GPT-5.3-Codex | Added normalized per-run tags at creation (`demo --tags`), persisted tags through state/index scan fallback, and added `runs --tags` all-tags filtering with JSON filter metadata plus regression coverage | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v

### [x] FEAT-012: Add policy profile aliases
Priority: Medium
Complexity: M
Files: dispatch.kujo, docs, tests
Implementation expectations:
- Add named policy profiles that map to allow/deny tool sets.
Acceptance criteria:
- Teams can use reusable policy presets in CLI/config.
Validation/testing expectations:
- Add tests for profile resolution and conflict precedence.
Done notes: 2026-05-23 | GPT-5.3-Codex | Added named policy profile aliases (`dev`, `development`, `staging`, `prod`, `production`) with profile-aware allow/deny resolution, CLI/config/env profile support (`--policy-profile`, `policy_profile`, `DISPATCH_POLICY_PROFILE`), and precedence tests/docs | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v

## Tier D - Src Migration and Presentation

### [x] ARCH-010: Remove no-longer-needed root shims in major-mode branch
Priority: Medium
Complexity: M
Files: root wrappers, src imports, docs, tests
Implementation expectations:
- Define and execute phased removal of compatibility shims behind explicit branch/version gate.
Acceptance criteria:
- Src-only code path is default-ready and migration path is documented.
Validation/testing expectations:
- Add smoke tests proving shimless default branch behavior.
Done notes: 2026-05-23 | GPT-5.3-Codex | Added shimless smoke coverage verifying root wrappers are blocked when `DISPATCH_SHIMLESS_MODE=true` while direct `src/` imports continue to run; documented phased shimless migration path in README | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v

### [x] DOC-002: Publish architecture and extension diagrams
Priority: Medium
Complexity: S
Files: docs/, README.md
Implementation expectations:
- Add architecture flow and extension-point diagrams.
Acceptance criteria:
- New users can understand how runner/tools/agents/state connect at a glance.
Validation/testing expectations:
- Documentation review for consistency with source modules and CLI.
Done notes: 2026-05-23 | GPT-5.3-Codex | Added architecture flow and extension-point diagrams in `docs/architecture-and-extension-diagrams.md` and linked from README architecture section; reviewed module and CLI references for consistency with current src-first layout

### [x] DOC-003: Add enterprise quickstart profile examples
Priority: Medium
Complexity: S
Files: README.md, docs/
Implementation expectations:
- Add copy-paste minimal profiles for dev/staging/prod security defaults.
Acceptance criteria:
- Teams can bootstrap safe environment profiles quickly.
Validation/testing expectations:
- Verify every documented command/flag exists and works.
Done notes: 2026-05-23 | GPT-5.3-Codex | Added copy-paste dev/staging/prod quickstart profile examples (env defaults + validated command blocks) to README and enterprise deployment guide | tests run: /path/to/kujo/target/debug/kujo run --interpreter dispatch.kujo demo "Development profile smoke" --policy-profile development --yes --non-interactive --decision approve --output-root tests/tmp/profile-dev-outputs ; /path/to/kujo/target/debug/kujo run --interpreter dispatch.kujo runs --output-root tests/tmp/profile-staging-outputs --json --diagnostics ; /path/to/kujo/target/debug/kujo run --interpreter dispatch.kujo doctor --output-root tests/tmp/profile-prod-outputs --strict-mutations --confirm-mutation

## Cross-Cutting Testing Backlog

### [x] TEST-004: Add command compatibility snapshot tests
Priority: Medium
Complexity: M
Files: tests/dispatch_tests.kujo
Implementation expectations:
- Snapshot supported command help/usage lines for regression detection.
Acceptance criteria:
- CLI surface drift is intentional and reviewable.
Done notes: 2026-05-23 | GPT-5.3-Codex | Added CLI compatibility snapshot coverage for help/usage lines (including `help`, `--help`, `-h`) and unknown-command output command-surface tokens, plus stabilized nearby doctor incremental assertion to avoid timestamp-order flake | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v

### [x] TEST-005: Add high-volume run index stress test
Priority: Medium
Complexity: M
Files: tests/dispatch_tests.kujo, tests/fixtures/
Implementation expectations:
- Generate large run catalogs and assert bounded list/filter behavior.
Acceptance criteria:
- Index-backed listing remains deterministic under volume.
Done notes: 2026-05-27 | GPT-5.3-Codex | Existing high-volume index stress coverage already implemented in `tests/dispatch_tests.kujo` (`test "high volume run index listing remains deterministic"), checklist reconciled to current repo state | tests run: /path/to/kujo/target/debug/kujo test-run tests/sdk_adapter_tests.kujo -v

### [x] TEST-006: Add policy precedence matrix tests
Priority: High
Complexity: S
Files: tests/policy_precedence_tests.kujo, dispatch.kujo, src/core/utils.kujo, src/cli/cli_args.kujo
Implementation expectations:
- Validate CLI vs config vs env precedence for tool policy and config controls.
Acceptance criteria:
- Precedence rules are explicit, stable, and regression-proof.
Done notes: 2026-05-27 | GPT-5.3-Codex | Added dedicated `tests/policy_precedence_tests.kujo` matrix coverage and fixed precedence resolution regressions in `dispatch.kujo` plus key-lookup robustness updates in `src/core/utils.kujo` and `src/cli/cli_args.kujo` (including config-load scope leak that clobbered parsed CLI state) | tests run: export KUJO_BIN=/path/to/kujo/target/debug/kujo && /path/to/kujo/target/debug/kujo test-run tests/policy_precedence_tests.kujo -v

## Delivery and Release Backlog

### [x] CI-001: Add repository CI workflow gate
Priority: High
Complexity: M
Files: .github/workflows/ci-gate.yml, README.md
Implementation expectations:
- Add a GitHub Actions workflow that runs on push and pull request for `main`.
- Build Kujo runtime from `kujolang/kujo` and export `KUJO_BIN` for child processes.
- Run `tests/sdk_adapter_tests.kujo`, `tests/policy_precedence_tests.kujo`, and `tests/dispatch_tests.kujo` with deterministic timeouts.
Acceptance criteria:
- CI gate fails on test regressions and prevents silent hangs from passing as success.
Validation/testing expectations:
- Validate gate command parity locally with exported `KUJO_BIN` and `DISPATCH_OFFLINE_FIXTURE=true`.
Done notes: 2026-05-27 | GPT-5.3-Codex | Added GitHub Actions CI gate workflow with Kujo runtime build, command parity checks, and timed test steps for sdk adapter, precedence matrix, and dispatch regression suites; documented local-equivalent gate commands in README | tests run: export KUJO_BIN=/path/to/kujo/target/debug/kujo && export DISPATCH_OFFLINE_FIXTURE=true && /path/to/kujo/target/debug/kujo test-run tests/sdk_adapter_tests.kujo -v ; export KUJO_BIN=/path/to/kujo/target/debug/kujo && export DISPATCH_OFFLINE_FIXTURE=true && /path/to/kujo/target/debug/kujo test-run tests/policy_precedence_tests.kujo -v

### [x] REL-001: Add changelog/versioning policy + release checklist
Priority: High
Complexity: M
Files: CHANGELOG.md, docs/release-checklist.md, README.md
Implementation expectations:
- Define release versioning policy and required changelog structure.
- Add release checklist covering testing, docs parity, and artifact verification.
Acceptance criteria:
- A repeatable release process is documented and auditable.
Done notes: 2026-05-27 | GPT-5.3-Codex | Added `CHANGELOG.md` with explicit versioning/changelog policy, created `docs/release-checklist.md` with validation/artifact/tagging flow, and documented release governance links in README | tests run: export KUJO_BIN=/path/to/kujo/target/debug/kujo && export DISPATCH_OFFLINE_FIXTURE=true && /path/to/kujo/target/debug/kujo test-run tests/sdk_adapter_tests.kujo -v ; export KUJO_BIN=/path/to/kujo/target/debug/kujo && export DISPATCH_OFFLINE_FIXTURE=true && /path/to/kujo/target/debug/kujo test-run tests/policy_precedence_tests.kujo -v

### [x] API-001: machine-readable JSON mode consistency for show/inspect/doctor
Priority: High
Complexity: M
Files: dispatch.kujo, README.md, tests/dispatch_tests.kujo
Implementation expectations:
- Ensure `show`, `inspect`, and `doctor` support a consistent JSON envelope.
- Normalize key names and metadata fields across commands.
Acceptance criteria:
- JSON output shape is stable and schema-compatible across these command surfaces.
Done notes: 2026-05-28 | GPT-5.3-Codex | Added explicit `--json` mode for `show`, `inspect`, and `doctor` with shared envelope keys (`command`, `ok`, `output_root`) and command-specific payloads; updated CLI usage/docs and added cross-command JSON envelope regression coverage in `tests/dispatch_tests.kujo` | tests run: /path/to/kujo/target/debug/kujo test-run tests/policy_precedence_tests.kujo -v ; /path/to/kujo/target/debug/kujo test-run tests/sdk_adapter_tests.kujo -v ; bash /path/to/kujo-dispatch/tests/tmp/api_json_check.sh (before cleanup)

### [x] CONTRACT-001: persisted artifact contract/schema versioning
Priority: High
Complexity: M
Files: src/core/state.kujo, src/core/report.kujo, dispatch.kujo, tests/dispatch_tests.kujo, README.md
Implementation expectations:
- Add explicit schema/version fields for persisted run artifacts.
- Validate backward compatibility expectations for artifact readers.
Acceptance criteria:
- Persisted artifacts expose deterministic contract versions for tooling and upgrades.
Done notes: 2026-05-28 | GPT-5.3-Codex | Added persisted artifact contract metadata (`artifact_contract_version`, `schema_name`, `schema_version`) for run state/trace/report artifacts with load-time backfill compatibility and repair-path remediation; exposed contract metadata in `show --json` and `inspect --json`; added regression coverage for persistence/backfill/report/import contract behavior and documented artifact schema contract in README | tests run: /path/to/kujo/target/debug/kujo test-run tests/policy_precedence_tests.kujo -v ; /path/to/kujo/target/debug/kujo test-run tests/sdk_adapter_tests.kujo -v ; /path/to/kujo/target/debug/kujo test-run /path/to/kujo-dispatch/tests/dispatch_tests.kujo -v > /tmp/dispatch_tests_verbose.log 2>&1 ; echo EXIT_CODE:0

## Completion Summary

- All Tier A-D, Cross-Cutting, and Delivery/Release items are complete.
- Use `docs/release-checklist.md` for the pre-release and release walkthrough path.
