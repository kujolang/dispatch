"""Operator integration fixture, not participant library or replay controller."""
import datetime
import json
import os
from pathlib import Path
import re
import signal
import selectors
import socket
import stat
import subprocess
import sys
import time
import uuid
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'src'))
from kujo_participant.codec import *
from kujo_participant.process import send,receive
from kujo_participant.codec import parse as legacy_parse
PACKAGE=Path(__file__).resolve().parents[1]
INSTALLED={}

def parse(raw):
    if 'consumer_namespace' not in INSTALLED:return legacy_parse(raw)
    def owner(d):
        require(d['participant']['namespace']==INSTALLED['consumer_namespace'])
        require(d['participant_extension']['schema']==INSTALLED['consumer_schema'])
        closed(d['participant_extension']['values'],('call_id','process_instance_id'))
        require(all(identifier(v) for v in d['participant_extension']['values'].values()))
        require(d['effect_extension']=={'schema':GIT,'values':{'workcell_effect_id':'workcell-logical-git-1','transaction_sha256':digest(encode(INSTALLED['intent']))}})
    return legacy_parse(raw,owner)

def match(raw,expected):
    doc=parse(raw);require(raw==encode(expected));return doc



def read(root,name,limit=8192):
    require(not root.is_symlink() and root.is_dir())
    require(re.fullmatch(r'[A-Za-z0-9_.-]+',name) is not None)
    fd=os.open(root/name,os.O_RDONLY|os.O_NOFOLLOW)
    try:
        require(stat.S_ISREG(os.fstat(fd).st_mode));data=os.read(fd,limit+1);require(len(data)<=limit);return data
    finally:os.close(fd)


