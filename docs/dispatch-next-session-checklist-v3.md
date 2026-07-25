# Dispatch Next-Session Checklist v3 (Flagship Enterprise Readiness)

Last reviewed: 2026-06-19
Scope: post-v2 review for production hardening, universal usefulness, performance, and presentation polish

Status: Active. Use this checklist for the next focused execution cycle.

## Review Snapshot

Dispatch is a strong offline-verified Control-layer example for Kujo: workflow templates, persisted state, trace/report artifacts, approval gates, retries, policy profiles, bundle import/export, diagnostics, cleanup, and CI are all present.

It should not be presented as universally production-ready for every enterprise by default. The repository is production-oriented and well hardened for fixture-backed/local orchestration, but live provider operations, large-scale catalogs, external plugin distribution, key management, observability integrations, and organization-specific IAM/SIEM controls still need environment-specific validation.

Root layout audit:

- Keep `dispatch.kujo` at the root as the CLI/runtime entrypoint.
- Keep `sdk_adapter.kujo` and `bridge_chat.kujo` at the root while live SDK bridge invocation and compatibility tests import those entry scripts directly.
- Core implementation should continue to live under `src/`.
- The domain handler layer was migrated from top-level `tools/` into `src/tools/` (with tests and docs updated) in the 2026-06-25 pass; all implementation modules now live under `src/`.

Current-session hardening already completed before this checklist:

- SDK bridge execution failures now redact stderr by default, matching parse-error behavior; raw bridge stderr remains available only through `DISPATCH_SDK_DEBUG_OUTPUT=true` or `debug_bridge_output`.
- Trace stress coverage was tuned to preserve truncation assertions while keeping the full local regression suite within the CI-style timeout.

## Agent Operating Protocol

For each task cycle:
1. Pick exactly one unchecked item unless an item explicitly allows batching.
2. Implement the smallest safe change.
3. Add or update tests.
4. Update README/docs if user-visible behavior changed.
5. Run the local CI-equivalent gate when feasible:

```bash
export KUJO_BIN=kujo
export DISPATCH_OFFLINE_FIXTURE=true

$KUJO_BIN test-run tests/sdk_adapter_tests.kujo -v
$KUJO_BIN test-run tests/policy_precedence_tests.kujo -v
$KUJO_BIN test-run tests/dispatch_tests.kujo -v
```

Completion format:

- Change `[ ]` to `[x]`.
- Add one line under the item:
  - Done notes: <date> | <agent/model> | <short summary> | <tests run>

Blocked format:

- Leave `[ ]` unchecked.
- Add one line:
  - Blocked: <date> | <reason> | <required follow-up>

## Tier A - Security and Trust Boundary Depth

### [ ] SEC-014: Centralize safe path validation policies
Priority: High
Complexity: M
Files: `src/core/utils.kujo`, `src/core/state.kujo`, `src/tools/source_lookup.kujo`, `dispatch.kujo`, tests
Implementation expectations:
- Consolidate repeated path guardrail logic for output roots, config files, sources directories, and future sink paths.
- Preserve current error messages unless intentionally updating a documented command surface.
Acceptance criteria:
- Path traversal, absolute-path opt-in, encoded separator, empty segment, and dot-segment behavior is consistent and covered by table tests.

### [ ] SEC-015: Add centralized error-output redaction helpers
Priority: High
Complexity: S
Files: `src/core/utils.kujo`, `sdk_adapter.kujo`, `src/core/runner.kujo`, tests
Implementation expectations:
- Reuse one redaction/summarization helper for bridge errors, policy audit metadata, hook details, and future subprocess failures.
- Keep debug opt-ins explicit and local-only in documentation.
Acceptance criteria:
- Secret-looking values are not exposed in default errors, traces, reports, or audit records.

### [ ] SEC-016: Harden bundle signing metadata and key guidance
Priority: Medium
Complexity: M
Files: `src/core/state.kujo`, `dispatch.kujo`, `README.md`, `docs/enterprise-deployment.md`, tests
Implementation expectations:
- Add explicit signature algorithm/key-id metadata where supported.
- Document managed-secret-store usage and discourage command-line signing keys for shared environments.
Acceptance criteria:
- Bundle verification remains backward-compatible and emits deterministic errors for tampering or missing key metadata.

### [ ] SEC-017: Guard lifecycle webhook sink paths before external exposure
Priority: Medium
Complexity: S
Files: `src/core/hooks.kujo`, tests, docs if exposed through CLI/config
Implementation expectations:
- If webhook sinks become user-configurable, apply safe relative path validation or an explicit opt-in env guard.
- Keep current internal callback behavior working.
Acceptance criteria:
- Hook sink writes cannot escape intended local artifact roots without explicit opt-in.

## Tier B - Performance and Scale

### [ ] PERF-007: Add append-friendly JSONL writer abstraction
Priority: High
Complexity: M
Files: `src/core/utils.kujo`, `src/core/hooks.kujo`, `src/core/state.kujo`, tests
Implementation expectations:
- Reduce repeated read-whole-file/write-whole-file patterns for hook sinks and mutation audit logs where Kujo runtime support allows.
- Preserve audit rotation semantics and JSONL line format.
Acceptance criteria:
- Long-running workflows can emit many lifecycle and audit events without quadratic file growth cost.

