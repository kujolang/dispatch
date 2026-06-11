# Agent Notes — EvalDevelopment

> **Purpose**: Capture runtime quirks, gotchas, and workflow lessons learned during development loops. Read this before starting any new loop to avoid repeating mistakes.

---

## Kujo Runtime Quirks Discovered

### 1. `arr[len(arr)] := value` crashes in VM mode (CRITICAL)

**Symptom**: `[RUFVM001] Runtime Error: Index out of bounds: 0` at seemingly correct array append code.

**Rule**: NEVER use `arr[len(arr)] := value`. Always use the functional `push()`:
```kujo
// ❌ BROKEN in VM mode
result[len(result)] := item

// ✅ WORKS
result := push(result, item)
```

**Discovered**: Loop 1, item 1.1. Affected 14 instances across 5 files.

---

### 2. Dict literals inside `push()` cause parse errors

**Symptom**: `Expected ')' to close function call arguments but found Identifier`

**Rule**: Never pass a dict literal directly to `push()`. Extract to a temp variable first:
```kujo
// ❌ BROKEN
arr := push(arr, {"key": "value"})

// ✅ WORKS
entry := {"key": "value"}
arr := push(arr, entry)
```

**Discovered**: Loop 1, item 1.1. Affected `config.kujo` and `eval_core.kujo`.

---

### 3. `test` is a reserved keyword — cannot be used as variable name

**Symptom**: `Failed to parse module: Expected test name string after 'test'`

**Rule**: Never use `test` as a variable name. Use `tdef`, `test_item`, etc. instead.
```kujo
// ❌ BROKEN
test := normalize_dict(tests[i])

// ✅ WORKS
tdef := normalize_dict(tests[i])
```

**Discovered**: Loop 1, item 1.1. In `config.kujo` line 171.

---

### 4. Historical: VM import-call regression was fixed in runtime patch

**Symptom (historical)**: `[RUFVM001] Cannot call non-function` when calling functions imported from other modules.

**Current rule**: Use VM-first CLI commands (`kujo run main.kujo ...`) as the default path. Keep `--interpreter` only for compatibility checks and runtime-diff debugging.
```bash
# ✅ PRIMARY PATH
kujo run main.kujo version

# ✅ OPTIONAL COMPATIBILITY CHECK
kujo run main.kujo --interpreter version
```

**Status**: Resolved for this repository's CLI path; keep regression tests VM-first.

---

### 5. `#` comments in JSON files break `parse_json`

**Symptom**: `"error":"Invalid JSON in config file"` even though JSON structure is valid.

**Rule**: JSON files must be pure JSON — no `#` comment lines. For human-readable docs, put comments in a separate README or use `_comment` fields.
```json
// ❌ BROKEN
# This is a comment
{"name": "suite"}

// ✅ WORKS
{"name": "suite"}
```

**Discovered**: Loop 1. Affected `examples/basic_suite.json` and `examples/snapshot_suite.json`.

---

### 6. `args()[0]` is the subcommand, not the first argument

**Symptom**: `command_run` reads `positionals[0]` as config path, gets "run" instead.

**Rule**: When dispatching to subcommand handlers, `positionals[0]` is the subcommand name. Command arguments start at `positionals[1]`.
```kujo
// ❌ BROKEN — positionals[0] is "run"
config_path := positionals[0]

// ✅ WORKS — positionals[1] is the actual config path
config_path := positionals[1]
```

Also update length checks: `compare` needs `len(positionals) < 3` (subcommand + 2 args), not `< 2`.

**Discovered**: Loop 1. Affected `command_run`, `command_report`, `command_compare`.

---

### 7. Inline `from` imports inside function bodies are fragile

**Symptom**: Functions not found at runtime, inconsistent behavior between VM and interpreter modes.

**Rule**: Move all `from` imports to the top of the file. Never put imports inside function bodies.
```kujo
// ❌ AVOID
func my_func() {
    from src.config import KNOWN_CHECKS
    ...
}

// ✅ PREFER
from src.config import KNOWN_CHECKS

func my_func() {
    ...
}
```

**Discovered**: Loop 1. Affected `command_list_checks` in `main.kujo` and `check_snapshot_matches` in `checks.kujo`.

---

### 8. Non-exported functions cannot be imported across modules

**Symptom**: `Symbol 'dict_get_or' not found in module 'src.config'` in VM mode.

**Rule**: Any function that another module imports must be declared with `export`.
```kujo
// ❌ Cannot be imported by other modules
func dict_get_or(obj, key, default_value) { ... }

// ✅ Can be imported by other modules
export func dict_get_or(obj, key, default_value) { ... }
```

**Discovered**: Loop 1. Affected `dict_get_or` and `normalize_string` in `config.kujo`.

---

### 9. KUJORUN001 warnings are benign in interpreter mode

**Symptom**: Large blocks of `[KUJORUN001] Undefined Function` warnings during `--interpreter` execution.

