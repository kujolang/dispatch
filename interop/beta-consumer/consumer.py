"""Independent, beta-only fact consumer. No workflow mutation or ecosystem imports."""
import hashlib
import json
import re
import sys
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).parent / 'publications'
BETA = 'dispatch.effect-assurance/v1beta1'
OWNERS = {'dispatch.sqlite-unique': 'dispatch', 'workcell.git-cas': 'workcell',
          'ability.application-gateway': 'ability'}
MECHANISMS = {'dispatch.sqlite-unique': 'sqlite_unique_transaction',
              'workcell.git-cas': 'git_ref_cas_transaction',
              'ability.application-gateway': 'ability_application_gateway'}

class Denial(Exception):
    pass

def need(ok, reason='contract_invalid'):
    if not ok:
        raise Denial(reason)

def sha(data):
    return hashlib.sha256(data).hexdigest()

def utf8(value):
    return value.encode('utf-8', errors='strict')

def portable(value):
    # Explicit byte emitter, deliberately not json.dumps canonicalization.
    def emit(v, depth):
        need(depth <= 8)
        if v is None: return b'null'
        if type(v) is bool: return b'true' if v else b'false'
        if type(v) is int:
            need(abs(v) <= 9007199254740991)
            return str(v).encode('ascii')
        if type(v) is str:
            pieces = [b'"']
            escapes = {34:b'\\"', 92:b'\\\\', 8:b'\\b', 12:b'\\f',
                       10:b'\\n', 13:b'\\r', 9:b'\\t'}
            for c in v:
                n = ord(c)
                need(not 0xd800 <= n <= 0xdfff)
                pieces.append(escapes[n] if n in escapes else
                              ('\\u%04x' % n).encode('ascii') if n < 32 else utf8(c))
            return b''.join(pieces) + b'"'
        if type(v) is list:
            need(len(v) <= 64)
            return b'[' + b','.join(emit(x, depth+1) for x in v) + b']'
        if type(v) is dict:
            need(len(v) <= 64 and all(type(k) is str and re.fullmatch(r'[A-Za-z0-9_.:-]{1,128}', k) for k in v))
            return b'{' + b','.join(emit(k, depth+1)+b':'+emit(v[k], depth+1) for k in sorted(v)) + b'}'
        raise Denial('contract_invalid')
    out = emit(value, 0)
    need(len(out) <= 8192)
    return out

def digest(value):
    return sha(portable(value))

def parse(raw, limit=8192, canonical=False):
    need(type(raw) is bytes and len(raw) <= limit)
    def pairs(items):
        out = {}
        for k, v in items:
            need(k not in out)
            out[k] = v
        return out
    def integer(s):
        need(s != '-0')
        return int(s)
    def invalid(_): raise Denial('contract_invalid')
    obj = json.loads(raw.decode('utf-8', errors='strict'), object_pairs_hook=pairs,
                     parse_int=integer if canonical else int, parse_constant=invalid,
                     parse_float=invalid if canonical else float)
    if canonical: need(portable(obj) == raw)
    return obj

def schema(obj, path):
    spec = json.loads((ROOT/path).read_text())
    need(not list(Draft202012Validator(spec, format_checker=FormatChecker()).iter_errors(obj)))

def manifest(profile):
    need(profile in OWNERS, 'unsupported_profile')
    m = parse((ROOT/OWNERS[profile]/'assurance-profile.json').read_bytes())
    need(set(m) == {'schema','advisory','owner','profile_id','versions','verified_predicate','vectors','conformance','multi_effect','live_verification','beta_binding_schema'})
    need(m['schema'] == 'dispatch.assurance-profile-manifest/v1' and m['advisory'] is True)
    need(m['profile_id'] == profile and m['live_verification'] is True and m['multi_effect'] is False)
    need({'profile_version':'1beta1', 'envelope':BETA} in m['versions'], 'unsupported_profile')
    need(m['conformance'] == 'dispatch.effect-assurance-conformance/v1')
    # No fetch or document-selected path resolution: installed schema slot only.
    need(m['beta_binding_schema'] == 'bindings-v1beta1.schema.json')
    return m

