# Local HTTP/OpenAPI Ability interoperability

Experimental, opt-in and unreleased. This third participant reuses the same
application profile and Dispatch authority as Agents SDK and MCP. It is one local
publication operation, not an OpenAPI importer or arbitrary internet integration.

## Ownership and contract

Ability owns the local transport fixture and `http.ability-handoff/v1alpha1` schema,
`docs/controlled-http.md` and `examples/controlled-http/openapi.json`. The public
operation is POST `/v1/abilities/publication/create/run`, operation ID
`publication_create`. Its route ID is `publication_run`; raw URL/query never enters
the handoff. The existing application profile retains surface `sdk` beneath HTTP.
The Node fixture exercises actual socket failure/concurrency while the existing
Kujo gateway owns all business logic, session authentication and idempotency.

A host-installed ticket binds normalized invocation, client request ID, method,
route/operation and Dispatch run/step/attempt/effect. Client headers/body cannot
select this context, verifier, profile, root or principal. An atomic durable claim
consumes admission. Current attempt and expiry are rechecked before mutation.
The transport never retries POST, follows redirects or determines replay safety.

`src/adapters/http_ability_handoff.kujo` verifies a closed4096-byte exact-byte handoff,
confined content-addressed artifacts and correlation against the authoritative result,
private receipt and selected sidecar. It is not a verifier or replay engine. The
fixture composes it in the existing operator callback under locked persisted beta
required/deny admission; `retry_is_effect_safe` remains authoritative.

## Failure knowledge

| Transport/application event | Initial durable business state in fixture | Participant observation | Admission |
|---|---|---|---|
| Client times out before delayed mutation | Absent; server fences the cancelled call | `timeout` | Review, live absence/enforcement verification, fresh ticket |
| Business and receipt commit, socket destroyed | Committed | `response_lost` | Review, live committed/enforcement verification, deduplicated retry |
| Application handler throws before commit | Absent, failed private receipt | `application_error` | Review, live absence/enforcement verification, fresh ticket |
| Two concurrent copies of a ticket | One admitted, one denied | Denial does not authorize anything | Only winner reaches application |

A500 or timeout in general does not prove absent business state. Initial authoritative
result conservatively remains indeterminate until live evidence is resolved. The
explicit error/timeout/loss outcomes are kept distinct; no status code is used as
assurance. Verifier/readback unavailability cannot fabricate a safe result.

## Real process fixture

```sh
KUJO_BIN=/path/to/kujo ABILITY_ROOT=/path/to/ability node tests/http_ability_integration.mjs response-loss
KUJO_BIN=/path/to/kujo ABILITY_ROOT=/path/to/ability node tests/http_ability_integration.mjs timeout-before
KUJO_BIN=/path/to/kujo ABILITY_ROOT=/path/to/ability node tests/http_ability_integration.mjs application-error
```

Controller, client and loopback server exit between attempts. Evidence remains in
private content-addressed storage. A new controller publishes/loads live Ability beta
assurance, rejects mismatched correlation at actual locked resume, rejects the stale
checkpoint after that audit, then admits a new attempt using a fresh checkpoint.
The replay server/client are new processes, and the descendant executes. Every
scenario ends with one business row and one receipt. Standalone authenticated HTTP
replays the existing receipt without Dispatch IDs or control callbacks.

Each controlled attempt first denies21 malformed/forged HTTP requests, then sends two
concurrent valid deliveries: one claim wins, one denies. Additional expired/stale/
reused tickets and24 handoff/integrity substitutions fail without business mutation.
Canaries cover public HTTP bodies/headers, handoffs and journal. This fixture has no
HTTP-specific Watchdog exporter; existing Dispatch lifecycle telemetry remains
observational and gains no headers/body/configuration.

## Cross-participant comparison

| Meaning | SDK | MCP | HTTP | Candidate generality |
|---|---|---|---|---|
| Participant identity | SDK run/tool step/model call | Server/session/RPC/request/invocation | Client request/host request/method/route/operation | Distinct; keep owned by participant |
| Controller correlation | Run/step/action attempt/effect | Same | Same | Genuine common reference to Dispatch authority, not authority itself |
| Immutable evidence | Exact result/assurance digest refs | Same | Same | Genuine shared mechanism already owned by existing contracts |
| Application binding | Ability ID/version/definition/invocation | Same | Same | Ability-specific; not yet universal |
| Receipt binding | Ability receipt ID/ref | Same | Same | Application-specific, even if many APIs have receipts |
| Transaction | Application transaction digest | Same | Same | Shared because all three use the same Ability predicate |
| Outcome | SDK receipt/transport lifecycle | MCP receipt/transport lifecycle | HTTP timeout/response/application lifecycle | Uncertainty is common; enum/state meanings are participant-specific |
| Trust/configuration | Excluded; operator/Dispatch owns it | Same | Same | Genuine exclusion rule, not another authority envelope |

Do not merge the three schemas now. Their similar shape partly reflects a single
application. Recommended next task: **continue participant validation** with one
existing Workcell Git CAS action through a bounded participant, without an Ability
receipt. Reuse the existing Git assurance family to test whether result/sidecar/
controller references suffice before extracting a generic handoff core. This is
more informative than another language SDK around the same Ability fixture.

Remote authentication, multi-effect, renewal, total-store rollback and hostile host
isolation remain excluded. No universal exactly-once or rollback guarantee exists.


Application-error detail: the unchanged Ability gateway persists successful replay
receipts only. Its failed handler therefore also encounters receipt-finalization
failure: the returned code is `ability_idempotency_commit_failed` with
`error.details.execution_status = failed`. The HTTP fixture preserves that private
receipt, reports application error, and independently verifies `not_started`; it
never treats the commit-failed code alone as evidence of business absence. The
focused regression asserts all three facts.
