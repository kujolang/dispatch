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
