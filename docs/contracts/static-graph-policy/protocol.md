# Static graph policy v1alpha1

Experimental opt-in: anchored workflow `metadata.graph_policy`, schema
`dispatch.static-graph-policy/v1alpha1`. Requires the existing composition and
heterogeneous graph contracts and additive controller feature. Historical result,
parent finalization, participant and input-binding alpha1/alpha2 bytes are unchanged.

## Definition and ownership

The host declares at most eight nodes, two branches and two disjoint one-level
subgraphs in the existing serial DAG. Branch sources are unconditional nodes.
Subgraph members are unconditional in this slice; nested groups and branch-containing
groups are rejected. Every dependency remains statically declared in `depends_on`.
No installed participant can add nodes, change membership or raise a ceiling.

Each branch has `id`, `source`, a closed `predicate` and 2–4 cases with unique `value`
and disjoint `nodes`. Supported predicates are finalized node `terminal_outcome`,
Eval `evaluation_verdict`, or authorized `human_action`. Cases must name descendants
of the source. No JSON expressions, scripts, arbitrary fields or inferred graph edges.
Unmatched durable facts block selection rather than selecting a default path.

A node may declare `config.on_unsuccessful`: `fail` (default), `block`,
`continue_optional` (only an anchored optional node), `route` with a branch whose
source is this node, or `require_review` with a declared required human review node.
Review has its own exact subject/revision and cannot rewrite the original failure.
Needs-changes, policy-required intervention and incomplete Eval remain nonterminal;
no terminal fact is invented just to make them branchable. Unknown effects block
parent finalization and cannot select a terminal branch or authorize retry.

`config.accept_terminal` maps a declared dependency to allowed terminal outcomes.
The default remains successful completion. A remediation node can explicitly accept
its failed Eval predecessor. A conditional join drops only dependencies proved
`not_selected` by a durable activation; unresolved branch membership still blocks.

## Operator boundary

Installed `graph_policy_operation` accepts `kind: branch|subgraph`, `id`, and
`operation: assess|apply`. Assessment is informational. Apply requires the exact
candidate and an actor accepted by the existing installed graph authorizer.

Facts → assess → acquire existing graph lock → reload exact authority/journal/state
→ validate candidate and current input artifacts → retain evidence → revalidate
→ immutable control event → publish state last. Apply returns
`continuation: not_authorized`. Ordinary runner/admission is a separate operation.

`graph_branch_activated` records exact source terminal/fact identity, source revision,
predicate value, active and inactive nodes, graph definition, authority, source state,
journal cursor, actor evidence and resulting revision. It cannot be replaced. Later
alternate Eval files or decisions cannot switch a consumed path. Old source evidence
stays historical; a new graph would need a new explicit definition/authority.

Inactive nodes keep their original pending state. Graph explanation says
`not_selected`, separately retaining declared required membership. This is neither
successful work nor cancellation. Optionality permits omission; inactivity is a
proved policy selection. Outstanding dispatch or consumption can never be waived.

## Subgraphs

A group declares `id`, `members`, `entry` nodes and `policy: required-success`.
Membership is disjoint and immutable. Each member is downstream of every entry.
Members use their ordinary independent execution, effects, Eval and terminal authority.
A group assessment binds exact entry and member terminals and applies the same
bounded failure strategy. All member facts without `graph_subgraph_finalized` remain
nonterminal. Recovery cannot infer that event.

A parent declares `config.after_subgraphs` and all relevant group members in its
static `depends_on` topology. Admission consumes the successful group receipt;
cross-boundary dependencies/data references must declare that group receipt;
its input binding references that receipt instead of copying internal predecessor
terminals. Data still binds the exact independently finalized member output.
Graph success also requires the explicit group terminal decisions. A required failure
may end the graph unsuccessfully with an unentered/unfinalized group; this never
invents a group outcome, and outstanding dispatch or consumption still blocks. No nested
scheduler or new node kind exists.

## Dispatch budget and retries

The policy budget has `max_program_dispatches` (0–8) and `on_exhaustion: block`.
Usage is the number of immutable `node_start_requested` reservations. Reservation
precedes independent child admission; loss of a reply does not refund it. The existing
run lock serializes reservation checks. Existing dispatched/consumed work may resolve
and finalize after exhaustion; new program dispatch is blocked. Local decisions and
mechanical repair do not pretend to be new program executions.

There is no usage-based model/token/cost accounting here. Unknown usage is not zero.
The generic reservation budget makes no pricing or elapsed-time guarantee. Limits
cannot change through state edits or a replacement mutable workflow. No budget
extension/force-recovery command is provided.

Same-node retries are explicitly unsupported (`max_attempts` must remain 1). They
need a separate attempt rebinding/retirement contract before they can safely coexist
with immutable inputs and permanent claims. Repair is a different predeclared node
with its own attempt, capabilities, effects, evaluation and finalization. It never
replays an uncertain original effect.

## Provenance, explanation and compatibility

Input-binding/v1alpha3 adds exact `policy.branches` and `policy.subgraphs` digest
references; local terminal-input/v1alpha2 does likewise. Referenced receipts are
retained among existing content-addressed artifacts. No participant result changes.
Additive vectors cover four independent Kujo/TypeScript/Python/Go encoders.

Graph outcome-candidate/v1alpha2 explains active/inactive requirements, terminal facts,
failure strategies, branch choices, group receipts and reservation budget. Blocked is
an assessment, not a new global lifecycle state. Only the existing separate locked
graph finalization publishes completed/failed/cancelled. Evidence is not authority;
recovery replays validated control projections, never decisions inferred from artifacts.

Remaining boundaries: nested/conditional groups, same-node retries, dynamic topology,
distributed scheduling, remote trust, machine-loss recovery, mixed profiles,
compensation, exactly-once, rollback, stable SDK and new language syntax.