**Rule**: Ignore KUJORUN001 warnings. Key pass/fail decisions off exit codes and actual output, not warning presence. These are type-checker warnings from the pre-pass that don't affect runtime behavior.

**Discovered**: Loop 1. Confirmed from memory notes.

---

### 10. `contains()` may return int (0/1), not bool

**Symptom**: `file_does_not_contain` and `output_does_not_contain` checks produce false failures. `"found":0` in results but `passed":false`.

**Rule**: When comparing `contains()` results, use explicit integer comparison, not boolean:
```kujo
// ❌ MAY FAIL — contains() might return int 0, not bool false
found := contains(text, pattern)
if found == false { ... }

// ✅ RELIABLE
found := contains(text, pattern)
if found == 0 { ... }
```

**Status**: NOT YET FIXED. Known pre-existing issue causing false failures in basic suite. Affects items: `check_file_does_not_contain`, `check_output_does_not_contain`.

---

### 11. `path_exists()` returns bool `true`/`false`, not int `1`/`0`

**Symptom**: `path_exists(path) == 1` fails even when the file exists. In interpreter mode, `path_exists` returns actual boolean values.

**Rule**: Compare with `true`/`false`, not `1`/`0`:
```kujo
// ❌ MAY FAIL in interpreter mode
if path_exists(p) == 1 { ... }

// ✅ RELIABLE
if path_exists(p) == true { ... }
// or simply
if path_exists(p) { ... }
```

**Note**: This differs from `contains()` and `has_key()` which return int-like values. `path_exists` consistently returns boolean.

**Discovered**: Loop 4, item 1.3. Was blocking cache loading in `command_report`.

---

## Workflow Lessons

### Test runner: `kujo test` vs `kujo run`

- `kujo test` runs tests in VM-primary dual mode. Works reliably for contract tests.
- `kujo run main.kujo ...` is the primary CLI execution path and should be used in docs and smoke checks.
- `kujo run --interpreter` remains useful for compatibility parity checks and runtime debugging.
- The Kujo language runtime binary is at `./kujo`.
- The system `kujo` binary is the Python linter — NOT the language runtime. Always use the full path or set `KUJO_BIN`.

### VM-first migration from interpreter-era commands

Historical command examples may include `--interpreter` as the default execution path. Current repository guidance is VM-first:

```bash
# Preferred default
kujo run main.kujo run examples/release_gate_suite.json --output-dir .eval_out --json

# Optional compatibility/parity check
kujo run main.kujo --interpreter run examples/release_gate_suite.json --output-dir .eval_out --json
```

When interpreter mode emits KUJORUN001 warning blocks, treat them as advisory unless command exit code or artifact contract indicates failure.

### Validation pattern for every loop

```bash
export KUJO_BIN="./kujo"
cd /path/to/dispatch

# 1. Run contract tests
$KUJO_BIN test

# 2. Smoke: basic suite
$KUJO_BIN run main.kujo run examples/basic_suite.json --json 2>/dev/null

# 3. Smoke: CLI commands
$KUJO_BIN run main.kujo version
$KUJO_BIN run main.kujo list-checks

# 4. Check exit code
echo "EXIT: $?"
```

### Commit format

```
eval(<ITEM_ID>): <concise imperative summary>

- Bullet points for each change
- Validation: kujo test passed (1/1), <other checks>
```

### Checklist update after each loop

1. Change `### [ ] <ID>` to `### [x] <ID>`
2. Increment tier count in Completion Tracking table
3. Increment Total count in Completion Tracking table
4. Commit with message: `eval: mark item <ID> complete in checklist`

---

## Pre-existing Issues (not yet fixed)

| Issue | Impact | Severity |
|-------|--------|----------|
| `contains()` returns int, not bool | `file_does_not_contain`, `output_does_not_contain` false-fail | Medium |
| `exit(1)` may not set process exit code in interpreter mode | CLI doesn't signal failure to shell | Medium |
| `command_report` re-runs suite instead of reading saved results | Item 1.3 — wasteful re-execution | Medium |
| `timeout_seconds` config field unused | Item 5.6 — no command timeout enforcement | Low |

---

## File Map (for quick reference)

| File | Lines | Key exports |
|------|-------|-------------|
| `main.kujo` | ~340 | CLI dispatch |
| `src/config.kujo` | ~290 | `load_config`, `validate_config`, `init_config`, `KNOWN_CHECKS`, `dict_get_or`, `normalize_string` |
| `src/checks.kujo` | ~800 | `run_check`, all 12 `check_*` functions |
| `src/eval_core.kujo` | ~140 | `run_suite`, `compare_runs`, `contract_version` |
| `src/report.kujo` | ~250 | `generate_markdown_report`, `save_report`, `print_report` |
| `src/snapshot.kujo` | ~200 | `save_snapshot`, `compare_snapshot`, `list_snapshots`, `delete_snapshot` |
| `tests/contract_tests.kujo` | ~690 | All contract tests |
| `docs/improvement-checklist.md` | ~450 | 44 checklist items |
