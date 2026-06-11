# Dispatch Next-Session Checklist (Enterprise Hardening)

Last reviewed: 2026-05-22
Scope: production hardening, scale readiness, security depth, and adoption quality

## Purpose

This checklist is the next execution backlog after the completed extension checklist.

Use this document to drive incremental, test-first improvements that make Dispatch:
- safer for enterprise environments,
- faster at large scale,
- easier to adopt as a flagship Kujo ecosystem example.

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

## Tier 0 - Security and Operational Safety

### [x] SEC-007: Enforce output-root safety boundaries
Priority: Critical
Complexity: M
Files: dispatch.kujo, src/core/state.kujo, README.md, tests
Implementation expectations:
- Reject dangerous output-root values (empty, traversal-like, disallowed root paths).
- Add explicit opt-in env flag for unconstrained output roots.
Acceptance criteria:
- Unsafe output-root values fail with clear, actionable errors.
Validation/testing expectations:
- Add tests for safe and rejected output-root paths.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added output-root normalization/guardrails with explicit unsafe-path blocking and opt-in override | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v (54/54)

### [x] SEC-008: Add canonical path verification for source lookup
Priority: High
Complexity: M
Files: tools/source_lookup.kujo, src/tools/tool.kujo, tests
Implementation expectations:
- Add canonical/normalized path verification to reduce symlink and alias bypass risks.
- Ensure effective path remains inside allowed source root unless explicit opt-in.
Acceptance criteria:
- Canonicalized path escapes are blocked.
Validation/testing expectations:
- Add tests for alias/symlink-like path edge cases.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added canonical path checks and root containment enforcement for source lookup | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v (54/54)

### [x] SEC-009: Add mutation audit artifact for doctor --write and cleanup --apply
Priority: High
Complexity: S
Files: dispatch.kujo, src/core/state.kujo, README.md, tests
Implementation expectations:
- Emit an audit log artifact recording run IDs and mutation actions.
Acceptance criteria:
- Stateful repair/cleanup operations leave an auditable trail.
Validation/testing expectations:
- Add tests validating audit record creation and shape.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added dispatch mutation audit JSONL artifact for doctor/cleanup/import paths and CLI visibility | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v (54/54)

## Tier 1 - Performance and Scale

### [x] PERF-001: Add run metadata index for list/filters
Priority: High
Complexity: L
Files: src/core/state.kujo, dispatch.kujo, tests
Implementation expectations:
- Maintain lightweight run metadata index updated on persist.
- Use index for `runs` and `cleanup` discovery paths.
Acceptance criteria:
- Run listing avoids full state-file scans for common queries.
Validation/testing expectations:
- Add tests verifying index creation, update, and fallback behavior.
Done notes: 2026-05-22 | GPT-5.3-Codex | Implemented .dispatch-run-index metadata path with persist/update/read fallback logic | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v (54/54)

### [x] PERF-002: Bound trace growth and add truncation policy
Priority: High
Complexity: M
Files: src/core/trace.kujo, src/core/runner.kujo, README.md, tests
Implementation expectations:
- Add configurable max events/max payload size for traces.
- Preserve summary metadata when truncation occurs.
Acceptance criteria:
- Very large runs do not create unbounded trace artifacts.
Validation/testing expectations:
- Add tests for truncation behavior and retained metadata.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added configurable trace truncation limits and preserved truncation metadata in trace artifacts | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v (54/54)

### [x] PERF-003: Add filtered counts independent of pagination window
Priority: Medium
Complexity: S
Files: dispatch.kujo, src/core/state.kujo, tests
Implementation expectations:
- Return both page-local catalog stats and full filtered stats.
Acceptance criteria:
- JSON output clearly distinguishes page metrics vs full filtered metrics.
Validation/testing expectations:
- Add tests for metric correctness across limit/offset combinations.
Done notes: 2026-05-22 | GPT-5.3-Codex | Exposed page and filtered catalogs independently in runs JSON output | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v (54/54)

## Tier 2 - Architecture and Presentation Quality

### [x] ARCH-008: Remove root compatibility shims behind major-version flag
Priority: Medium
Complexity: M
Files: root wrappers, src imports, README.md, tests
Implementation expectations:
- Add migration mode to run fully src-only imports.
- Prepare clean removal path for root shim modules.
Acceptance criteria:
- Codebase supports shimless mode without regressions.
Validation/testing expectations:
- Add import smoke tests in both compatibility and shimless modes.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added DISPATCH_SHIMLESS_MODE guards to root compatibility wrappers to support src-only migration mode | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v (54/54)

