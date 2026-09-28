# Independent comprehension, before implementation

I chose Node because v26.7.0 satisfies the supplied >=22 requirement and the package has a direct ESM API. This is an agent rehearsal, not evidence of human usability.

The SDK is a bounded evidence codec and recorder. It validates a closed registration, produces and parses canonical bytes, hashes exact bytes, and compares a complete expected snapshot. It does not run work, store evidence, resolve addresses, select configuration, authenticate callers, or decide retries.

Dispatch owns admission and replay decisions. The local trusted host installs registration, provides current identities and references, stores evidence and runs its fixed action. The effect owner executes the action; the live owner-specific verifier establishes effect truth. A participant reports what completion communication it actually received. Unknown means no usable terminal report was observed; a committed effect can still have unknown participant knowledge. Reported can describe an error.

A content reference is an exact-byte SHA-256 address, not a path or authority token. The host resolves it in confined storage and checks bounds and hashes. Neither package metadata nor schema metadata can select a trusted profile, target, verifier or configuration. Those are installed out of band by the operator. Correlation means the bytes agree with the expected snapshot; agreement grants no permission. Exit status describes process termination, not whether a business effect committed.

Misuse responses: caller-selected Dispatch IDs are unacceptable; IDs must originate at the current trusted host boundary. Correlation cannot be permission. A participant retry helper would cross into controller admission and risk duplicate effects. Selecting a Git target belongs to operator configuration, not this participant. Resolving evidence refs in the SDK crosses its pure codec boundary. Exit 0 cannot establish commit; the independent effect verifier must establish that fact.

The published corpus names some wire mutations without prescribing their exact bytes. I interpret these as representative malformed encodings with unchanged expected categories, constructing mutations myself from the documented wire rules. This is a runner implementation choice, not a changed outcome.
