# Upgrading Dispatch from 1.2 to 1.3

Dispatch 1.3 is a development candidate. Its process-owned POSIX run locks
and confined directory durability require the exact Kujo source commit pinned
in `release/dispatch-v1.3.0.refs`; even the released 1.5.0 tag predates the
directory barrier. The old 1.2 release uses an age-reclaimable file
that can admit overlapping workers. Do not point 1.2 and 1.3 workers at the
same output root during a rolling deployment.

1. Stop every Dispatch 1.2 worker and confirm no run is executing. Retain a
   backup of the output root, including SQLite state when enabled.
2. Install or build the 1.3 candidate with the immutable Kujo commit recorded
   in `release/dispatch-v1.3.0.refs`. Do not use the 1.2 runtime with 1.3
   source: its native `file_lock` and `file_unlock` functions are missing.
3. On a single host, run the offline gate and resume a paused legacy run in
   staging. The existing `.dispatch-run.lock` file is retained: a 1.3 worker
   takes an advisory lock on that same inode and overwrites the former JSON
   owner metadata while holding it. Do not manually unlink it, even after a
   crash; the OS releases the process handle on exit.
4. For a rollback, stop every 1.3 worker before starting any 1.2 worker. The
   old age-reclamation protocol cannot see a native advisory lock and is not
   safe to run alongside a 1.3 worker. Restore the staged output-root backup
   if the older runtime cannot read a new run artifact.

Rehearse the quiesced paused-run upgrade and backup rollback for both filesystem
and SQLite state:

```bash
KUJO_BIN=/path/to/pinned/kujo-1.4 KUJO_OLD_BIN=/path/to/pinned/kujo-1.0.2 \
  bash tests/upgrade_rehearsal_tests.sh
```

The script verifies the
immutable v1.2 source tag and the old runtime's version. The old executable
creates and rolls back the paused run, while the candidate executable resumes
it. Without `KUJO_OLD_BIN`, the source-level rehearsal remains available using
the selected current runtime for both phases. Target staging must still test
representative deployment storage and worker quiescence.

Webhook sink writers now coordinate through a persistent
`<sink>.dispatch-write.lock` file. Keep it on the same local filesystem as the
sink and never unlink it while writers are active. This lock is host-local;
multi-host deployments still need an external storage and coordination design.

The older installer shim may export the original root `bridge_chat.kujo` path.
Dispatch translates only that exact, missing legacy path to
`src/bridge/bridge_chat.kujo`. A custom `DISPATCH_SDK_BRIDGE_SCRIPT` path
remains under operator control. Bundled workflow examples may be passed by
absolute path from outside the installation; arbitrary absolute config and
workflow paths still require `DISPATCH_ALLOW_ANY_CONFIG_PATH=true`.
