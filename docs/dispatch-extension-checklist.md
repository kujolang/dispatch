# Dispatch Extension Checklist and Execution Plan

Last reviewed: 2026-05-21
Scope: repository-wide architecture, security, extensibility, and test coverage

## Purpose

This document is the execution checklist for improving Dispatch into a more reusable workflow engine for real-world developer projects.

It is intentionally structured so an AI coding agent can:
1. Pick one unchecked item.
2. Implement it safely.
3. Add or update tests.
4. Update README as needed.
5. Check the item off with notes.

## Agent Operating Protocol

For each task cycle, follow this exact order:
1. Read README.md and this checklist.
2. Select exactly one unchecked item unless the item explicitly allows batching.
3. Confirm dependencies for that item are complete.
4. Implement the change with minimal unrelated edits.
5. Add tests or extend existing tests.
6. Run the relevant test command(s).
7. Update README/docs if behavior, commands, or structure changed.
8. Mark the item as complete and append a short implementation note.

Completion format:
- Change status from [ ] to [x].
- Add one line under the item:
  - Done notes: <date> | <agent/model> | <short summary> | <tests run>

If blocked:
- Leave [ ] unchecked.
- Add one line:
  - Blocked: <date> | <reason> | <required follow-up>

## Evidence Snapshot From Current Review

High-value findings observed in code:
- Duplicate decision normalization logic exists in two modules:
  - dispatch.kujo:20
  - approval.kujo:3
- Local source lookup currently builds path from unsanitized source_id:
  - tool.kujo:160
- SDK adapter executes via shell command wrapper and returns raw bridge output in parse-error details:
  - sdk_adapter.kujo:134
  - sdk_adapter.kujo:165
  - sdk_adapter.kujo:166
  - sdk_adapter.kujo:167
- Agent and tool routing are hardcoded, reducing plug-and-play extensibility:
  - agent.kujo:185
  - agent.kujo:196
  - runner.kujo:59
  - runner.kujo:61
- Resume command requires markdown fixture validation even when resuming from non-source-dependent steps:
  - dispatch.kujo:258
- Workflow definition and tool handlers are concentrated in single root-level files, making repo growth noisy:
  - workflow.kujo:20
  - tool.kujo:147
- Tests currently focus on workflow happy-path and selected lifecycle states, but do not cover SDK adapter behavior, CLI argument parser behavior, or path hardening.

## Priority Tiers

- Tier 0: Security and correctness blockers.
- Tier 1: Architecture cleanup and DRY foundation.
- Tier 2: Extensibility and developer experience.
- Tier 3: Advanced capabilities and scale.

## Tier 0 - Security and Correctness

### [x] SEC-001: Prevent path traversal in local source lookup
Priority: Critical
Complexity: S
Files: tool.kujo, tests/dispatch_tests.kujo (or new tests file)
Implementation expectations:
- Validate source_id against strict allowlist pattern (for example, letters, numbers, hyphen, underscore only).
- Reject values containing path separators or traversal segments.
- Return structured tool error code for invalid source_id.
Acceptance criteria:
- Inputs like ../secret, ..%2fsecret, a/b, and absolute paths are rejected.
- Valid fixture source IDs still work.
Validation/testing expectations:
- Add tests for allowed and blocked source_id values.
Done notes:
- Done notes: 2026-05-21 | GPT-5.3-Codex | Added strict source_id allowlist validation and blocked traversal/path separator patterns in local source lookup | kujo test-run tests/dispatch_tests.kujo; demo/runs/show/inspect/doctor smoke checks

### [x] SEC-002: Restrict and validate sources_dir boundaries
Priority: High
Complexity: M
Files: tool.kujo, dispatch.kujo, README.md, tests
Implementation expectations:
- Canonicalize and validate sources_dir to an allowed root or explicit trusted path list.
- Fail closed on unreadable/unexpected directories.
Acceptance criteria:
- Arbitrary directory traversal through --sources-dir is not possible without explicit opt-in.
- Error message explains invalid directory constraints.
Validation/testing expectations:
- Add tests for valid, invalid, and non-existent directories.
Done notes:
- Done notes: 2026-05-21 | GPT-5.3-Codex | Added sources_dir allowlist validation with explicit DISPATCH_ALLOW_ANY_SOURCES_DIR opt-in and traversal rejection for demo/tool paths | kujo test-run tests/dispatch_tests.kujo; demo/runs/show/inspect/doctor smoke checks; invalid sources-dir demo failure check

