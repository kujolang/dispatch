import copy
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from kujo_participant.codec import *


def specimen():
    return {'schema':'kujo.interop-handoff/v1alpha1',
            'subject':{'run_id':'run-1','step_id':'action','attempt_id':'1','effect_id':'effect-1'},
            'participant':{'namespace':NS,'invocation_id':'invocation-1'},
            'completion_knowledge':'unknown','execution_result_ref':'sha256:'+'a'*64,
            'assurance_ref':'sha256:'+'b'*64,
            'participant_extension':{'schema':EXT,'values':{'call_id':'call-1','process_instance_id':'process-1'}},
            'effect_extension':{'schema':GIT,'values':{'workcell_effect_id':'workcell-1','transaction_sha256':'c'*64}}}

class CodecTests(unittest.TestCase):
    def test_roundtrip(self):
        self.assertEqual(parse(encode(specimen())), specimen())
        for field in ['effect_extension','assurance_ref']:
            doc=specimen(); doc[field]=None; self.assertEqual(parse(encode(doc)),doc)
    def test_vectors(self):
        corpus=json.loads((ASSETS/'commitment-vectors.json').read_text())
        self.assertEqual(len(corpus['vectors']),20)
        for v in corpus['vectors']:
            with self.subTest(name=v['name']):
                raw=v['input'].encode() if v['recipe']=='exact_utf8' else encode(v['input'])
                self.assertEqual(raw.decode(),v['preimage_utf8'])
                self.assertEqual(raw.hex(),v['preimage_hex'])
                self.assertEqual(digest(raw),v['sha256'])
    def test_wire_mutations(self):
        raw=encode(specimen())
        values=[raw+b'\n', b' '+raw,raw.replace(b'unknown',b'unknow\\u006e'),
                raw.replace(b'{',b'{"schema":"duplicate",',1),
                json.dumps(specimen()).encode(),b'\xef\xbb\xbf'+raw,
                raw.replace(b'call-1',b'call-1\\n'),raw.replace(b'call-1',b'\\ud800'),
                raw.replace(b'call-1',b'\xff'),b'['*1000+b']'*1000]
        for value in values:
            with self.subTest(raw=value[:30]), self.assertRaises(Invalid): parse(value)
    def test_closed_extensions(self):
        mutations=[('participant_extension',None),('effect_extension',{'schema':'unknown','values':{}}),
                   ('completion_knowledge','committed'),('execution_result_ref','https://bad'),
                   ('assurance_ref','sha256:'+'A'*64)]
        for key,value in mutations:
            doc=specimen();doc[key]=value
            with self.subTest(key=key),self.assertRaises(Invalid):parse(encode(doc))
        for value in ['a'*129,'x\n','é',{'nested':'value'},[],1]:
            doc=specimen();doc['participant_extension']['values']['call_id']=value
            with self.subTest(value=value),self.assertRaises(Invalid):parse(encode(doc))
        doc=specimen();doc['participant_extension']['values']['metadata']='secret'
        with self.assertRaises(Invalid):parse(encode(doc))
    def test_correlations(self):
        expected=specimen()
        paths=[('subject',x) for x in expected['subject']]+[('participant','invocation_id'),('participant','namespace')]
        for outer,inner in paths:
            doc=copy.deepcopy(expected);doc[outer][inner]='wrong'
            with self.subTest(inner=inner),self.assertRaises(Invalid):match(encode(doc),expected)
        for key in ['execution_result_ref','assurance_ref','completion_knowledge']:
            doc=copy.deepcopy(expected);doc[key]='reported' if key=='completion_knowledge' else 'sha256:'+'d'*64
            with self.subTest(key=key),self.assertRaises(Invalid):match(encode(doc),expected)
        doc=copy.deepcopy(expected)
        doc['execution_result_ref'],doc['assurance_ref']=doc['assurance_ref'],doc['execution_result_ref']
        with self.assertRaises(Invalid):match(encode(doc),expected)
    def test_python_numbers(self):
        for raw in [b'-0',b'1.0',b'1e0',b'NaN',b'Infinity',b'9007199254740992']:
            with self.subTest(raw=raw),self.assertRaises(Invalid):decode(raw)
        for value in [1.0,float('nan'),9007199254740992,{'key':object()}]:
            with self.subTest(value=str(value)),self.assertRaises(Invalid):encode(value)
        self.assertEqual(encode({'z':True,'a':None,'n':-9007199254740991}),b'{"a":null,"n":-9007199254740991,"z":true}')
    def test_unicode(self):
        value='é/\u2028\u2029\x00\b\f\n\r\t"\\'
        self.assertEqual(encode(value),b'"\xc3\xa9/\xe2\x80\xa8\xe2\x80\xa9\\u0000\\b\\f\\n\\r\\t\\"\\\\"')
        self.assertNotEqual(encode('é'),encode('e\u0301'))
        with self.assertRaises(Invalid):encode('\udfff')
    def test_limits(self):
        for value in [{'x':list(range(65))},'x'*8192]:
            with self.assertRaises(Invalid):encode(value)
        value=0
        for _ in range(9):value=[value]
        with self.assertRaises(Invalid):encode(value)
        with self.assertRaises(Invalid):parse(b' '*6145)
    def test_request(self):
        self.assertEqual(request(b'{"call_id":"x"}'),{'call_id':'x'})
        for key in ['profile','repository','target','verifier','config_revision','evidence_root',
                    'assurance_ref','run','step','attempt','effect','principal']:
            with self.subTest(key=key),self.assertRaises(Invalid):request(encode({'call_id':'x',key:'CANARY'}))
    def test_assets(self):
        assets_check()
    def test_isolated_environment(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);marker=root/'executed'
            code='open('+repr(str(marker))+',"w").write("leak")'
            for name in ['sitecustomize.py','usercustomize.py','json.py','startup.py']:(root/name).write_text(code)
            env=dict(os.environ,PYTHONPATH=tmp,PYTHONHOME='/invalid',PYTHONSTARTUP=str(root/'startup.py'),CANARY='SECRET_ENV')
            result=subprocess.run([sys.executable,'-I',str(ASSETS.parent/'run.py'),'parse'],input=encode(specimen()),capture_output=True,cwd=tmp,env=env)
            self.assertEqual(result.returncode,0,result.stderr)
            self.assertFalse(marker.exists())
            self.assertNotIn(b'SECRET_ENV',result.stdout+result.stderr)

class ParityCorpusTests(unittest.TestCase):
    def test_neutral_corpus(self):
        corpus=json.loads((ASSETS/'parity.json').read_text())
        expected=json.loads(json.dumps(corpus['expected']).replace('@RUNTIME@','python'))
        for item in corpus['cases']:
            raw=item['wire'].replace('@RUNTIME@','python').encode()
            with self.subTest(name=item['name']):
                try:
                    result=encode(decode(raw)) if item['mode']=='encode' else encode(match(raw,expected))
                    accepted=True
                except Invalid:
                    accepted=False
                self.assertEqual(accepted,item['accept'])
