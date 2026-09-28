import json
from pathlib import Path
from kujo_participant_sdk import create_codec, content_ref
example=json.loads(Path(__file__).with_name('conformance.json').read_bytes())
codec=create_codec(example['registration'])
wire=codec.provisional(example['handoff'])
assert codec.match_expected(wire,example['handoff']) is True
print(content_ref(wire))
