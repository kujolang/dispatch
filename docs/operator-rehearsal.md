# Operate a local batch-summary graph (experimental)

This walkthrough uses a trusted local host, a static five-node graph and retained
local storage. It is not a stable graph SDK or a claim of general production
readiness. The installed host runs this one workflow; it does not accept arbitrary
participant code or topology.

## Install and configure

Prerequisites: macOS or Linux, Bash, curl, tar, Git, and Kujo 1.6.0 with the
`sync_directory_beneath` runtime primitive. No provider account is needed. The
current release manifest pins a runtime **source commit**: its normal installer
path needs Cargo. To use a binary-only installation, use the verified 1.6.0 release
archive and its published SHA-256 file instead. Do not mistake an unavailable
release named after a source SHA for a verified binary installation.

The following binary-install manifest was rehearsed without Cargo. The installer
verifies the runtime release checksum. Use a new prefix and run the commands from
a fresh directory (the source refs below are intentionally pinned):

```bash
curl -fsSL https://raw.githubusercontent.com/kujolang/kujo/fc53093f35e4236682bbbf5ab1ccc8d2b4df990c/install.sh -o install.sh
cat > operator.refs <<'REFS'
kujo=v1.6.0
ai-sdk=5184a122590dd5698770b50d99b69ed11c7ec84a
agents-sdk=5a9d5525e511a293b743b1c44d9ef270fd491f9f
dispatch=1fd7b46289ae3c07ee0cec2cf88a80bdca377246
REFS
bash install.sh --package dispatch --release-manifest "$PWD/operator.refs" \
  --prefix "$PWD/installed" --bin-dir "$PWD/bin"
export PATH="$PWD/bin:$PATH"
bash installed/sources/dispatch/scripts/install_operator_dependencies.sh
cp installed/sources/dispatch/examples/operator/batch.json batch.json
```

Source archives are the installed package format; an editable Git checkout is not
needed. This manifest installs the bounded host, not an unpublished participant
SDK or a new stable graph release. The package's default source-runtime manifest
remains unchanged for canonical source-build validation.

The script downloads Workcell and Eval into `.operator-deps` without symlinks or
test-fixture preparation. It refuses to overwrite an existing dependency directory.
Set `DISPATCH_OPERATOR_DEPS` to a fresh absolute directory to install elsewhere.
Keep the installed code and dependencies unchanged for the lifetime of a run:
implementation/configuration changes invalidate its authority.

Copy `examples/operator/batch.json` into your project. Its `amounts` are bounded
integer inputs; `expected_total` is the Eval criterion, not a claimed result.
`program_limit` and `eval_limit` are immutable ceilings for this run. Initializing
copies the exact source input, records its digest and the local OS user ID, creates
retained Git workspaces and negotiates each independent node run.

```bash
dispatch operator init /absolute/batch-run /absolute/batch.json
dispatch operator inspect /absolute/batch-run --json
```

If you installed a source archive without a `dispatch` shim, use
`kujo run /installed/dispatch/dispatch.kujo operator ...` with `DISPATCH_ROOT` set
to that installed directory, or `bash /installed/dispatch/scripts/operator.sh ...`.
The latter resolves its installed files itself and works from any directory.
Only the initializing OS user is accepted by this trusted-host example. Filesystem
ownership and local executable permissions remain the host trust boundary.

## Plan, apply, then separately continue

A plan is an exact, reviewable candidate. It grants no authority and writes no run
state. Keep plans outside the retained workspace when comparing read-only snapshots.
For each operation below, use this pattern, inspect the resulting JSON, then apply:

```bash
dispatch operator plan /absolute/batch-run reserve A > /absolute/plan.json
cat /absolute/plan.json
dispatch operator apply /absolute/batch-run /absolute/plan.json
dispatch operator run /absolute/batch-run
```

`run` uses Dispatch's existing DAG and one-use node admission. It may stop with
`node_requires_independent_finalization`; that is the expected control boundary,
not permission to replay. A program produces typed JSON and a proposed SQLite
receipt. Admit that receipt separately, and verify it by independent sink readback.
For A, plan/apply each operation in this order:

```text
refresh A
select A
admit A
refresh A
parent-finalize A
```

`admit` explicitly authorizes the one selected SQLite mutation. `refresh` reads the
sink and retains evidence. `parent-finalize` accepts the exact output, its local
schema evaluation, preservation and effect evidence. No operation runs B or R.
Then call `run` again so the DAG observes A's independent finalization.

## Human review, Eval and branch

```bash
dispatch operator review /absolute/batch-run
```

This creates H's durable review request for the exact A output. Inspect it before
planning `approve H` (or `deny H`), then apply that plan. Approval binds the subject,
input digest, request, revision and OS-user actor. A stale plan must be regenerated;
a wrong subject or actor is rejected. Approval does not execute Eval or consumers.

Plan/apply each operation:

```text
reserve E
eval-dispatch E
observe E
node-finalize E
branch graph
```

Eval runs in a fresh process against the exact bound A output. `observe E` records
its actual runtime measurement artifact; it does not invent model usage. Eval
finalization and branch activation remain separate from executing the selected
consumer. On pass, reserve B and call `run`. On fail, reserve R and call `run`.
The other branch is `not_selected`, consuming no program capacity.

Finish the selected consumer with the same five receipt/finalization operations
used for A. Call `run` again, then plan/apply `graph-finalize graph`.

## Inspect failure, budget and provenance

```bash
dispatch operator inspect /absolute/batch-run --json
```

The report references exact input bindings, output digests, node terminals,
attempt history, review evidence, branch decisions, graph outcome and retained
recovery assessment. Resource totals preserve observed/provider-reported/estimated
classes and explicit unknowns. A known partial sum is not a complete total.
No model was invoked in this workflow; monetary cost and model usage have no
sourced measurement and are not reported as measured zero.

To exercise a real failed quality check, initialize a **new** workspace from a
config with `expected_total: 99`. Eval fails and the explicitly configured repair
branch R publishes the summary receipt. A failed quality check remains in history;
routing it does not rewrite the verdict as pass.

To exercise exhaustion, initialize another workspace with `eval_limit: 0`.
After A and H complete, `plan ... reserve E` rejects for lack of Eval capacity.
Do not edit the anchored ceiling or restore old state. Consumed work can still
record evidence and finalize when the remaining available capacity is zero.

## Controller failure and retained recovery

After a controller dies, begin with `inspect`, then `plan ... recover graph`.
The plan comes from the existing retained-host recovery engine. Apply only a
permitted mechanical repair, then inspect again. A consistent run needs no repair;
continue with ordinary plans/admission. For a child, use its node ID instead of
`graph`. Recovery never runs a node or chooses a branch.

A consumed attempt remains consumed even if its reply was lost. An unresolved
Eval may be resolved only from the installed adapter's exact retained response
(`eval-resolve E`); absence of that response remains uncertainty. Never refund or
rerun it based on budget availability. This example deliberately provides no
force-recover command, ceiling extension, evidence renewal, or unsafe retry.

The preservation/effect evidence window is bounded to roughly one hour. Expiry
may prevent further execution/finalization even though history remains readable.
Do not reset the workspace to evade expiry. The deeper renewal APIs are outside
this first-hour workflow.

See [resource accounting](contracts/resources/protocol.md),
[graph attempts](contracts/graph-attempts/operator.md), and
[retained recovery](contracts/recovery/retained-host.md) for the authority
contracts. The rehearsal evidence and remaining friction are recorded separately.
