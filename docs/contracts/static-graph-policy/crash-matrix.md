# Static policy recovery and authority matrix

| Boundary | Durable facts | Allowed after fresh load | Prohibited |
| --- | --- | --- | --- |
| Condition terminal, before activation | Exact Eval/human/node receipt | Assess and explicitly commit selected case | Recovery inventing activation; either path executing |
| Activation durable, reply lost | Immutable choice and source identity | Reuse same activation; separately drive | Replacing choice, fabricating cancellation/success for inactive nodes |
| Activation immutable record, index lost | Exact source-bound event plus retained actor/source bytes | Existing operator reconciliation under run lock | Inferring missing source facts or applying stale plan |
| Downstream dispatch before claim | Durable reservation and exact binding | Ordinary one-use admission | Refunding budget or omitting outstanding work |
| Downstream admission, execution absent | Permanent claim and admission | Review/independent evidence | Re-executing because the process never replied |
| Mutation, reply lost | Consumed effect attempt and real SQLite mutation | Independent sink verification then normal finalization | Retrying unknown effect, switching branch |
| All group member facts, no terminal event | Member history only | Explicit subgraph assessment/finalization | Parent continuation or inferred group completion |
| Group terminal event, reply lost | Exact group receipt | Parent binds receipt under ordinary admission | Reopening group members |
| Group immutable event, index lost | Exact source event and evidence | Operator repair publishes state last | Synthesizing group terminal history |
| Two activation/finalization controllers | Same surviving source state | One lock winner; other sees lock/stale/already-decided | Duplicate authoritative decisions |

| Information | Producer | Validator / authority | Required durable anchor |
| --- | --- | --- | --- |
| Program output/effect fact | Program, Workcell, adapter | Existing independent parent/effect path | Result, observation, consumed claim and parent receipt |
| Eval judgment | Eval | Exact existing local terminal contract | Subject/result/content/config and terminal receipt |
| Human action | Review mechanism | Existing v2 validation plus installed host authorization | Exact decision/request/revision and terminal receipt |
| Branch choice | Dispatch assessment | Dispatch operator apply under run lock | Static definition, source receipt, actor evidence and event |
| Group outcome | Dispatch assessment | Same Dispatch graph authority | Entry/member terminal facts, policy, actor and event |
| Budget usage | Durable Dispatch reservations | Existing graph run lock | Anchored limit and append-only start requests |
| Explanation / RunLedger | Observer | Never admission authority | Exact receipt references, not copied domain artifacts |
| Reconciliation | Retained evidence inventory | Existing explicit operator reconciliation | Source-bound plan, immutable history, reconciliation receipt |

Development exposed that the retained inventory must recognize new policy-event
artifact ownership: the transition replay already worked, but actor evidence was
otherwise an unrelated orphan. The fix adds branch/group receipt references to the
existing inventory; it does not weaken orphan handling or create an audit store.

The new implementation remains filesystem-backed integration proof with the existing
SQLite state store as canonical compatibility coverage. Workcell/Eval/Agents SDK and
other repositories are unmodified. Human and Eval callbacks remain trusted-host
installed authorities; this does not authenticate remote participants.