def write(root,name,raw,replace=False):
    require(re.fullmatch(r'[A-Za-z0-9_.-]+',name) is not None)
    target=root/name
    temp=root/('tmp-'+str(uuid.uuid4())) if replace else target
    fd=os.open(temp,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
    try:
        with os.fdopen(fd,'wb') as stream:stream.write(raw);stream.flush();os.fsync(stream.fileno())
        if replace:os.replace(temp,target)
        directory=os.open(root,os.O_RDONLY);os.fsync(directory);os.close(directory)
    finally:
        if replace and temp.exists():temp.unlink()


def artifact(root,raw):
    store=root/'artifacts'
    if not store.exists():store.mkdir(mode=0o700)
    require(not store.is_symlink() and store.is_dir())
    name=digest(raw)+'.json'
    try:write(store,name,raw)
    except FileExistsError:require(read(store,name,1048576)==raw)
    return reference(raw)


def child():
    parent,worker=socket.socketpair();parent.settimeout(20)
    process=subprocess.Popen([INSTALLED.get('package_python',sys.executable),'-I',INSTALLED.get('package_worker',str(PACKAGE/'run.py')),'participant',str(worker.fileno())],
                             pass_fds=(worker.fileno(),),stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE,env={},cwd=PACKAGE)
    worker.close();return process,parent


def finish(process):
    out,err=process.communicate(timeout=20)
    require(out==b'' and err==b'');require(process.returncode in (0,-signal.SIGKILL))


def record(root,doc):
    process,channel=child()
    try:
        send(channel,{'mode':'record','handoff':doc});reply=receive(channel)
        raw=reply['wire'].encode();match(raw,doc);finish(process)
        return artifact(root,raw)
    finally:
        channel.close()
        if process.poll() is None:process.kill();process.wait()


def effect(config,root,mode):
    # Existing Workcell action only. Source config is operator-owned, never caller JSON.
    process=subprocess.Popen([config['runtime'],'run',config['entry'],str(root),mode],cwd=config['cwd'],env={},
                             stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    selector=selectors.DefaultSelector();selector.register(process.stdout,selectors.EVENT_READ,'out');selector.register(process.stderr,selectors.EVENT_READ,'err')
    captured={'out':b'','err':b''};deadline=time.monotonic()+15
    try:
        while selector.get_map():
            require(time.monotonic()<deadline)
            for key,_ in selector.select(min(0.2,max(0,deadline-time.monotonic()))):
                part=os.read(key.fileobj.fileno(),1024)
                if not part:selector.unregister(key.fileobj)
                else:
                    captured[key.data]+=part;require(sum(map(len,captured.values()))<=8192)
        require(process.wait(timeout=max(.01,deadline-time.monotonic()))==0 and captured['err']==b'')
        value=decode(captured['out']);require(value['ok'] is True);return value
    finally:
        selector.close()
        if process.poll() is None:process.kill();process.wait()



def run(root,attempt,mode):
    assets_check();config=decode(read(root,'config.json'));suffix=str(attempt)
    INSTALLED.update(config)
    ticket=decode(read(root,'py-ticket-'+suffix+'.json'))
    request_data=request(read(root,'py-request-'+suffix+'.json',512))
    def live():
        require(decode(read(root,'py-current.json'))['attempt']==suffix)
        require(time.time()*1000<ticket['valid_until_ms'])
        require(ticket['subject']['attempt_id']==suffix and request_data['call_id']==ticket['call_id'])
    live()
    if mode=='attach':
        result_raw=read(root,'result-'+suffix+'.json',1048576)
        old_ref=read(root,'py-handoff-'+suffix+'.ref',128).decode()
        require(REF.fullmatch(old_ref) is not None)
        old=parse(read(root/'artifacts',old_ref[7:]+'.json',6144))
        require(old['execution_result_ref']==reference(result_raw))
        sidecar=read(root,'py-selected.json',8192)
        old['assurance_ref']=artifact(root,sidecar)
        ref=record(root,old);write(root,'py-bound-handoff-'+suffix+'.ref',ref.encode(),True)
        return {'ok':True}
    # Validate input and freshness BEFORE consuming or invoking any application action.
    claim='py-claim-'+suffix
    process,channel=child()
    try:
        send(channel,{'mode':'execute','request':request_data})
        admitted=receive(channel)
        closed(admitted,('op','call_id','process_instance_id'))
        require(admitted['op']=='admit' and admitted['call_id']==ticket['call_id'] and identifier(admitted['process_instance_id']))
        live()
        try:write(root,claim,b'claimed')
        except FileExistsError:return {'ok':False,'code':'admission_denied'}
        ids={'call_id':admitted['call_id'],'process_instance_id':admitted['process_instance_id'],'invocation_id':str(uuid.uuid4())}
        write(root,'py-identities-'+suffix+'.json',encode(ids))
        tx=digest(encode(config['intent']))
        def document(result_raw,knowledge):
            return {'schema':'kujo.interop-handoff/v1alpha1','subject':ticket['subject'],
                    'participant':{'namespace':config.get('consumer_namespace',NS),'invocation_id':ids['invocation_id']},
                    'completion_knowledge':knowledge,'execution_result_ref':artifact(root,result_raw),'assurance_ref':None,
                    'participant_extension':{'schema':config.get('consumer_schema',EXT),'values':{'call_id':ids['call_id'],'process_instance_id':ids['process_instance_id']}},
                    'effect_extension':{'schema':GIT,'values':{'workcell_effect_id':'workcell-logical-git-1','transaction_sha256':tx}}}
        def result(knowledge,observation):
            subject={k:v for k,v in ticket['subject'].items() if k!='effect_id'}
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')
            return encode({'schema':'kujo.execution-result/v1','result_id':subject['run_id']+':'+suffix,
                'subject':subject,'attempt':attempt,'producer':{'name':'external-python-host','version':'1'},
                'status':'indeterminate' if knowledge=='unknown' else 'success',
                'classification':'unknown',
                'effects':[{'effect_id':ticket['subject']['effect_id'],'class':'external_idempotent',
                 'state':'unknown' if knowledge=='unknown' else 'committed','idempotency_key':'fixture-key',
                 'enforced_by':'git-local','enforcement_evidence_ref':observation['evidence_ref']}],
                'evidence':[],'started_at':timestamp,'finished_at':timestamp,'preservation_outcome':ticket['preservation'],
                'participant_correlation':dict(ids,completion_knowledge=knowledge)})
        initial_observation=effect(config,root,'observe')['observation']
        provisional=result('unknown',initial_observation);doc=document(provisional,'unknown')
        send(channel,{'ok':True,'handoff':doc})
        reply=receive(channel);closed(reply,('op','wire'));require(reply['op']=='record');match(reply['wire'].encode(),doc)
        provisional_ref=artifact(root,reply['wire'].encode());write(root,'py-provisional-'+suffix+'.ref',provisional_ref.encode())
        send(channel,{'ok':True});require(receive(channel)=={'op':'execute'});live()
        crash=config.get('crash') if attempt==1 else None
        if crash=='before_commit':process.kill()
        else:
            effect(config,root,'apply')
            if crash=='after_commit':process.kill()
        knowledge='unknown' if crash in ('before_commit','after_commit') else 'reported'
        observation=effect(config,root,'observe')['observation']
        final=result(knowledge,observation);doc=document(final,knowledge)
        if knowledge=='unknown':
            finish(process);ref=record(root,doc)
        else:
            send(channel,{'ok':True,'handoff':doc});reply=receive(channel)
            closed(reply,('op','wire'));require(reply['op']=='record');match(reply['wire'].encode(),doc)
            ref=artifact(root,reply['wire'].encode());send(channel,{'ok':True});finish(process)
        write(root,'result-'+suffix+'.json',final)
        write(root,'py-handoff-'+suffix+'.ref',ref.encode())
        proof={'returncode':process.returncode,'signal':'SIGKILL' if knowledge=='unknown' else None,
               'phase':crash,'observed_state':observation['observed_state'],'completion_knowledge':knowledge}
        write(root,'py-termination-'+suffix+'.json',encode(proof))
        return {'ok':True,'termination':proof}
    finally:
        channel.close()
        if process.poll() is None:process.kill();process.wait()

if __name__=='__main__':
    try:
        require(len(sys.argv)==4 and re.fullmatch('[1-9][0-9]{0,8}',sys.argv[2]) is not None)
        root=Path(sys.argv[1]);require(root.is_absolute() and not root.is_symlink())
        print(json.dumps(run(root,int(sys.argv[2]),sys.argv[3]),separators=(',',':')))
    except Exception:
        print('{"ok":false,"code":"participant_denied"}')
        sys.exit(1)
