# Independent beta consumer adoption rehearsal

A standalone Python implementation of the published bounded beta contract. This
is test/reference software, not a workflow controller or new effect adapter.
`consumer.py` never imports, invokes or copies Dispatch/Workcell/Ability assurance
implementation. The pre-code [interpretation](INTERPRETATION.md) was committed
separately. The author has prior project context; independence means independently
written implementation from published contracts, not organizational independence.

## Reproduce

Use Python3.10+ and the pinned generic JSON Schema dependencies:

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python isolated.py
```

Run from this directory. `isolated.py` copies only consumer/test code, installed
publication snapshots and recorded observations to a new temporary directory. It
uses isolated Python, no ecosystem implementation paths and no runtime/helper
imports. The AST dependency audit and input hashes are retained in `evidence/`.
No network is used during verification; dependency installation is separate.

Dependencies: Python standard library plus jsonschema 4.26.0 and its pinned attrs,
jsonschema-specifications, referencing and rpds-py dependencies. JSON Schema
Draft2020-12 validation and date-time format checking are generic library services.
Portable encoding, hashing, profile reconstruction, policy/configuration checks,
version selection, live-fact comparisons and decisions are independently written.
Published source revisions/hashes are in `publications/PROVENANCE.json`.
Copied documents are frozen adoption inputs, not new normative authorities.

## Trust interface

The local Python `decide(packet)` interface separates exact result/assurance bytes,
immutable policy, current operator host mapping, current clock and authenticated
readback. It returns only verified/blocked/unsupported/configuration_error with a
bounded published reason category. It does not execute/retry anything, mutate a
run or authenticate an arbitrary JSON sender. The CLI is an offline test harness,
NOT a service that accepts producer-supplied host/live authority.

The embedding must supply independently trusted current run/step/attempt/effect,
expected intent, exact installed revision, current implementation/authority
commitments, revocation and authenticated live facts. The implementation verifies
policy/configuration commitments and compares those facts. A source hash is not
proof of execution; installation identity is the operator's responsibility.
The local `checked_at == now` fixture rule prevents reusing a previous observation;
it is an interface choice, not an additional ecosystem timestamp field.
The embedding still owns locks, journal reconciliation and final mutation rechecks.
No verified response is a persistent bearer token.

The consumer independently enforces the documented v1 external-idempotent predicate
(nonempty key/enforcement references, including unknown completion), the beta
single-effect domain, exact original result bytes, selected profile and canonical
wire bytes. It does not implement general Dispatch retry/intervention policy.

## Genuine observations, not synthetic success

`capture.py` is a separate operator-side test observer and is never copied into the
isolated consumer environment. It reads real stores produced by the existing
three-family migration harness, using read-only SQLite snapshots or confined Git
readback. It imports no backend implementation. The actual operator-pinned verifier runs in
the migration harness; capture requires its result-bound 33-case conformance
attestation before transcribing observed facts. That attestation is trusted because
it comes from the operator-run fixture, not because JSON says ok:true. Capture
additionally checks exact intent/transaction,
Git marker/ref postcondition, or Ability business/request/receipt/session facts
before retaining content-light observations. Backend table/CLI layouts are fixture
transport details only; the consumer never reads them. Installation commitments
refer to the actual fixture verifier, not the auxiliary readback observer. It is not a production backend verifier.
No database paths, body, principal, session credential or raw receipt is exported.

Capture while the normal migration harness is running (from Dispatch root):

```sh
python3 interop/beta-consumer/capture.py tests/tmp /tmp/new-observations
KUJO_BIN=/path/to/reviewed/kujo node tests/beta_migration.mjs
```

Run these in separate terminals; capture waits for artifacts. Use a new empty output
directory. Capture intentionally fails if receipt publication already changed the
original evidence. Never replace a failed readback with copied assurance facts.
The capture checks protected persisted policy and current run identity against the
independently reconstructed selection. Current evidence retains that comparison.

Recorded packets are valid at their recorded observation time. Restart tests replay
that explicit clock to prove deterministic interpretation; they do NOT claim the
old observation is live now. Freshness/revocation changes are tested separately and
deny. Readback cannot prove an absent effect from a failed query. This rehearsal
captures committed paths; existing real crash/absence/concurrency gates remain
separate required ecosystem evidence.

## Coverage and scope

- All 58 frozen vectors, all 6 historical artifact examples, exact encoding negatives.
- SQLite and Git bindings reconstructed from raw documented inputs; Ability request,
  principal/key, application profile and transaction reconstructed from vector inputs.
- All 3 real beta profiles: pinned revision, independent predicate/evidence validation,
  new processes with identical decisions, one logical effect from the real fixtures.
- Identity/intent/version/configuration/revocation/freshness/wire/domain negatives;
  invalid live facts and `ok:true` alone deny. Weaker host defaults do not override
  the selected revision. Existing alpha/legacy inputs remain non-beta.
- Canary rejection emits no payload in stdout/stderr.

No contract ambiguity or semantic change was needed. No normative documents were
changed to make this consumer pass. Beta remains opt-in/unreleased and required/deny;
alpha remains for old runs. Remote authentication, multi-effect, arbitrary Ability
values, renewal, total-store rollback and production deployment certification remain
outside scope. This is local reference adoption, not a hosted security certification.
