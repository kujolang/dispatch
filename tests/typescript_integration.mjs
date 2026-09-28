// Controller integration harness only; external participant implementation is not copied.
import fs from 'node:fs';import path from 'node:path';import {spawnSync,spawn} from 'node:child_process';import assert from 'node:assert/strict';
import {encode,hash,ref,parse} from '../interop/typescript-participant/dist/codec.js';
const boundary=process.argv[2]||'after_commit',cwd=process.cwd(),runtime=process.env.KUJO_BIN||'/tmp/kujo-wave-a-release-candidate-bin',workcell=path.resolve(process.env.WORKCELL_ROOT||'../workcell');
assert(['before_commit','after_commit'].includes(boundary));const root=path.resolve('tests/tmp/typescript-'+Date.now());fs.mkdirSync(root+'/artifacts',{recursive:true,mode:0o700});
const write=(n,d)=>fs.writeFileSync(root+'/'+n,encode(d)),read=n=>JSON.parse(fs.readFileSync(root+'/'+n,'utf8')),logs=[];
const env={...process.env,DISPATCH_OFFLINE_FIXTURE:'true',DISPATCH_ALLOW_ANY_OUTPUT_ROOT:'true'};
function cmd(exe,args,dir=cwd,input){const r=spawnSync(exe,args,{cwd:dir,env,encoding:'utf8',input,timeout:90000,maxBuffer:2*1024*1024});assert.equal(r.status,0,r.stderr+'\n'+r.stdout);assert.equal(r.stderr,'');logs.push(r.stdout);return r.stdout.trim();}
const phase=p=>JSON.parse(cmd(runtime,['run','tests/persisted_negotiation_fixture.kujo',root,p]));
const repo=root+'/PRIVATE_HOST_PATH.git';cmd('git',['init','--bare','--quiet',repo]);
const git=(args,input)=>cmd('git',['--git-dir='+repo,...args],cwd,input),old=git(['hash-object','-w','--stdin'],'old'),next=git(['hash-object','-w','--stdin'],'PRIVATE_GIT_CONTENT');
const now=Math.floor(Date.now()/1000),intent={operation:'update',target_sha256:hash('private-target'),scope_sha256:hash('operator-scope'),key_sha256:hash('fixture-key'),request_sha256:hash(next),precondition_sha256:hash(old),valid_from:now-5,valid_until:now+1800};
const target='refs/kujo-targets/'+intent.target_sha256,marker='refs/kujo-effects/'+intent.scope_sha256+'/'+intent.key_sha256;git(['update-ref',target,old]);
write('config.json',{runtime,node:process.execPath,cwd:workcell,entry:'examples/effect-assurance/adapter.kujo',issuer:'git-local',repo,old_oid:old,new_oid:next,intent,beta:true,native_participant:true,boundary,effect_class:'external_idempotent'});
const observe=()=>JSON.parse(cmd(runtime,['run','examples/effect-assurance/adapter.kujo',root,'observe'],workcell));
const host=n=>JSON.parse(cmd(process.execPath,['interop/typescript-participant/host/runner.mjs',root,String(n)]));
const installed=phase('install');const started=phase('start');assert.equal(started.ok,true,JSON.stringify(started));
assert.equal(observe().observation.observed_state,boundary==='before_commit'?'not_started':'committed');
assert.equal(read('ts-termination-1.json').signal,'SIGKILL');assert.equal(read('ts-termination-1.json').phase,'executing');
const preparedRef=fs.readFileSync(root+'/ts-prepared-1.ref','utf8'),preparedBytes=fs.readFileSync(root+'/artifacts/'+preparedRef.slice(7)+'.json');assert.equal(ref(preparedBytes),preparedRef);
assert.equal(read('result-1.json').participant_correlation.completion_knowledge,'unknown');assert.equal(host(1).ok,false);
assert.equal(phase('assure').ok,true);assert.equal(phase('eval').ok,true);
const originalRef=fs.readFileSync(root+'/ts-bound-handoff-1.ref','utf8'),original=fs.readFileSync(root+'/artifacts/'+originalRef.slice(7)+'.json','utf8'),doc=parse(original);
const pointer=read('state-pointer.json'),before=fs.readFileSync(pointer.run_dir+'/state.json');let negatives=0;
function select(d){const raw=encode(d),r=ref(raw);fs.writeFileSync(root+'/artifacts/'+r.slice(7)+'.json',raw);fs.writeFileSync(root+'/ts-bound-handoff-1.ref',r);}
const attacks=[];for(const k of ['run_id','step_id','attempt_id','effect_id'])attacks.push(d=>d.subject[k]='wrong');
for(const k of ['namespace','invocation_id'])attacks.push(d=>d.participant[k]='wrong');
for(const k of ['execution_result_ref','assurance_ref'])attacks.push(d=>d[k]=ref('wrong'));
attacks.push(d=>d.completion_knowledge='reported',d=>d.participant_extension.values.call_id='wrong',d=>d.participant_extension.values.process_instance_id='wrong',d=>d.effect_extension.values.transaction_sha256='0'.repeat(64),d=>d.effect_extension.schema='unknown/v1',d=>d.participant_extension.schema='unknown/v1',d=>d.participant_extension.values.payload='PRIVATE_INPUT_CANARY');
for(const mutate of attacks){const d=structuredClone(doc);mutate(d);select(d);assert.equal(phase('eval').ok,false);assert.deepEqual(fs.readFileSync(pointer.run_dir+'/state.json'),before);negatives++;}
fs.writeFileSync(root+'/ts-bound-handoff-1.ref',originalRef);
// Pinned executable/lock substitution cannot borrow the installed revision.
for(const name of ['interop/typescript-participant/dist/codec.js','interop/typescript-participant/dist/sdk.js','interop/typescript-participant/package-lock.json']){const saved=fs.readFileSync(name);try{fs.appendFileSync(name,'\n');assert.equal(phase('eval').ok,false);assert.deepEqual(fs.readFileSync(pointer.run_dir+'/state.json'),before);}finally{fs.writeFileSync(name,saved);}}
// Exact artifact reads reject byte tampering and symlinks, not just JSON substitutions.
const artifactPath=root+'/artifacts/'+originalRef.slice(7)+'.json';
fs.appendFileSync(artifactPath,' ');assert.equal(phase('eval').ok,false);fs.writeFileSync(artifactPath,original);
fs.renameSync(artifactPath,artifactPath+'.saved');fs.symlinkSync(artifactPath+'.saved',artifactPath);assert.equal(phase('eval').ok,false);fs.unlinkSync(artifactPath);fs.renameSync(artifactPath+'.saved',artifactPath);
assert.equal(phase('eval').ok,true);
const cp=phase('checkpoint');assert(cp.ok);fs.writeFileSync(root+'/checkpoint-id',cp.checkpoint.checkpoint_id);
const bad=structuredClone(doc);bad.participant.invocation_id='wrong';select(bad);assert.equal(phase('resume').ok,false);
fs.writeFileSync(root+'/ts-bound-handoff-1.ref',originalRef);assert.equal(phase('resume').error.code,'stale_checkpoint');const cp2=phase('checkpoint');fs.writeFileSync(root+'/checkpoint-id',cp2.checkpoint.checkpoint_id);
const store=read('operator-store.json');store.selected='legacy';write('operator-store.json',store);const resumed=phase('resume');assert(resumed.ok,JSON.stringify(resumed));assert.equal(resumed.policy.config_revision,installed.r1);
assert.equal(host(2).ok,false);assert.equal(git(['rev-parse',target]),next);assert.equal(git(['cat-file','blob',marker]),encode(intent));
assert.equal(read('result-2.json').participant_correlation.completion_knowledge,'reported');assert.notEqual(read('ts-identities-1.json').invocation_id,read('ts-identities-2.json').invocation_id);
// A controller-installed duplicate-delivery ticket: four independent hosts and children.
const ticket=read('ts-ticket-2.json');write('ts-ticket-3.json',{...ticket,subject:{...ticket.subject,attempt_id:'3'},call_id:'native-call-3',valid_until_ms:Date.now()+120000});write('ts-current.json',{attempt:'3'});write('ts-request-3.json',{call_id:'native-call-3'});
const results=await Promise.all(Array.from({length:4},()=>new Promise((resolve,reject)=>{const p=spawn(process.execPath,['interop/typescript-participant/host/runner.mjs',root,'3'],{cwd,env:{}});let out='';p.stdout.on('data',b=>out+=b);p.on('error',reject);p.on('close',c=>{try{assert.equal(c,0);resolve(JSON.parse(out));}catch(e){reject(e);}});})));assert.equal(results.filter(x=>x.ok).length,1);
let trust=0;write('ts-ticket-4.json',{...ticket,subject:{...ticket.subject,attempt_id:'4'},call_id:'native-call-4',valid_until_ms:Date.now()+120000});write('ts-current.json',{attempt:'4'});
for(const k of ['profile','repo','config_revision','dispatch_run_id','dispatch_step_id','dispatch_attempt_id','dispatch_effect_id','trusted_root','verifier','assurance_ref','principal']){write('ts-request-4.json',{call_id:'native-call-4',[k]:'PRIVATE_INPUT_CANARY'});assert.equal(host(4).ok,false);assert(!fs.existsSync(root+'/ts-claim-4'));trust++;}
write('ts-request-4.json',{call_id:'native-call-4'});write('ts-current.json',{attempt:'2'});assert.equal(host(4).ok,false);write('ts-current.json',{attempt:'4'});write('ts-ticket-4.json',{...read('ts-ticket-4.json'),valid_until_ms:0});assert.equal(host(4).ok,false);
assert.equal(git(['for-each-ref','--format=%(refname)','refs/kujo-effects']).split('\n').length,1);
const journal=fs.readFileSync(pointer.run_dir+'/control-events.jsonl','utf8');assert(journal.includes('assurance_replay_admitted'));
for(const raw of [journal,original,...logs])for(const canary of ['PRIVATE_INPUT_CANARY','PRIVATE_GIT_CONTENT','PRIVATE_HOST_PATH'])assert(!raw.includes(canary));
assert.deepEqual(fs.readFileSync(root+'/artifacts/'+preparedRef.slice(7)+'.json'),preparedBytes);assert.equal(ref(fs.readFileSync(root+'/artifacts/'+originalRef.slice(7)+'.json')),originalRef);
const proof={package_substitution_denials:3,artifact_tamper_denials:2,historical_bytes_unchanged:true,ok:true,boundary,native_generic:true,actual_sigkill:true,controller_restart:true,participant_restart:true,checkpoint:true,logical_effects:1,concurrency:{contenders:4,admitted:1,denied:3},negative_correlations:negatives,trust_denials:trust+2,no_new_reader:true,privacy:true};write('proof.json',proof);console.log(JSON.stringify({root,...proof}));
