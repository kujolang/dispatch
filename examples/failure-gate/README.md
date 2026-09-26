# Local failure, review and evaluator-only rerun

From the Dispatch checkout, with sibling repositories available:

```bash
export KUJO_BIN=/absolute/path/to/kujo
export FAILURE_GATE_WORKCELL=/absolute/path/to/workcell
export FAILURE_GATE_EVAL=/absolute/path/to/eval
export FAILURE_GATE_RUNLEDGER=/absolute/path/to/runledger
export FAILURE_GATE_CASEFILE=/absolute/path/to/casefile
export PATH="$FAILURE_GATE_WORKCELL/tests/fixtures/backend-protocol:$PATH"
"$KUJO_BIN" run examples/failure-gate/run.kujo
```

Requires Git, jq and a runtime with bounded artifact I/O and directory sync.
No AI credentials, container daemon or live provider is used. The Workcell
backend is explicitly a fixture, never live-isolation evidence.

The example makes an isolated temporary Git source, runs Workcell with
pre-evaluation export, verifies its manifest, invokes the real Eval producer
with a deterministic missing-file check, and creates a Dispatch review boundary.
It applies a typed local fixture decision through the same semantic validators,
records it, and reruns only Eval. It verifies unchanged input evidence, exactly
one action attempt, two evaluator attempts, and an unexecuted descendant.
RunLedger records the correlation and CaseFile creates a redacted review bundle
inside the temporary source repository. The final JSON points to the handoff.

The fixture's local decision driver is test code, not an authentication service.
Production decisions use `resume-decision`, whose locking/duplicate/conflict
behavior is covered by `bash tests/decision_claim_contract.sh`.

Artifacts remain in the printed temporary directory and
`tests/tmp/failure-golden-runs`. Inspect them before removing them. The successful
proof intentionally leaves the second failed evaluation paused for review.
