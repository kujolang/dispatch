"""Real controller/Workcell proof; independent Python host, published effect CLI."""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
ROOT=Path(__file__).resolve().parents[1]
PACKAGE=ROOT/'interop/python-participant'
PYTHON=str(PACKAGE/'.venv/bin/python')
RUNTIME=os.environ.get('KUJO_BIN','/tmp/kujo-wave-a-release-candidate-bin')
WORKCELL=Path(os.environ.get('WORKCELL_ROOT',str(ROOT.parent/'workcell'))).resolve()
CANARY='PRIVATE_PYTHON_PAYLOAD_6e802'
PATHCANARY='PRIVATE_HOST_PATH_729a'
sha=lambda b:hashlib.sha256(b if isinstance(b,bytes) else b.encode()).hexdigest()
wire=lambda x:json.dumps(x,sort_keys=True,separators=(',',':')).encode()
logs=[]

def cmd(argv,cwd=ROOT,data=None):
    child=subprocess.run(argv,cwd=cwd,input=data,capture_output=True,timeout=180,
                         env=dict(os.environ,DISPATCH_OFFLINE_FIXTURE='true',DISPATCH_ALLOW_ANY_OUTPUT_ROOT='true'))
    assert child.returncode==0,(argv[0],child.stdout[-3000:],child.stderr[-3000:])
    assert not child.stderr,child.stderr
    logs.append(child.stdout)
    return child.stdout

def write(path,value):path.write_bytes(wire(value))
def load(path):return json.loads(path.read_bytes())
def controller(root,phase):return json.loads(cmd([RUNTIME,'run','tests/persisted_negotiation_fixture.kujo',str(root),phase]))
def effect(root,mode):return json.loads(cmd([RUNTIME,'run','examples/effect-assurance/adapter.kujo',str(root),mode],WORKCELL))
def git(config,*args,data=None):return cmd(['git','--git-dir='+config['repo'],*args],data=data).strip().decode()

def setup(parent,name,crash=None):
    root=parent/name;root.mkdir(mode=0o700)
    now=int(time.time())
    config={'runtime':RUNTIME,'python':PYTHON,'cwd':str(WORKCELL),'entry':'examples/effect-assurance/adapter.kujo',
            'issuer':'git-local','beta':True,'native_participant':'python','crash':crash,
            'repo':str(root/(PATHCANARY+'.git')),'effect_class':'external_idempotent'}
    cmd(['git','init','--bare','--quiet',config['repo']])
    config['old_oid']=git(config,'hash-object','-w','--stdin',data=b'old')
    config['new_oid']=git(config,'hash-object','-w','--stdin',data=CANARY.encode())
    config['intent']={'operation':'update','target_sha256':sha('target'),'scope_sha256':sha(str(root)),
                      'key_sha256':sha('fixture-key'),'request_sha256':sha(config['new_oid']),
                      'precondition_sha256':sha(config['old_oid']),'valid_from':now-2,'valid_until':now+1800}
    git(config,'update-ref','refs/kujo-targets/'+config['intent']['target_sha256'],config['old_oid'])
    write(root/'config.json',config)
    return root,config

def host(root,attempt=1):
    child=subprocess.run([PYTHON,'-I',str(PACKAGE/'host/runner.py'),str(root),str(attempt),'run'],capture_output=True,env={},timeout=30)
    assert b'PRIVATE_' not in child.stdout+child.stderr
    return json.loads(child.stdout)

def ticket(root):
    subject={'run_id':'concurrency-run','step_id':'action','attempt_id':'1','effect_id':'effect-1'}
    value={'subject':subject,'call_id':'native-call-1','preservation':{},'valid_until_ms':int(time.time()*1000)+120000}
    write(root/'py-ticket-1.json',value);write(root/'py-current.json',{'attempt':'1'});write(root/'py-request-1.json',{'call_id':'native-call-1'})

