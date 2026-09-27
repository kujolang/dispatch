// Offline process orchestration only; participant, action, reader and admission run in Kujo.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process'; import assert from 'node:assert/strict';
const boundary = process.argv[2] || 'after_commit'; assert(['before_commit','after_commit'].includes(boundary));
const cwd=process.cwd(), runtime=process.env.KUJO_BIN||'/tmp/kujo-wave-a-release-candidate-bin', workcell=path.resolve(process.env.WORKCELL_ROOT||'../workcell');
const root=path.resolve('tests/tmp/git-participant-'+Date.now()); fs.mkdirSync(root+'/artifacts',{recursive:true,mode:0o700});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const write=(n,x)=>fs.writeFileSync(root+'/'+n,canonical(x),{mode:0o600}), read=n=>JSON.parse(fs.readFileSync(root+'/'+n,'utf8'));
const logs=[], env={...process.env,DISPATCH_OFFLINE_FIXTURE:'true',DISPATCH_ALLOW_ANY_OUTPUT_ROOT:'true'};
function cmd(exe,args,where=cwd,input){const r=spawnSync(exe,args,{cwd:where,env,input,encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024}); assert.equal(r.status,0,r.stderr+'\n'+r.stdout);assert.equal(r.stderr,'');logs.push(r.stdout);return r.stdout.trim();}
const phase=n=>JSON.parse(cmd(runtime,['run','tests/persisted_negotiation_fixture.kujo',root,n]));
const canary='PRIVATE_GIT_CONTENT_84c9', pathCanary='PRIVATE_REPO_PATH_7f31';
const repo=root+'/'+pathCanary+'.git';cmd('git',['init','--bare','--quiet',repo]);
const git=(args,input)=>cmd('git',['--git-dir='+repo,...args],cwd,input);
const old=git(['hash-object','-w','--stdin'],'old'), next=git(['hash-object','-w','--stdin'],canary), now=Math.floor(Date.now()/1000);
const intent={operation:'update',target_sha256:sha('PRIVATE_TARGET_96d1'),scope_sha256:sha('operator-scope'),key_sha256:sha('fixture-key'),request_sha256:sha(next),precondition_sha256:sha(old),valid_from:now-5,valid_until:now+1800};
const target='refs/kujo-targets/'+intent.target_sha256, marker='refs/kujo-effects/'+intent.scope_sha256+'/'+intent.key_sha256;
git(['update-ref',target,old]);
write('config.json',{runtime,cwd:workcell,node:process.execPath,entry:'examples/effect-assurance/adapter.kujo',issuer:'git-local',repo,old_oid:old,new_oid:next,intent,beta:true,git_participant:true,boundary,effect_class:'external_idempotent'});
const observe=()=>JSON.parse(cmd(runtime,['run','examples/effect-assurance/adapter.kujo',root,'observe'],workcell));
const participant=n=>JSON.parse(cmd(runtime,['run','examples/controlled-git/participant.kujo',root,String(n)],workcell));
const calls=()=>fs.existsSync(root+'/git-participant-invocations')?fs.readFileSync(root+'/git-participant-invocations','utf8'):'';
const installed=phase('install');assert.equal(phase('start').ok,true);
const committed=boundary==='after_commit'; assert.equal(observe().observation.observed_state,committed?'committed':'not_started');
assert.equal(git(['rev-parse',target]),committed?next:old);
assert.equal(read('result-1.json').status,'indeterminate');assert.equal(read('result-1.json').process_correlation.outcome,'completion_lost');
assert.equal(calls(),'1\n');assert.equal(participant(1).ok,false);assert.equal(calls(),'1\n');
// Host installs a separate valid ticket; hostile caller fields cannot use it.
const ticket=read('git-ticket-1.json'), current=read('git-current-ticket.json');
write('git-ticket-9.json',{...ticket,participant_call_id:'process-call-9',dispatch_attempt_id:'9'});write('git-current-ticket.json',{attempt:'9'});
let deniedInputs=0;
for(const field of ['profile','verifier','config_revision','repo','git_executable','target_ref','evidence_root','assurance_ref','dispatch_run_id','dispatch_step_id','dispatch_attempt_id','dispatch_effect_id']){
 write('git-request-9.json',{call_id:'process-call-9',[field]:'caller-override'});assert.equal(participant(9).ok,false,field);assert(!fs.existsSync(root+'/git-claim-9'));deniedInputs++;
}
write('git-request-9.json',{call_id:'wrong-call'});assert.equal(participant(9).ok,false);deniedInputs++;
write('git-request-9.json',{call_id:'process-call-9'});write('git-ticket-9.json',{...ticket,participant_call_id:'process-call-9',dispatch_attempt_id:'9',valid_until:0});assert.equal(participant(9).ok,false);deniedInputs++;
write('git-ticket-9.json',{...ticket,participant_call_id:'process-call-9',dispatch_attempt_id:'9'});write('git-current-ticket.json',current);assert.equal(participant(9).ok,false);deniedInputs++;
assert.equal(calls(),'1\n');assert(!fs.existsSync(root+'/git-claim-9'));
// Fresh controller and verifier, no live participant process retained.
assert.equal(phase('assure').ok,true);assert.equal(phase('eval').ok,true);
const pointer=read('state-pointer.json'), stateFile=pointer.run_dir+'/state.json', before=fs.readFileSync(stateFile);
const refFile=root+'/git-bound-handoff-1.ref', originalRef=fs.readFileSync(refFile,'utf8'), doc=read('artifacts/'+originalRef.slice(7)+'.json');
function select(value){const raw=canonical(value),ref='sha256:'+sha(raw);fs.writeFileSync(root+'/artifacts/'+sha(raw)+'.json',raw);fs.writeFileSync(refFile,ref);}
let negatives=0;
for(const field of ['participant_id','participant_call_id','participant_invocation_id','workcell_effect_id','dispatch_run_id','dispatch_step_id','dispatch_attempt_id','dispatch_effect_id','execution_result_ref','assurance_ref','transaction_sha256']){
 select({...doc,[field]:field.endsWith('_ref')?'sha256:'+'0'.repeat(64):field==='transaction_sha256'?'0'.repeat(64):'substituted'});
 assert.equal(phase('eval').ok,false,field);assert.deepEqual(fs.readFileSync(stateFile),before);assert.equal(calls(),'1\n');negatives++;
}
for(const patch of [{schema:'unknown'},{unexpected:'field'},{outcome:'safe'},{participant_call_id:'bad\n'},{assurance_ref:'../../private'},{assurance_ref:'https://example.invalid/evidence'}]){select({...doc,...patch});assert.equal(phase('eval').ok,false);negatives++;}
const huge=' '.repeat(4097);fs.writeFileSync(root+'/artifacts/'+sha(huge)+'.json',huge);fs.writeFileSync(refFile,'sha256:'+sha(huge));assert.equal(phase('eval').ok,false);negatives++;
fs.writeFileSync(refFile,originalRef);const artifact=root+'/artifacts/'+originalRef.slice(7)+'.json', bytes=fs.readFileSync(artifact);
fs.writeFileSync(artifact,Buffer.concat([bytes,Buffer.from('\n')]));assert.equal(phase('eval').ok,false);fs.writeFileSync(artifact,bytes);negatives++;
fs.renameSync(artifact,artifact+'.saved');fs.symlinkSync(artifact+'.saved',artifact);assert.equal(phase('eval').ok,false);fs.unlinkSync(artifact);fs.renameSync(artifact+'.saved',artifact);negatives++;
// Correct handoff cannot turn mismatched profile/intent into permission.
const cfg=read('config.json');write('config.json',{...cfg,intent:{...intent,target_sha256:sha('substituted')}});assert.equal(phase('eval').ok,false);write('config.json',cfg);negatives++;
const store=read('operator-store.json'), broken=structuredClone(store);broken.revisions[installed.r1].descriptor.profile='dispatch.sqlite-unique';write('operator-store.json',broken);assert.equal(phase('eval').ok,false);write('operator-store.json',store);negatives++;
const cp=phase('checkpoint');assert.equal(cp.ok,true);fs.writeFileSync(root+'/checkpoint-id',cp.checkpoint.checkpoint_id);
select({...doc,participant_call_id:'wrong-call'});assert.equal(phase('resume').ok,false);assert.equal(calls(),'1\n');
fs.writeFileSync(refFile,originalRef);assert.equal(phase('resume').error.code,'stale_checkpoint');const fresh=phase('checkpoint');assert.equal(fresh.ok,true);fs.writeFileSync(root+'/checkpoint-id',fresh.checkpoint.checkpoint_id);
store.selected='legacy';write('operator-store.json',store);
const resumed=phase('resume');assert.equal(resumed.ok,true,JSON.stringify(resumed));assert.equal(resumed.policy.config_revision,installed.r1);
assert.equal(calls(),'1\n2\n');assert.equal(git(['rev-parse',target]),next);assert.equal(git(['for-each-ref','--format=%(refname)','refs/kujo-effects']).split('\n').length,1);
assert.equal(git(['cat-file','blob',marker]),canonical(intent));assert.equal(observe().observation.observed_state,'committed');assert.equal(participant(2).ok,false);assert.equal(calls(),'1\n2\n');
const first=read('result-1.json').process_correlation,second=read('result-2.json').process_correlation;assert.notEqual(first.participant_invocation_id,second.participant_invocation_id);assert.equal(first.workcell_effect_id,second.workcell_effect_id);assert.equal(second.outcome,'completed');
const journal=fs.readFileSync(pointer.run_dir+'/control-events.jsonl','utf8');assert(journal.includes('assurance_replay_admitted'));
const publicArtifacts=[journal,...[1,2].map(n=>fs.readFileSync(root+'/artifacts/'+fs.readFileSync(root+'/git-handoff-'+n+'.ref','utf8').slice(7)+'.json','utf8'))];
// Git initialization hashes are diagnostic setup output only; all participant/controller outputs are content-light.
for(const raw of [...publicArtifacts,...logs]){assert(!raw.includes(canary));assert(!raw.includes(pathCanary));assert(!raw.includes('PRIVATE_TARGET_96d1'));}
for(const raw of publicArtifacts){assert(!raw.includes('ability_invocation'));assert(!raw.includes('receipt_ref'));}
assert(!fs.existsSync(root+'/application.sqlite'));assert(!fs.existsSync(root+'/invocation.json'));
const proof={schema:'dispatch.git-participant-rehearsal/v1',boundary,ok:true,actual_sigkill:true,initial_observed_state:committed?'committed':'not_started',logical_effects:1,admitted_processes:2,duplicate_denials:2,caller_denials:deniedInputs,negative_correlations:negatives,fresh_controller:true,checkpoint:true,stale_checkpoint_denied:true,descendant:true,privacy:true,ability_used:false,policy:resumed.policy};write('proof.json',proof);console.log(JSON.stringify({root,...proof}));
