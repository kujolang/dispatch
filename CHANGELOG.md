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
- Added optional steps: a step marked `optional` that fails or is denied by tool policy now emits a `step_skipped` trace event and the run continues instead of failing.
- Added the `approval-handoff` workflow template, a minimal human-in-the-loop flow that avoids the flaky reliability tool and completes under the `staging`/`production` policy profiles.
- Added the `version` / `--version` command, sourced from `kennel.toml`.
- Added the `--webhook-sink <path.jsonl>` flag to `demo` and `resume` to append lifecycle events to a local JSONL sink.

### Changed
- Moved the domain tool handlers (`source_lookup`, `content_processing`, `reliability_tools`) from the root `tools/` directory into `src/tools/` so all implementation modules live under `src/`. Root-level scripts are now limited to the runtime entry points `dispatch.kujo`, `sdk_adapter.kujo`, and `bridge_chat.kujo`.
- Replaced the bundle signature scheme with a cryptographic keyed SHA-256 MAC (`dispatch-signature-v2`): each artifact is hashed with `sha256`, digests are bound to the run id, and the value is signed with a nested keyed hash so the secret key is never persisted. Bundles signed with the previous non-cryptographic `dispatch-signature-v1` scheme must be re-exported.
- Report titles are now derived from the workflow name instead of a hardcoded research-report label.
- Optimized the per-step state writer to an O(1) in-place update (was an O(n) array rebuild per step mutation).

### Security
- Bundle signing now uses a real keyed cryptographic MAC, replacing the prior character-count fingerprint that embedded the key material in the comparison string.

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
