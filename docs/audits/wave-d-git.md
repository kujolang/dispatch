# Wave D non-Ability Git participant audit and evidence

2026-09-27. Experimental, unreleased. No global enablement, execution-result schema
change, new verifier, generic handoff extraction or runtime change.

## 1. Baselines

Fetched clean main before editing:

| Repository | Starting commit | Treatment |
| --- | --- | --- |
| Dispatch | `87f248dc57420f729090b43b0bb1e9586a52bb7c` | Reader, offline controller fixture, gates, docs |
| Workcell | `e66689a8cac6577c22dfaa6c8c5401123f362ce6` | Process example, handoff schema, owner tests, docs |
| Kujo | `d43e1064553dc5a0dc640e48106d74417b0b327b` | Roadmap/docs only |
| Ability | `d6c970785f8d8bea04de0dce37920c2d0ca1c067` | Unchanged; prior participant regression only |
| MCP | `a7ec0dd8e6bcae303ab1431b4586dfe3e91f3a5a` | Unchanged; prior participant regression only |
| Agents SDK | `af0aa28f5960232cbafa7cf528a32db8cb36c7a9` | Unchanged; unrelated maintenance files preserved |

## 2. Participant choice

A controlled local process is the smallest participant without an application
semantics layer. Kujo owns its one-use admission, Workcell action and evidence
recording. Node only supervises deterministic process termination in the offline
rehearsal. No Ability invocation, receipt, gateway, session token or database is
created. Shared controller-fixture branches for older tests are not executed.

## 3. Existing Git lifecycle

Workcell `src/evidence/git_effect.kujo` remains unchanged. It checks the bounded
eight-field intent and old/new OIDs, writes an exact intent blob, then atomically
updates the target with expected old OID and creates the scoped key marker in one
`git update-ref --stdin` transaction. Reapplication observes the existing exact
marker/new target and returns without another mutation. Hooks are disabled,
ambient Git configuration is suppressed and command output/time are bounded.

The existing profile and verifier accept only exact absent/old or marker/new
postconditions. A commit object, command exit code or producer “safe” string alone
is not the predicate. Repository errors and moved targets cannot prove absence.

## 4. Ownership

| Owner | Facts/authority |
| --- | --- |
| Participant | Call/process identity, transport completion knowledge, bounded references |
| Workcell | Scoped intent marker, target CAS, Git postcondition and beta predicate |
| Dispatch | Run/step/action-attempt/effect, immutable required/deny negotiation, review/replay |
| Caller | One asserted call ID; no trusted configuration or control decisions |

## 5. Handoff

Workcell owns `workcell.git-process-handoff/v1alpha1`: 13 closed fields, maximum
4096 UTF-8 bytes, compact sorted JSON, ASCII identifiers of at most 128 characters,
SHA-256 references. See Workcell `docs/controlled-git-participant.md` and
`docs/contracts/git-process-handoff-v1alpha1.schema.json` for every field/bound.
Result bytes bind `process_correlation`; the correlation reader compares them to
authoritative bytes. Assurance attachment creates a new handoff rather than
mutating the initial handoff or result. No receipt field exists.

## 6–8. Crash, absence and replay

| Real SIGKILL boundary | Participant knowledge | Existing live predicate | Fresh reviewed replay |
| --- | --- | --- | --- |
| Before atomic ref transaction | Completion lost | No marker and exact old target: not_started | Executes one transaction |
| After atomic ref transaction, before completion reply | Completion lost | Exact marker plus new target: committed | Deduplicates existing transaction |

The pre-commit barrier follows intent-blob creation: absence means no logical
ref/marker commit, not zero preparatory object-store writes.

Both pause in Dispatch, persist evidence, exit all initial processes, receive a
new beta sidecar, and resume under the original required/deny revision. A weaker
process default does not alter authority. Descendant completion is asserted.
This is surviving authoritative state/filesystem recovery, not machine-loss
recovery or universal rollback.

## 9. Duplicate admission

Owner test starts four actual processes concurrently against one ticket: one
admitted, three denied, one marker/target transition. Each integration denies
reusing both initial and replay tickets. Initial and reviewed attempts execute
in two distinct participant processes; only one logical Git effect remains.
There are no automatic participant retries.

## 10. Identity

`process-call-N` is the controller-correlated participant call; generated UUID is
the process invocation; Dispatch owns its run, `action` step, decimal action
attempt and `effect-1`. `workcell-logical-git-1` is a distinct host correlation
alias, **not** a newly invented Workcell-native transaction ID. Native identity is
scoped key/marker plus intent commitment. The alias stays stable across attempts;
call and process IDs change. Exact result and assurance addresses remain separate.

## 11–12. Trust, privacy and security review

The untrusted request permits only `call_id`; unknown trust/identity fields reject
before claiming. Tickets require full bounded host identity, intent commitment,
current-attempt selection and expiry. Exclusive confined creation prevents
concurrent reuse. An after-claim error is completion unknown, not effect absence.

The reader rejects identity/reference/transaction substitution, unsupported shape,
unsafe references, symlinks, oversized bytes, digest tampering and wire changes.
Installed configuration commits the reader, participant, recorder and supervisor
alongside existing verifier code. Wrong profile/config revision and target fail.
A handoff never grants permission by itself. Live profile verification remains
inside existing locked Dispatch admission with freshness/revocation checks.

Canaries in repository content, repository path and logical target do not appear
in handoffs, participant/controller diagnostics or the control journal. No new
telemetry bus is introduced. There are no Git paths, raw refs or command lines in
public correlation. Host-controlled roots/configuration are trusted, not protected
against a hostile operator/root. Git executable discovery still uses the existing
operator PATH behavior; untrusted input cannot choose it.

