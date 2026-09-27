# Wave D Git process evidence

Historical local verification, 2026-09-27. These are not live admission tokens.
The assurance validity intervals expire; future replay must resolve live authority
through Dispatch, not treat archived proofs as permission.

- `before-*` / `after-*`: real SIGKILL rehearsal proofs and exact authoritative
  result, selected beta assurance and correlated handoff bytes. Artifact digests
  were independently rechecked after copying. Result/assurance/handoff bytes are
  unmodified; proof output omits the local temporary root.
- `workcell-*`: owner gates, concurrent one-ticket test, official adapters and
  release report. Stable release pins are unchanged; tests use the documented
  source-runtime compatibility override, not stable-runtime certification.
- `kujo-docs.log`: affected README contract, with `cargo fmt --check` also passing.
- `dispatch-first-attempt.log`: retained unsuccessful gate attempt at the existing
  HTTP timeout fixture. No test/assertion was suppressed. Root cause unestablished.
- `http-timeout-isolated.log`: unchanged isolated rerun passed.
- `dispatch-release-gate.log`: final full-gate result (added after completion).

Log checkout prefixes are replaced with `<kujo-repos>`; logs are not commitment
preimages. No application payload, credential, Git repository path/ref or source
content is added to the handoff. See the [audit](../../audits/wave-d-git.md) for
limits, ownership and the four-participant comparison.
