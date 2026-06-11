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
- Added repository CI gate workflow with deterministic Kujo runtime build and timed regression test steps.
- Added machine-readable JSON envelopes for `show`, `inspect`, and `doctor` command surfaces.
- Added persisted artifact contract metadata (`artifact_contract_version`, `schema_name`, `schema_version`) for run state, trace, and report artifacts.
- Added named policy profile aliases and dedicated CLI/config/env precedence coverage.
- Added strict mutation guards for `doctor --write`, `cleanup --apply`, and `import-run`.
- Added signed run bundle export/import verification paths and deterministic signature failure handling.
- Added incremental doctor scope controls and run index diagnostics metadata for operational scale.

### Changed
- Updated release and pre-release documentation to align with completed enterprise hardening backlog.

## [0.1.0] - 2026-05-27

### Added
- Initial public Dispatch package metadata, core workflow orchestration engine, CLI commands, and baseline documentation.
