# Source-blind adopter integration

Experimental, unpublished coordinator fixture for the Kujo 1.6 agent rehearsal.
This is not a human usability result.

`consumer/participant.mjs` and `registration.json` are byte-preserved outputs from
an agent with no conversation history, given only the frozen `1110ff7` public
onboarding bundle and reviewed SDK archives. The participant uses the public npm
SDK; it imports no repository implementation. Its chosen extension has
`session_tag` and `exchange_tag`, and no effect extension.

`host/runner.py` is separately authored trusted coordinator code. It implements
that bundle's bounded STDIN/STDOUT host interface. It atomically claims the
controller's one-use ticket before launch, retains unknown evidence before the
fixed Workcell action, and launches a recording-only participant after process
loss. It neither grants Dispatch replay permission nor replaces Git assurance.
The host may inspect repository code; that does not extend the adopter's inputs.

Run `PILOT_CONSUMER=/absolute/installed/consumer KUJO_BIN=/absolute/kujo
python3 tests/adopter_pilot_integration.py` from Dispatch. The consumer directory
must contain the reviewed installed npm package, independently authored worker,
registration and lock. It is separate from this source checkout. When PILOT_CONSUMER is supplied, no package is built, installed, or fetched.
Without it, prepare.py creates a separate clean installation from the retained
reviewed archive closure, checks SHA-256 pins and installs offline with scripts
disabled. Neither route rebuilds an SDK. The test commits exact
worker, installed SDK asset, registration and coordinator hashes to the existing
operator installation inventory.

The integration uses the existing generic correlation reader, persisted beta
required/deny negotiation, real Workcell CAS, durable review/checkpoint and fresh
controllers. No production assurance or replay policy is modified.

Reproduction from retained reviewed archives (no registry fallback):

```sh
python3 interop/adopter-pilot/prepare.py \
  .ci/participant-distribution/retained /absolute/new/consumer
PILOT_CONSUMER=/absolute/new/consumer \
  KUJO_BIN=/absolute/kujo python3 tests/adopter_pilot_integration.py
```

The first run used the adopter's original independently installed consumer, not
this reproduction. `docs/evidence/source-blind-adopter/real-host-proof.json`
retains that run's results. `host-inputs.json` pins the exact copied worker,
registration, coordinator and test sources. Public package archives are unchanged.

## Coordinator security review

The peer's reply must be exactly one bounded JSON object whose only member is
`wire`; wire bytes must equal the host's expected canonical snapshot. Duplicate
JSON members reject. Both normal finishing and effect-child output are bounded;
no raw error/receipt, repository path or private payload is reported. The host
launches the pinned worker with empty environment and explicit Node executable.
Caller input is restricted to the admitted call identity. The participant never
sends an effect-execution or retry request. Admission is exclusively a durable
host claim; a crash after claim does not restore that permission.

The selected registration is installed by the host and pinned with the worker and
SDK assets. Its callback checks the two adopter-defined fields and result
correlation. A null effect extension is intentional: the existing Workcell beta
assurance still binds target, scope, request, key, precondition and transaction.
Generic correlation supplies no assurance authority.

The integration denied changed installed source/assets, all four controller
subject fields, both content refs, participant namespace/invocation, both
extension values, completion knowledge and artifact byte tampering. It also
rejected twelve caller trust/config fields, stale/expired tickets and a symlink
request before mutation. Four contenders yielded one admission and three denials.
Repository content and local path canaries were absent from handoff, journal and
captured public diagnostics.

This is local operator trust, not isolation from a hostile root/operator. The
adopter's source-blind restriction was procedural on a shared host. No claim is
made that package contents or a successful correlation confer replay permission.
