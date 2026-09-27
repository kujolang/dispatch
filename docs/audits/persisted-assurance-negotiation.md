# Persisted assurance negotiation — audit and implementation plan

Baseline: Dispatch 63d8097551a092fdd65e2bacd0a1f6fecfc15c9a; fetched main.
Kujo documentation baseline 8ae1e285999b241a48536dc2eeca5ad81c4cfd28 includes f63d662.

## Source findings before implementation

- state.kujo::create_run_state persists workflow/options, schema version 2 and revision.
- persist_run_state increments revision; state_store.kujo optionally writes SQLite
  first, then secondary state.json. Backend selection currently depends on environment.
- load_run_state backfills old fields but does not reject future schema versions.
  Therefore additive required_features alone cannot protect against existing readers.
- runner.kujo reloads only for callback admission, then reconciles the control journal
  under the process-owned run lock. Plain resume also needs authoritative reload.
- control_journal.kujo verifies sequence, hash chain, durable records and state cursor;
  it currently does not bind immutable assurance policy.
- checkpoint.kujo hashes the complete state snapshot; no duplicate policy digest is
  needed in its checkpoint envelope.
- Existing bundles contain state/trace/report, not the complete control journal or
  application evidence. Protected imports must preserve policy and remain blocked
  without surviving authority; this task does not add portable recovery.
- Tool policies remain separate from replay assurance. Operator-installed callbacks
  are the existing trust/configuration boundary; no producer-selected executable.

## Planned implementation

Add a bounded normalized negotiation object to run state, immutable and bound to
its initial control-journal record. Identify operator configuration by a SHA-256
commitment covering policy/profile/issuer/mechanism/verifier and authority identity.
Resolve the exact revision live via installed host code; never persist credentials.

Assurance-aware state uses a guarded storage codec in the existing authoritative
state slot and secondary export. Its non-JSON discriminator makes unmodified older
readers fail parsing rather than ignore authority fields. Legacy storage is unchanged.
SQLite rows take precedence even if a replacement process selects filesystem defaults.
Policy removal/substitution is checked against retained journal authority.

Integrate live resolution under the run lock and at protected execution entry;
generic controllers without the installed host fail closed. Preserve explicit legacy
versus historical absence. Keep checkpoints' existing full-state hash binding.

Tests: actual old-reader failure; restart with weaker defaults; missing/revoked/replaced
revision; stale secondary/rolled-back state; policy/checkpoint/import mismatches;
optional fallback including selected-read failure; real SQLite/Git/Ability integration;
legacy and full release gates. No global default change, result schema change or runtime
change. Full replacement of all trusted state/history is outside local rollback
protection, as is arbitrary execution by a host administrator.

## Implemented authority and reviewed boundaries

The source map above describes the pre-change baseline. Implementation is in
`src/core/assurance_state.kujo`, `assurance_configuration.kujo` and
`assurance_admission.kujo`, integrated into the existing state/store, journal,
runner and intervention modules. The canonical local API/storage contract is
[../persisted-assurance-negotiation.md](../persisted-assurance-negotiation.md).
No v1 result, effect envelope, runtime, adapter, Watchdog or RunLedger changes.

Fresh source review checked downgrade, stale SQLite exports, missing rows,
configuration/profile/issuer substitution, manifest replacement, revocation,
checkpoint/import mismatches, sidecar disappearance, journal divergence and
admission timing. Fixes made during review:

- Recheck protected pending **and running** attempts, including after step-start
  hooks/persistence. A controller crash after persisting `running` must not skip
  revalidation. Hook-driven expiry/revocation tests assert zero additional action
  invocations, then repeat from a fresh controller on the retained running state.
- Bind the persisted/redacted workflow and input to the initial journal anchor;
  reject a caller's substituted workflow before protected execution.
- Journal sidecar/replay selections; deleting selection cannot become optional
  absence. Selected read failures never fall back.
- Preserve legacy callers whose options omit output_root: locked reload uses state.
- Public schema constraints use the runtime-supported anyOf vocabulary rather than
  unsupported conditional schema keywords.
- CI fetches old controller history, respects adapter checkout environment paths,
  installs both real adapter repositories for release verification, and uses the
  same reviewed 5d72aab runtime source as local gate evidence. Historical release
  manifests/install smoke pins are not represented as shipping these new features.

Protected policy is immutable; no migration operation is implemented. Generic
controller paths without an installed host refuse protected continuation. The
bounded protected helper supports reviewed retry_step/retry_clean only; other
protected intervention actions need an explicit future API review. Existing legacy
manual override, evaluator-only retry, abort/cancel and v1 policy are unchanged.
State reads are confined and bounded at 8 MiB; implementation manifests at 16 files
of 1 MiB each; selected sidecars at 8 KiB. Operator installation remains trusted code.
No protection is claimed against replacement of the entire store/history, hostile
host administration, distributed atomic revocation or machine-loss restoration.

## Runtime observations

See [retained reproducer](evidence/persisted-negotiation/runtime-return-probe.md).
An independent VM loop/return stack-underflow was reproduced on both pinned optimized
and freshly built current debug Kujo; interpreter passes. It remains open outside
this task. Unsupported nested assignment was also encountered and is already tracked.
Both affected new code paths use supported alternatives; no runtime gate failures
were reclassified as environmental or suppressed.

## Baselines and provenance

Fetched main before editing; requested lineage checks passed. Starting commits:

