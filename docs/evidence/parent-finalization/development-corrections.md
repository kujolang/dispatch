# Development corrections

The initial 25-case parent suite passed. Review added five prerequisite/authority
cases and a post-artifact-publication final revalidation; the 30-case suite passed.

The first final canonical gate's new parent suite also passed. A subsequent review
noticed that the race barrier independently loaded state but did not explicitly
assess eligibility in each fresh controller before the lock race. The gate was
intentionally stopped (SIGTERM, not an assertion failure) after the new parent and
vector suites passed. The stronger fixture now independently assesses in both
processes and verifies the surviving terminal state, stale-request denial and one
durable parent_finalized event. Full focused and canonical gates were restarted
from bb60d4c. Interrupted log and exit status are retained separately.

No failing assertion was suppressed or converted to a skip. Final verification
results are recorded in validation.json after completion.

A second source review found a real precondition defect: a skipped child's mutable
`optional` flag was consulted without checking the anchored workflow. Derived-state
damage could therefore waive a required child. Finalization and exact decision
reconstruction now validate step count/order/identity, optionality and dependencies
against the immutable workflow definition. A focused regression deliberately changes
a required pending child to skipped/optional and requires parent_topology_changed.
The in-progress gate was stopped with SIGTERM before claiming completion. Focused
and canonical gates were restarted from f63b14d; both interrupted logs are retained.
