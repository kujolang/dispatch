# Dispatch gateway bridge continuation

The phase-one Dispatch contract remains unchanged: the runner persists
`state.json` before emitting `human_intervention_required`, then returns while
the run is suspended. Leash owns provider verification and decision claims.

The additive `resume-decision` command is the Dispatch-side bridge adapter:

```bash
kujo run dispatch.kujo resume-decision decision.json \
  --output-root tests/tmp/gateway-dogfood --non-interactive
```

The normalized decision must bind `decision_id`, `event_id`, `run_id`, and
`step_id` to the current `run_state.human_intervention`. Dispatch records the
decision ID in `run_state.human_decisions` before invoking the runner. A
duplicate delivery returns `already_applied` and does not execute a second
continuation. A stale or cross-run request fails closed.

Leash normally calls this behavior through an authenticated bridge service
configured as `notifications.chatops.dispatch_bridge.callback_url`. The
callback must verify the shared bearer secret and the
`X-Leash-Idempotency-Key`, then invoke the command with the matching output
root. The local CLI remains useful for offline fixtures and repair.

If the workflow reaches another gate, the runner emits another versioned
provider-neutral intervention event. The prior decision remains in the trace
and audit records. Suspended runs make no model calls or context rebuilds.