def reconstruct_intent(profile, inputs, validity, reported='unknown', observed='committed'):
    """SQLite/Git binding from application-owned raw strings, per owner specs."""
    need(profile in ('dispatch.sqlite-unique', 'workcell.git-cas'))
    git = profile == 'workcell.git-cas'
    if git:
        need(all(re.fullmatch('[0-9a-f]{40}', inputs[k]) for k in ['old_oid','new_oid']))
        need(inputs['old_oid'] != inputs['new_oid'])
    intent = {'operation':'update' if git else 'create',
              'target_sha256':sha(utf8(inputs['target'])), 'scope_sha256':sha(utf8(inputs['scope'])),
              'key_sha256':sha(utf8(inputs['key'])),
              'request_sha256':sha(utf8(inputs['new_oid'] if git else inputs['request'])),
              'precondition_sha256':sha(utf8(inputs['old_oid'] if git else 'empty')),
              'valid_from':validity['from'], 'valid_until':validity['until']}
    return {**{k:v for k,v in intent.items() if not k.startswith('valid_')},
            'transaction_sha256':digest(intent), 'reported_state':reported,
            'replay_class':'external_idempotent', 'observed_state':observed}

def evidence(profile, bindings, validity, live):
    if profile != 'ability.application-gateway':
        intent = {k:bindings[k] for k in ['operation','target_sha256','scope_sha256','key_sha256','request_sha256','precondition_sha256']}
        intent.update(valid_from=validity['from'], valid_until=validity['until'])
        need(digest(intent) == bindings['transaction_sha256'], 'binding_mismatch')
        return 'sha256:'+digest([MECHANISMS[profile], digest(intent), bindings['observed_state']])
    # Application profile is separately authenticated readback, not envelope content.
    p = live['application_profile']
    keys = {'schema','ability_id','ability_version','definition_digest','surface','principal_sha256','tenant_sha256','key_digest','request_digest','input_sha256','intent_sha256','target_sha256','operation','transaction_sha256'}
    need(set(p) == keys, 'verification_failed')
    need(p['schema'] == 'ability.application-assurance/v1alpha1' and p['ability_id'] == 'kujo.fixture.publication.create' and p['ability_version'] == '1.0.0' and p['surface'] == 'sdk', 'verification_failed')
    for k in keys-{'schema','ability_id','ability_version','surface','operation'}:
        need(re.fullmatch('[0-9a-f]{64}', p[k]) is not None, 'verification_failed')
    need(digest({k:v for k,v in p.items() if k != 'transaction_sha256'}) == p['transaction_sha256'], 'binding_mismatch')
    expected = {'operation':'create','target_sha256':sha(b'kujo.application.publications'),
                'scope_sha256':p['principal_sha256'],'key_sha256':sha(utf8(p['key_digest'])),
                'request_sha256':p['request_digest'],'precondition_sha256':digest(p),
                'transaction_sha256':p['transaction_sha256']}
    need(p['target_sha256'] == expected['target_sha256'] and p['operation'] == 'create', 'binding_mismatch')
    need(all(bindings[k] == v for k,v in expected.items()), 'binding_mismatch')
    receipt = live['receipt_sha256']
    need(receipt is None or (type(receipt) is str and re.fullmatch('[0-9a-f]{64}', receipt)), 'verification_failed')
    return 'sha256:'+digest({'profile':p,'business_state':bindings['observed_state'],
                            'receipt_sha256':receipt,'verification':'authenticated_sqlite_readback'})

