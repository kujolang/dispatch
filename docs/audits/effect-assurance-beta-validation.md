# Beta review validation and security record

Date: 2026-09-27. Baselines are in the [review](../effect-assurance-beta-review.md).
The source fix is `bf57c4f`. This is local source-runtime validation, not a release,
production certification, benchmark or observed hosted-CI result.

## Reproduction and scope

Before changing code, the added test passed existing legacy comparisons then failed
on malformed selected JSON under an unknown host-selected profile with optional
legacy_unavailable. Retained [before](evidence/beta-review/fallback-before.txt) and
[after](evidence/beta-review/fallback-after.txt) outputs establish the regression.
The fix performs bounded framing and recognized-envelope checks before unsupported
profile fallback. It does not execute an unknown profile or interpret an unknown
envelope's interior. Shape validation is reused from the resolver, not duplicated.

Changed code and test hashes are in
[validated-source-sha256.json](evidence/beta-review/validated-source-sha256.json).
The two source files and two tests were held unchanged during the full gate.

## Commands and provenance

```sh
KUJO_BIN=/tmp/kujo-wave-a-release-candidate-bin DISPATCH_OFFLINE_FIXTURE=true bash scripts/run_release_gate.sh
# Kujo docs-only changes:
cargo fmt --check
cargo test --test readme_contracts
# Both modified repositories:
git diff --check
```

Runtime: optimized Kujo source `5d72aab4b99e7f8c01e4c208d6c97061934c7447`;
binary SHA-256 `4ef726d0020b6df0be78da4b7e96a79d099d414efa83874676038da501a72a93`.
Host Darwin x86_64; Rust 1.96.0 (ac68faa20); Node v26.7.0. No runtime source edits.
Kujo formatter and readme contract test pass (1 test); existing vendored tiny_http
unused-import/dead-code warnings were not suppressed.

Full gate outcome is recorded in [validation.json](evidence/beta-review/validation.json)
and [release-gate.txt](evidence/beta-review/release-gate.txt). These artifacts are
written only after the gate exits successfully. Unmodified supporting repositories
were exercised through Dispatch's real integration paths, not claimed separately
as full repository release validations.

## Real evidence

- Common conformance: **69 checks each** for [SQLite](evidence/beta-review/sqlite-conformance.json),
  [Git](evidence/beta-review/git-conformance.json) and
  [Ability](evidence/beta-review/ability-conformance.json); previously 62.
- [SQLite/Git crash paths](evidence/beta-review/effect-assurance.txt): real SIGKILL
  before/after commit, 45 assurance cases per crash path; expired and non-idempotent
  cases deny; replay yields one logical effect.
- [Ability](evidence/beta-review/ability-assurance.txt): six crash boundaries,
  business-commit/receipt-failure, corrupted/unavailable state, delayed expiry and
  revocation. Six concurrent contenders: 1 admitted, 4 replayed, 1 in-progress,
  1 business effect. Two Dispatch controllers: 1 admitted, 1 rejected. Counts are
  this run's observations, not fixed scheduling guarantees.
- [Persisted negotiation](evidence/beta-review/persisted-negotiation.txt): 25 cases
  covering missing/revoked/replaced configuration, weaker restart defaults, stale
  state/checkpoints/exports, tampering, selected-sidecar read failure, delayed
  execution checks and actual old-controller refusal.
- [Required-mode families](evidence/beta-review/persisted-adapters-proof.json): all
  three use a fresh controller, retained checkpoint, descendant execution and one
  logical effect. Privacy assertions pass.

## Fresh security review

Scope: final changed source/tests plus their resolver, persisted configuration,
selection and v1 admission dependencies; documentation checked against those paths.
This is a source review, not a hosted security-scanner or independent third-party
certification. Every changed source file was reread after the regression passed.

| Risk | Review result |
|---|---|
| Optional downgrade precedence | Fixed and tested: malformed/oversized/expired/wrong-digest/extra-field known alpha cannot hide behind unknown host profile |
| Unknown envelope partial interpretation | Only bounded JSON framing/schema ID read; no interior proof or executable selection |
| Profile/issuer/catalog confusion | Selection and expected context remain host-owned; catalog cannot install authority; revoked/disabled matches deny first |
| Algorithm/result substitution | Exact result SHA-256 checked before fallback; lowercase closed alpha digests; historical bytes not rewritten |
| Live verifier failure/selected read failure | Existing resolver and persisted loader deny; not converted to missing |
| Revision aliasing/revocation | Existing exact descriptor/code/authority checks and delayed live admission remain intact |
| Old controller/rollback | Guarded authoritative state and surviving journal checks; same-root total rollback explicitly outside trust model |
| Cross-profile/tenant evidence | Existing profile binding/live verification and Ability authentication remain mandatory; no new producer authority |
| Payload leakage/cardinality | No payload/label fields added; fixed codes, 8 KiB sidecar preflight; existing canaries pass |
| Duplicate JSON keys/portable serialization | Not frozen as beta semantics; strict portable vectors/reader rules remain B1, no runtime parser change |
| Evidence expiry/renewal | Corrected broad documentation promise; immutable selected evidence is not automatically replaceable |

No additional demonstrated admission bypass was found in this bounded final review.
B1–B3 are contract-freeze blockers, not claims that the fixed alpha is universally
safe. No global assurance enablement, beta acceptance, result/v2, remote trust,
multi-effect or new adapter was introduced.

## Next acceptance boundary

Produce completed three-owner profile specs and literal digest/preimage vectors;
reproduce them with an independent maintenance verifier; then rehearse new beta
sidecars over unchanged historical result bytes under separately admitted policy.
Keep alpha runs and alpha verification supported without relabeling them. A second
beta review must evaluate those artifacts before any schema is promoted.
