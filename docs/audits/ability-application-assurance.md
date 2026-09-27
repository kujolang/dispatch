# Ability application-owned assurance validation

## Baselines and ownership

Clean fetched main baselines: Ability `63d4367d677ce350bb2756dab02603170ca44cee`,
Dispatch `0a7551db5c5b7f7c1c90ccfd2c9acc60e369833a`, Workcell
`b34c26c90a8626c988a4234fd2610dcf11df1634`, Kujo
`62f809d30c78c2deaa7003cf6790b4f219c21411`. Requested Wave C ancestors verified.
Workcell and Kujo runtime are untouched. Ability owns application identity and
transactions; Dispatch owns workflow authority. Watchdog/RunLedger remain unchanged.

The source audit and implementation plan preceded coding in Ability
`docs/audits/application-assurance.md`. It maps runtime invocation identity,
principal/tenant attribution, v1 request/key digests, policy/audit callbacks,
receipt construction, replay validation and the exact commit_failed boundary.

## Authentication and profile

An operator-provisioned SQLite session maps a separately supplied credential
hash to canonical principal/tenant, validity and revocation. JSON identity alone
cannot authenticate. The local gateway is trusted installed code; its database,
executable, admitted invocation and credential are outside producer documents.
No hosted IAM or trust against the same OS user is claimed.

The closed 14-field `ability.application-assurance/v1alpha1` profile contains
Ability ID/version/definition/surface, principal/tenant digests, unchanged v1
request/key digests, additional v2 intent commitment, input digest, target,
operation and transaction. Exact profile and evidence digests fit alpha1's
existing fields. A single new mechanism enum (`ability_application_gateway`)
is necessary because the old SQLite mechanism describes one atomic transaction.
Evidence includes observed business state and nullable receipt SHA-256, never
private business bodies. The outer envelope binds current Dispatch
run/step/attempt/effect/exact-result bytes and the existing control boundary.

## Dual-commit and crash matrix

| Termination/failure boundary | Business | Receipt | Fresh continuation |
|---|---:|---:|---|
| Before business | absent | absent | Fenced recovery, one publication |
| Before business transaction commit | rolled back | absent | Fenced recovery, one publication |
| After business commit | committed | absent | Existing exact business key reused; receipt repaired through ordinary execution |
| Before receipt commit | committed | absent | Same deduplicated recovery |
| After receipt commit | committed | committed | Existing Ability replay |
| Before reply | committed | committed | Existing Ability replay |
| SQLite rejects receipt insertion | committed | absent | commit_failed retained; live proof permits deduplicated retry |
| Handler fails before business, receipt cannot commit | absent | absent | commit_failed retained; live absence permits retry |
| Business store unavailable | unknown | unavailable | No assurance; admission blocked |
| Receipt/business disagree | inconsistent | present | Admission blocked |

Six crash barriers use real SIGKILL. Controllers and verifiers exit between
stages. Business content lives in a real private SQLite row; receipts are a
separate durable transaction. The receipt failure test uses an SQLite trigger
that aborts insertion, rather than a fabricated successful transaction or a
service-only return value. No rollback of committed business work is claimed.

## Admission, concurrency and security review

The new opt-in host API `run_workflow_with_admission` reloads state and reconciles
the journal under the existing process-owned run lock, calls trusted admission,
and executes without releasing the lock. The fixture passes
`prepare_assured_continuation`; `retry_is_effect_safe` remains authoritative and
unchanged. The ordinary runner path still supplies no admission callback.

Six simultaneous retries contend after a business commit/receipt failure. One
retry executes, others return existing replay or in_progress, and one business
row remains. Two Dispatch controllers admit one continuation. Recovery generates
an owner fence; a delayed old handler cannot mutate after a replacement finishes.
Revocation/expiry are tested after prior verification and after early gateway
authentication but before business mutation. Live SQLite admission rejects them.

