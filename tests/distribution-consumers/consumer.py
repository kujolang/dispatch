import json
from pathlib import Path
from kujo_participant_sdk import create_codec,content_ref
example=json.loads(Path(__file__).with_name('consumer.json').read_bytes())
codec=create_codec(example['registration']);handoff=example['handoff']
first=codec.provisional(handoff)
report=codec.terminal_report(dict(handoff,completion_knowledge='reported'))
final=codec.finalize_after_readback(handoff)
print(json.dumps({'match':codec.match_expected(first,handoff),'ref':content_ref(first),'knowledge':[codec.parse_handoff(w)['completion_knowledge'] for w in [first,report,final]]}))
