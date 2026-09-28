# Fresh consumer interpretation (before implementation)

Inputs: bundled README, API reference, SDK design/trust document and conformance
corpus. No codec implementation is needed. `createCodec` / `create_codec` accepts
an installed closed registration. It supplies encode/parse, exact content refs,
expected snapshot comparison and unknown/report/finalize helpers. Matching is
correlation only. Host code supplies snapshots, storage and all admission/effect
operations. A fresh recording process can finalize without executing anything.

The examples use new `example.private-ts-consumer` and
`example.private-python-consumer` owner namespaces. The optional Git extension is
host-composed correlation, not effect verification. Runtime packages do not
preinstall either owner. The existing local host IPC is a fixture integration
interface, not part of the public SDK API. Consumers require only public exports.

Distribution trust is an out-of-band operator pin set, not feed metadata. The
consumer downloads a complete reviewed closure before installation. Names,
versions, archive bytes, dependency locks and asset manifests are pinned. A local
HTTP feed authenticates nothing; byte pins provide artifact identity, while the
operator remains trusted. No remote trust is claimed.
