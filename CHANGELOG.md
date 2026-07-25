# Changelog

All notable changes to this project will be documented in this file.

This project follows Keep a Changelog and Semantic Versioning.

## Versioning Policy

- Source of truth version: `kennel.toml` -> `[package].version`.
- Version format: `MAJOR.MINOR.PATCH`.
- `MAJOR`: incompatible CLI/output or contract changes.
- `MINOR`: backward-compatible features and behavior expansions.
- `PATCH`: backward-compatible fixes, security remediations, and documentation corrections.
- Pre-1.0 policy:
  - Breaking changes MAY be released in minor increments while the package is experimental.
  - Breaking changes MUST still be explicitly called out in changelog entries.

## Changelog Entry Policy

Each release section should include only shipped changes and use these headings when applicable:

- Added
- Changed
- Deprecated
- Removed
- Fixed
- Security

## [Unreleased]

### Added
- Added `scripts/run_release_gate.sh`, a bounded release-validation gate that
  runs focused integration suites and generated shards of the broad Dispatch
  contract suite.
- Added a declarative workflow loader: `demo --workflow-file <spec.json>` builds and runs a user-authored workflow from JSON (`src/workflows/loader.kujo`), with an example at `examples/workflows/custom-review.json`.
- Added per-template report builders: the `crud-reliability` report now renders purpose-built Contract/Migration/Auth/Error-Budget sections.
- Added structured run input via `demo --input-json '{...}'`, merged into the run input alongside `topic`.
- Added CLI plugin injection (`--plugin <name>`) backed by a built-in plugin registry (`src/plugins/builtin_plugins.kujo`); the `sample` plugin contributes a tool, an agent handler, and a lifecycle `event_hook`.
- Added a public custom-trace API: tool/agent handlers may return `trace_events` that the runner appends to the run trace.
- Added a reproducible offline throughput benchmark (`tests/benchmarks/run_throughput.kujo`, `docs/benchmarks.md`) and a quickstart walkthrough (`examples/quickstart-walkthrough.md`).
- Added crash-safe, torn-write-safe atomic artifact writes (stage to a temp file, then `rename`) for state, trace, report, run index, mutation audit, and exported bundles.
- Added bundle signing key rotation: signatures record a `key_id` (`DISPATCH_BUNDLE_SIGNING_KEY_ID`/`--signing-key-id`) and verification can trust a key set (`DISPATCH_BUNDLE_SIGNING_KEYS`) so keys rotate without invalidating in-flight bundles.
- Added a `--webhook-sink` path guard (absolute/traversal paths blocked unless `DISPATCH_ALLOW_ANY_WEBHOOK_SINK=true`) and a `--webhook-url` best-effort HTTP lifecycle sink.
- Added `--cancel-after-step <step-id>` cooperative cancellation to `demo`/`resume`.
- Added per-step `idempotency_key` support: keyed results are cached in run state and reused on resume instead of re-executing side effects.
- Added a configurable SDK bridge timeout (`DISPATCH_SDK_TIMEOUT_MS`) and a `state.json` size-budget diagnostic (`DISPATCH_STATE_MAX_BYTES`, surfaced by `doctor`).
- Added CI guards: package version consistency (`kennel.toml`/`kujo.toml`), a pinned Kujo runtime ref, and a warning-free default-run smoke.
- Added optional steps: a step marked `optional` that fails or is denied by tool policy now emits a `step_skipped` trace event and the run continues instead of failing.
- Added the `approval-handoff` workflow template, a minimal human-in-the-loop flow that avoids the flaky reliability tool and completes under the `staging`/`production` policy profiles.
- Added the `version` / `--version` command, sourced from `kennel.toml`.
- Added the `--webhook-sink <path.jsonl>` flag to `demo` and `resume` to append lifecycle events to a local JSONL sink.

### Changed
- Removed the no-op `parallel_execution` runner branch and reframed the README scheduling claim: steps execute sequentially in a single process with `depends_on` gating order (no concurrent execution).
- Bounded run-index write amplification: per-step `running` status updates no longer rewrite the full catalog index; it is refreshed at run creation and on each non-`running` status transition.
- Extracted the CLI output/version/contract helper cluster from `dispatch.kujo` into `src/cli/output.kujo`.
- Documented and adopted the default bytecode VM run path (`kujo run dispatch.kujo ...`) as canonical; it executes with no diagnostic output. The `--interpreter` (tree-walking) mode remains supported for debugging but emits `[KUJORUN001]` type-checker warnings. README, docs, help text, and the test subprocess calls now use the VM path.
- Moved the domain tool handlers (`source_lookup`, `content_processing`, `reliability_tools`) from the root `tools/` directory into `src/tools/` so all implementation modules live under `src/`. Root-level scripts are now limited to the runtime entry points `dispatch.kujo`, `sdk_adapter.kujo`, and `bridge_chat.kujo`.
- Replaced the bundle signature scheme with a cryptographic keyed SHA-256 MAC (`dispatch-signature-v2`): each artifact is hashed with `sha256`, digests are bound to the run id, and the value is signed with a nested keyed hash so the secret key is never persisted. Bundles signed with the previous non-cryptographic `dispatch-signature-v1` scheme must be re-exported.
- Report titles are now derived from the workflow name instead of a hardcoded research-report label.
- Optimized the per-step state writer to an O(1) in-place update (was an O(n) array rebuild per step mutation).

### Security
- Bundle signing now uses a real keyed cryptographic MAC, replacing the prior character-count fingerprint that embedded the key material in the comparison string.
- Bundle signing supports key rotation via a trusted key set, and documentation recommends supplying the signing key by environment variable rather than the `--signing-key` flag to keep it out of process arguments.
- `--webhook-sink` paths are constrained to safe relative locations by default, preventing arbitrary file writes outside the workspace.
- Atomic artifact writes prevent torn/partial files from crashes or concurrent readers; a threat model and concurrency guidance were added to the enterprise deployment guide.

### Fixed
- Fixed the built-in `research-report` and `crud-reliability` templates failing under the `staging`/`production` policy profiles by marking the reliability probe step optional.

## [1.0.0] - 2026-06-10

### Added
- Added repository CI gate workflow with deterministic Kujo runtime build and timed regression test steps.
- Added machine-readable JSON envelopes for `show`, `inspect`, and `doctor` command surfaces.
- Added persisted artifact contract metadata (`artifact_contract_version`, `schema_name`, `schema_version`) for run state, trace, and report artifacts.
- Added named policy profile aliases and dedicated CLI/config/env precedence coverage.
- Added strict mutation guards for `doctor --write`, `cleanup --apply`, and `import-run`.
- Added signed run bundle export/import verification paths and deterministic signature failure handling.
- Added incremental doctor scope controls and run index diagnostics metadata for operational scale.

### Changed
- Renamed the remaining legacy repository config filename to `kujo.toml`.
- Standardized local path examples to generic `/path/to/` placeholders in release-facing docs.
- Bumped the package release version to `1.0.0`.
- Updated release and pre-release documentation to align with completed enterprise hardening backlog.

## [0.1.0] - 2026-05-27

### Added
- Initial public Dispatch package metadata, core workflow orchestration engine, CLI commands, and baseline documentation.
