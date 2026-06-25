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

- The offline path still spawns the external SDK bridge subprocess per agent
  step (it falls back to deterministic output when `AI_SDK_PATH` is absent), so
  per-run latency is dominated by subprocess spawn attempts, not core
  orchestration. This is a known optimization opportunity: short-circuit the
  bridge spawn entirely when fixture mode is active.
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

## Index write amplification

Per-step `running` status updates no longer rewrite the full run-index catalog
(`.dispatch-run-index.json`); the index is refreshed at creation and on each
non-`running` status transition. This bounds index writes per run to O(1)
regardless of step count. For very large catalogs, isolate workloads with a
dedicated `--output-root` per service so index writes stay small.
