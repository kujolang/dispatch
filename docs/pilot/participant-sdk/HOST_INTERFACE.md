# Local participant pilot host interface — draft 1

Experimental local/operator interface for this pilot only, not a stable SDK API or
remote protocol. This document contains everything the adopter needs about the
host. Dispatch/Workcell implementation source is not onboarding material.

## Registration before launch

Choose your runtime and a new `pilot.*` participant namespace/schema. Submit a
closed registration using the SDK's published field kinds, with a short explanation
of your chosen fields. The operator reviews and installs this registration before
launch. Runtime caller input cannot replace it. You may choose your field names;
the operator supplies their agreed values in a complete host snapshot. Do not
invent controller subject IDs or evidence references.

The pilot uses a fixed operator-selected action. You do not need to know its
implementation. If the host supplies an effect extension, its closed registration
is also installed out of band; treat its values as correlation, not effect truth.
The host never sends repository paths, credentials, profile/verifier selection or
replay policy to the participant.

## Transport

The coordinator supplies a local subprocess harness after registration review.
It communicates through dedicated stdin/stdout pipes. Each message is one UTF-8
JSON object followed by LF, at most 16,384 bytes including LF. No duplicate JSON
members. The embedded handoff `wire` is a JSON string preserving exact canonical
SDK wire bytes; the outer transport JSON need not be canonical. No unsolicited
stdout. Stderr must remain empty or contain a bounded content-free diagnostic.
This inherited local channel is host provenance, not remote authentication.

The first input message has exactly:

`{"mode":"participate","snapshot":<complete host handoff>}`

or:

`{"mode":"record","snapshot":<complete host handoff>}`

The host installs registration independently; no registration arrives in these
messages. Unknown mode/extra fields/malformed messages fail closed. A host can
correlate returned exact wire against the complete snapshot with its own checks.
A consumer does not gain permission by echoing host data.

## Participation

1. Host consumes a current, fresh one-use controller admission before launch and
   supplies an `unknown` snapshot. A duplicate receives no admitted context.
2. Participant uses the SDK's provisional helper and replies with exactly
   `{"wire":"<canonical handoff JSON>"}`.
3. Host validates/correlates and durably stores the provisional evidence before
   invoking its preconfigured action. The participant cannot request another
   action or trigger retries.
4. If a usable completion report reaches the participant, the host supplies
   `{"mode":"terminal","snapshot":<complete reported snapshot>}`. Participant
   uses the terminal helper, returns the same one-field wire message, and exits.
5. EOF, interruption or process loss conveys no effect truth. Do not invent a
   terminal report or retry. The host preserves unknown, independently observes
   the effect, finalizes the execution result and can launch a new recorder.

A terminal report may describe an error. `reported` is observation, not success.
Git commit knowledge remains with the live effect verifier, not the participant.

## Recording only

For `mode=record`, encode the supplied complete snapshot with the readback
finalization helper, return the one-field wire message and exit. Preserve explicit
knowledge and references. Do not perform readback, resolve references, invoke an
effect or request admission. This mode must work in a fresh process.

## Admission and tests

Only Dispatch authorizes reviewed continuation. The operator harness handles
review, evidence storage, assurance and fresh controller state. It will test
post-effect process loss and duplicate/concurrent requests. Participant exit code,
SDK schema validation and a successful snapshot match do not grant admission.

Before integration, return: registration and field meanings, launch command using
only your installed reviewed package, standalone public-API proof, full published
conformance results, questions log and trust-boundary answers. The coordinator will
supply only the documented messages, not source code or hidden lifecycle hints.
