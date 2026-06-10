# R1.2 Interpreter Entrypoint Matrix

Date: 2026-05-24

| Subcommand | Exit | Result |
|---|---:|---|
| init | 4 | FAIL |

## init

Command: ./kujo run main.ruff --interpreter init --name loop-r12
Exit: 4
Excerpt:
```text
Type checking warnings:
  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'init_config'
  --> 0:0
   = note: Function must be defined before it is called
```

| run | 1 | FAIL |

## run

Command: ./kujo run main.ruff --interpreter run examples/basic_suite.json --json
Exit: 1
Excerpt:
```text
Type checking warnings:
  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'init_config'
  --> 0:0
   = note: Function must be defined before it is called
```

| report | 1 | FAIL |

## report

Command: ./kujo run main.ruff --interpreter report
Exit: 1
Excerpt:
```text
Type checking warnings:
  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'init_config'
  --> 0:0
   = note: Function must be defined before it is called
```

| compare | 1 | FAIL |

## compare

Command: ./kujo run main.ruff --interpreter compare ./eval_results/last_run.json ./eval_results/last_run.json
Exit: 1
Excerpt:
```text
Type checking warnings:
  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'init_config'
  --> 0:0
   = note: Function must be defined before it is called
```

| list-checks | 0 | PASS |

## list-checks

Command: ./kujo run main.ruff --interpreter list-checks
Exit: 0
Excerpt:
```text
Type checking warnings:
  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'init_config'
  --> 0:0
   = note: Function must be defined before it is called
```

| snapshots | 0 | PASS |

## snapshots

Command: ./kujo run main.ruff --interpreter snapshots
Exit: 0
Excerpt:
```text
Type checking warnings:
  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'init_config'
  --> 0:0
   = note: Function must be defined before it is called
```

| version | 0 | PASS |

## version

Command: ./kujo run main.ruff --interpreter version
Exit: 0
Excerpt:
```text
Type checking warnings:
  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'init_config'
  --> 0:0
   = note: Function must be defined before it is called
```

| lint | 1 | FAIL |

## lint

Command: ./kujo run main.ruff --interpreter lint examples/basic_suite.json
Exit: 1
Excerpt:
```text
Type checking warnings:
  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'init_config'
  --> 0:0
   = note: Function must be defined before it is called
```

| diff | 0 | PASS |

## diff

Command: ./kujo run main.ruff --interpreter diff README.md README.md
Exit: 0
Excerpt:
```text
Type checking warnings:
  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'init_config'
  --> 0:0
   = note: Function must be defined before it is called
```

| export | 1 | FAIL |

## export

Command: ./kujo run main.ruff --interpreter export examples/basic_suite.json
Exit: 1
Excerpt:
```text
Type checking warnings:
  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'init_config'
  --> 0:0
   = note: Function must be defined before it is called
```

| completion | 4 | FAIL |

## completion

Command: ./kujo run main.ruff --interpreter completion --shell bash
Exit: 4
Excerpt:
```text
Type checking warnings:
  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'normalize_string'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'make_result'
  --> 0:0
   = note: Function must be defined before it is called

  [RUFRUN001] [runtime] Undefined Function: Undefined function 'init_config'
  --> 0:0
   = note: Function must be defined before it is called
```

## watch

Command: ./kujo run main.ruff --interpreter watch --config eval.json
Result: long-running mode; validated separately via start/terminate check.
