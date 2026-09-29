# Dispatch 1.3.0

Dispatch 1.3.0 brings durable failure review and controlled continuation to Kujo
1.6.0. Paused workflows retain their policy, revision, journal and evidence across
controller restarts. Retry decisions require evidence; a tool's status or an
idempotency key alone does not prove an external effect is safe to repeat.

## Runtime and installation

Use released Kujo 1.6.0 on Linux/macOS. Install `dispatch@1.3.0` through Kennel,
or use the Kujo installer with `release/dispatch-v1.3.0.refs`. AI SDK 1.1.1 and
Agents SDK 1.1.2 form the pinned installer closure. Workcell 1.2.0, Ability 1.2.0
and MCP 1.2.0 are the tested optional integration cohort.

Stop old workers and back up the full output root before upgrading. Never mix
pre-1.3 lock protocols with new workers. See [upgrade and backup rollback](UPGRADING_TO_1_3.md).
Operator-specific staging and live-provider certification remain deployment
responsibilities; offline and localhost fixture evidence is not a live-provider claim.

## Experimental companion contracts

Wave C beta remains opt-in, required/deny, single-effect and trusted-host scoped.
Alpha runs remain alpha. SQLite, Workcell Git CAS and Ability profiles retain
owner verifiers; Dispatch alone admits replay. Live freshness/revocation and
persisted configuration identity remain required.

Wave D alpha provides evidence correlation through agent/tool/protocol/process
participants. A correlation match is not permission. TypeScript/Python participant
SDKs remain alpha and unpublished. Read-only bounded effect-set/Go experiments
are not production multi-effect admission. The source-blind agent adopter
rehearsal is technical evidence; human usability remains unvalidated.

No exactly-once guarantee, universal rollback, general machine-loss recovery,
remote authenticated participant trust, stable participant SDK or distributed
lock service is claimed. Windows is not certified for this POSIX controller release.

## Verification

The active [release checklist](release-checklist.md) and exact-source hosted
Linux/macOS gates govern publication. Historical audit receipts remain historical.
