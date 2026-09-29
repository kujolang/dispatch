# Bounded sequential continuation evidence

Validation passed. `validation.json` identifies final tested source commits,
commands, counts, source/toolchain pins, explicit skips, warnings and SHA-256 file
inventory. Logs retain initial failures rather than suppressing them.

Starting source: Dispatch `9f700059767730feffc05cb4ae26c649fe70dc0a`, Kujo
`ce1307482776893b563f67b867889b9a6dc617a4`, Workcell
`8f8680c175e0da4c1695e0f411137237eb0664ad`. Workcell was cleanly fast-forwarded from
`1940da0639b70b702c1b1077dda51ca39b065216` to current main before source edits.
Agents SDK and Ability were inspected/reused but not modified.

Corrections during validation:

- An early generic guard assumed `has_key` returned a Boolean; the runtime returns
  an integer. The source now compares it explicitly. `contains` returns a Boolean;
  the shared allowed-action check now explicitly requires `true`.
- Fresh-observation deadline calculation is converted to an integer before portable
  commitment encoding. Floating-point data is not admitted into that encoding.
- The initial three-second Git evidence fixture expired before selection completed.
  The final fixture allows twelve seconds and still waits for actual expiry; no
  expired-evidence rejection was removed.
- Workcell main's locked adapter dependencies had changed since the local install.
  Initial npm tests/integrity failed; `npm ci` restored the committed dependency
  tree, after which all 23 tests and integrity checks passed. No lockfile rewrite.
- An additional Kujo Markdown contract found historical unchecked RC release rows.
  The review now labels them as historical actions in plain bullets, preserving
  their original meaning and linking current shipped status. All seven affected
  documentation/repository checks pass; no release action was claimed completed.

Live remote-provider certification, Docker/Podman live OCI integration, malicious
participants and multi-host recovery are not claimed. The canonical Workcell
suite's explicit live-OCI skip is retained in its log. No relevant participant SDK
source was modified; existing Dispatch compatibility gates still exercise it.

The contract and ownership/crash/TOCTOU audit are in
[sequential-continuation.md](../../contracts/effect-set/sequential-continuation.md).

Current-main integration: while validation ran, Dispatch main advanced to
`7558d0b` (release 1.3, resume authorization/locking fixes, native bridge cwd,
additional transport/CI tests) and Kujo main to `92b24a8` (companion CI and installer
example). Both were merged without dropping concurrent work. Dispatch's first
canonical run was deliberately interrupted after the historical 29/39 checks and
all 80 new scenarios passed; it is **not** reported as a completed canonical gate.
The final full gate runs on merged source `b6f1d304d376a421f4647358bbc71e2662fbe7e3`,
which contains lifecycle implementation `0e8d32f409a017286a2e1c37c9ff7410b7b54cee`.
