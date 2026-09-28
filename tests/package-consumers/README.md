# External installed-package consumers

These files are copied into an empty directory outside ecosystem checkouts.
`example.mjs` and `example.py` demonstrate only the public library surface.
The shared `conformance.json` is copied from the language-neutral corpus; runners
use standard JSON solely to manufacture test wires and import no private codec.

`worker.mjs`, `record.mjs`, `registration.mjs` and `worker.py` are **integration
fixtures**, not distributed library files. The trusted local host provides an
inherited IPC channel and fixed owner registration. They import the installed
package root and have no Git/Dispatch implementation or environment-selected
modules. Python uses the clean installed venv with `-I`; Node resolves from this
consumer's node_modules. No source-SDK fallback is allowed.

A successful correlation match does not admit an effect. The host owns tickets,
configuration, execution, storage and Dispatch review/replay.
