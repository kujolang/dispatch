# Portable commitments and alpha/beta rehearsal audit

2026-09-27. Outcome: proposed beta prepared for bounded adoption rehearsal; alpha
retained. No stable release, global enablement, new adapter, runtime change or
execution-result/v1 change. Normative material lives in
[portable commitments](../contracts/portable-commitments.md) and
[beta migration](../contracts/beta-migration.md), with profile contracts in owner
repositories. This audit records evidence rather than competing normative rules.

## Starting truth

Fetched clean main, with expected lineage checked:

| Repository | Baseline |
|---|---|
| Dispatch | 6cdc364e21420133be25ad1a03388c5865074962 |
| Kujo | be91137d8f361e41ddf0ef0fa896cda8387b36d0 |
| Workcell | b34c26c90a8626c988a4234fd2610dcf11df1634 |
| Ability | f103ac5904c69ad7a1c6dffb262200f986d734d4 |

Workcell and Ability modifications are owner profile specifications/vectors/tests;
Ability additionally adds an explicit portable-observation domain check. Existing
alpha observation and stable receipts remain unchanged. Other ecosystem repositories
were not modified.

## What changed

- 58 frozen vectors cover exact result bytes, policy/configuration revisions,
  implementation manifest, target/scope/key/request/precondition/transaction,
  application profile/evidence and beta binding commitments. Distinct-byte pairs
  cover whitespace/order/attempt/tenant/target/input/transaction changes.
- Independent standard-library Node/Python checkers and a Kujo regression reproduce
  preimage strings, UTF-8 hex and SHA-256. Ability's own old/v2 digest helpers and
  Git's original serializer are checked rather than silently replaced.
- The clean-room tree imports no ecosystem implementation. It validates six real
  alpha/beta artifact examples against published envelope/profile schemas and exact
  result/profile commitments. This is NOT a live authority verifier.
- Owner specifications define the actual predicate, authentication, byte recipes,
  commit topology, denial semantics, limits, retention and profile extensions.
  Static manifests are advisory and version conformance independently.
- Beta uses a closed common envelope plus separately closed owner binding schemas,
  profile/version selection and live_readback method. No compensation placeholder or
  generic three-mechanism/provenance ladder is frozen into the envelope.
- New beta runs are explicitly required/deny with beta configuration, negotiation
  and controller feature. Alpha runs remain alpha. No in-place migration operation.
- Existing immutable journal/checkpoint/revision authority and live verification
  remain in the replay path. Profile facts are adapted internally to the existing
  v1 predicate resolver; an alpha document is never accepted as beta evidence.

## Rehearsal and boundaries

The matrix creates real SQLite, Git and Ability effects, stops at review, and uses
fresh controller processes. Each family proves alpha continuation, new beta
continuation, actual pre-beta controller refusal, cross-envelope denial, and new
live beta evidence over unchanged historical result bytes. Positive paths execute
a descendant with one logical effect and retain policy/checkpoint identity.

Beta profile checks exercise 33 cases per family against live verifiers; existing
alpha common conformance remains 69 per family. Different envelope/profile/config/
feature versions are not treated as interchangeable. Failed sidecar selection may
leave the permitted audit trail but cannot invoke another business action.

The proposed beta admission domain is deliberately required/deny, local, one effect,
external_idempotent, decimal action IDs and bounded portable values. Alpha optional
fallback remains available under its old exact rules. No renewal, remote identity,
multieffect aggregation, general machine-loss recovery or hostile total-store rollback
protection is added. Ability's historical inner application evidence schema remains
alpha even under a beta envelope: that is explicit nested profile evidence, not
relabeling an alpha assurance document.

## Fresh security review

Reviewed changed core/adapter paths and their control, journal and v1 dependencies.

| Concern | Result |
|---|---|
| Alpha/beta confusion | Separate exact schema/config/profile/feature dispatch; required cross-version inputs deny |
| Generic/profile leakage | Generic schema bounds bindings; owner schemas and reconstructed expected facts close each supported profile |
| Canonicalization | Explicit byte rules, independent vectors; beta canonical-wire equality rejects duplicate keys/alternate encoding |
| Unsupported application numbers/keys | Found during review; added explicit gateway portable observation and authenticated negative tests |
| Identifier schema end anchors | Tightened beta patterns to reject a trailing newline consistently across JSON Schema engines; source already rejected it |
| Algorithm/digest substitution | Fixed SHA-256 lowercase64; original result bytes preserved; profile commitment recomputed |
| Issuer/profile substitution | Operator registry/expected context selects authority and verifier; metadata cannot install code |
| Downgrade on restart | Immutable beta policy, separate guarded codec/feature; old actual controller refuses |
| Reason-code fallback | Beta required path has no fallback; unknown/internal errors remain denials |
| Stale metadata | Manifests advisory; live installed exact revision/revocation is authoritative |
| Evidence/TOCTOU | Existing locked admission and application readback remain live; no cached proof token |
| Privacy | No input/body/session copied into assurance; real fixture canaries remain absent |

