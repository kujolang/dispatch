# Getting Started Tutorial

A step-by-step guide to using Kujo Eval.

## Step 1: Verify Kujo Runtime Is Installed

```bash
export KUJO_BIN=./kujo
"$KUJO_BIN" --version
```

Important:
- This project requires the Kujo language runtime binary.
- If `kujo --version` in your shell points to the Python linter tool, use `"$KUJO_BIN"` in all commands below.

## Step 2: Initialize Your First Eval Suite

```bash
cd your-project
kujo run main.ruff init --name my-first-suite
```

This creates an `eval.json` file with 3 example tests. Choose a template with `--template`:
- `basic` — command + file checks (default)
- `cli` — CLI-focused tests
- `web` — HTTP endpoint tests
- `agent` — agent output tests

## Step 3: Look at Your eval.json

```bash
cat eval.json
```

You'll see something like:

```json
{
  "name": "my-first-suite",
  "description": "Eval suite for my-first-suite (template: basic)",
  "version": "0.1.0",
  "output_dir": "./eval_results",
  "snapshot_dir": "./snapshots",
  "stop_on_failure": false,
  "tests": [
    {
      "name": "example: command succeeds",
      "check": "command_succeeds",
      "params": { "command": "echo hello world" }
    }
  ]
}
```

## Step 4: Customize Your Tests

Edit `eval.json` to test YOUR code. Here's an example testing a CLI tool:

```json
{
  "name": "my-cli-tests",
  "tests": [
    {"name": "help flag works", "check": "command_succeeds", "params": {"command": "./mytool --help"}},
    {"name": "produces output file", "check": "file_exists", "params": {"path": "./output/result.txt"}},
    {"name": "output is valid JSON", "check": "json_matches_shape", "params": {"path": "./output/result.json", "required_keys": ["status"]}}
  ]
}
```

## Step 5: Run Your Suite

```bash
kujo run main.ruff run
```

Output:
```
Running eval suite: eval.json

[PASS] help flag works
[PASS] produces output file
[PASS] output is valid JSON
```

## Step 6: View the Report

```bash
kujo run main.ruff report
```

Generates a markdown report at `eval_results/eval-report.md`. For HTML:

```bash
kujo run main.ruff report --format html
```

## Step 7: Add More Checks

Explore available check types:

```bash
kujo run main.ruff list-checks
# Lists all 27 check types
```

See `docs/eval-suite-reference.md` for parameters for each check type.

## Step 8: Use in CI

```yaml
# .github/workflows/eval.yml
- name: Run Eval
  run: kujo run main.ruff run --quiet --json
```

Eval exits with code 1 on any failure — perfect for CI gates.

## Step 9: Advanced Features

- **Filtering**: `--filter auth` runs only tests with "auth" in the name
- **Tags**: Add `"tags": ["smoke"]` to tests, then `--tags smoke`
- **Retry**: Add `"retry": 2` to flaky tests
- **Snapshots**: Use `check: "snapshot_matches"` and `--update-snapshots`
- **Watch mode**: `kujo run main.ruff watch`
- **Lint**: `kujo run main.ruff lint`
- **Export**: `kujo run main.ruff export`

## Next Steps

- Read `docs/COOKBOOK.md` for copy-paste recipes
- Read `docs/ECOSYSTEM.md` for Scout/Dispatch/RAG integration
- Read `docs/ARCHITECTURE.md` for internal design
