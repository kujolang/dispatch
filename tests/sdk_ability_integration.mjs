// Offline orchestration harness only; application, tool and control execution are Kujo.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
const cwd=process.cwd(),runtime=process.env.KUJO_BIN||'/tmp/kujo-wave-a-release-candidate-bin';
const sdk=path.resolve(process.env.AGENTS_SDK_ROOT||'../agents-sdk'),ability=path.resolve(process.env.ABILITY_ROOT||'../ability');
const root=path.resolve('tests/tmp/sdk-ability-'+Date.now());fs.mkdirSync(path.join(root,'artifacts'),{recursive:true,mode:0o700});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const token=crypto.randomBytes(32).toString('hex'),canary='WAVED_PRIVATE_BUSINESS_PAYLOAD_5adc';
const env={...process.env,ABILITY_GATEWAY_SESSION:token,DISPATCH_OFFLINE_FIXTURE:'true',DISPATCH_ALLOW_ANY_OUTPUT_ROOT:'true'};
function cmd(exe,args,where=cwd){const r=spawnSync(exe,args,{cwd:where,env,encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});assert.equal(r.status,0,r.stderr+'\n'+r.stdout);assert.equal(r.stderr,'');return r.stdout.trim();}
const gateway=(mode,arg='')=>JSON.parse(cmd(runtime,['run','examples/application-assurance/gateway.kujo',root,mode,arg],ability));
const phase=name=>JSON.parse(cmd(runtime,['run','tests/persisted_negotiation_fixture.kujo',root,name]));
const sql=text=>cmd('sqlite3',[path.join(root,'application.sqlite'),text]);
const write=(name,data)=>fs.writeFileSync(path.join(root,name),canonical(data),{mode:0o600});
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const lines=cmd(runtime,['run','examples/application-assurance/gateway.kujo','definition'],ability).split('\n');const definition=JSON.parse(lines[0]);write('definition.json',definition);
const principal={type:'user',id:'sdk-user',tenant_id:'sdk-tenant',claims:{}};
write('invocation.json',{schema:'kujo.ability.invocation/v1',invocation_id:'application-publication',ability_id:definition.id,ability_version:definition.version,definition_digest:lines[1],input:{body:canary},principal,surface:'sdk',idempotency_key:'publication-key',approval:{},request_id:'app-request',trace_id:'app-trace',metadata:{}});
const now=Math.floor(Date.now()/1000);
sql(`PRAGMA journal_mode=WAL; CREATE TABLE sessions(token TEXT PRIMARY KEY,principal TEXT NOT NULL,valid_from INTEGER NOT NULL,valid_until INTEGER NOT NULL,revoked INTEGER NOT NULL DEFAULT 0); CREATE TABLE requests(key TEXT PRIMARY KEY,request TEXT NOT NULL,profile TEXT NOT NULL,owner TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN ('active','ready','completed'))); CREATE TABLE business_effects(key TEXT PRIMARY KEY,tx TEXT UNIQUE NOT NULL,profile TEXT NOT NULL,body TEXT NOT NULL); CREATE TABLE receipts(key TEXT PRIMARY KEY,raw TEXT NOT NULL,digest TEXT NOT NULL,tx TEXT NOT NULL); CREATE TABLE audit(phase TEXT NOT NULL,invocation TEXT NOT NULL); INSERT INTO sessions VALUES('${sha(token)}','${canonical(principal)}',${now-2},${now+1800},0); CREATE TRIGGER receipt_failure BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT, 'receipt persistence unavailable'); END;`);
const observed=gateway('observe','portable-v1');assert.equal(observed.ok,true);const p=observed.profile;
write('config.json',{runtime,cwd:ability,sdk_root:sdk,beta:true,issuer:'ability-local',effect_class:'external_idempotent',application_key_digest:p.key_digest,profile_sha256:sha(canonical(p)),transaction_sha256:p.transaction_sha256,intent:{operation:p.operation,target_sha256:p.target_sha256,scope_sha256:p.principal_sha256,key_sha256:sha(p.key_digest),request_sha256:p.request_digest,precondition_sha256:sha(canonical(p))}});
phase('install');const started=phase('start');assert.equal(started.ok,true,JSON.stringify(started));
assert.equal(sql('SELECT count(*) FROM business_effects;'),'1');assert.equal(sql('SELECT count(*) FROM receipts;'),'0');
assert.equal(fs.readFileSync(path.join(root,'sdk-gateway-invocations'),'utf8'),'1\n');
const first=read('result-1.json');assert.equal(first.status,'indeterminate');assert.equal(first.sdk_correlation.outcome,'receipt_failed');
const receipt=read('artifacts/'+first.sdk_correlation.receipt_ref.slice(7)+'.json');assert.equal(receipt.error.code,'ability_idempotency_commit_failed');assert.equal(receipt.result.transaction,p.transaction_sha256);
// Re-emitting the same model call cannot bypass the host's single-use admission.
const duplicate=JSON.parse(cmd(runtime,['run','examples/controlled-ability/participant.kujo','--interpreter',root,'1','run'],sdk));assert.equal(duplicate.status,'failed');
assert.equal(fs.readFileSync(path.join(root,'sdk-gateway-invocations'),'utf8'),'1\n');assert.equal(sql('SELECT count(*) FROM business_effects;'),'1');
// Both SDK and initial controller processes have exited. Only persisted artifacts remain.
sql('DROP TRIGGER receipt_failure;');assert.equal(phase('assure').ok,true);assert.equal(phase('eval').ok,true);
const pointer=read('state-pointer.json'),stateFile=path.join(pointer.run_dir,'state.json');
const referenceFile=path.join(root,'sdk-bound-handoff-1.ref'),originalRef=fs.readFileSync(referenceFile,'utf8');
const doc=read('artifacts/'+originalRef.slice(7)+'.json');const before=fs.readFileSync(stateFile);let negatives=0;
for(const field of ['tool_call_id','sdk_invocation_id','ability_invocation_id','receipt_id','dispatch_run_id','dispatch_step_id','dispatch_attempt_id','dispatch_effect_id','execution_result_ref','assurance_ref','receipt_ref','transaction_sha256']){
 const changed={...doc,[field]:field.endsWith('_ref')?'sha256:'+'0'.repeat(64):field==='transaction_sha256'?'0'.repeat(64):'substituted'};
 const raw=canonical(changed),ref='sha256:'+sha(raw);fs.writeFileSync(path.join(root,'artifacts',sha(raw)+'.json'),raw);fs.writeFileSync(referenceFile,ref);
 assert.equal(phase('eval').ok,false,field);assert.deepEqual(fs.readFileSync(stateFile),before);assert.equal(sql('SELECT count(*) FROM business_effects;'),'1');negatives++;
}
fs.writeFileSync(referenceFile,originalRef);
// Selected artifact tampering and symlink substitution fail before live admission.
const docPath=path.join(root,'artifacts',originalRef.slice(7)+'.json'),docBytes=fs.readFileSync(docPath);
fs.writeFileSync(docPath,Buffer.concat([docBytes,Buffer.from('\n')]));assert.equal(phase('eval').ok,false);fs.writeFileSync(docPath,docBytes);negatives++;
fs.renameSync(docPath,docPath+'.retained');fs.symlinkSync(docPath+'.retained',docPath);assert.equal(phase('eval').ok,false);fs.unlinkSync(docPath);fs.renameSync(docPath+'.retained',docPath);negatives++;
assert.equal(fs.readFileSync(path.join(root,'sdk-gateway-invocations'),'utf8'),'1\n');
assert.equal(phase('eval').ok,true);const checkpoint=phase('checkpoint');assert.equal(checkpoint.ok,true);fs.writeFileSync(path.join(root,'checkpoint-id'),checkpoint.checkpoint_id||checkpoint.checkpoint?.checkpoint_id||'');
// The actual locked continuation, not only inspection, rejects substituted evidence.
const deniedDoc=canonical({...doc,tool_call_id:'other-call'});fs.writeFileSync(path.join(root,'artifacts',sha(deniedDoc)+'.json'),deniedDoc);fs.writeFileSync(referenceFile,'sha256:'+sha(deniedDoc));
assert.equal(phase('resume').ok,false);assert.equal(sql('SELECT count(*) FROM business_effects;'),'1');assert.equal(fs.readFileSync(path.join(root,'sdk-gateway-invocations'),'utf8'),'1\n');fs.writeFileSync(referenceFile,originalRef);
const stale=phase('resume');assert.equal(stale.ok,false);assert.equal(stale.error.code,'stale_checkpoint');
const freshCheckpoint=phase('checkpoint');assert.equal(freshCheckpoint.ok,true);fs.writeFileSync(path.join(root,'checkpoint-id'),freshCheckpoint.checkpoint_id||freshCheckpoint.checkpoint?.checkpoint_id||'');
const resumed=phase('resume');assert.equal(resumed.ok,true,JSON.stringify(resumed));
assert.equal(sql('SELECT count(*) FROM business_effects;'),'1');assert.equal(sql('SELECT count(*) FROM receipts;'),'1');
assert.equal(fs.readFileSync(path.join(root,'sdk-gateway-invocations'),'utf8'),'1\n2\n');
const second=read('result-2.json');assert.equal(second.sdk_correlation.outcome,'receipt_succeeded');assert.notEqual(first.sdk_correlation.sdk_run_id,second.sdk_correlation.sdk_run_id);assert.equal(first.sdk_correlation.ability_invocation_id,second.sdk_correlation.ability_invocation_id);
const standalone=JSON.parse(cmd(runtime,['run','examples/controlled-ability/participant.kujo','--interpreter',root,'standalone','standalone'],sdk));assert.equal(standalone.ok,true);assert.equal(standalone.controlled,false);assert.equal(sql('SELECT count(*) FROM business_effects;'),'1');
for(const attempt of [1,2]){
 const records=fs.readFileSync(path.join(root,'watchdog-'+attempt+'.jsonl'),'utf8');assert(!records.includes(canary));assert(!records.includes(token));assert(!records.includes('verifier'));assert.equal(records.trim().split('\n').length,attempt===1?4:2);
 const handoff=read('artifacts/'+fs.readFileSync(path.join(root,'sdk-handoff-'+attempt+'.ref'),'utf8').slice(7)+'.json');assert(!canonical(handoff).includes(canary));assert(!canonical(handoff).includes(token));
}
const journal=fs.readFileSync(path.join(pointer.run_dir,'control-events.jsonl'),'utf8');assert(!journal.includes(canary));assert(!journal.includes(token));
const proof={schema:'dispatch.sdk-ability-rehearsal/v1',ok:true,negative_correlations:negatives,business_effects:1,receipt_rows:1,sdk_processes:5,duplicate_admission_denied:true,locked_replay_denial:true,controller_restart:true,beta_required:true,checkpoint:true,standalone:true,receipt_commit_failed:true,dispatch_policy:resumed.policy,first_result_sha256:sha(fs.readFileSync(path.join(root,'result-1.json'))),second_result_sha256:sha(fs.readFileSync(path.join(root,'result-2.json')))};
write('proof.json',proof);console.log(JSON.stringify({root,...proof}));