### [x] SEC-003: Redact sensitive process output on bridge parse failures
Priority: High
Complexity: S
Files: sdk_adapter.kujo, tests
Implementation expectations:
- Do not return full stdout/stderr by default in error details.
- Keep optional debug mode for local troubleshooting.
Acceptance criteria:
- Default failure payload is safe for logs/state artifacts.
- Debug mode remains available behind explicit flag/env.
Validation/testing expectations:
- Add tests for parse-failure payload shape and redaction behavior.
Done notes:
- Done notes: 2026-05-21 | GPT-5.3-Codex | Added default bridge parse-error redaction with explicit DISPATCH_SDK_DEBUG_OUTPUT/debug_bridge_output opt-in for raw stdout/stderr and added adapter tests | kujo test-run tests/sdk_adapter_tests.kujo; kujo test-run tests/dispatch_tests.kujo; demo/runs/show/inspect/doctor smoke checks

### [x] SEC-004: Replace shell-wrapped bridge invocation with direct argv execution
Priority: Medium
Complexity: M
Files: sdk_adapter.kujo, README.md, tests
Implementation expectations:
- Replace zsh -lc command with direct spawn_process argv invocation.
- Keep support for bridge script path and interpreter mode.
Acceptance criteria:
- Bridge call still works in fixture mode and live mode.
- No shell interpolation path remains in normal execution.
Validation/testing expectations:
- Add adapter unit tests for command construction.
Done notes:
- Done notes: 2026-05-21 | GPT-5.3-Codex | Replaced shell-wrapped SDK bridge call with direct argv invocation via env -C and added command-construction tests | kujo test-run tests/sdk_adapter_tests.kujo; kujo test-run tests/dispatch_tests.kujo -v; demo/runs/show/inspect/doctor smoke checks

### [x] SEC-005: Add state artifact redaction policy
Priority: Medium
Complexity: M
Files: state.kujo, runner.kujo, report.kujo, README.md, tests
Implementation expectations:
- Introduce redact-before-persist for known sensitive fields (api keys, tokens, auth headers, secrets).
- Ensure trace payload summaries also apply redaction.
Acceptance criteria:
- state.json, trace.json, and report artifacts avoid storing sensitive values.
Validation/testing expectations:
- Add tests asserting sensitive tokens are not persisted in plain text.
Done notes:
- Done notes: 2026-05-22 | GPT-5.3-Codex | Implemented redact-before-persist for state/trace/report artifacts, hardened trace/state handling for legacy null fields, and added persistence/report redaction coverage | kujo test-run tests/dispatch_tests.kujo -v; kujo test-run tests/sdk_adapter_tests.kujo -v; dispatch demo/runs/show/inspect/doctor smoke sequence with --output-root tests/tmp/smoke-outputs

## Tier 1 - Architecture and DRY Foundation

### [x] ARCH-001: Centralize approval decision normalization
Priority: High
Complexity: S
Files: approval.kujo, dispatch.kujo, utils or new module
Implementation expectations:
- Move normalize_decision into one shared helper.
- Keep behavior parity across CLI and approval engine.
Acceptance criteria:
- One source of truth for decision normalization.
Validation/testing expectations:
- Add decision normalization test matrix.
Done notes:
- Done notes: 2026-05-21 | GPT-5.3-Codex | Added shared decision normalization module and refactored CLI + approval engine to use one source of truth with matrix tests | kujo test-run tests/dispatch_tests.kujo -v; kujo run dispatch.kujo runs --output-root tests/tmp/arch001-smoke --json

### [x] ARCH-002: Introduce reusable CLI argument parser utility
Priority: High
Complexity: M
Files: dispatch.kujo, new cli module, tests
Implementation expectations:
- Replace parse_flag_value, has_flag, collect_positionals with reusable parser.
- Add flag schema with required/optional/value rules.
Acceptance criteria:
- Missing value flags produce clear errors.
- Positionals and flags are unambiguous.
Validation/testing expectations:
- Add parser-focused tests for edge cases.
Done notes:
- Done notes: 2026-05-21 | GPT-5.3-Codex | Added schema-driven CLI arg parser module with unknown/missing/required flag errors and refactored dispatch command handlers to use it | kujo test-run tests/dispatch_tests.kujo -v; kujo run dispatch.kujo runs --output-root tests/tmp/arch002-smoke --json

