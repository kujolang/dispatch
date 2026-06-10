# Command Inventory

Generated from `kujo run main.kujo` help output. Do not edit manually; regenerate with `scripts/generate_command_inventory.sh`.

## Command Surface

| Command | Description |
|---|---|
| `init` | Create an eval.json suite file in the current directory |
| `run` | Execute all tests in an eval suite |
| `report` | Generate a report from the last run (md/html/junit/tap/ndjson) |
| `compare` | Compare two eval run result files |
| `list-checks` | List all available check types |
| `snapshots` | List stored snapshots |
| `version` | Print eval contract version |
| `watch` | Watch config file and re-run on changes |
| `lint` | Validate eval.json without running tests |
| `policy-explain` | Print effective command/path/env policy for a stage |
| `diff` | Compare two files line-by-line |
| `export` | Export eval suite to shell script |
| `verify-manifest` | Verify artifact-manifest checksum entries |
| `completion` | Generate shell completion script (--shell bash|zsh|fish) |

## Canonical Invocation

```bash
kujo run main.kujo <command> [options]
```
