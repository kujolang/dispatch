"""Trusted coordinator fixture implementing frozen HOST_INTERFACE.md; not SDK/adopter code.
Filesystem/effect primitives retain the existing host fixture's bounded local rules.
"""
import datetime, hashlib, json, os, re, selectors, signal, stat, subprocess, sys, time, uuid
from pathlib import Path

def require(value):
    if not value: raise ValueError('pilot_denied')
def encode(value): return json.dumps(value,sort_keys=True,separators=(',',':')).encode()
def digest(raw): return hashlib.sha256(raw).hexdigest()
def reference(raw): return 'sha256:'+digest(raw)
def decode(raw):
    def unique(items):
        out={}
        for k,v in items:
            require(k not in out);out[k]=v
        return out
    return json.loads(raw.decode('utf-8'),object_pairs_hook=unique)
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



def child(config):
    return subprocess.Popen([config['pilot_node'],config['pilot_worker']],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env={},cwd=str(Path(config['pilot_worker']).parent))
def exchange(process,mode,doc):
    raw=encode({'mode':mode,'snapshot':doc})+b'\n';require(len(raw)<=16384)
    process.stdin.write(raw);process.stdin.flush()
    selector=selectors.DefaultSelector();selector.register(process.stdout,selectors.EVENT_READ)
    output=b'';deadline=time.monotonic()+10
    try:
        while not output.endswith(b'\n'):
            require(time.monotonic()<deadline)
            if selector.select(.1):
                chunk=os.read(process.stdout.fileno(),16385-len(output));require(chunk);output+=chunk;require(len(output)<=16384)
        reply=decode(output);require(set(reply)=={'wire'});wire=reply['wire'].encode()
        require(wire==encode(doc));return wire
    finally:selector.close()
def finish(process):
    if process.stdin:process.stdin.close();process.stdin=None
    selector=selectors.DefaultSelector()
    selector.register(process.stdout,selectors.EVENT_READ)
    selector.register(process.stderr,selectors.EVENT_READ)
    deadline=time.monotonic()+10
    try:
        while selector.get_map():
            require(time.monotonic()<deadline)
            for key,_ in selector.select(.1):
                data=os.read(key.fileobj.fileno(),1)
                require(data==b'');selector.unregister(key.fileobj)
        require(process.wait(timeout=max(.01,deadline-time.monotonic())) in (0,-9))
    finally:selector.close()
def record(config,root,doc):
    process=child(config)
    try:
        raw=exchange(process,'record',doc);finish(process);return artifact(root,raw)
    finally:
        if process.poll() is None:process.kill();process.wait()