An initial Dispatch gate was deliberately stopped for the portable-identity hardening;
it is not reported as a passing run. The final gate validates the corrected source.
A supplementary native schema probe rejected unsupported `then`/`maxProperties` keywords; this is a validator capability limit, not an environmental failure. Published Draft2020-12 schemas were therefore checked with python-jsonschema, including strict identifier negatives. Production admission uses explicit reconstruction/validation, not that native schema helper. An independent vector check also caught generator input aliasing; inputs are now copied before adding transaction identity. No failing result was counted as a pass. Optional live OCI/provider
certification was not requested; offline gates report their normal explicit skips.
The separate known VM early-return defect was not changed; current paths pass on the
reviewed source runtime.

## Validation and provenance

Runtime source: 5d72aab4b99e7f8c01e4c208d6c97061934c7447, optimized binary SHA-256
4ef726d0020b6df0be78da4b7e96a79d099d414efa83874676038da501a72a93.
Local Darwin x86_64, Node26.7.0, Rust1.96.0. No hosted CI claim.

- Dispatch: KUJO_BIN set to the reviewed binary, DISPATCH_OFFLINE_FIXTURE=true,
  `bash scripts/run_release_gate.sh`; includes the new clean-room, portable,
  beta-contract and real migration suites plus prior conformance/persistence gates.
- Ability: `bash scripts/verify-release.sh` with the same KUJO_BIN; includes consumer
  conformance and Fence. New portability regression is in the canonical test runner.
- Workcell: help/version/validate, version consistency, run, quality, release_report,
  markdown_links, official-adapter npm tests and integrity check. The documented
  source-runtime WORKCELL_TEST_KUJO_VERSION=1.5.0 override was used; this is not a
  published-runtime release certification. Report summary: 249 passed, 0 failed.
- Kujo docs only: cargo fmt --check and cargo test --test readme_contracts.
- git diff --check and profile/contract local link checks.

Raw logs, matrix and source hashes are retained under
[evidence/portable-beta](evidence/portable-beta/). Final validation.json is written
only after the full gate exits successfully.

## Blocker decision

| Prior blocker | Decision within declared candidate domain |
|---|---|
| Portable commitment vectors | PASS: independent Node/Python and runtime agreement |
| Complete profile specifications | PASS: three owner documents, schemas, recipes and conformance mapping |
| Actual alpha-to-beta rehearsal | PASS: three real adapters, fresh controllers, exact historical bytes, cross-version denial |
| Remaining critical contract ambiguity | PASS: scoped semantics explicit; unsupported domains deny |

Recommend **beta adoption rehearsal**, not Wave D or stable promotion. Have a separate
consumer implement the published contract/profile specs and run the frozen corpus
against an operator-pinned deployment. Preserve alpha runs/revisions; beta opt-in
must remain explicit. Optional-beta policy, remote trust, arbitrary application
value domains and long-lived evidence renewal require separately reviewed work.

## Final evidence and commit map

The final full Dispatch gate exited 0, including all 24 legacy shards, command
smoke and 3/3 bounded workloads. All modified repository gates passed locally.
[Validation manifest](evidence/portable-beta/validation.json) records hashes and
implementation revisions; [migration matrix](evidence/portable-beta/migration-matrix.json)
records the twelve real-family scenarios.

| Repository | Commit | Purpose |
|---|---|---|
| Dispatch | 9d0fd9d | Portable vectors and independent checkers |
| Dispatch | 940436d | Explicit beta admission with separate alpha authority |
| Dispatch | ddc4b7d | Real three-family migration and conformance |
| Dispatch | 6c5323a | Strict beta schema identifier grammar |
| Workcell | e66689a | Owner Git profile and portable vectors |
| Ability | 7b7f881 | Owner application profile and portable vectors |
| Ability | ca9acea | Authenticated portable observation domain guard |
| Kujo | 4ccd023 | Roadmap and architecture status |

This audit and evidence are committed separately from implementation.
