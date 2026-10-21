# Dispatch 1.4.1

A maintenance release updating the supported Node.js tooling baseline to 26.12.1. The reviewed Kujo 1.8.1 runtime and pinned AI SDK / Agents SDK installer closure are unchanged.

Use `release/dispatch-v1.4.1.refs` for reproducible installation. Quiesce old workers before upgrading; never mix lock protocols on a run directory. Existing 1.4 graph controls, resource accounting, approval receipts and recovery behavior are retained.

Effect assurance beta, participant interoperability alpha and the installed operator remain experimental and require a trusted local host. Separate participant SDK packages remain unpublished. Live provider and target-infrastructure certification remain deployment-specific.

The candidate and tagged release workflows require the full offline gate, companion integration checks, upgrade/restart/rollback rehearsals and clean installation checks before acceptance.
