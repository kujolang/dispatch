"""Language-local runner for the shared SDK corpus, not the TypeScript runner."""
import copy
import json
from kujo_participant import codec
from kujo_participant.sdk import create_codec, content_ref, SDKError, CorrelationError

def run():
    corpus=json.loads((codec.ASSETS/'sdk-conformance.json').read_text())
    results=[]
    for c in corpus['cases']:
        try:
            registration=copy.deepcopy(corpus['registration'])
            if c['op']=='bad_registration': registration['participant']['fields']['call_id']='arbitrary'
            if c['op']=='null_registration': registration['participant']=None
            if c['op']=='no_effect_registration': registration['effect']=None
            sdk=create_codec(registration)
            if c['op']=='registration_copy': registration['participant']['fields']['call_id']='arbitrary'
            doc=copy.deepcopy(corpus['handoff'])
            for path,value in c.get('change',{}).items():
                keys=path.split('.'); target=doc
                for key in keys[:-1]: target=target[key]
                target[keys[-1]]=value
            wire=codec.encode(doc)
            mutation=c.get('wire')
            if mutation=='whitespace': wire+=b'\n'
            elif mutation=='reordered': wire=json.dumps(doc,separators=(',',':')).encode()
            elif mutation=='duplicate': wire=b'{"schema":"kujo.interop-handoff/v1alpha1",'+wire[1:]
            elif mutation=='alternate_escape': wire=wire.replace(b'run-1',b'run\\u002d1')
            elif mutation=='invalid_utf8': wire=b'\xff'
            elif mutation=='oversize': wire=b' '*6145
            elif mutation=='surrogate': wire=wire.replace(b'run-1',b'\\ud800')
            op=c['op']
            if op=='match':
                assert sdk.match_expected(wire,corpus['handoff']) is True
                result={'code':'match'}
            elif op=='reference_string': content_ref(wire.decode()); raise AssertionError('accepted string')
            elif op=='reference': result={'code':'ok','ref':content_ref(bytes([0,255,10]))}
            else:
                raw=(sdk.provisional(doc) if op=='provisional' else
                     sdk.terminal_report(doc) if op=='terminal_report' else
                     sdk.finalize_after_readback(doc) if op=='finalize_after_readback' else
                     sdk.encode_handoff(sdk.parse_handoff(wire)))
                result={'code':'ok','hex':raw.hex(),'ref':content_ref(raw),'value':sdk.parse_handoff(raw)}
        except SDKError as error:
            if c['op']=='match': assert isinstance(error,CorrelationError)
            result={'code':error.code}
        assert result['code']==c['expected'],(c['name'],result,c['expected'])
        results.append(dict(name=c['name'],**result))
    return {'schema':corpus['schema'],'cases':results}
