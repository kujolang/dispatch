# Portable commitments v1

Status: proposed beta contract, opt-in and unreleased; historical alpha recipes
are retained. MUST/MUST NOT define interoperability requirements. SHA-256 always
hashes the bytes specified below, producing exactly 64 lowercase hexadecimal
characters without prefix. An evidence reference adds exactly `sha256:`; it is
not a path, URL, signature or authentication credential.

## Byte and value domains

`exact_utf8`: hash the original, valid UTF-8 bytes. Preserve whitespace, key order,
JSON escape spelling, Unicode normalization and trailing newline. No BOM removal
or Unicode normalization. Result artifacts are at most 1,048,576 bytes; selected
sidecars 8192. Raw logical strings (target, scope, key, body, OIDs) are encoded UTF-8
without an added terminator/newline or JSON quotes. Keep the exact result bytes
through the replay horizon; parsed equivalence is not byte identity.

`portable_json` (portable-json/v1): serialize recursively, no whitespace or trailing
newline. Object keys MUST match `[A-Za-z0-9_.:-]{1,128}` and be sorted in ascending
ASCII byte order. Emit key JSON string, colon, value; comma-separate members.
Arrays preserve order. Integers use base-10 without plus/leading zeroes, range
[-9007199254740991,9007199254740991]; negative zero/floats are unsupported.
Booleans/null are lowercase JSON tokens. Strings contain Unicode scalar values:
Surround each string with byte22 (hex). Emit UTF-8 verbatim except these escapes:
quote → hex `5c22`; backslash → `5c5c`; backspace → `5c62`; form-feed → `5c66`;
newline → `5c6e`; carriage-return → `5c72`; tab → `5c74`. Other U+0000–001F use
bytes `5c753030` followed by two lowercase ASCII hex digits for the code point.
Slash, U+2028/U+2029 and non-ASCII are NOT escaped.
Reject unpaired surrogates, duplicate object keys, invalid UTF-8, unsupported types,
unknown closed fields, depth >8, >64 members/items per container, or >8192 encoded
bytes. Depth starts at zero for the root; children increment it.

Beta sidecar wire bytes MUST equal this encoding. Parse-then-reencode byte equality
rejects duplicate keys, alternate escapes and whitespace; do not silently normalize
before accepting a selected sidecar. Exact result bytes have NO such canonical-wire
requirement. The two commitments deliberately have different byte rules.

`alpha_json`: retain the original compact sorted-key serialization for the alpha
objects/arrays in these profiles. On the bounded ASCII-key/scalar/integer domain
above its bytes match portable-json/v1; this equivalence is tested, not permission
to rewrite historical artifacts. Historical alpha objects outside that domain
remain exact retained bytes and are not beta-portable inputs.

`ability_v1_json` and `ability_v2_json`: retain separately named historical Ability
recipes. For this publication profile's bounded string/integer/ASCII-key inputs,
both emit the portable-json/v1 bytes. V1 identities MUST remain v1 identities;
do not change a stored key/request digest because a helper/version name changed.
Arbitrary Ability values, floats and non-ASCII object keys are outside this
portability claim. Their independent migration is not implemented here.

## Commitment table

| Commitment | Exact preimage |
|---|---|
| result_sha256 | Exact authoritative result UTF-8 bytes, <=1 MiB |
| selected sidecar_sha256 | Exact sidecar UTF-8 bytes, <=8 KiB |
| alpha policy_sha256 | alpha_json of six policy fields excluding policy_sha256 |
| beta policy_sha256 | portable_json of six policy fields excluding policy_sha256 |
| alpha configuration revision | alpha_json of all eleven descriptor fields |
| beta configuration revision | portable_json of all eleven descriptor fields |
| verifier_sha256 | alpha_json ordered array of raw lowercase source SHA-256 strings; 1–16 files, <=1 MiB each; no paths in preimage |
| target/scope | Exact operator-defined logical string bytes; profiles specify meanings |
| envelope key_sha256 | Exact v1 idempotency_key string bytes (Ability uses its application key digest string) |
| request/precondition | Exact profile recipe, never an unspecified object hash |
| SQLite/Git transaction | alpha_json of the closed eight-field intent, INCLUDING validity |
| SQLite/Git evidence | alpha_json array [mechanism, transaction_sha256, observed_state] |
| Ability profile/transaction/evidence | Profile's explicit recipes; see Ability's normative document |
| beta profile_sha256 | portable_json of the complete closed bindings object |

Descriptor fields: schema, mode, fallback, profile, profile_version, issuer,
mechanism, verifier_id, verifier_version, verifier_sha256, authority_sha256.
Policy preimage: schema, mode, fallback, profile, profile_version, config_revision.
No self-hash field, credential, executable path or implicit default participates.
Changing any committed field needs a new revision, never aliasing an old revision.

## Vector format and independent use

`dispatch.commitment-vectors/v1` is a frozen maintenance format: schema, algorithm
(`sha256`), encoding (`utf-8`), output (`lowercase-hex-unprefixed`), vectors and
distinct pairs. Each vector has name, recipe, purpose, typed input,
preimage_utf8, preimage_hex and sha256. UTF-8 string and hex MUST describe identical
bytes; neither may be treated as a substitute if they disagree. Names are unique;
up to128 vectors, <=8192 bytes per preimage, <=1 MiB per file. Distinct pairs MUST
resolve to two existing names and unequal hashes. Format metadata is not trust.

Generic/SQLite vectors live in Dispatch tests/vectors; Git and Ability vectors
live in their owner repositories. Node and Python checkers use only their standard
libraries. A Kujo checker independently compares the portable encoding and the
existing alpha serializers. Owner tests also exercise Ability's two actual digest
helpers and Git's intent serialization. `generate_vectors.mjs` is maintenance
code, not an admission component; committed vectors, not regenerated expectations,
are the normative examples. A clean-room test copies only documents, schemas,
vectors and representative artifacts into a temporary directory; independent
checkers import no ecosystem implementation. Offline artifact validation establishes
structure/commitments only, NOT live authority or replay permission.
