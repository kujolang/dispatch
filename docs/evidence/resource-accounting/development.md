# Development failures and corrections

- Initial native resource unit fixture used nested index assignment. VM reported
  `Stack underflow`; interpreter diagnosis was `Complex index assignment not yet
  supported`. Rewrote the fixture using explicit dictionary copy/update. No runtime
  edits. 17 checks then passed.
- `integration-1.log`: source inventory exceeded the historical 16-file verifier
  bound (`assurance_verifier_invalid`). The new source-bound controller requires
  21 files. Raised only this bounded host manifest limit to 32; historical ordered
  hashes remain unchanged. Dedicated 16/32/33-entry checks pass.
- `integration-2.log`: three real Eval proof groups passed, then source observation
  rejected `resource_subject_not_consumed`. Array `contains` is not deep object
  equality. Replaced with exact serialized subject comparison.
- First embedded runtime schema generation parsed u64 maximum through JavaScript
  Number and produced an overflowing Kujo literal (18446744073709552000). Replaced
  generation with unchanged JSON source bytes decoded at runtime.
- Native schema validation then rejected unsupported `maxProperties`; its supported
  subset also lacks `uniqueItems`. Preserved original schema and enforced those two
  constraints explicitly. The other constraints use the existing validator.
- `integration-4.log` was an accidental follow-on start after the native prerequisite
  failed (shell did not yet use set -e). Stopped that development run explicitly;
  it is interrupted, not a pass. Subsequent scripts use fail-fast shell handling.
- `integration-5.log`: all six resource/Eval/runtime/SDK proof groups passed after
  corrections. Tests use offline provider-response fixtures through the real SDK
  extraction surface; they do not claim live provider billing certification.

- `policy-1.log`: subgraph plan was requested before the graph had observed its
  producer terminal state. Existing readiness correctly rejected it. The proof now
  places the evaluator before the program in static order, drives the existing DAG
  to publish the predecessor and pause for Eval, then reserves both ready members.
  No readiness rule was weakened. `policy-2` began before this correction.
- `policy-2.log` reproduced the same pre-observation readiness rejection while the
  corrected third run was being prepared. Both failures are retained.
- `policy-3.log`: ordinary DAG drive intentionally continues past waiting Eval
  nodes, so it had already reserved B. Duplicate reservation correctly rejected.
  The proof now uses an existing authorized human prerequisite for B/E/F. Finalizing
  that prerequisite makes them ready without dispatching them, allowing an explicit
  mixed plan. No source scheduling change or test-only locking is introduced.

- Source review found a pre-existing CI layout gap: the canonical parent/graph
  fixtures require sibling Workcell/Eval repositories, but CI only provided
  .ci/workcell and no Eval checkout. A baseline archive reproduced missing-module
  exit 4. CI now provisions exact graph-fixture pins and guarded sibling aliases.
  The first reproduction archive exceeded Node default maxBuffer; reran using
  git archive --output, retaining the actual diagnostic separately.
- The first fixed-layout probe used symlinks to repositories outside its temporary
  module search root and was correctly rejected by Kujo import containment. Replaced
  those test sources with exact git archives inside the CI checkout layout; Workcell,
  Eval and real SDK usage extraction then passed. Guarded alias tests also pass.
- A maintenance edit initially put a GitHub expression inside a JavaScript template
  literal without escaping it; Node rejected the script before any edit. Rewrote
  the insertion as literal lines, reran five layout checks and parsed both YAML
  workflows. No failed maintenance command is treated as a passing test.
- The expanded serial canonical gate now includes 111 suite groups and real process
  crash proofs. CI previously limited that step to 45 minutes. Increased only the
  validation workflow deadline (300-minute gate, 360-minute jobs); graph/resource
  ceilings are unchanged. Hosted elapsed time is not certified by local validation.
- Final focused runs passed: integration-7 (6 groups, including live evaluator
  configuration and final operator-revocation rejection), policy-4 (4 groups),
  recovery-2 (9 groups), and 20 native resource/manifest assertions. Canonical
  verification uses the committed final tests, including both precomputed contenders.
- `canonical-1.log` stopped at static_policy_recovery: isolated controller copies
  omitted the newly source-bound resource_eval_worker.kujo. Corrected all five
  existing node-fixture copy sites. This changes test dependency packaging, not
  production authority. The failed canonical run and every completed suite log are
  retained; a complete rerun is required.
