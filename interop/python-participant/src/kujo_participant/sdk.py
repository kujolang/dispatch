"""Experimental SDK facade over the independent Python codec. No host capability."""
import hashlib
from . import codec

CONFORMANCE = 'kujo.participant-sdk-conformance/v1alpha1'

class SDKError(ValueError):
    def __init__(self, code):
        self.code = code
        super().__init__(code)

class CorrelationError(SDKError):
    pass

def fail(code):
    raise SDKError(code)

def content_ref(raw):
    if type(raw) is not bytes:
        fail('invalid_handoff')
    return 'sha256:' + hashlib.sha256(raw).hexdigest()

def create_codec(registration):
    # Detached closure, no registry mutation API or payload-driven code loading.
    import re
    try:
        r = codec.decode(codec.encode(registration))
        codec.closed(r, ('namespace', 'participant', 'effect'))
        codec.require(codec.identifier(r['namespace']) and r['participant'] is not None)
        for spec in (r['participant'], r['effect']):
            if spec is None:
                continue
            codec.closed(spec, ('schema', 'fields'))
            codec.require(type(spec['schema']) is str and len(spec['schema']) <= 128 and
                          re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.:-]*/v[1-9][0-9]*(?:alpha|beta)?[0-9]*', spec['schema']))
            codec.require(type(spec['fields']) is dict and len(spec['fields']) <= 16)
            for key, kind in spec['fields'].items():
                codec.require(codec.identifier(key) and kind in
                              ('identifier', 'sha256', 'reference', 'nullable_identifier'))
    except (ValueError, TypeError, KeyError):
        fail('invalid_registration')

    def owner(doc):
        if doc['participant']['namespace'] != r['namespace']:
            fail('unsupported_extension')
        for name, spec in (('participant_extension', r['participant']), ('effect_extension', r['effect'])):
            ext = doc[name]
            if ext is None:
                if name == 'participant_extension':
                    fail('unsupported_extension')
                continue
            if spec is None or ext['schema'] != spec['schema']:
                fail('unsupported_extension')
            if set(ext['values']) != set(spec['fields']):
                fail('invalid_handoff')
            for key, kind in spec['fields'].items():
                value = ext['values'][key]
                ok = (codec.identifier(value) if kind == 'identifier' else
                      value is None or codec.identifier(value) if kind == 'nullable_identifier' else
                      type(value) is str and codec.REF.fullmatch(value) is not None if kind == 'reference' else
                      type(value) is str and codec.HEX.fullmatch(value) is not None)
                if not ok:
                    fail('invalid_handoff')

    def parse_handoff(raw):
        if type(raw) is not bytes:
            fail('invalid_handoff')
        if len(raw) > 6144:
            fail('bounds_exceeded')
        try:
            # Call validate directly: preserve SDK category instead of legacy error wrapper.
            doc = codec.decode(raw, 6144)
            codec.require(codec.encode(doc) == raw)
            return codec.validate(doc, owner)
        except SDKError:
            raise
        except (ValueError, TypeError, KeyError, UnicodeError):
            fail('invalid_handoff')

    def encode_handoff(doc):
        try:
            raw = codec.encode(doc)
            parse_handoff(raw)
            return raw
        except SDKError:
            raise
        except (ValueError, TypeError, KeyError):
            fail('invalid_handoff')

    def match_expected(raw, expected):
        doc = parse_handoff(raw)
        exp = parse_handoff(encode_handoff(expected))
        for field, code in (('subject', 'subject_mismatch'), ('participant', 'participant_mismatch'),
                            ('execution_result_ref', 'result_ref_mismatch'), ('assurance_ref', 'assurance_ref_mismatch'),
                            ('participant_extension', 'extension_mismatch'), ('effect_extension', 'extension_mismatch'),
                            ('completion_knowledge', 'knowledge_mismatch')):
            if doc[field] != exp[field]:
                raise CorrelationError(code)
        return True

    def record(doc, knowledge=None):
        raw = encode_handoff(doc)
        if knowledge is not None and parse_handoff(raw)['completion_knowledge'] != knowledge:
            fail('invalid_knowledge')
        return raw

    # Immutable tuple of named callables; cannot replace operations on a live instance.
    from collections import namedtuple
    API = namedtuple('ParticipantCodec', ('encode_handoff', 'parse_handoff', 'match_expected',
                                         'provisional', 'terminal_report', 'finalize_after_readback'))
    return API(encode_handoff, parse_handoff, match_expected,
               lambda doc: record(doc, 'unknown'), lambda doc: record(doc, 'reported'), record)
