import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from consumer import ROOT, portable, digest, sha, parse, Denial, decide, reconstruct_intent, schema, OWNERS

HERE=Path(__file__).parent
class Portability(unittest.TestCase):
    def test_frozen_vectors(self):
        count=0
        for path in ROOT.rglob('*commitments.json'):
            document=json.loads(path.read_text()); hashes={}
            self.assertEqual(document['algorithm'],'sha256')
            for v in document['vectors']:
                self.assertIn(v['recipe'],['exact_utf8','portable_json','alpha_json','ability_v1_json','ability_v2_json'])
                raw=v['input'].encode('utf-8') if v['recipe']=='exact_utf8' else portable(v['input'])
                self.assertEqual(raw.decode(),v['preimage_utf8'],v['name'])
                self.assertEqual(raw.hex(),v['preimage_hex'],v['name'])
                self.assertEqual(sha(raw),v['sha256'],v['name']);hashes[v['name']]=sha(raw);count+=1
            for pair in document['distinct']:self.assertNotEqual(hashes[pair[0]],hashes[pair[1]])
        self.assertEqual(count,58)

    def test_retained_artifacts(self):
        records=json.loads((ROOT/'dispatch/assurance-artifacts.json').read_text())
        self.assertEqual(len(records),6)
        for record in records:
            a=parse(record['assurance_raw'].encode(),canonical=True)
            r=record['result_raw'].encode()
            schema(parse(r,1048576),'execution-result-v1.schema.json')
            if a['schema'].endswith('v1alpha1'):
                self.assertNotEqual(a['schema'],'dispatch.effect-assurance/v1beta1')
            else:
                schema(a,'dispatch/effect-assurance-v1beta1.schema.json')
                schema(a['bindings'],OWNERS[a['profile']['id']]+'/bindings-v1beta1.schema.json')
                self.assertEqual(digest(a['bindings']),a['profile_sha256'])
                self.assertEqual(sha(r),a['subject']['result_sha256'])

    def test_encoding_boundaries(self):
        for v in [1.0,-0.0,9007199254740992,{'é':1},'\ud800',list(range(65)),{str(n):n for n in range(65)},'a'*8191]:
            with self.subTest(value_type=type(v).__name__),self.assertRaises(Denial):portable(v)
        v=0
        for _ in range(8):v=[v]
        portable(v)
        with self.assertRaises(Denial):portable([v])
        self.assertEqual(portable('\x00/\u2028"\\'),b'"\\u0000/\xe2\x80\xa8\\"\\\\"')
        for raw in [b'{"a":1,"a":1}',b'-0',b'1.0',b'NaN',b'"\xff"',b'"\\ud800"']:
            with self.subTest(raw=raw),self.assertRaises((Denial,UnicodeError)):parse(raw,canonical=True)

    def test_reconstruct_profiles(self):
        for owner,file,profile in [('dispatch','sqlite-commitments.json','dispatch.sqlite-unique'),('workcell','git-assurance-commitments.json','workcell.git-cas')]:
            vs={v['name']:v for v in json.loads((ROOT/owner/file).read_text())['vectors']}
            raw={k:vs[k]['input'] for k in ['target','scope','key']}
            if owner=='dispatch':raw['request']=vs['request']['input']
            else:raw.update(new_oid=vs['request']['input'],old_oid=vs['precondition']['input'])
            intent=vs['transaction']['input']
            actual=reconstruct_intent(profile,raw,{'from':intent['valid_from'],'until':intent['valid_until']})
            self.assertEqual(actual,vs['beta-profile']['input'])
            self.assertEqual(digest(actual),vs['beta-profile']['sha256'])
        vs={v['name']:v for v in json.loads((ROOT/'ability/application-assurance-commitments.json').read_text())['vectors']}
        # Independently rebuild the tenant/principal-scoped key object from request identity.
        principal=vs['principal']['input']; original_key=vs['key']['input']['idempotency_key']
        self.assertEqual(digest({'tenant_id':principal['tenant_id'],'principal_type':principal['type'],'principal_id':principal['id'],'idempotency_key':original_key}),vs['key']['sha256'])
        definition=vs['definition']['input']; inputs=vs['request']['input']['input']
        request={'ability_id':definition['id'],'ability_version':definition['version'],
                 'definition_digest':digest(definition),'input':inputs,'principal':principal}
        self.assertEqual(digest(request),vs['request']['sha256'])
        profile={'schema':'ability.application-assurance/v1alpha1',
                 'ability_id':definition['id'],'ability_version':definition['version'],
                 'definition_digest':digest(definition),'surface':'sdk',
                 'principal_sha256':digest(principal),'tenant_sha256':sha(principal['tenant_id'].encode()),
                 'key_digest':vs['key']['sha256'],'request_digest':digest(request),
                 'input_sha256':sha(inputs['body'].encode()),'intent_sha256':digest({'input':inputs,'principal':principal}),
                 'target_sha256':sha(b'kujo.application.publications'),'operation':'create'}
        self.assertEqual(digest(profile),vs['transaction']['sha256'])
        profile['transaction_sha256']=digest(profile)
        self.assertEqual(profile,vs['profile']['input'])