### [x] ARCH-003: Split tool handlers into modular files
Priority: Medium
Complexity: M
Files: tool.kujo, new tools/ modules, README.md
Implementation expectations:
- Keep tool registry in tool.kujo.
- Move each handler into dedicated module(s).
Acceptance criteria:
- Behavior unchanged.
- Root file size is reduced and easier to navigate.
Validation/testing expectations:
- Existing tests pass; add at least one module-level tool test.
Done notes:
- Done notes: 2026-05-22 | GPT-5.3-Codex | Split tool handlers into dedicated tools modules while keeping registry wiring in tool.kujo, added module-level handler coverage, and updated architecture docs | kujo test-run tests/dispatch_tests.kujo -v; NO_SCRIPTS_RUN_TESTS; kujo run dispatch.kujo runs --output-root tests/tmp/arch003-smoke --json

### [x] ARCH-004: Replace hardcoded agent dispatch with registry mapping
Priority: Medium
Complexity: M
Files: agent.kujo, workflow.kujo, tests
Implementation expectations:
- Use agent_id -> handler map rather than if-chain.
- Make custom agent handlers easier to add.
Acceptance criteria:
- Adding an agent does not require editing a long conditional chain.
Validation/testing expectations:
- Add tests for unknown handler and mapped handler execution.
Done notes:
- Done notes: 2026-05-22 | GPT-5.3-Codex | Replaced run_agent if-chain with registry-based handler mapping, added optional custom handler injection support, and added mapped/unknown handler tests | kujo test-run tests/dispatch_tests.kujo -v; NO_SCRIPTS_RUN_TESTS; kujo run dispatch.kujo runs --output-root tests/tmp/arch004-smoke --json

### [x] ARCH-005: Replace hardcoded tool payload branching with adapter strategy
Priority: Medium
Complexity: M
Files: runner.kujo, workflow.kujo, tests
Implementation expectations:
- Move tool payload shaping to tool-level adapters or step config transforms.
- Avoid runner-specific tool name branching.
Acceptance criteria:
- runner stays orchestration-focused, not tool-specific.
Validation/testing expectations:
- Add tests for custom tool payload mapping.
Done notes:
- Done notes: 2026-05-22 | GPT-5.3-Codex | Moved tool payload shaping into per-tool payload adapters in tool registry, removed runner-specific tool-name branching, and added custom adapter mapping test coverage | kujo test-run tests/dispatch_tests.kujo -v; NO_SCRIPTS_RUN_TESTS; kujo run dispatch.kujo runs --output-root tests/tmp/arch005-smoke --json

### [x] ARCH-006: Support workflow templates by ID
Priority: Medium
Complexity: M
Files: workflow.kujo, dispatch.kujo, README.md, tests
Implementation expectations:
- Add workflow registry (for example: research-report, crud-audit, release-review).
- CLI should choose workflow template by flag.
Acceptance criteria:
- New workflows can be added with minimal core edits.
Validation/testing expectations:
- Add tests for selecting workflow by ID.
Done notes:
- Done notes: 2026-05-22 | GPT-5.3-Codex | Added workflow template registry and create_workflow_by_template selector, wired demo/resume --workflow flag handling, and added known/unknown template tests | kujo test-run tests/dispatch_tests.kujo -v; NO_SCRIPTS_RUN_TESTS; kujo run dispatch.kujo runs --output-root tests/tmp/arch006-smoke --json

### [x] ARCH-007: Restructure repository layout for maintainability
Priority: Medium
Complexity: M
Files: repo structure, imports, README.md, kennel.toml/kujo.toml if needed
Implementation expectations:
- Proposed target shape:
  - src/core (runner, state, retry, step, errors, memory, trace)
  - src/cli (dispatch command entry, argument parser)
  - src/agents
  - src/tools
  - src/workflows
  - docs
  - tests
  - examples
Acceptance criteria:
- Root is cleaner and easier for new contributors.
- Commands and tests continue to run.
Validation/testing expectations:
- Full test run after move + import path validation.
Done notes:
- Done notes: 2026-05-22 | GPT-5.3-Codex | Added src-based module layout (core/cli/agents/tools/workflows) with compatibility wrappers, switched CLI/tests to the new import paths, and updated repository structure docs | kujo test-run tests/dispatch_tests.kujo -v; NO_SCRIPTS_RUN_TESTS; kujo run dispatch.kujo runs --output-root tests/tmp/arch007-smoke --json

