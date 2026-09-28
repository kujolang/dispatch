# Limited adopter pilot status

**Source-blind agent rehearsal passed; human validation remains unperformed.**

The user subsequently selected a fresh no-history agent rehearsal. See
[`source-blind-adopter.md`](../../audits/source-blind-adopter.md) for current evidence
and the separate Kujo 1.6 technical recommendation. The original 39-file frozen
bundle and its manifest remain unchanged. The preparation record below describes
what was and was not known at `1110ff7`; it is historical, not a current blocker.

## Original preparation record

Baseline: Dispatch `113a72853c2c9532e13825bf825d4fb3c3e77785`, Kujo
`c1cc06ff67e6b8dc1419e5b91adc259891090aad`; fetched main, clean before preparation.
No SDK or controller implementation changes, package rebuilds, or publication.

Frozen bundle: `/tmp/kujo-adopter-pilot-20260928` (locally `/private/tmp/...`).
Manifest SHA-256:
`37ed7e530b573bf0939243cc2c7337d527c1f82238b1ee73ab987b977cfca405`.
The exact manifest is retained in
`docs/evidence/participant-adopter-pilot/frozen-inputs.json`.
The coordinator must deliver that expected digest out of band; the bundle cannot
bootstrap its own authority.

`python3 scripts/prepare_participant_pilot.py <new-outside-checkout-directory>`
reproduces the bundle from retained reviewed artifacts without rebuilding SDKs.
It contains both language options and their existing dependency closure, public
README/API/design/schema/spec/conformance/capability assets, reviewed pins, a pilot
task and bounded host-interface specification. No Dispatch or participant
implementation source is supplied. Packaged implementation remains installed
software and is explicitly excluded from onboarding inspection.

Verification performed: all 39 file hashes, exact bundle file allowlist, identical
published 45-case conformance corpus across language documentation, no loose
implementation source. `git diff --check` passed. These are preparation checks,
not adopter conformance or controlled-effect proof. Full ecosystem gates were not
rerun: no implementation or contract changed and the adopter has not started.
The prior distribution evidence remains valid; it is not relabeled as this pilot.

The host interface is an explicit proposed local pilot interface to be implemented
by the coordinator after the adopter chooses registration/runtime. It is not a
claim that a new harness already exists. Freeze corrections as new addenda, never
rewrite the supplied onboarding record.

## Outstanding independent observations

Not run: independent install, new registration/implementation, questions and gap
classification, public API usability, all 45 conformance cases, realistic errors,
completion-loss/fresh-controller replay, duplicate admission, trust answers,
misuse probes and post-fix regression. No adopter answers, timings or successful
results have been invented.

The requested evidence concerns a developer outside the design process. The
current coordinator has design/history context and cannot serve as that adopter.
An actual human developer must be identified, or the user must explicitly choose
an isolated agent rehearsal. The latter can test clean-room implementation but
must remain labeled agent evidence; human usability stays unproven.

Resume by selecting the adopter/runtime, providing only the frozen bundle and its
out-of-band digest, and following ADOPTER_TASK.md without hidden coaching. No
remote trust, A2A, public publication or API stabilization is authorized.