def run(root,attempt,mode):
    require(mode in ('run','attach'))
    config=decode(read(root,'config.json'));suffix=str(attempt)
    ticket=decode(read(root,'py-ticket-'+suffix+'.json'))
    request_data=decode(read(root,'py-request-'+suffix+'.json',512));require(set(request_data)=={'call_id'})
    def live():
        require(decode(read(root,'py-current.json'))['attempt']==suffix)
        require(time.time()*1000<ticket['valid_until_ms'])
        require(ticket['subject']['attempt_id']==suffix and request_data['call_id']==ticket['call_id'])
    live()
    if mode=='attach':
        result_raw=read(root,'result-'+suffix+'.json',1048576)
        old_ref=read(root,'py-handoff-'+suffix+'.ref',128).decode()
        require(re.fullmatch(r'sha256:[0-9a-f]{64}',old_ref) is not None)
        old_raw=read(root/'artifacts',old_ref[7:]+'.json',6144);require(reference(old_raw)==old_ref);old=decode(old_raw)
        require(old['execution_result_ref']==reference(result_raw))
        sidecar=read(root,'py-selected.json',8192)
        old['assurance_ref']=artifact(root,sidecar)
        ref=record(config,root,old);write(root,'py-bound-handoff-'+suffix+'.ref',ref.encode(),True)
        return {'ok':True}
    # Validate input and freshness BEFORE consuming or invoking any application action.
    claim='py-claim-'+suffix
    try:write(root,claim,b'claimed')
    except FileExistsError:return {'ok':False,'code':'admission_denied'}
    ids={'session_tag':str(uuid.uuid4()),'exchange_tag':ticket['call_id'],'invocation_id':str(uuid.uuid4())}
    write(root,'py-identities-'+suffix+'.json',encode(ids))
    process=child(config)
    try:
        def document(result_raw,knowledge):
            return {'schema':'kujo.interop-handoff/v1alpha1','subject':ticket['subject'],
                    'participant':{'namespace':config['consumer_namespace'],'invocation_id':ids['invocation_id']},
                    'completion_knowledge':knowledge,'execution_result_ref':artifact(root,result_raw),'assurance_ref':None,
                    'participant_extension':{'schema':config['consumer_schema'],'values':{'session_tag':ids['session_tag'],'exchange_tag':ids['exchange_tag']}},
                    'effect_extension':None}
        def result(knowledge,observation):
            subject={k:v for k,v in ticket['subject'].items() if k!='effect_id'}
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')
            return encode({'schema':'kujo.execution-result/v1','result_id':subject['run_id']+':'+suffix,
                'subject':subject,'attempt':attempt,'producer':{'name':'source-blind-pilot-host','version':'1'},
                'status':'indeterminate' if knowledge=='unknown' else 'success',
                'classification':'unknown',
                'effects':[{'effect_id':ticket['subject']['effect_id'],'class':'external_idempotent',
                 'state':'unknown' if knowledge=='unknown' else 'committed','idempotency_key':'fixture-key',
                 'enforced_by':'git-local','enforcement_evidence_ref':observation['evidence_ref']}],
                'evidence':[],'started_at':timestamp,'finished_at':timestamp,'preservation_outcome':ticket['preservation'],
                'participant_correlation':dict(ids,completion_knowledge=knowledge)})
        initial_observation=effect(config,root,'observe')['observation']
        provisional=result('unknown',initial_observation);doc=document(provisional,'unknown')
        raw=exchange(process,'participate',doc)
        provisional_ref=artifact(root,raw);write(root,'py-provisional-'+suffix+'.ref',provisional_ref.encode())
        live()
        crash=config.get('crash') if attempt==1 else None
        if crash=='before_commit':process.kill()
        else:
            effect(config,root,'apply')
            if crash=='after_commit':process.kill()
        knowledge='unknown' if crash in ('before_commit','after_commit') else 'reported'
        observation=effect(config,root,'observe')['observation']
        final=result(knowledge,observation);doc=document(final,knowledge)
        if knowledge=='unknown':
            finish(process);ref=record(config,root,doc)
        else:
            raw=exchange(process,'terminal',doc);ref=artifact(root,raw);finish(process)
        write(root,'result-'+suffix+'.json',final)
        write(root,'py-handoff-'+suffix+'.ref',ref.encode())
        proof={'returncode':process.returncode,'signal':'SIGKILL' if knowledge=='unknown' else None,
               'phase':crash,'observed_state':observation['observed_state'],'completion_knowledge':knowledge}
        write(root,'py-termination-'+suffix+'.json',encode(proof))
        return {'ok':True,'termination':proof}
    finally:
        if process.poll() is None:process.kill();process.wait()

if __name__=='__main__':
    try:
        require(len(sys.argv)==4 and re.fullmatch('[1-9][0-9]{0,8}',sys.argv[2]) is not None)
        root=Path(sys.argv[1]);require(root.is_absolute() and not root.is_symlink())
        print(json.dumps(run(root,int(sys.argv[2]),sys.argv[3]),separators=(',',':')))
    except Exception:
        print('{"ok":false,"code":"participant_denied"}')
        sys.exit(1)