def decide(packet):
    """packet's host/live sections MUST be delivered through operator-owned authority.
    Serializable only for offline rehearsal; never expose this as untrusted admission.
    """
    try:
        policy = packet['policy']
        need(policy.get('schema') == 'dispatch.assurance-negotiation/v1beta1', 'unsupported_envelope')
        schema(policy, 'dispatch/assurance-negotiation-v1beta1.schema.json')
        need(digest({k:v for k,v in policy.items() if k != 'policy_sha256'}) == policy['policy_sha256'], 'binding_mismatch')
        host = packet['host']; revision = policy['config_revision']
        need(revision in host['revisions'], 'configuration_unavailable')
        installed = host['revisions'][revision]
        need(installed['status'] != 'revoked', 'authority_revoked')
        need(installed['status'] == 'active', 'configuration_unavailable')
        config = installed['descriptor']
        schema(config, 'dispatch/assurance-configuration-v1beta1.schema.json')
        need(digest(config) == revision, 'configuration_unavailable')
        need(all(policy[k] == config[k] for k in ['mode','fallback','profile','profile_version']), 'configuration_unavailable')
        need(config['verifier_sha256'] == installed['current_verifier_sha256'] and config['authority_sha256'] == installed['current_authority_sha256'], 'configuration_unavailable')
        profile = config['profile']; m = manifest(profile)
        need(config['mechanism'] == MECHANISMS[profile], 'configuration_unavailable')
        raw = utf8(packet['assurance_raw']); a = parse(raw, canonical=True)
        need(a.get('schema') == BETA, 'unsupported_envelope')
        schema(a, 'dispatch/effect-assurance-v1beta1.schema.json')
        need(a['profile'] == {'id':profile,'version':policy['profile_version']}, 'unsupported_profile')
        need(a['issuer'] == config['issuer'], 'binding_mismatch')
        b = a['bindings']; schema(b, OWNERS[profile]+'/bindings-v1beta1.schema.json')
        need(digest(b) == a['profile_sha256'], 'binding_mismatch')
        result_raw = utf8(packet['result_raw']); r = parse(result_raw, 1048576)
        schema(r, 'execution-result-v1.schema.json')
        need(len(r['effects']) == 1, 'result_policy_denied')
        effect = r['effects'][0]
        need(effect['class'] == 'external_idempotent' and all(type(effect.get(k)) is str and effect[k] for k in ['idempotency_key','enforced_by','enforcement_evidence_ref']), 'result_policy_denied')
        s = a['subject']; need(s == host['subject'], 'binding_mismatch')
        need(re.fullmatch('[1-9][0-9]*', s['attempt_id']) is not None and int(s['attempt_id']) == r['attempt'], 'binding_mismatch')
        need(all(s[k] == r['subject'][k] for k in ['run_id','step_id','attempt_id']), 'binding_mismatch')
        need(s['result_sha256'] == sha(result_raw) and s['effect_id'] == effect['effect_id'], 'binding_mismatch')
        need(b['reported_state'] == effect['state'] and b['replay_class'] == effect['class'] and b['key_sha256'] == sha(utf8(effect['idempotency_key'])), 'binding_mismatch')
        need(a['evidence_ref'] == effect['enforcement_evidence_ref'], 'binding_mismatch')
        need(b == host['expected_bindings'], 'binding_mismatch')
        now = packet['now']; start = a['validity']['from']; end = a['validity']['until']
        need(type(now) is int and 0 < end-start <= 3600 and start <= now < end, 'freshness_failed')
        live = packet['live']
        need(live['config_revision'] == revision and live['subject'] == s and live['profile'] == a['profile'], 'verification_failed')
        need(live['checked_at'] == now and live['bindings'] == b and live['predicate'] == m['verified_predicate'], 'verification_failed')
        need(live['status'] == 'verified' and live['evidence_ref'] == a['evidence_ref'], 'verification_failed')
        need(evidence(profile, b, a['validity'], live) == a['evidence_ref'], 'verification_failed')
        return {'decision':'verified','reason_category':None}
    except Denial as error:
        reason = str(error)
        return {'decision':'unsupported' if reason.startswith('unsupported_') else 'configuration_error' if reason == 'configuration_unavailable' else 'blocked', 'reason_category':reason}
    except (ValueError, TypeError, KeyError, UnicodeError, RecursionError, OverflowError):
        return {'decision':'blocked','reason_category':'contract_invalid'}

if __name__ == '__main__':
    # Offline process harness only. Host/live JSON is trusted test input, not a service API.
    try:
        packet = parse(Path(sys.argv[1]).read_bytes(), 2097152)
        print(json.dumps(decide(packet), sort_keys=True))
    except (Denial, ValueError, UnicodeError, RecursionError, OSError, IndexError):
        print('{"decision":"blocked","reason_category":"contract_invalid"}')