A review denial is auditable state mutation, not permission. Tests prove a restored
handoff still needs a fresh checkpoint after denial. Pure evaluation substitutions
leave authoritative exported state unchanged and never call the participant.

## 13. Validation

Workcell `tests/run.sh`, `tests/quality.sh`, `tests/release_report.sh` (249 passed,
0 failed), version consistency, Markdown links, CLI help/version/validate,
`tests/effect_assurance.sh`, official adapter npm tests (23/23), and adapter
integrity checks passed. Kujo `cargo fmt --check` and `cargo test --test
readme_contracts` passed. Logs are in `docs/evidence/wave-d-git/`.

Docker daemon connection failed because its socket is absent; Podman is not
installed. Live OCI/remote-provider gates were not enabled; offline contracts did
run. The first Dispatch gate attempt stopped at the existing HTTP timeout fixture;
a subsequent isolated unchanged run passed. Cause is not established and is not
classified as environmental. The unchanged full Dispatch rerun passed: all focused suites, both new Git paths,
all three HTTP scenarios, both MCP scenarios, SDK, beta migration, all three live
assurance families, persisted negotiation, legacy failure/reexecution/review,
24 contract shards, command smoke and 3/3 bounded release-workload runs. The
initial failure, isolated pass and complete full pass are all retained; no assertion
or required suite was weakened or skipped. No cause is inferred from a passing rerun.

Each Git scenario recorded 15 denied caller/stale/expired inputs, 22 correlation,
shape, integrity, target and profile negatives, two spent-ticket denials, fresh
controller/checkpoint continuation and one logical effect. Fresh source review
confirmed correlation is checked before the unchanged live verifier, no participant
retry exists, no Ability path is invoked, and configuration revision commits the
installed participant/reader code. No unresolved blocker in this bounded slice.
Runtime: optimized Kujo source binary `5d72aab4b99e7f8c01e4c208d6c97061934c7447`,
SHA-256 `4ef726d0020b6df0be78da4b7e96a79d099d414efa83874676038da501a72a93`.
Workcell source compatibility uses its documented `WORKCELL_TEST_KUJO_VERSION=1.5.0`
override; this is not stable 1.2.1 runtime certification. No hosted CI claim.

## 14. Commit map

| Repository | Commit | Purpose |
| --- | --- | --- |
| Workcell | `1940da0639b70b702c1b1077dda51ca39b065216` | Kujo participant/recorder, bounded supervisor, handoff schema, concurrent admission tests and owner docs |
| Dispatch | `6c4c98e539f0f6dc27adfda2da92b2e3f730c5b9` | Correlation reader, real crash/checkpoint fixtures, release gate and reviewed Workcell CI pin |
| Kujo | `1cec8849f72ff8a32e76ac2bec94ba044ed96a25` | Roadmap and architecture status; runtime unchanged |

Evidence and Kujo roadmap commits are listed in the final session handoff and
repository history; this report is part of the evidence commit.

## 15. Four-way field comparison

This inventory was derived from all three existing schemas before implementing
the Git path. No Ability fields were copied into the new handoff.

| Classification | Fields across the actual schemas | Interpretation |
| --- | --- | --- |
| Controller/evidence common | `schema`; `dispatch_run_id`, `dispatch_step_id`, `dispatch_attempt_id`, `dispatch_effect_id`; `execution_result_ref`, `assurance_ref` | Versioned integrity/correlation to Dispatch authority and selected evidence |
| Common concept, participant vocabulary | `outcome`; participant invocation/call identity | Completion knowledge and distinct call/execution IDs are useful across all four, but values/names are not interchangeable |
| Ability-family only | `ability_id`, `ability_version`, `definition_digest`, `ability_invocation_id`, `receipt_id`, `receipt_ref` | Absent from Git; not universal fields |
| Effect-family commitment | `transaction_sha256` in all four; `workcell_effect_id` only Git | Same digest spelling does not imply same semantics: application transaction versus complete Git intent; Git field is a host alias |
| SDK only | `sdk_run_id`, `tool_call_id`, `sdk_invocation_id`, `tool_name` | Agent/tool lifecycle |
| MCP only | `mcp_server_id`, `mcp_session_id`, `rpc_request_id`, `mcp_request_id`, `mcp_invocation_id`, `tool_name` | Protocol/session/tool lifecycle |
| HTTP only | `client_request_id`, `http_request_id`, `method`, `route_id`, `operation_id` | HTTP/application-route correlation |
| Process only | `participant_id`, `participant_call_id`, `participant_invocation_id` | Installed local executor/request/process lifecycle |

These rows account for every field in SDK (19), MCP (21), HTTP (20) and Git (13).
The Git target/scope/key/request/precondition/transaction bindings stay in the
profile assurance, not duplicated as a “universal” handoff. Neither a receipt nor
a globally meaningful transaction ID is required for controller interoperability.

## 16–18. Generic core decision and next step

**YES: enough evidence to design/extract a small correlation/reference core next.**
The non-Ability effect confirms a stable controller subject + exact result address
+ optional selected assurance address + namespaced participant identity/knowledge.
Keep participant details and effect-family commitments in closed versioned
extensions; do not make Ability receipts or generic “transaction” semantics
mandatory. No generic schema was created here.

Next vertical slice: extract that core with explicit adapters/migration tests for
all four existing handoffs, retain old schemas and exact historical bytes, and
prove no change to live verifier or admission policy. Do not generalize lifecycle
states, add provider adapters or turn correlation into replay authority.

Four combinations now demonstrate framework/protocol/HTTP/process participation
across **two** effect families. This supports the extraction decision, not universal
interoperability, remote authentication, multi-effect admission, automatic renewal,
total-store rollback protection or complete Wave D.
