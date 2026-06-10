# Remediation Baseline Command Matrix

Date: 2026-05-24
Runtime: ./kujo

| Command | Exit | Result |
|---|---:|---|
| `./kujo run main.kujo --interpreter version` | 4 | FAIL |

## [1] ./kujo run main.kujo --interpreter version

Exit: 4

Excerpt:
```text
Type checking warnings:
  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'init_config'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'default_config_path'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'dict_get_or'
  --> 0:0
   = note: Function must be defined before it is called
```

| `./kujo run main.kujo --interpreter list-checks` | 4 | FAIL |

## [2] ./kujo run main.kujo --interpreter list-checks

Exit: 4

Excerpt:
```text
Type checking warnings:
  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'init_config'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'default_config_path'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'dict_get_or'
  --> 0:0
   = note: Function must be defined before it is called
```

| `./kujo run main.kujo --interpreter run examples/basic_suite.json --json` | 4 | FAIL |

## [3] ./kujo run main.kujo --interpreter run examples/basic_suite.json --json

Exit: 4

Excerpt:
```text
Type checking warnings:
  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'init_config'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'default_config_path'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'dict_get_or'
  --> 0:0
   = note: Function must be defined before it is called
```

| `./kujo run main.kujo --interpreter report` | 4 | FAIL |

## [4] ./kujo run main.kujo --interpreter report

Exit: 4

Excerpt:
```text
Type checking warnings:
  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'init_config'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'default_config_path'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [KUJORUN001] [runtime] Undefined Function: Undefined function 'dict_get_or'
  --> 0:0
   = note: Function must be defined before it is called
```

| `./kujo test` | 0 | PASS |

## [5] ./kujo test

Exit: 0

Excerpt:
```text
[✓] tests/contract_tests.kujo (24.64ms)
[✓] tests/cli_integration_tests.kujo (14.52ms)
[✓] tests/security_tests.kujo (14.62ms)
[✓] tests/benchmark_tests.kujo (15.40ms)
[✓] tests/coverage_tests.kujo (19.43ms)
[✓] tests/stress_tests.kujo (14.08ms)
[✓] tests/quality_tests.kujo (15.11ms)

[✓] Passed 7/7 tests
[i] Runtime strategy: dual (vm_primary=7, interpreter_fallback=0)
```

| `./kujo test-run tests/contract_tests.kujo -v` | 1 | FAIL |

## [6] ./kujo test-run tests/contract_tests.kujo -v

Exit: 1

Excerpt:
```text

============================================================
Test Results
============================================================
  ✗ contract version is exported (6ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
  ✗ make_success_result returns ok=true with empty error (4ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
  ✗ make_error_result returns ok=false with error message (4ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
  ✗ make_result handles empty data dict (4ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
  ✗ KNOWN_CHECKS returns all check types (4ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
  ✗ validate_config rejects empty config (4ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
  ✗ validate_config rejects config without name (4ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
  ✗ validate_config rejects config without tests (4ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
  ✗ validate_config rejects unknown check type (3ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
  ✗ validate_config accepts valid config (4ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
  ✗ load_config returns error for missing file (4ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
  ✗ command_succeeds with simple echo (4ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
  ✗ command_succeeds fails on bad command (4ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
  ✗ command_succeeds fails with empty command (3ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
  ✗ run_shell returns ok for valid command (4ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
  ✗ run_shell captures multi-line output (4ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
  ✗ run_shell captures stderr (6ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
  ✗ run_shell returns error for empty command (4ms)
    Error: Setup failed: Failed to evaluate module 'src.eval_core': Symbol 'dict_get_or' not found in module 'src.config'
```

| `bash scripts/release_quality_gates.sh` | 1 | FAIL |

## [7] bash scripts/release_quality_gates.sh

Exit: 1

Excerpt:
```text
=== Kujo Eval Release Quality Gates ===

[GATE 1] Running test suites...
[✓] tests/contract_tests.kujo (22.95ms)
[✓] tests/cli_integration_tests.kujo (15.25ms)
[✓] tests/security_tests.kujo (15.79ms)
[✓] tests/benchmark_tests.kujo (14.70ms)
[✓] tests/coverage_tests.kujo (17.92ms)
[✓] tests/stress_tests.kujo (13.83ms)
[✓] tests/quality_tests.kujo (14.02ms)

[✓] Passed 7/7 tests
[i] Runtime strategy: dual (vm_primary=7, interpreter_fallback=0)
PASS: All test suites pass

[GATE 2] CLI help output...
FAIL: CLI help missing subcommand: list-checks
```

| `bash scripts/supply_chain_policy_check.sh` | 1 | FAIL |

## [8] bash scripts/supply_chain_policy_check.sh

Exit: 1

Excerpt:
```text
=== Kujo Eval Supply-Chain Policy Check ===

  PASS: No root scratch .kujo files
  PASS: All src/*.kujo files exist
  PASS: No hardcoded secrets in source
  PASS: kennel.toml exports match src files
  PASS: RUNTIME_VERSION file exists
  PASS: README doc references are valid
  FAIL: No .out files in git
  PASS: CHANGELOG.md exists

=== Results: 7 passed, 1 failed ===
```

