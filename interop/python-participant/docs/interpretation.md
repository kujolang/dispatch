# Interpretation before implementation

Read from Dispatch c944b079b2744fdd96792e50158cc82b72eeea4d published
`docs/interop-handoff.md`, generic/Workcell correlation schemas, and
`docs/contracts/portable-commitments.md`. No participant implementation was read.
The TypeScript README supplies public black-box API documentation only.

The eight-field closed core binds a host-owned Dispatch action/effect subject to
one participant namespace and independent invocation identity. The current action
attempt is canonical decimal; evaluator/opaque/multi-effect domains are excluded.
`reported` means a usable terminal participant report, including error; `unknown`
means no usable report. Neither proves effect completion or replay safety.

Execution-result reference is required, selected assurance reference nullable.
Both are exact SHA-256 content addresses, never paths or permission. One mandatory
closed owner participant extension and at most one closed effect extension carry
correlation only. Git target/intent semantics remain with Workcell assurance.

Wire is canonical portable JSON: UTF-8 scalar Unicode, ASCII sorted member keys,
compact separators, prescribed control escaping, no Unicode normalization.
Reject duplicate members before constructing objects and require exact wire equality;
never repair whitespace, key order, alternate escapes or trailing newlines.
Portable integers are bounded to the JavaScript safe integer interval; floats and
negative zero are forbidden. Python's default duplicate acceptance, arbitrary
integers, non-finite numbers and ASCII escaping are not contract behavior.

Bounds are 6144 bytes total, 2048 for core projection and each extension, 128 bytes
for identifiers/flat values, 16 flat members. Portable encoding also has depth 8,
64-member containers and 8192-byte output limits. Registered extensions close the
vocabulary further. Unknown extensions fail; an untrusted document cannot install
its own validator.

The host supplies expected identities/references and a private local admission
channel. Correlation success grants no replay permission. Dispatch alone combines
locked persisted policy with current Workcell verification. No required semantic
ambiguity identified at this interpretation stage. This is implementation
independence, not a claim of no prior architectural context.
