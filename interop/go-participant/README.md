# Independent Go participant proof

Experimental, unpublished, standard-library-only codec and recording process.
Read [the protocol and trust boundary](../../docs/contracts/effect-set/protocol.md).

From this directory: `GOTOOLCHAIN=local GOPROXY=off go build -o participant .`.
Pipe canonical handoff bytes to `./participant record`; output is canonical bytes,
not an execution receipt or permission. `./participant mcp` runs the bounded local
recording-only MCP server. Go >=1.22 is required. Do not commit the built binary.

From Dispatch root, run `node tests/go_participant_conformance.mjs`. The common
historical vectors remain unchanged. New vectors are in
`tests/vectors/effect-set.json`; TypeScript, Python, Go and Kujo reproduce them.
