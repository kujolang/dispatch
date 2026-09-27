"""Operator-side TEST capture: reads real fixture stores, never imported by consumer.
Not a new production verifier. Records a point-in-time observation for offline replay.
No backend implementation source is imported. Never exports business payload/credential.
"""
import json
import sqlite3
import subprocess
import sys
import time
from pathlib import Path
from consumer import portable, digest, sha, utf8, manifest, evidence, decide

def capture(folder):
    config = json.loads((folder/'config.json').read_text())
    assurance_raw = (folder/'historical-beta.json').read_text()
    a = json.loads(assurance_raw); profile = a['profile']['id']; now = int(time.time())
    result_raw = (folder/'result-1.json').read_text()
    assert sha(utf8(result_raw)) == a['subject']['result_sha256']
    attestation=json.loads((folder/'beta-conformance.json').read_text())
    assert attestation=={'checks':33,'ok':True,'result_sha256':sha(utf8(result_raw)),'schema':'dispatch.effect-assurance/v1beta1'}
    registry = json.loads((folder/'operator-store.json').read_text())['revisions']
    revision, installed = next((k,v) for k,v in registry.items() if v['descriptor']['verifier_version'] == '1')
    descriptor = installed['descriptor']; assert digest(descriptor) == revision
    expected = dict(config['intent'])
    expected.pop('valid_from',None); expected.pop('valid_until',None)
    live = {}
    if profile == 'dispatch.sqlite-unique':
        db=sqlite3.connect('file:'+str(folder/'sink.sqlite')+'?mode=ro',uri=True)
        db.execute('BEGIN')
        rows=db.execute('SELECT intent FROM effect_keys WHERE scope=? AND key=?',(expected['scope_sha256'],expected['key_sha256'])).fetchall()
        assert len(rows)==1 and json.loads(rows[0][0]) == config['intent']
        tx=digest(config['intent']); assert db.execute('SELECT request FROM logical_effects WHERE tx=?',(tx,)).fetchall()==[(expected['request_sha256'],)]
        db.close()
    elif profile == 'workcell.git-cas':
        def git(*args):
            return subprocess.check_output(['git','--no-replace-objects','-C',config['repo'],*args],env={'PATH':'/usr/bin:/bin','GIT_CONFIG_NOSYSTEM':'1','HOME':'/nonexistent'},timeout=5,stderr=subprocess.DEVNULL).decode().strip()
        marker='refs/kujo-effects/'+expected['scope_sha256']+'/'+expected['key_sha256']
        marker_bytes=subprocess.check_output(['git','--no-replace-objects','-C',config['repo'],'cat-file','blob',marker],env={'PATH':'/usr/bin:/bin','GIT_CONFIG_NOSYSTEM':'1','HOME':'/nonexistent'},timeout=5,stderr=subprocess.DEVNULL)
        assert marker_bytes == portable(config['intent'])
        assert git('rev-parse','refs/kujo-targets/'+expected['target_sha256']) == config['new_oid']
        tx=digest(config['intent'])
    else:
        db=sqlite3.connect('file:'+str(folder/'application.sqlite')+'?mode=ro',uri=True);db.execute('BEGIN')
        key=config['application_key_digest']
        rows=db.execute('SELECT tx,profile,body FROM business_effects WHERE key=?',(key,)).fetchall();assert len(rows)==1
        tx,raw_profile,body=rows[0];p=json.loads(raw_profile)
        assert sha(utf8(body))==p['input_sha256'] and tx==p['transaction_sha256']==config['transaction_sha256']
        assert digest(p)==config['profile_sha256']
        request=db.execute('SELECT request,profile,state FROM requests WHERE key=?',(key,)).fetchone()
        assert request and request[0]==p['request_digest'] and json.loads(request[1])==p
        # Operator-owned session mapping, not producer authentication fields.
        sessions=db.execute('SELECT principal,valid_from,valid_until,revoked FROM sessions').fetchall()
        assert any(digest(json.loads(raw))==p['principal_sha256'] and start<=now<end and revoked==0 for raw,start,end,revoked in sessions)
        receipts=db.execute('SELECT raw,digest,tx FROM receipts WHERE key=?',(key,)).fetchall();assert len(receipts)<=1
        receipt_hash=None
        if receipts:
            raw,h,receipt_tx=receipts[0];assert sha(utf8(raw))==h and receipt_tx==tx
            receipt_hash=h
        db.close();live.update(application_profile=p,receipt_sha256=receipt_hash)
    expected.update(transaction_sha256=tx,reported_state='unknown',replay_class='external_idempotent',observed_state='committed')
    assert expected==a['bindings']
    ref=evidence(profile,expected,a['validity'],live);assert ref==a['evidence_ref']
    policy={'schema':'dispatch.assurance-negotiation/v1beta1','mode':'required','fallback':'deny','profile':profile,'profile_version':'1beta1','config_revision':revision}
    policy['policy_sha256']=digest(policy)
    state_path=next((folder/'runs').glob('*/state.json'))
    state_raw=state_path.read_text();assert state_raw.startswith('DISPATCH_ASSURANCE_STATE_V1BETA1\n')
    state=json.loads(state_raw.split('\n',1)[1]);assert state['assurance_negotiation']==policy
    result=json.loads(result_raw);assert state['run_id']==result['subject']['run_id']
    subject={'kind':'action',**result['subject'],'effect_id':result['effects'][0]['effect_id'],'result_sha256':sha(utf8(result_raw))}
    assert subject==a['subject']
    live.update(config_revision=revision,subject=a['subject'],profile=a['profile'],checked_at=now,
                bindings=expected,predicate=manifest(profile)['verified_predicate'],status='verified',evidence_ref=ref)
    packet={'result_raw':result_raw,'assurance_raw':assurance_raw,'policy':policy,'now':now,
            'host':{'subject':subject,'expected_bindings':expected,'revisions':{revision:{**installed,'current_verifier_sha256':descriptor['verifier_sha256'],'current_authority_sha256':descriptor['authority_sha256']}}},'live':live}
    assert decide(packet)['decision']=='verified',decide(packet)
    return packet

if __name__=='__main__':
    # Watch real migration artifacts before receipt publication changes evidence.
    root=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
    deadline=time.monotonic()+900
    while time.monotonic()<deadline:
        for base in sorted(root.glob('beta-migration-*'),reverse=True):
            for family in ['sqlite','git','ability']:
                dest=out/(family+'.json')
                if dest.exists(): continue
                folder=base/(family+'-beta')
                if not (folder/'historical-beta.json').exists(): continue
                try:
                    packet=capture(folder);dest.write_text(json.dumps(packet,ensure_ascii=False,indent=2)+'\n')
                    print(json.dumps({'captured':family,'observed_at':packet['now'],'origin':base.name}),flush=True)
                except (AssertionError,KeyError,ValueError,sqlite3.Error,subprocess.SubprocessError,FileNotFoundError):pass
        if len(list(out.glob('*.json')))==3:sys.exit(0)
        time.sleep(.05)
    sys.exit('capture timed out; no synthetic success substituted')