class Decisions(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.packets=[json.loads(p.read_text()) for p in sorted((HERE/'observations').glob('*.json'))]
        if len(cls.packets)!=3:raise RuntimeError('three genuine observed packets required')

    def test_positives_restart(self):
        for p in self.packets:
            self.assertEqual(decide(p),{'decision':'verified','reason_category':None})
            with tempfile.TemporaryDirectory() as d:
                file=Path(d)/'packet.json';file.write_text(json.dumps(p))
                outputs=[subprocess.check_output([sys.executable,str(HERE/'consumer.py'),str(file)]) for _ in range(2)]
                self.assertEqual(outputs[0],outputs[1]);self.assertEqual(json.loads(outputs[0]),decide(p))

    def test_delayed_restart(self):
        for original in self.packets:
            for change,reason in [('expiry','freshness_failed'),('revocation','authority_revoked')]:
                p=copy.deepcopy(original)
                if change=='expiry':p['now']=json.loads(p['assurance_raw'])['validity']['until']
                else:p['host']['revisions'][p['policy']['config_revision']]['status']='revoked'
                with tempfile.TemporaryDirectory() as d:
                    file=Path(d)/'packet.json';file.write_text(json.dumps(p))
                    out=json.loads(subprocess.check_output([sys.executable,str(HERE/'consumer.py'),str(file)]))
                    self.assertEqual(out,{'decision':'blocked','reason_category':reason})

    def test_privacy(self):
        canary='CUSTOMER_SECRET_body_password_9b2e'
        for original in self.packets:
            p=copy.deepcopy(original); a=json.loads(p['assurance_raw']);a['payload']=canary
            p['assurance_raw']=portable(a).decode()
            with tempfile.TemporaryDirectory() as d:
                file=Path(d)/'packet.json';file.write_text(json.dumps(p))
                response=subprocess.run([sys.executable,str(HERE/'consumer.py'),str(file)],capture_output=True,text=True,check=True)
                self.assertNotIn(canary,response.stdout+response.stderr)
                self.assertEqual(json.loads(response.stdout)['decision'],'blocked')
        for path in (HERE/'observations').glob('*.json'):
            text=path.read_text()
            self.assertNotIn('CANARY',text)
            self.assertNotIn('SECRET_BUSINESS_PAYLOAD_PERSISTED_PROFILE_98x',text)
            self.assertNotIn('session_token',text)

    def test_negative_matrix(self):
        results=[]
        for original in self.packets:
            profile=original['policy']['profile']
            def check(name,change,expected=None):
                p=copy.deepcopy(original);change(p);out=decide(p)
                self.assertNotEqual(out['decision'],'verified',(profile,name))
                if expected:self.assertEqual(out['reason_category'],expected,(profile,name))
                results.append({'profile':profile,'case':name,**out})
            def doc_change(p,fn):
                a=json.loads(p['assurance_raw']);fn(a);p['assurance_raw']=portable(a).decode()
            for key in ['run_id','step_id','attempt_id','effect_id','result_sha256']:
                check(key,lambda p,k=key:doc_change(p,lambda a:a['subject'].__setitem__(k,'2' if k=='attempt_id' else '0'*64 if k=='result_sha256' else 'other')))
            for key in ['target','scope','key','request','precondition','transaction']:
                def changed(p,k=key):
                    def alter(a):a['bindings'][k+'_sha256']='0'*64;a['profile_sha256']=digest(a['bindings'])
                    doc_change(p,alter)
                check(key,changed)
            check('profile',lambda p:doc_change(p,lambda a:a['profile'].__setitem__('id','unknown.profile')),'unsupported_profile')
            check('profile-version',lambda p:doc_change(p,lambda a:a['profile'].__setitem__('version','1alpha1')),'unsupported_profile')
            check('alpha',lambda p:doc_change(p,lambda a:a.__setitem__('schema','dispatch.effect-assurance/v1alpha1')),'unsupported_envelope')
            check('issuer',lambda p:doc_change(p,lambda a:a.__setitem__('issuer','untrusted')))
            check('expired',lambda p:p.__setitem__('now',json.loads(p['assurance_raw'])['validity']['until']),'freshness_failed')
            check('future',lambda p:p.__setitem__('now',json.loads(p['assurance_raw'])['validity']['from']-1),'freshness_failed')
            check('whitespace',lambda p:p.__setitem__('assurance_raw',p['assurance_raw']+'\n'))
            check('reordered',lambda p:p.__setitem__('assurance_raw',json.dumps(dict(reversed(list(json.loads(p['assurance_raw']).items()))),separators=(',',':'))))
            check('duplicate-key',lambda p:p.__setitem__('assurance_raw','{"schema":"dispatch.effect-assurance/v1beta1",'+p['assurance_raw'][1:]))
            check('extra-field',lambda p:doc_change(p,lambda a:a.__setitem__('extra',None)))
            check('newline-id',lambda p:doc_change(p,lambda a:a['subject'].__setitem__('run_id',a['subject']['run_id']+'\n')))
            check('result-bytes',lambda p:p.__setitem__('result_raw',p['result_raw']+'\n'))
            def result_change(p,fn):
                r=json.loads(p['result_raw']);fn(r);p['result_raw']=json.dumps(r,separators=(',',':'))
                def update(a):a['subject']['result_sha256']=sha(p['result_raw'].encode())
                doc_change(p,update);p['host']['subject']['result_sha256']=sha(p['result_raw'].encode())
            check('multi-effect',lambda p:result_change(p,lambda r:r['effects'].append(copy.deepcopy(r['effects'][0]))),'result_policy_denied')
            check('non-idempotent',lambda p:result_change(p,lambda r:r['effects'][0].__setitem__('class','external_non_idempotent')),'result_policy_denied')
            def opaque(p):
                result_change(p,lambda r:r['subject'].__setitem__('attempt_id','attempt-1'))
                doc_change(p,lambda a:a['subject'].__setitem__('attempt_id','attempt-1'))
                p['host']['subject']['attempt_id']='attempt-1'
                p['live']['subject']=copy.deepcopy(p['host']['subject'])
            check('opaque-attempt',opaque,'binding_mismatch')
            def install(p):return p['host']['revisions'][p['policy']['config_revision']]
            check('revoked',lambda p:install(p).__setitem__('status','revoked'),'authority_revoked')
            check('missing-revision',lambda p:p['host'].__setitem__('revisions',{}),'configuration_unavailable')
            check('code-substitution',lambda p:install(p).__setitem__('current_verifier_sha256','0'*64),'configuration_unavailable')
            check('authority-substitution',lambda p:install(p).__setitem__('current_authority_sha256','0'*64),'configuration_unavailable')
            def replacement(p):
                old=install(p);old['descriptor']['verifier_version']='2';p['host']['revisions']={digest(old['descriptor']):old}
            check('new-revision-only',replacement,'configuration_unavailable')
            def retained(p):
                old=copy.deepcopy(install(p));old['descriptor']['verifier_version']='2';p['host']['revisions'][digest(old['descriptor'])]=old
            p=copy.deepcopy(original);retained(p);p['host']['selected']='legacy';self.assertEqual(decide(p)['decision'],'verified')
            check('policy-downgrade',lambda p:p['policy'].__setitem__('mode','legacy'))
            check('alpha-policy',lambda p:p['policy'].__setitem__('schema','dispatch.assurance-negotiation/v1alpha1'),'unsupported_envelope')
            check('legacy-policy',lambda p:p.__setitem__('policy',{}),'unsupported_envelope')
            check('live-ok-only',lambda p:p.__setitem__('live',{'ok':True}))
            check('live-wrong-transaction',lambda p:p['live']['bindings'].__setitem__('transaction_sha256','0'*64))
            check('live-old-read',lambda p:p['live'].__setitem__('checked_at',p['now']-1),'verification_failed')
            check('live-wrong-predicate',lambda p:p['live'].__setitem__('predicate','safe'),'verification_failed')
            check('live-wrong-revision',lambda p:p['live'].__setitem__('config_revision','0'*64),'verification_failed')
            check('live-failed',lambda p:p['live'].__setitem__('status','unavailable'),'verification_failed')
            check('evidence-url',lambda p:doc_change(p,lambda a:a.__setitem__('evidence_ref','https://invalid.example/secret')))
            check('oversize',lambda p:p.__setitem__('assurance_raw',' '*8193))
        (HERE/'evidence').mkdir(exist_ok=True)
        (HERE/'evidence/decisions.json').write_text(json.dumps(results,indent=2)+'\n')

if __name__=='__main__':unittest.main(verbosity=2)