| Repository | Commit | Scope |
|---|---|---|
| Dispatch | 63d8097551a092fdd65e2bacd0a1f6fecfc15c9a | implementation, fixtures, docs |
| Kujo | 8ae1e285999b241a48536dc2eeca5ad81c4cfd28 | documentation only; includes f63d662 |
| Workcell | b34c26c90a8626c988a4234fd2610dcf11df1634 | read-only real Git adapter |
| Ability | f103ac5904c69ad7a1c6dffb262200f986d734d4 | read-only real application gateway |
| Agents SDK | bb2202d8b54f44717b1b1f0157a6774f2027cea1 | read-only; unrelated local files preserved |
| MCP | 07845898ee9f2662d0e0e364973d77cdaac04762 | read-only |
| Watchdog | e18e437afb221a597d48295b432b0ff356931158 | read-only |
| RunLedger | 97cb607a062efeecc7fcdc4e4a4e0308f90d45fe | read-only |

Host: Darwin x86_64. Rust/cargo 1.96.0. Node v26.7.0. SQLite 3.51.0.
Dispatch gates use the immutable optimized source-runtime binary from Kujo
5d72aab4b99e7f8c01e4c208d6c97061934c7447, SHA-256
4ef726d0020b6df0be78da4b7e96a79d099d414efa83874676038da501a72a93.
This is source-runtime validation, not a claim about published npm/native 1.5.0.
Current Kujo debug build SHA-256 for the independent runtime reproduction:
29ea1fd65a2aadb160b7ae215c4baf6403db66d8972808cbe885005b3b6c82cf.

## Decision and next vertical slice

The local persisted-negotiation criteria are implemented: exact immutable authority,
configuration revision lookup, locked live checks, mixed-version refusal, retained
journal rollback checks and three existing real profiles. Recommend **beta contract
design/review**, not automatic beta promotion. Review the guarded state compatibility
boundary, supported intervention actions, operator manifest/authority installation,
reason codes and migration/retention expectations using this audit and retained tests.

Alpha remains opt-in, experimental and unreleased. Stable ecosystem adoption still
needs migration rehearsals, independently maintained consumers, release evidence and
supported transport security review. Remote trust and multi-effect design are separate;
no Wave D recommendation. The independent runtime defect remains an explicit tracked
risk, not a reason to weaken admission or silently use the interpreter.

## Retained integration results

The final source campaign has 25 persisted-negotiation scenario summaries in
[evidence/persisted-negotiation/persisted_negotiation-proof.json](evidence/persisted-negotiation/persisted_negotiation-proof.json).
These cover weaker replacement defaults, required absence, exact R1 lookup with R2
installed, missing/revoked/substituted configurations, changed verifier bytes,
optional fallback, delayed expiry/revocation, running-attempt restart, oversized
association rejection, policy tampering, stale checkpoint, removed selection,
state rollback, authoritative SQLite over stale JSON and changed process backend,
missing SQLite authority, signed import preservation and actual old-controller
refusal. Old SQLite-reader proof explicitly selects its SQLite backend.

[evidence/persisted-negotiation/persisted_negotiation_adapters-proof.json](evidence/persisted-negotiation/persisted_negotiation_adapters-proof.json)
records required-mode SQLite, Git and Ability paths: separate controller processes,
checkpoint, weaker replacement default, exact original revision, trusted live
verification, replay and descendant completion. Each verifies one logical effect
(SQLite/application row count; Git target-ref postcondition). Logs/journal exclude
payload/session canaries. Ability begins with a real business commit plus replay
receipt failure, then recovers through its unchanged application-owned gateway.
Existing common conformance is also rerun by the canonical gate.

Policy behavior is unchanged from the canonical specification:

| Persisted mode / observation | Outcome |
|---|---|
| Historical absent policy or explicit legacy | Existing v1 semantics; no assurance fabricated |
| Required + recognized verified assurance | Existing v1 replay safety still decides |
| Required or optional/deny + unavailable assurance | Deny |
| Optional/legacy_unavailable + absent or unsupported envelope/profile | Explicit fallback to v1 only |
| Recognized invalid, expired or revoked assurance | Deny; no fallback |
| Selected sidecar read failure/tampering | Deny, never absence |
| Missing/revoked/substituted exact configuration revision | Deny, regardless of fallback |
| Running retry after pause/crash | Live recheck before executing again |

Source hashes tie the evidence to implementation commit 006ff1a and fixtures/CI
commit fb7d7c6. Proof stdout digests are retained alongside normalized repository-
relative evidence paths; workload payloads and application credentials are not copied.

## Validation procedure

The final canonical run uses `KUJO_BIN=<pinned optimized binary>` and
`DISPATCH_OFFLINE_FIXTURE=true bash scripts/run_release_gate.sh`. Earlier development
runs exposed and fixed the legacy output_root assumption and fixture/schema issues;
two incomplete campaigns were deliberately stopped for review fixes. They are not
counted as passes. No failing check was disabled or suppressed. Final runtime/core/
fixture source stayed frozen during the retained complete campaign.

Kujo documentation-only validation: `cargo fmt --check` and
`cargo test --test readme_contracts` passed (1 test, after a successful cold build).
Node syntax, shell syntax, workflow YAML parsing and `git diff --check` passed.
CI checkout roots/history and runtime pin were checked locally; hosted Linux/macOS
CI execution is distinct from this local Darwin run. No live SaaS credentials or
optional online environments were needed. Full Kujo runtime gates and unrelated
Wave A/consumer repository gates were not rerun: their source/contracts are unchanged.

**Final result: PASS.** Full Dispatch release gate: all focused suites, 101 legacy
contract tests in 24 shards, VM/interpreter command smoke and 3/3 offline release
workloads. Retained [gate output](evidence/persisted-negotiation/release-gate.txt),
[validation summary](evidence/persisted-negotiation/validation.json) and
[source hashes](evidence/persisted-negotiation/validated-source-sha256.json).