### [x] ARCH-009: Consolidate utilities into src/core namespace
Priority: Medium
Complexity: M
Files: utils.kujo, src/core/*, imports, tests
Implementation expectations:
- Move shared utility implementations to src/core.
- Keep temporary wrappers only where compatibility is required.
Acceptance criteria:
- New modules import shared helpers from src/core paths.
Validation/testing expectations:
- Full suite passes after utility namespace consolidation.
Done notes: 2026-05-22 | GPT-5.3-Codex | Consolidated shared helpers into src/core utils/errors/memory modules and aligned imports | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v (54/54)

### [x] DOC-001: Add enterprise deployment guide section
Priority: Medium
Complexity: S
Files: README.md, docs/
Implementation expectations:
- Add deployment guidance for environment hardening, monitoring, and upgrade policy.
- Include explicit statement of production assumptions and non-goals.
Acceptance criteria:
- New adopters can evaluate production readiness requirements quickly.
Validation/testing expectations:
- Documentation review for consistency with actual CLI behavior.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added enterprise deployment guidance doc and linked operational assumptions/non-goals in docs | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v (54/54)

## Tier 3 - Functional Growth

### [x] FEAT-007: Add workflow config file support
Priority: Medium
Complexity: L
Files: dispatch.kujo, src/workflows/workflow.kujo, tests, README.md
Implementation expectations:
- Support loading workflow parameters from JSON/YAML config path.
- CLI flags should override config values deterministically.
Acceptance criteria:
- Teams can run repeatable workflows from committed config files.
Validation/testing expectations:
- Add integration tests for config parsing and flag precedence.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added JSON/YAML config loading with deterministic CLI-over-config precedence for demo/resume | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v (54/54)

### [x] FEAT-008: Add pluggable authorization policy for tool execution
Priority: Medium
Complexity: M
Files: src/tools/tool.kujo, src/core/runner.kujo, tests
Implementation expectations:
- Add optional policy callback to permit/deny tool calls by step/run context.
Acceptance criteria:
- Tool calls can be centrally constrained for policy/compliance needs.
Validation/testing expectations:
- Add tests for allow/deny policy outcomes.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added pluggable tool authorization policy evaluation in runner tool execution pipeline | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v (54/54)

### [x] FEAT-009: Add run export/import bundle command
Priority: Low
Complexity: M
Files: dispatch.kujo, src/core/state.kujo, README.md, tests
Implementation expectations:
- Add CLI commands to export a run bundle and re-import into another output root.
Acceptance criteria:
- Portable run artifacts support migration and debugging workflows.
Validation/testing expectations:
- Add round-trip export/import integration tests.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added export-run/import-run CLI commands with portable bundle serialization round trip | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v (54/54)

## Cross-Cutting Testing Backlog

### [x] TEST-001: Add CLI negative-path matrix
Priority: High
Complexity: M
Files: tests/dispatch_tests.kujo
Implementation expectations:
- Add matrix tests for invalid numeric flags, invalid statuses, and malformed command combinations.
Acceptance criteria:
- CLI failures are deterministic and user-friendly.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added negative-path matrix coverage for invalid flags/statuses/argument combinations | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v (54/54)

### [x] TEST-002: Add long-run stress fixture test
Priority: Medium
Complexity: M
Files: tests/dispatch_tests.kujo, tests/fixtures/
Implementation expectations:
- Add fixture generating many steps/events to validate performance and trace bounds.
Acceptance criteria:
- Stress paths remain stable and artifact sizes controlled.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added long-run stress fixture and assertions for bounded traces under heavy step/event volume | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v (54/54)

### [x] TEST-003: Add corruption-repair integration matrix
Priority: Medium
Complexity: M
Files: tests/dispatch_tests.kujo
Implementation expectations:
- Cover malformed JSON, partial files, missing artifacts, and repair outcomes.
Acceptance criteria:
- Doctor/repair behavior is predictable across realistic corruption modes.
Done notes: 2026-05-22 | GPT-5.3-Codex | Added corruption matrix coverage for malformed state and partial/missing artifact scenarios | tests run: /path/to/kujo/target/debug/kujo test-run tests/dispatch_tests.kujo -v (54/54)

## Suggested Next Execution Order

1. SEC-007
2. SEC-009
3. PERF-001
4. PERF-002
5. ARCH-009
6. DOC-001
7. FEAT-007
8. FEAT-008
9. TEST-002
10. ARCH-008
