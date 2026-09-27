// Offline orchestration harness only; application/control are Kujo; existing MCP STDIO bridge is Node.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
const lost=process.argv.includes('--lost-response');
const cwd=process.cwd(),runtime=process.env.KUJO_BIN||'/tmp/kujo-wave-a-release-candidate-bin';
const mcp=path.resolve(process.env.MCP_ROOT||'../mcp'),ability=path.resolve(process.env.ABILITY_ROOT||'../ability');
const root=path.resolve('tests/tmp/mcp-ability-'+Date.now());fs.mkdirSync(path.join(root,'artifacts'),{recursive:true,mode:0o700});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const token=crypto.randomBytes(32).toString('hex'),canary='WAVED_MCP_PRIVATE_PAYLOAD_746e';
const env={...process.env,ABILITY_GATEWAY_SESSION:token,DISPATCH_OFFLINE_FIXTURE:'true',DISPATCH_ALLOW_ANY_OUTPUT_ROOT:'true'};
function cmd(exe,args,where=cwd){const r=spawnSync(exe,args,{cwd:where,env,encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});assert.equal(r.status,0,r.stderr+'\n'+r.stdout);assert.equal(r.stderr,'');return r.stdout.trim();}
const gateway=(mode,arg='')=>JSON.parse(cmd(runtime,['run','examples/application-assurance/gateway.kujo',root,mode,arg],ability));
const phase=name=>JSON.parse(cmd(runtime,['run','tests/persisted_negotiation_fixture.kujo',root,name]));
const sql=text=>cmd('sqlite3',[path.join(root,'application.sqlite'),text]);
const write=(name,data)=>fs.writeFileSync(path.join(root,name),canonical(data),{mode:0o600});
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const lines=cmd(runtime,['run','examples/application-assurance/gateway.kujo','definition'],ability).split('\n');const definition=JSON.parse(lines[0]);write('definition.json',definition);
const principal={type:'user',id:'mcp-user',tenant_id:'mcp-tenant',claims:{}};
write('invocation.json',{schema:'kujo.ability.invocation/v1',invocation_id:'application-publication',ability_id:definition.id,ability_version:definition.version,definition_digest:lines[1],input:{body:canary},principal,surface:'sdk',idempotency_key:'publication-key',approval:{},request_id:'app-request',trace_id:'app-trace',metadata:{}});
const now=Math.floor(Date.now()/1000);
sql(`PRAGMA journal_mode=WAL; CREATE TABLE sessions(token TEXT PRIMARY KEY,principal TEXT NOT NULL,valid_from INTEGER NOT NULL,valid_until INTEGER NOT NULL,revoked INTEGER NOT NULL DEFAULT 0); CREATE TABLE requests(key TEXT PRIMARY KEY,request TEXT NOT NULL,profile TEXT NOT NULL,owner TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN ('active','ready','completed'))); CREATE TABLE business_effects(key TEXT PRIMARY KEY,tx TEXT UNIQUE NOT NULL,profile TEXT NOT NULL,body TEXT NOT NULL); CREATE TABLE receipts(key TEXT PRIMARY KEY,raw TEXT NOT NULL,digest TEXT NOT NULL,tx TEXT NOT NULL); CREATE TABLE audit(phase TEXT NOT NULL,invocation TEXT NOT NULL); INSERT INTO sessions VALUES('${sha(token)}','${canonical(principal)}',${now-2},${now+1800},0); CREATE TRIGGER receipt_failure BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT, 'receipt persistence unavailable'); END;`);
if(lost)sql('DROP TRIGGER receipt_failure;');
const observed=gateway('observe','portable-v1');assert.equal(observed.ok,true);const p=observed.profile;
write('config.json',{runtime,cwd:ability,mcp_root:mcp,node:process.execPath,mcp_drop_response:lost,beta:true,issuer:'ability-local',effect_class:'external_idempotent',application_key_digest:p.key_digest,profile_sha256:sha(canonical(p)),transaction_sha256:p.transaction_sha256,intent:{operation:p.operation,target_sha256:p.target_sha256,scope_sha256:p.principal_sha256,key_sha256:sha(p.key_digest),request_sha256:p.request_digest,precondition_sha256:sha(canonical(p))}});
phase('install');const started=phase('start');assert.equal(started.ok,true,JSON.stringify(started));
assert.equal(sql('SELECT count(*) FROM business_effects;'),'1');assert.equal(sql('SELECT count(*) FROM receipts;'),lost?'1':'0');
assert.equal(fs.readFileSync(path.join(root,'mcp-gateway-invocations'),'utf8'),'1\n');
const first=read('result-1.json');assert.equal(first.status,'indeterminate');assert.equal(first.mcp_correlation.outcome,lost?'receipt_succeeded':'receipt_failed');
const receipt=read('artifacts/'+first.mcp_correlation.receipt_ref.slice(7)+'.json');if(!lost)assert.equal(receipt.error.code,'ability_idempotency_commit_failed');assert.equal(receipt.result.transaction,p.transaction_sha256);
if(lost)assert(!fs.existsSync(path.join(root,'mcp-response-1-run.json')));
else fs.copyFileSync(path.join(root,'mcp-response-1-run.json'),path.join(root,'mcp-original-response.json'));
// Re-emitting the same model call cannot bypass the host's single-use admission.
const duplicate=JSON.parse(cmd(process.execPath,['tests/mcp_ability_client.mjs',root,'1','run']));assert.equal(duplicate.outcome,'not_admitted');
assert.equal(fs.readFileSync(path.join(root,'mcp-gateway-invocations'),'utf8'),'1\n');assert.equal(sql('SELECT count(*) FROM business_effects;'),'1');
// Unclaimed expired/stale host tickets must fail before the gateway too.
const currentTicket=read('mcp-current-ticket.json'),ticket1=read('mcp-ticket-1.json');
const ticket9={...ticket1,dispatch_attempt_id:'9',rpc_request_id:'rpc-call-9',mcp_session_id:'mcp-denial-9',valid_until_ms:0};write('mcp-ticket-9.json',ticket9);write('mcp-current-ticket.json',{attempt:'9'});
const expired=JSON.parse(cmd(process.execPath,['tests/mcp_ability_client.mjs',root,'9','expired']));assert.equal(expired.outcome,'not_admitted');assert(!fs.existsSync(path.join(root,'mcp-claim-9')));
ticket9.valid_until_ms=Date.now()+60000;write('mcp-ticket-9.json',ticket9);write('mcp-current-ticket.json',currentTicket);
const staleUnclaimed=JSON.parse(cmd(process.execPath,['tests/mcp_ability_client.mjs',root,'9','stale']));assert.equal(staleUnclaimed.outcome,'not_admitted');assert(!fs.existsSync(path.join(root,'mcp-claim-9')));assert.equal(fs.readFileSync(path.join(root,'mcp-gateway-invocations'),'utf8'),'1\n');
// Both MCP and initial controller processes have exited. Only persisted artifacts remain.
if(!lost)sql('DROP TRIGGER receipt_failure;');
const cfg=read('config.json');cfg.mcp_drop_response=false;write('config.json',cfg);assert.equal(phase('assure').ok,true);assert.equal(phase('eval').ok,true);
const pointer=read('state-pointer.json'),stateFile=path.join(pointer.run_dir,'state.json');
const referenceFile=path.join(root,'mcp-bound-handoff-1.ref'),originalRef=fs.readFileSync(referenceFile,'utf8');
const doc=read('artifacts/'+originalRef.slice(7)+'.json');const before=fs.readFileSync(stateFile);let negatives=0;
for(const field of ['rpc_request_id','mcp_request_id','mcp_invocation_id','mcp_server_id','mcp_session_id','tool_name','ability_invocation_id','receipt_id','dispatch_run_id','dispatch_step_id','dispatch_attempt_id','dispatch_effect_id','execution_result_ref','assurance_ref','receipt_ref','transaction_sha256']){
 const changed={...doc,[field]:field.endsWith('_ref')?'sha256:'+'0'.repeat(64):field==='transaction_sha256'?'0'.repeat(64):'substituted'};
 const raw=canonical(changed),ref='sha256:'+sha(raw);fs.writeFileSync(path.join(root,'artifacts',sha(raw)+'.json'),raw);fs.writeFileSync(referenceFile,ref);
 assert.equal(phase('eval').ok,false,field);assert.deepEqual(fs.readFileSync(stateFile),before);assert.equal(sql('SELECT count(*) FROM business_effects;'),'1');negatives++;
}
for(const ref of ['../../private','https://credentials.invalid/evidence']){
 const changed=canonical({...doc,assurance_ref:ref});fs.writeFileSync(path.join(root,'artifacts',sha(changed)+'.json'),changed);fs.writeFileSync(referenceFile,'sha256:'+sha(changed));assert.equal(phase('eval').ok,false);negatives++;
}
const oversized=' '.repeat(4097);fs.writeFileSync(path.join(root,'artifacts',sha(oversized)+'.json'),oversized);fs.writeFileSync(referenceFile,'sha256:'+sha(oversized));assert.equal(phase('eval').ok,false);negatives++;
fs.writeFileSync(referenceFile,originalRef);
// Selected artifact tampering and symlink substitution fail before live admission.
const docPath=path.join(root,'artifacts',originalRef.slice(7)+'.json'),docBytes=fs.readFileSync(docPath);
fs.writeFileSync(docPath,Buffer.concat([docBytes,Buffer.from('\n')]));assert.equal(phase('eval').ok,false);fs.writeFileSync(docPath,docBytes);negatives++;
fs.renameSync(docPath,docPath+'.retained');fs.symlinkSync(docPath+'.retained',docPath);assert.equal(phase('eval').ok,false);fs.unlinkSync(docPath);fs.renameSync(docPath+'.retained',docPath);negatives++;
assert.equal(fs.readFileSync(path.join(root,'mcp-gateway-invocations'),'utf8'),'1\n');
assert.equal(phase('eval').ok,true);const checkpoint=phase('checkpoint');assert.equal(checkpoint.ok,true);fs.writeFileSync(path.join(root,'checkpoint-id'),checkpoint.checkpoint_id||checkpoint.checkpoint?.checkpoint_id||'');
// The actual locked continuation, not only inspection, rejects substituted evidence.
const deniedDoc=canonical({...doc,rpc_request_id:'other-call'});fs.writeFileSync(path.join(root,'artifacts',sha(deniedDoc)+'.json'),deniedDoc);fs.writeFileSync(referenceFile,'sha256:'+sha(deniedDoc));
assert.equal(phase('resume').ok,false);assert.equal(sql('SELECT count(*) FROM business_effects;'),'1');assert.equal(fs.readFileSync(path.join(root,'mcp-gateway-invocations'),'utf8'),'1\n');fs.writeFileSync(referenceFile,originalRef);
const stale=phase('resume');assert.equal(stale.ok,false);assert.equal(stale.error.code,'stale_checkpoint');
const freshCheckpoint=phase('checkpoint');assert.equal(freshCheckpoint.ok,true);fs.writeFileSync(path.join(root,'checkpoint-id'),freshCheckpoint.checkpoint_id||freshCheckpoint.checkpoint?.checkpoint_id||'');
const resumed=phase('resume');assert.equal(resumed.ok,true,JSON.stringify(resumed));
assert.equal(sql('SELECT count(*) FROM business_effects;'),'1');assert.equal(sql('SELECT count(*) FROM receipts;'),'1');
assert.equal(fs.readFileSync(path.join(root,'mcp-gateway-invocations'),'utf8'),'1\n2\n');
const second=read('result-2.json');assert.equal(second.mcp_correlation.outcome,'receipt_succeeded');assert.notEqual(first.mcp_correlation.mcp_session_id,second.mcp_correlation.mcp_session_id);assert.equal(first.mcp_correlation.ability_invocation_id,second.mcp_correlation.ability_invocation_id);
const standalone=JSON.parse(cmd(process.execPath,['tests/mcp_ability_client.mjs',root,'standalone','standalone']));assert.equal(standalone.ok,true);assert.equal(standalone.outcome,'standalone');assert.equal(standalone.isError,false);assert.equal(sql('SELECT count(*) FROM business_effects;'),'1');
for(const attempt of [1,2]){
 if(!(lost&&attempt===1)){const records=fs.readFileSync(path.join(root,'mcp-watchdog-'+attempt+'.json'),'utf8');assert(!records.includes(canary));assert(!records.includes(token));assert(!records.includes('verifier'));assert(JSON.parse(records).ok);}
 const handoff=read('artifacts/'+fs.readFileSync(path.join(root,'mcp-handoff-'+attempt+'.ref'),'utf8').slice(7)+'.json');assert(!canonical(handoff).includes(canary));assert(!canonical(handoff).includes(token));
 if(!(lost&&attempt===1)){const response=fs.readFileSync(path.join(root,'mcp-response-'+attempt+'-run.json'),'utf8');assert(!response.includes(canary));assert(!response.includes(token));assert(!response.includes('receipt_id'));assert(!response.includes('principal'));}
}
const staleTicket=JSON.parse(cmd(process.execPath,['tests/mcp_ability_client.mjs',root,'1','stale']));assert.equal(staleTicket.outcome,'not_admitted');
if(!lost){const originalResponse=fs.readFileSync(path.join(root,'mcp-original-response.json'),'utf8');assert(!originalResponse.includes(canary));assert(!originalResponse.includes(token));assert(!originalResponse.includes('receipt_id'));}
const journal=fs.readFileSync(path.join(pointer.run_dir,'control-events.jsonl'),'utf8');assert(!journal.includes(canary));assert(!journal.includes(token));
const proof={scenario:lost?'stdio-loss':'receipt-failure',schema:'dispatch.mcp-ability-rehearsal/v1',ok:true,negative_correlations:negatives,business_effects:1,receipt_rows:1,mcp_processes:7,expired_admission_denied:true,stale_admission_denied:true,duplicate_admission_denied:true,locked_replay_denial:true,controller_restart:true,beta_required:true,checkpoint:true,standalone:true,receipt_commit_failed:!lost,stdio_reply_lost:lost,dispatch_policy:resumed.policy,first_result_sha256:sha(fs.readFileSync(path.join(root,'result-1.json'))),second_result_sha256:sha(fs.readFileSync(path.join(root,'result-2.json')))};
write('proof.json',proof);console.log(JSON.stringify({root,...proof}));
