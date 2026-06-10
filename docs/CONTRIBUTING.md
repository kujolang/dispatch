# Contributing to Kujo Eval

## Getting Started

1. Clone the repo and ensure the Kujo language runtime is available
2. Run tests: `kujo test` (from the repo root)
3. Run CLI smoke: `kujo run main.ruff version`

## Development Workflow

### Adding a New Check Type

1. Implement in `src/checks.ruff` using the `make_check_error`/`make_check_success` helpers
2. Register in `KNOWN_CHECKS()` in `src/config.ruff`
3. Add dispatch case in `run_check()` in `src/checks.ruff`
4. Add tests in `tests/contract_tests.ruff` (success, failure, edge cases)
5. Update `docs/eval-suite-reference.md` with the new check's parameters

### Code Conventions

- Use `push()` for array appends (never `arr[len(arr)] := value` — VM bug)
- Use `== true` / `== false` for `path_exists()` comparisons (returns bool, not int)
- Use `== 1` / `== 0` for `contains()` and `has_key()` comparisons (return int-like)
- Never use `test` as a variable name (Kujo reserved keyword)
- Keep all imports at the top of the file (no inline imports)
- Export any function that another module imports

### Adding a New Report Format

1. Add `generate_<format>_report(results)` to `src/report.ruff`
2. Add `--format <name>` CLI flag
3. Add tests verifying output structure

### Before Submitting

- Run `kujo test` — all suites must pass
- Run `kujo run main.ruff run examples/basic_suite.json --json`
- Run `kujo run main.ruff list-checks` — verify new checks appear
- Update `CHANGELOG.md` with the appropriate category for user-visible behavior changes
- Run `scripts/release_quality_gates.sh` (or CI equivalent). The release gate enforces changelog coverage when behavior-affecting files change.

### Changelog Gate Notes

- The release gate uses `KUJO_EVAL_CHANGELOG_BASE_REF` (default: `origin/main`) to determine diff scope for behavior changes.
- If behavior-affecting files (`main.ruff`, `src/`, `scripts/`, `examples/`, `schema/`, `tests/`, `kennel.toml`) change, `CHANGELOG.md` must also be updated.

## Project Structure

```
kujo-eval/
├── main.ruff              # CLI entry point
├── kennel.toml            # Package manifest
├── src/
│   ├── common.ruff        # Shared utilities
│   ├── cli.ruff           # CLI argument parsing
│   ├── config.ruff        # Config loading/validation
│   ├── checks.ruff        # All check implementations
│   ├── eval_core.ruff     # Suite runner
│   ├── report.ruff        # Report generators
│   └── snapshot.ruff      # Snapshot management
├── tests/
│   ├── contract_tests.ruff   # API contract tests
│   └── security_tests.ruff   # Security regression tests
├── examples/              # Example eval suites
└── docs/                  # Documentation
```

## Kujo Runtime Notes

See `docs/agent-notes.md` for documented Kujo runtime quirks and workarounds discovered during development.

## Release Process

1. Update `CHANGELOG.md` with all changes since last release
2. Bump version in `kennel.toml`
3. Run full test suite: `kujo test`
4. Run release quality gates: `bash scripts/release_quality_gates.sh` (if available)
5. Tag and push: `git tag vX.Y.Z && git push --tags`
