// Real loopback socket orchestration; application and admission are existing Kujo paths.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
const scenario=process.argv[2]||'response-loss';assert(['response-loss','timeout-before','application-error'].includes(scenario));
const cwd=process.cwd(),runtime=process.env.KUJO_BIN||'/tmp/kujo-wave-a-release-candidate-bin';
const ability=path.resolve(process.env.ABILITY_ROOT||'../ability');
const root=path.resolve('tests/tmp/http-ability-'+Date.now());fs.mkdirSync(path.join(root,'artifacts'),{recursive:true,mode:0o700});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const token=crypto.randomBytes(32).toString('hex'),canary='WAVED_HTTP_PRIVATE_PAYLOAD_746e';
const env={...process.env,ABILITY_GATEWAY_SESSION:token,DISPATCH_OFFLINE_FIXTURE:'true',DISPATCH_ALLOW_ANY_OUTPUT_ROOT:'true'};
function cmd(exe,args,where=cwd){const r=spawnSync(exe,args,{cwd:where,env,encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});assert.equal(r.status,0,r.stderr+'\n'+r.stdout);assert.equal(r.stderr,'');return r.stdout.trim();}
const gateway=(mode,arg='')=>JSON.parse(cmd(runtime,['run','examples/application-assurance/gateway.kujo',root,mode,arg],ability));
const phase=name=>JSON.parse(cmd(runtime,['run','tests/persisted_negotiation_fixture.kujo',root,name]));
const sql=text=>cmd('sqlite3',[path.join(root,'application.sqlite'),text]);
const write=(name,data)=>fs.writeFileSync(path.join(root,name),canonical(data),{mode:0o600});
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const lines=cmd(runtime,['run','examples/application-assurance/gateway.kujo','definition'],ability).split('\n');const definition=JSON.parse(lines[0]);write('definition.json',definition);
const principal={type:'user',id:'http-user',tenant_id:'http-tenant',claims:{}};
write('invocation.json',{schema:'kujo.ability.invocation/v1',invocation_id:'application-publication',ability_id:definition.id,ability_version:definition.version,definition_digest:lines[1],input:{body:canary},principal,surface:'sdk',idempotency_key:'publication-key',approval:{},request_id:'app-request',trace_id:'app-trace',metadata:{}});
const now=Math.floor(Date.now()/1000);
sql(`PRAGMA journal_mode=WAL; CREATE TABLE sessions(token TEXT PRIMARY KEY,principal TEXT NOT NULL,valid_from INTEGER NOT NULL,valid_until INTEGER NOT NULL,revoked INTEGER NOT NULL DEFAULT 0); CREATE TABLE requests(key TEXT PRIMARY KEY,request TEXT NOT NULL,profile TEXT NOT NULL,owner TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN ('active','ready','completed'))); CREATE TABLE business_effects(key TEXT PRIMARY KEY,tx TEXT UNIQUE NOT NULL,profile TEXT NOT NULL,body TEXT NOT NULL); CREATE TABLE receipts(key TEXT PRIMARY KEY,raw TEXT NOT NULL,digest TEXT NOT NULL,tx TEXT NOT NULL); CREATE TABLE audit(phase TEXT NOT NULL,invocation TEXT NOT NULL); INSERT INTO sessions VALUES('${sha(token)}','${canonical(principal)}',${now-2},${now+1800},0);`);
const observed=gateway('observe','portable-v1');assert.equal(observed.ok,true);const p=observed.profile;
write('config.json',{runtime,cwd:ability,http_root:ability,node:process.execPath,http_scenario:scenario,beta:true,issuer:'ability-local',effect_class:'external_idempotent',application_key_digest:p.key_digest,profile_sha256:sha(canonical(p)),transaction_sha256:p.transaction_sha256,intent:{operation:p.operation,target_sha256:p.target_sha256,scope_sha256:p.principal_sha256,key_sha256:sha(p.key_digest),request_sha256:p.request_digest,precondition_sha256:sha(canonical(p))}});
const participant=(attempt,mode)=>JSON.parse(cmd(process.execPath,[path.join(ability,'examples/controlled-http/participant.mjs'),root,String(attempt),mode]));
const calls=()=>fs.existsSync(path.join(root,'http-gateway-invocations'))?fs.readFileSync(path.join(root,'http-gateway-invocations'),'utf8'):'';
phase('install');const started=phase('start');assert.equal(started.ok,true,JSON.stringify(started));
const committed=scenario==='response-loss',expectedCount=committed?'1':'0';
assert.equal(sql('SELECT count(*) FROM business_effects;'),expectedCount);assert.equal(sql('SELECT count(*) FROM receipts;'),expectedCount);
const first=read('result-1.json');assert.equal(first.status,'indeterminate');
assert.equal(first.http_correlation.outcome,scenario==='response-loss'?'response_lost':scenario==='timeout-before'?'timeout':'application_error');
const firstPublic=read('http-public-1.json');assert.equal(firstPublic.concurrent_denied,1);assert.equal(firstPublic.invalid_requests_denied,21);
const initialCalls=calls();assert.equal(participant(1,'deny').outcome,'not_admitted');assert.equal(calls(),initialCalls);
const ticket=read('http-ticket-1.json'),pointerTicket=read('http-current-ticket.json');
write('http-ticket-9.json',{...ticket,dispatch_attempt_id:'9',client_request_id:'client-call-9',valid_until_ms:0});write('http-current-ticket.json',{attempt:'9'});assert.equal(participant(9,'deny').outcome,'not_admitted');assert(!fs.existsSync(path.join(root,'http-claim-9')));
write('http-ticket-9.json',{...ticket,dispatch_attempt_id:'9',client_request_id:'client-call-9',valid_until_ms:Date.now()+60000});write('http-current-ticket.json',pointerTicket);assert.equal(participant(9,'deny').outcome,'not_admitted');assert(!fs.existsSync(path.join(root,'http-claim-9')));
// All first controller/client/server processes have exited. Fresh live verification.
assert.equal(phase('assure').ok,true);assert.equal(phase('eval').ok,true);
const pointer=read('state-pointer.json'),stateFile=path.join(pointer.run_dir,'state.json');
const referenceFile=path.join(root,'http-bound-handoff-1.ref'),originalRef=fs.readFileSync(referenceFile,'utf8');
const doc=read('artifacts/'+originalRef.slice(7)+'.json'),before=fs.readFileSync(stateFile);let negatives=0;
for(const field of ['client_request_id','http_request_id','method','route_id','operation_id','ability_invocation_id','receipt_id','dispatch_run_id','dispatch_step_id','dispatch_attempt_id','dispatch_effect_id','execution_result_ref','assurance_ref','receipt_ref','transaction_sha256']){
 const changed={...doc,[field]:field.endsWith('_ref')?'sha256:'+'0'.repeat(64):field==='transaction_sha256'?'0'.repeat(64):'substituted'};
 const raw=canonical(changed);fs.writeFileSync(path.join(root,'artifacts',sha(raw)+'.json'),raw);fs.writeFileSync(referenceFile,'sha256:'+sha(raw));assert.equal(phase('eval').ok,false,field);assert.deepEqual(fs.readFileSync(stateFile),before);assert.equal(sql('SELECT count(*) FROM business_effects;'),expectedCount);negatives++;
}
for(const ref of ['../../private','https://credentials.invalid/evidence']){const raw=canonical({...doc,assurance_ref:ref});fs.writeFileSync(path.join(root,'artifacts',sha(raw)+'.json'),raw);fs.writeFileSync(referenceFile,'sha256:'+sha(raw));assert.equal(phase('eval').ok,false);negatives++;}
const oversize=' '.repeat(4097);fs.writeFileSync(path.join(root,'artifacts',sha(oversize)+'.json'),oversize);fs.writeFileSync(referenceFile,'sha256:'+sha(oversize));assert.equal(phase('eval').ok,false);negatives++;
fs.writeFileSync(referenceFile,originalRef);const artifact=path.join(root,'artifacts',originalRef.slice(7)+'.json'),bytes=fs.readFileSync(artifact);
fs.writeFileSync(artifact,Buffer.concat([bytes,Buffer.from('\n')]));assert.equal(phase('eval').ok,false);fs.writeFileSync(artifact,bytes);negatives++;
fs.renameSync(artifact,artifact+'.retained');fs.symlinkSync(artifact+'.retained',artifact);assert.equal(phase('eval').ok,false);fs.unlinkSync(artifact);fs.renameSync(artifact+'.retained',artifact);negatives++;
const cp=phase('checkpoint');assert.equal(cp.ok,true);fs.writeFileSync(path.join(root,'checkpoint-id'),cp.checkpoint_id||cp.checkpoint?.checkpoint_id||'');
const changed=canonical({...doc,method:'GET'});fs.writeFileSync(path.join(root,'artifacts',sha(changed)+'.json'),changed);fs.writeFileSync(referenceFile,'sha256:'+sha(changed));assert.equal(phase('resume').ok,false);assert.equal(calls(),initialCalls);assert.equal(sql('SELECT count(*) FROM business_effects;'),expectedCount);
fs.writeFileSync(referenceFile,originalRef);assert.equal(phase('resume').error.code,'stale_checkpoint');const fresh=phase('checkpoint');assert.equal(fresh.ok,true);fs.writeFileSync(path.join(root,'checkpoint-id'),fresh.checkpoint_id||fresh.checkpoint?.checkpoint_id||'');
const resumed=phase('resume');assert.equal(resumed.ok,true,JSON.stringify(resumed));assert.equal(sql('SELECT count(*) FROM business_effects;'),'1');assert.equal(sql('SELECT count(*) FROM receipts;'),'1');
const second=read('result-2.json');assert.equal(second.http_correlation.outcome,'receipt_succeeded');assert.notEqual(second.http_correlation.http_request_id,first.http_correlation.http_request_id);assert.equal(second.http_correlation.ability_invocation_id,first.http_correlation.ability_invocation_id);
assert.equal(participant('standalone','standalone').replayed,true);assert.equal(participant(1,'deny').outcome,'not_admitted');assert.equal(sql('SELECT count(*) FROM business_effects;'),'1');
for(const n of [1,2]){for(const raw of [fs.readFileSync(path.join(root,'http-public-'+n+'.json'),'utf8'),canonical(read('artifacts/'+fs.readFileSync(path.join(root,'http-handoff-'+n+'.ref'),'utf8').slice(7)+'.json'))]){assert(!raw.includes(canary));assert(!raw.includes(token));assert(!raw.includes('principal'));assert(!raw.includes('authorization'));}}
const journal=fs.readFileSync(path.join(pointer.run_dir,'control-events.jsonl'),'utf8');assert(!journal.includes(canary));assert(!journal.includes(token));
const proof={schema:'dispatch.http-ability-rehearsal/v1',scenario,ok:true,initial_business_effects:Number(expectedCount),business_effects:1,receipt_rows:1,negative_correlations:negatives,invalid_http_requests_per_attempt:21,concurrent_denied_per_attempt:1,controller_restart:true,server_restart:true,standalone:true,expired_stale_reuse_denied:true,locked_replay_denial:true,policy:resumed.policy,initial_outcome:first.http_correlation.outcome};write('proof.json',proof);console.log(JSON.stringify({root,...proof}));