## Tier 2 - Extensibility and Developer Utility

### [x] FEAT-001: Add plugin registration for external tools and agents
Priority: High
Complexity: L
Files: workflow/tool/agent modules, README.md, examples
Implementation expectations:
- Allow project-level modules to register extra tools/agents without modifying Dispatch core.
Acceptance criteria:
- External project can inject at least one custom tool and one custom agent.
Validation/testing expectations:
- Add integration test with sample plugin.
Done notes:
- Done notes: 2026-05-22 | GPT-5.3-Codex | Added src/core/plugins runtime plugin registry/merge helpers to inject external tools and agent handlers, and added integration test coverage for custom plugin tool+agent injection | kujo test-run tests/dispatch_tests.kujo -v; NO_SCRIPTS_RUN_TESTS; kujo run dispatch.kujo runs --output-root tests/tmp/feat001-smoke --json

### [x] FEAT-002: Add schema validation for step inputs and outputs
Priority: High
Complexity: L
Files: runner.kujo, step.kujo, workflow.kujo, errors.kujo, tests
Implementation expectations:
- Validate required fields and types before step execution and after output.
Acceptance criteria:
- Bad payloads fail early with actionable errors.
Validation/testing expectations:
- Add tests for schema pass/fail paths.
Done notes:
- Done notes: 2026-05-22 | GPT-5.3-Codex | Added runner-level schema validation for step input/output contracts with actionable error codes and added pass/fail validation tests for required fields and typed outputs | kujo test-run tests/dispatch_tests.kujo -v; NO_SCRIPTS_RUN_TESTS; kujo run dispatch.kujo runs --output-root tests/tmp/feat002-smoke --json

### [x] FEAT-003: Add per-step timeout and cancellation support
Priority: Medium
Complexity: M
Files: runner.kujo, retry.kujo, workflow config, tests
Implementation expectations:
- Add timeout_ms and cancellation state handling.
Acceptance criteria:
- Long-running steps can be safely terminated.
Validation/testing expectations:
- Add tests for timeout behavior.
Done notes:
- Done notes: 2026-05-22 | GPT-5.3-Codex | Added per-step timeout_ms enforcement and workflow cancellation state handling (including cancel_after_step_id option), plus lifecycle tests for timeout and cancellation transitions | kujo test-run tests/dispatch_tests.kujo -v; NO_SCRIPTS_RUN_TESTS; kujo run dispatch.kujo runs --output-root tests/tmp/feat003-smoke --json

### [x] FEAT-004: Add lifecycle event hooks/webhook outputs
Priority: Medium
Complexity: M
Files: trace.kujo, runner.kujo, new hook module, README.md
Implementation expectations:
- Emit normalized events to callback or webhook sink.
Acceptance criteria:
- Consumers can subscribe to run progress externally.
Validation/testing expectations:
- Add tests for hook payload format and invocation count.
Done notes:
- Done notes: 2026-05-22 | GPT-5.3-Codex | Added normalized lifecycle hook events with callback and webhook-sink emission paths, integrated hook emission across runner lifecycle events, and added hook payload/invocation tests | kujo test-run tests/dispatch_tests.kujo -v; NO_SCRIPTS_RUN_TESTS; kujo run dispatch.kujo runs --output-root tests/tmp/feat004-smoke --json

### [x] FEAT-005: Add workflow template for CRUD API reliability review
Priority: Medium
Complexity: M
Files: workflow(s), tools, examples, README.md, tests
Implementation expectations:
- Provide practical Dispatch template for CRUD systems (contract checks, migration safety, auth checks, error-budget notes).
Acceptance criteria:
- Users can run a CRUD-focused workflow with minimal setup.
Validation/testing expectations:
- Add integration test using fixture CRUD input.
Done notes:
- Done notes: 2026-05-22 | GPT-5.3-Codex | Added `crud-reliability` workflow template with CRUD-focused planning/verification/writer guidance and registered it in template selection with end-to-end execution tests | kujo test-run tests/dispatch_tests.kujo -v; NO_SCRIPTS_RUN_TESTS; kujo run dispatch.kujo runs --output-root tests/tmp/feat005-smoke --json

