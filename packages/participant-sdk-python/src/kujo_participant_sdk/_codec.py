"""Independent implementation of the published experimental correlation contract."""
import hashlib
import json
import re
from pathlib import Path
from jsonschema import Draft202012Validator

ASSETS = Path(__file__).resolve().parent / 'assets'
ID = re.compile(r'[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}', re.ASCII)
KEY = re.compile(r'[A-Za-z0-9_.:-]{1,128}', re.ASCII)
REF = re.compile(r'sha256:[0-9a-f]{64}', re.ASCII)
HEX = re.compile(r'[0-9a-f]{64}', re.ASCII)

class Invalid(ValueError):
    def __init__(self):
        super().__init__('interop_invalid')

def require(condition):
    if not condition:
        raise Invalid()

def encode(value):
    """portable-json/v1. Never normalizes Unicode or accepts arbitrary objects."""
    def visit(item, depth):
        require(depth <= 8)
        if item is None or type(item) is bool:
            return
        if type(item) is int:
            require(abs(item) <= 9007199254740991)
        elif type(item) is str:
            item.encode('utf-8', 'strict')
        elif type(item) in (list, dict):
            require(len(item) <= 64)
            if type(item) is dict:
                for key, val in item.items():
                    require(type(key) is str and KEY.fullmatch(key) is not None)
                    visit(val, depth + 1)
            else:
                for val in item:
                    visit(val, depth + 1)
        else:
            raise Invalid()
    try:
        visit(value, 0)
        raw = json.dumps(value, ensure_ascii=False, allow_nan=False,
                         sort_keys=True, separators=(',', ':')).encode('utf-8')
        require(len(raw) <= 8192)
        return raw
    except (UnicodeError, RecursionError, TypeError, ValueError):
        raise Invalid() from None

def decode(raw, limit=8192):
    def pairs(items):
        result = {}
        for key, value in items:
            require(key not in result)
            result[key] = value
        return result
    def integer(value):
        require(value != '-0')
        result = int(value)
        require(abs(result) <= 9007199254740991)
        return result
    def forbidden(_):
        raise Invalid()
    try:
        require(type(raw) is bytes and len(raw) <= limit)
        return json.loads(raw.decode('utf-8', 'strict'), object_pairs_hook=pairs,
                          parse_int=integer, parse_float=forbidden, parse_constant=forbidden)
    except (ValueError, UnicodeError, RecursionError):
        raise Invalid() from None

def digest(raw):
    require(type(raw) is bytes)
    return hashlib.sha256(raw).hexdigest()

def reference(raw):
    return 'sha256:' + digest(raw)

def identifier(value):
    return type(value) is str and ID.fullmatch(value) is not None

def closed(value, keys):
    require(type(value) is dict and set(value) == set(keys))

def assets_check():
    try:
        raw = (ASSETS / 'manifest.json').read_bytes()
        require(digest(raw) == 'd226203f39aec5ef034c085aa25539cd4658761791189914c0c32bcfe6b80ac4')
        for name, expected in json.loads(raw).items():
            require(re.fullmatch(r'[a-z0-9.-]+', name) is not None)
            require(digest((ASSETS / name).read_bytes()) == expected)
    except Exception:
        raise ValueError('sdk_assets_invalid') from None

assets_check()
_SCHEMAS = {'core.schema.json': Draft202012Validator(json.loads((ASSETS/'core.schema.json').read_bytes()))}

def schema_check(name, value):
    require(_SCHEMAS[name].is_valid(value))

def validate(doc, owner):
    closed(doc, ('schema', 'subject', 'participant', 'completion_knowledge',
                 'execution_result_ref', 'assurance_ref', 'participant_extension', 'effect_extension'))
    require(doc['schema'] == 'kujo.interop-handoff/v1alpha1')
    closed(doc['subject'], ('run_id', 'step_id', 'attempt_id', 'effect_id'))
    require(all(identifier(x) for x in doc['subject'].values()))
    # Published current-consumer domain: canonical positive decimal action attempt.
    require(re.fullmatch(r'[1-9][0-9]*', doc['subject']['attempt_id'], re.ASCII) is not None)
    closed(doc['participant'], ('namespace', 'invocation_id'))
    require(identifier(doc['participant']['namespace']) and identifier(doc['participant']['invocation_id']))
    require(doc['completion_knowledge'] in ('reported', 'unknown'))
    require(type(doc['execution_result_ref']) is str and REF.fullmatch(doc['execution_result_ref']) is not None)
    require(doc['assurance_ref'] is None or
            (type(doc['assurance_ref']) is str and REF.fullmatch(doc['assurance_ref']) is not None))
    for name in ('participant_extension', 'effect_extension'):
        ext = doc[name]
        if ext is None:
            require(name == 'effect_extension')
            continue
        closed(ext, ('schema', 'values'))
        require(type(ext['values']) is dict and len(ext['values']) <= 16)
        require(len(encode(ext)) <= 2048)
        for key, value in ext['values'].items():
            require(identifier(key))
            require(value is None or (type(value) is str and len(value.encode('utf-8')) <= 128))
    owner(doc)
    core = {k: v for k, v in doc.items() if k not in ('participant_extension', 'effect_extension')}
    require(len(encode(core)) <= 2048)
    schema_check('core.schema.json', doc)
    return doc