There is no cross-store transaction: revocation after Dispatch admission may
still block the application and create a new controlled failure. A successful
observation is not a reusable admission token. Temporary lock-owner bookkeeping
may change on denied controller attempts; authoritative state bytes do not.

Review covers forged/cross-tenant/cross-principal identity; changed key/input/
Ability version/definition; stale transaction; receipt tampering even with a
recomputed digest; wrong subject/result bytes; revoked/expired sessions; malicious
URL/path and symlink references; oversized and conflicting documents. Denials
have allowlisted codes and fixed messages. The payload canary exists in the
business database and is absent from assurance, verifier output, diagnostics and
journal strings. No producer evidence URL is fetched. The profile relies on a
trusted application store; malicious operator replacement or rollback of that
store is not independently detectable by this prototype.

## Compatibility and defects addressed

Ability's stable runtime and receipt schema are unchanged. Its existing replay
validator trusts application callbacks to bind request/key digests. A regression
fixture makes that seam explicit; the gateway verifies exact persisted receipt
bytes, request/key, principal, Ability/surface and transaction before supplying
replay. Changing the stable schema is unnecessary for this slice.

The existing unknown external-idempotent exception is preserved. Compensation,
manual override, evaluator-only retry and durable review policy are untouched.
Kujo has documentation changes only. No execution-result/v2 or broad Wave C
migration was introduced.

Ability's release gate initially failed because pre-existing `src/profile.kujo`
was missing from Fence's architecture map. The same violation reproduced in an
isolated archive of baseline `63d4367`; a separate commit adds the precise zone
and dependencies, without disabling a rule. Fresh review also replaced a fixture
lock gap with continuous locked admission and strengthened receipt failure to a
real SQLite abort.

## Contract recommendation and exact next task

Keep additive alpha1 assurance. Application facts fit the existing digest fields;
only an additive mechanism enum was needed. This is evidence of generalization,
not evidence that alpha1 is stable or arbitrary adapters are supported.

Next: write the Wave C compatibility/migration specification with a conformance
matrix for these three families. Specify mechanism/profile negotiation, fail-closed
handling by older alpha1 consumers, opt-in legacy coexistence, exact-byte and
canonical digest rules, authority/freshness/revocation obligations, dual-commit
recovery and multi-effect admission boundaries. Use current SQLite/Git/Ability
fixtures as compatibility evidence. Do not enable global assurance, implement
result/v2, or build additional provider adapters in that task.

## Final validation and evidence

All gates passed: Ability canonical release (runtime/contracts, both SDKs,
registry/devkit, CMS/Agents SDK/MCP consumer conformance and Fence); Dispatch
canonical full release (101 tests/24 shards, failure safety 20, failure execution
6, review checkpoints 4, original SQLite/Git assurance, application assurance,
control/reexecution/claim/store/operations/routing/hardening and 3/3 bounded
release runs); final post-review application integration with actual SQL receipt
failure and stale-owner fencing; unchanged Wave A 76-case adapter plus real
HTTP/restart/RunLedger correlation; Kujo docs-only fmt/readme contract checks.
The post-review application fixture was rerun in full after strengthening SQL
failure tests; no unrelated test failure was hidden or suppressed.

Retained evidence is in `docs/evidence/application-assurance-2026-09-26/`:
`proof.json`, exact `assurance.json`, `profile.json`, `result-1.json`, digest
inventory `artifacts.json`, build provenance and gate logs/checksums in
`validation.json`. The final six retry outcomes are 1 admitted, 2 replayed,
3 in_progress, 1 business row; two controller contenders yield 1 admission and
1 rejection. No secret credential or private business body is retained here.

CI pins Ability `f103ac5904c69ad7a1c6dffb262200f986d734d4`; new application CI
builds the reviewed source runtime without raising Ability's stable runtime floor.
The baseline Fence failure is a source configuration defect, not an environmental
excuse. No optional online/provider environment was needed for this offline task.