### [ ] PERF-008: Add run catalog compaction or archival index mode
Priority: Medium
Complexity: M
Files: `src/core/state.kujo`, `dispatch.kujo`, docs, tests
Implementation expectations:
- Provide a safe way to compact old terminal runs into an archived index while preserving inspect/export paths.
Acceptance criteria:
- `runs --json --diagnostics` stays responsive for large catalogs and reports archived/current index counts clearly.

### [ ] PERF-009: Clarify or implement true DAG parallel execution
Priority: Medium
Complexity: L
Files: `src/core/runner.kujo`, `README.md`, tests
Implementation expectations:
- Decide whether `parallel_execution` means dependency-aware scheduling only or actual concurrent execution.
- Rename/document the current behavior or implement bounded concurrent execution if Kujo runtime primitives support it.
Acceptance criteria:
- Users do not infer unimplemented concurrency guarantees from the current flag name.

## Tier C - Functionality and Universal Usefulness

### [ ] FEAT-013: Add workflow/template validation command
Priority: High
Complexity: M
Files: `dispatch.kujo`, `src/workflows/workflow.kujo`, tests, README
Implementation expectations:
- Add a command that validates built-in or configured workflow templates for step IDs, dependencies, schema shape, missing tools, and missing agents.
Acceptance criteria:
- Template authors can catch workflow contract problems before running a workflow.

### [ ] FEAT-014: Add config-driven plugin registration path
Priority: Medium
Complexity: L
Files: `src/core/plugins.kujo`, `dispatch.kujo`, docs, tests
Implementation expectations:
- Move beyond in-memory plugin injection tests by supporting a constrained manifest/config path for tool and agent registration.
Acceptance criteria:
- External project teams can extend Dispatch without editing core modules.

### [ ] FEAT-015: Improve request-changes resume semantics
Priority: Medium
Complexity: M
Files: `src/core/approval.kujo`, `src/core/runner.kujo`, tests, README
Implementation expectations:
- Make request-changes loops more explicit by recording reviewer notes, changed inputs, and the resumed decision path.
Acceptance criteria:
- Approval review history is clear enough for audit and handoff.

### [ ] API-002: Publish artifact JSON schema examples
Priority: Medium
Complexity: M
Files: `docs/`, `README.md`, tests
Implementation expectations:
- Add compact schema examples for `state.json`, `trace.json`, `report.json`, and command JSON envelopes.
- Keep examples generated from or validated against fixtures where possible.
Acceptance criteria:
- External readers can integrate without reverse-engineering artifact payloads.

## Tier D - Presentation and Adoption

### [ ] DOC-004: Add enterprise readiness matrix
Priority: High
Complexity: S
Files: `README.md`, `docs/enterprise-deployment.md`
Implementation expectations:
- State what is verified locally, what is production-oriented, and what remains environment-owned.
- Make the positioning confident but precise.
Acceptance criteria:
- Users understand Dispatch as a flagship Kujo example without overclaiming universal production readiness.

### [ ] DOC-005: Add copyable "build your first custom workflow" guide
Priority: Medium
Complexity: M
Files: `docs/`, `README.md`, `examples/`
Implementation expectations:
- Show a minimal new workflow/template with one custom tool and one report artifact.
- Keep examples short enough for agents and humans to imitate.
Acceptance criteria:
- New users can adapt Dispatch beyond research and CRUD reliability templates in one sitting.

### [ ] DOC-006: Add architecture decision record for src/root entrypoint boundary
Priority: Low
Complexity: S
Files: `docs/`
Implementation expectations:
- Document why root entry scripts remain while implementation lives under `src/`.
- Capture the future compatibility-breaking migration trigger.
Acceptance criteria:
- Future cleanup work does not accidentally break bridge or CLI entrypoint contracts.

## Tier E - Test and Release Confidence

### [ ] TEST-008: Add end-to-end bridge failure redaction fixture
Priority: High
Complexity: M
Files: `tests/sdk_adapter_tests.kujo`, `tests/fixtures/`
Implementation expectations:
- Add a controlled bridge/runtime failure path that emits secret-looking stderr and verify default user-facing errors stay redacted.
Acceptance criteria:
- Helper-level redaction coverage is backed by a realistic bridge execution failure path.

### [ ] TEST-009: Add release smoke script for documented profile commands
Priority: Medium
Complexity: S
Files: `tests/`, `docs/release-checklist.md`, `README.md`
Implementation expectations:
- Encode README enterprise profile examples into a repeatable local smoke script.
Acceptance criteria:
- Documentation examples are regularly checked for command drift.

### [ ] TEST-010: Add artifact schema compatibility snapshots
Priority: Medium
Complexity: M
Files: `tests/fixtures/`, `tests/dispatch_tests.kujo`
Implementation expectations:
- Snapshot minimal and full artifact payloads for state, trace, report, show, inspect, and doctor JSON output.
Acceptance criteria:
- Breaking changes to machine-readable artifacts become intentional and reviewable.