parent=ROOT/'tests/tmp'/('python-'+str(time.time_ns()));parent.mkdir(parents=True)
proofs=[]
for crash in ('before_commit','after_commit'):
    root,config=setup(parent,crash,crash)
    installed=controller(root,'install');started=controller(root,'start');assert started['ok'],started
    termination=load(root/'py-termination-1.json')
    assert termination['returncode']==-9 and termination['signal']=='SIGKILL'
    assert termination['observed_state']==('not_started' if crash=='before_commit' else 'committed')
    assert termination['completion_knowledge']=='unknown'
    original=(root/'result-1.json').read_bytes()
    assert not controller(root,'eval')['ok']
    assert controller(root,'assure')['ok']
    evaluated=controller(root,'eval');assert evaluated['ok'],evaluated
    # Correlation-only substitutions fail before assurance can grant admission.
    selected=root/'py-bound-handoff-1.ref';saved_ref=selected.read_bytes()
    original_handoff=(root/'artifacts'/(saved_ref.decode()[7:]+'.json')).read_bytes()
    if crash=='after_commit':
        for name in ('__init__.py', 'sdk.py'):
            source=PACKAGE/'src/kujo_participant'/name; original_source=source.read_bytes()
            try:
                source.write_bytes(original_source+b'\n')
                assert not controller(root,'eval')['ok']
            finally:source.write_bytes(original_source)
            assert controller(root,'eval')['ok']
        mutations=[(['subject',k],'wrong') for k in ['run_id','step_id','attempt_id','effect_id']]
        mutations += [(['participant','invocation_id'],'wrong'),(['participant','namespace'],'other.owner'),
                      (['execution_result_ref'],'sha256:'+'d'*64),(['assurance_ref'],'sha256:'+'e'*64),
                      (['participant_extension','values','call_id'],'wrong'),
                      (['effect_extension','values','transaction_sha256'],'f'*64),
                      (['completion_knowledge'],'reported')]
        for path,value in mutations:
            doc=json.loads(original_handoff);cursor=doc
            for part in path[:-1]:cursor=cursor[part]
            cursor[path[-1]]=value;raw=wire(doc);ref='sha256:'+sha(raw)
            (root/'artifacts'/(ref[7:]+'.json')).write_bytes(raw);selected.write_text(ref)
            assert not controller(root,'eval')['ok'],path
        selected.write_bytes(saved_ref)
        artifact_path=root/'artifacts'/(saved_ref.decode()[7:]+'.json')
        artifact_path.write_bytes(original_handoff+b' ')
        assert not controller(root,'eval')['ok']
        artifact_path.write_bytes(original_handoff)
        assert controller(root,'eval')['ok']
    checkpoint=controller(root,'checkpoint');assert checkpoint['ok'],checkpoint
    (root/'checkpoint-id').write_text(checkpoint['checkpoint']['checkpoint_id'])
    store=load(root/'operator-store.json');store['selected']='legacy';write(root/'operator-store.json',store)
    resumed=controller(root,'resume');assert resumed['ok'],resumed
    assert resumed['policy']['config_revision']==installed['r1']
    assert (root/'result-1.json').read_bytes()==original
    assert git(config,'rev-parse','refs/kujo-targets/'+config['intent']['target_sha256'])==config['new_oid']
    markers=git(config,'for-each-ref','--format=%(refname)','refs/kujo-effects').splitlines();assert len(markers)==1
    assert git(config,'cat-file','blob',markers[0]).encode()==wire(config['intent'])
    assert not host(root)['ok']
    pointer=load(root/'state-pointer.json');journal=(Path(pointer['run_dir'])/'control-events.jsonl').read_bytes()
    handoff_ref=(root/'py-bound-handoff-1.ref').read_text();handoff=(root/'artifacts'/(handoff_ref[7:]+'.json')).read_bytes()
    for private in (CANARY,PATHCANARY,str(root)):
        assert private.encode() not in handoff+journal
    proofs.append({'case':crash,'termination':termination,'required_revision_preserved':True,'fresh_controller':True,'logical_effects':1})
root,config=setup(parent,'concurrent');ticket(root)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(lambda _:host(root),range(4)))
assert sum(r['ok'] for r in results)==1,results
assert git(config,'rev-parse','refs/kujo-targets/'+config['intent']['target_sha256'])==config['new_oid']
proofs.append({'case':'concurrency','admitted':1,'denied':3,'logical_effects':1})
for index,key in enumerate(['profile','repository','target','verifier','config_revision','evidence_root','assurance_ref','run','step','attempt','effect','principal']):
    root,config=setup(parent,'deny-'+str(index));ticket(root)
    write(root/'py-request-1.json',{'call_id':'native-call-1',key:CANARY})
    assert not host(root)['ok'];assert not (root/'py-claim-1').exists()
    assert effect(root,'observe')['observation']['observed_state']=='not_started'
for mode in ('expired','stale','symlink'):
    root,config=setup(parent,'deny-'+mode);ticket(root)
    if mode=='expired':
        t=load(root/'py-ticket-1.json');t['valid_until_ms']=1;write(root/'py-ticket-1.json',t)
    elif mode=='stale':write(root/'py-current.json',{'attempt':'2'})
    else:
        request_path=root/'py-request-1.json';request_path.unlink();request_path.symlink_to(parent/'before_commit/py-request-1.json')
    assert not host(root)['ok'];assert not (root/'py-claim-1').exists()
    assert effect(root,'observe')['observation']['observed_state']=='not_started'
for line in logs:assert CANARY.encode() not in line and PATHCANARY.encode() not in line
write(parent/'proof.json',{'proofs':proofs,'input_denials':12})
print(json.dumps({'ok':True,'root':str(parent),'proofs':proofs,'input_denials':12}))
