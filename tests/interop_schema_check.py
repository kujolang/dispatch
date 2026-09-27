"""Maintenance-only Draft 2020-12 validation (python-jsonschema 4.x).
Kujo's subset validator lacks propertyNames/maxProperties; production correlation
and fixtures remain Kujo-native and enforce the stricter byte/semantic bounds.
Run after: kujo run tests/interop_history.kujo
"""
import json
from pathlib import Path
from jsonschema import Draft202012Validator

root = Path(__file__).resolve().parents[1]
schemas = {}
for path in (root / 'docs/contracts/interop').glob('*.schema.json'):
    schema = json.loads(path.read_text())
    Draft202012Validator.check_schema(schema)
    schemas[schema['$id']] = Draft202012Validator(schema)
count = 0
for kind in ('sdk', 'mcp', 'http', 'git'):
    doc = json.loads((root / f'tests/tmp/interop-normalized/{kind}.json').read_text())
    for item in (doc, doc['participant_extension'], doc['effect_extension']):
        schemas[item['schema']].validate(item)
        changed = dict(item, unexpected='PRIVATE_CANARY')
        assert list(schemas[item['schema']].iter_errors(changed))
        count += 1
print(json.dumps({'ok': True, 'positive_schemas': count, 'closed_object_denials': count}))
