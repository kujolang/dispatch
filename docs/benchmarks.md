# Dispatch Benchmarks

Reproducible, offline performance harnesses for Dispatch. Numbers are
hardware-dependent; treat them as relative regression signals, not absolute SLAs.

## Run throughput

Times end-to-end execution of the fixture-backed `research-report` workflow
(9 steps, 1 approval gate, 1 retry probe).

```bash
export DISPATCH_OFFLINE_FIXTURE=true
kujo run tests/benchmarks/run_throughput.kujo 10   # 10 iterations (default)
```

Output reports total wall time, average per-run latency, and runs/sec.

### Interpreting results

- The offline path short-circuits fixture model calls in-process, so benchmark
  results are dominated by Dispatch orchestration, persistence, and trace/report
  artifact work rather than external provider or bridge subprocess latency.
- To benchmark pure orchestration cost, point `AI_SDK_PATH` at a fast local
  stub or compare relative numbers across changes on the same machine.

### Recording a baseline

Capture a baseline on your reference hardware and commit it alongside changes
that affect the hot path (runner, state persistence, trace handling):

```text
# Example shape (values are machine-specific):
Iterations: 10
Total wall time (ms): <T>
Average per-run latency (ms): <T/10>
Throughput (runs/sec): <10000/T>
```

## Release gate sharding

`tests/dispatch_tests.kujo` is intentionally broad and includes many child CLI
smoke checks. Use the release gate for blocking validation:

```bash
export KUJO_BIN=kujo
bash scripts/run_release_gate.sh
```

The script keeps the monolithic test file as the source contract, generates
temporary shards under `tests/tmp/dispatch-test-shards/`, and runs each shard
separately so slow paths are visible by shard instead of turning the whole suite
into one opaque timeout. The default shard count is 24 and can be overridden
with `DISPATCH_TEST_SHARDS=<count>`.

## Index write amplification

Per-step `running` status updates no longer rewrite the full run-index catalog
(`.dispatch-run-index.json`); the index is refreshed at creation and on each
non-`running` status transition. This bounds index writes per run to O(1)
regardless of step count. For very large catalogs, isolate workloads with a
dedicated `--output-root` per service so index writes stay small.

## Focused hardening workloads

```bash
kujo run tests/benchmarks/redaction.kujo
kujo run tests/benchmarks/webhook_sink.kujo
```

The redaction workload processes 200 nested objects and reports elapsed time,
output bytes, and a deterministic output hash. The sink workload appends 200
fixed events to a freshly seeded 1 MiB file and verifies the final size. Both
reset their input per invocation; neither uses provider calls. Compare the same
runtime and machine, and retain raw results when changing these paths. Timing
is evidence, not a blocking CI threshold. Update workload expectations only
when intentionally changing their documented inputs or output contracts.

The release gate now prints one receipt per suite and keeps full runner output
under `tests/tmp/dispatch-test-shards/logs/`. Set `DISPATCH_TEST_VERBOSE=true`
to also print passing logs. Failures retain the full log and print its last 80
lines. This changes verification-script verbosity, not Dispatch CLI output.

The throughput harness exits nonzero if any requested run does not complete.
Its existing output fields are retained, so a failure cannot look like a passing
performance check merely because timing numbers were printed.
