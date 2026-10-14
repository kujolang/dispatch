# Dispatch 1.4.0

Dispatch 1.4 adds bounded graph composition, explicit attempt and resource accounting,
retained-host reconciliation, and an experimental installed batch-summary operator.
Legacy approvals now bind to authoritative revisions and durable decision receipts;
subgraph settlement considers its declared members while preserving whole-graph guards.

## Installation and compatibility

Install `dispatch@1.4.0` through Kennel, or use the Kujo installer with
`release/dispatch-v1.4.0.refs`. Minimum runtime remains Kujo 1.6.0 on Linux/macOS.
The AI SDK dependency remains exactly `5184a122590dd5698770b50d99b69ed11c7ec84a`
(AI SDK 1.1.1). Agents SDK 1.1.2 remains in the installer closure.

`release/dispatch-v1.4.0-validation.refs` records the separate integration cohort:
released Eval 1.1.0 and MCP 1.3.2, Agents SDK 1.1.2, the existing Workcell effect
adapter and the exact retained-host Workcell graph revision. These validation
paths do not require new companion releases. The experimental operator installs
its own exact Workcell/Eval sources with `bash scripts/install_operator_dependencies.sh`.
Base workflows do not require the operator dependencies.

## Upgrade and recovery

Stop all workers and back up the complete output root before upgrading. Resume
persisted 1.3 runs with the new controller; roll back only from the untouched backup.
Never run old and new controllers concurrently over the same state. The release
checks exercise filesystem and SQLite state, separate-process resume and backup
rollback, plus real process termination, retained reservations and reconciliation.
The older 1.2 upgrade rehearsal remains covered separately by CI.

## Boundaries

Graph, participant and operator contracts remain experimental and opt-in under a
trusted local host. Uncertain or consumed work is not replay permission. Resource
reports preserve source provenance and unknown usage; they do not infer prices or
hard currency/token/time budgets. No general machine-loss recovery, universal
rollback, distributed lock service or exactly-once claim is made. Separate
participant SDK packages remain unpublished. Offline and localhost integration
checks do not certify remote model providers or hosted deployments.