### [x] FEAT-006: Add output retention and cleanup command
Priority: Low
Complexity: S
Files: dispatch.kujo, state.kujo, README.md, tests
Implementation expectations:
- Add command to prune old runs by age/count/status.
Acceptance criteria:
- Cleanup is explicit and safe (dry-run option).
Validation/testing expectations:
- Add tests for dry-run and apply modes.
Done notes:
- Done notes: 2026-05-22 | GPT-5.3-Codex | Added `cleanup` command with dry-run/apply modes plus status/max-count/age filters, implemented prune markers in state listings, and added dry-run/apply cleanup tests | kujo test-run tests/dispatch_tests.kujo -v; NO_SCRIPTS_RUN_TESTS; kujo run dispatch.kujo cleanup --output-root tests/tmp/feat006-smoke --max-count 1 --json

## Tier 3 - Advanced Runtime and Scale

### [x] SCALE-001: Improve run listing performance for large output catalogs
Priority: Medium
Complexity: M
Files: state.kujo, dispatch.kujo, tests
Implementation expectations:
- Add optional pagination/limit for runs command.
- Consider indexing metadata file for faster listing.
Acceptance criteria:
- runs command remains responsive with large run counts.
Validation/testing expectations:
- Add benchmark-oriented regression test or large fixture test.
Done notes:
- Done notes: 2026-05-22 | GPT-5.3-Codex | Added run-list pagination (`--limit`/`--offset`) with `paginate_runs` support and large-catalog pagination test coverage for scalable listings | kujo test-run tests/dispatch_tests.kujo -v; NO_SCRIPTS_RUN_TESTS; kujo run dispatch.kujo runs --output-root tests/tmp/scale001-smoke --limit 5 --offset 0 --json

### [x] SCALE-002: Add jitter to retry policy
Priority: Low
Complexity: S
Files: retry.kujo, workflow defaults, tests
Implementation expectations:
- Extend compute_delay with optional jitter strategy.
Acceptance criteria:
- Retry storms are reduced in multi-run scenarios.
Validation/testing expectations:
- Add deterministic tests with seeded jitter.
Done notes:
- Done notes: 2026-05-22 | GPT-5.3-Codex | Added retry jitter support (`deterministic` and `random` modes with jitter_ms/jitter_seed) and deterministic backoff tests for stable verification | kujo test-run tests/dispatch_tests.kujo -v; NO_SCRIPTS_RUN_TESTS; kujo run dispatch.kujo runs --output-root tests/tmp/scale002-smoke --limit 3 --json

### [x] SCALE-003: Add DAG step dependencies and optional parallel execution
Priority: Low
Complexity: XL
Files: workflow/runner/trace/state/tests
Implementation expectations:
- Expand linear current_step_index model to dependency graph model.
Acceptance criteria:
- Independent steps can execute in parallel safely.
Validation/testing expectations:
- Add integration tests for dependency ordering and artifact consistency.
Done notes:
- Done notes: 2026-05-22 | GPT-5.3-Codex | Added `depends_on` step dependencies, dependency-aware scheduler with deadlock detection, and parallel-ready execution mode support with DAG integration tests | kujo test-run tests/dispatch_tests.kujo -v; NO_SCRIPTS_RUN_TESTS; kujo run dispatch.kujo runs --output-root tests/tmp/scale003-smoke --limit 5 --json

## Testing Backlog Focus (Cross-Cutting)

These are required additions as checklist items above are completed:
- Add dedicated tests for sdk_adapter.kujo behavior.
- Add dedicated tests for dispatch CLI argument parsing.
- Add dedicated security tests for source lookup/path handling.
- Add tests for doctor --write mutation behavior.
- Add tests for malformed/corrupt state.json load/repair paths.
- Add tests covering redaction of sensitive values in persisted artifacts.

## README Update Rules For Future Agents

Whenever an item changes user behavior, command surface, configuration, or repo layout:
1. Update README in the same PR/change set.
2. Add a short "What changed" bullet under the relevant section.
3. If command flags changed, update CLI reference examples.
4. If file structure changed, update repository layout section.

## Suggested Execution Order

Recommended first ten tasks:
1. SEC-001
2. SEC-003
3. ARCH-001
4. ARCH-002
5. SEC-004
6. ARCH-003
7. ARCH-004
8. ARCH-005
9. FEAT-002
10. FEAT-005

## Review Notes For Handoff

- Current codebase is a solid, understandable foundation with strong workflow lifecycle basics.
- Main opportunity is moving from demo-specific orchestration to pluggable production patterns.
- Security hardening for source/path handling and artifact logging should come before major feature growth.
