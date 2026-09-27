// Offline maintenance harness. All effects, observations and admission run in Kujo.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const cwd=process.cwd(),runtime=process.env.KUJO_BIN||'/tmp/kujo-wave-a-release-candidate-bin';const root=path.resolve('tests/tmp/beta-migration-'+Date.now());fs.mkdirSync(root,{recursive:true});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');const canonical=x=>x&&typeof x==='object'?Array.isArray(x)?x.map(canonical):Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;const json=x=>JSON.stringify(canonical(x));
const canary='SECRET_BUSINESS_PAYLOAD_PERSISTED_PROFILE_98x',token=crypto.randomBytes(32).toString('hex');const env={...process.env,DISPATCH_OFFLINE_FIXTURE:'true',DISPATCH_ALLOW_ANY_OUTPUT_ROOT:'true',ABILITY_GATEWAY_SESSION:token};const logs=[];
function cmd(exe,args,where=cwd,input){const r=spawnSync(exe,args,{cwd:where,env,input,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});assert.equal(r.status,0,r.stdout+'\n'+r.stderr);assert.equal(r.stderr,'');logs.push(r.stdout);return r.stdout.trim();}
const controller=(dir,phase)=>JSON.parse(cmd(runtime,['run','tests/persisted_negotiation_fixture.kujo',dir,phase]));const proofs=[];
const older=path.join(root,'alpha-controller');fs.mkdirSync(older);
const archived=spawnSync('git',['archive','6cdc364'],{cwd,maxBuffer:32*1024*1024});assert.equal(archived.status,0);
assert.equal(spawnSync('tar',['-x','-C',older],{input:archived.stdout}).status,0);
fs.writeFileSync(path.join(older,'old-probe.kujo'),'from src.core.state import load_run_state\narguments := args()\ntry {loaded := load_run_state(arguments[0], arguments[1]); print(to_json({"accepted": loaded["ok"]}))} except err {print(to_json({"accepted": false}))}\n');
for(const family of ['sqlite','git','ability']) for(const scenario of ['alpha','beta','alpha-in-beta','beta-in-alpha']){
 const dir=path.join(root,family+'-'+scenario);fs.mkdirSync(dir,{mode:0o700});const now=Math.floor(Date.now()/1000);let config={runtime,cwd,entry:'examples/effect-assurance/sqlite-adapter.kujo',issuer:'sqlite-local',db:path.join(dir,'sink.sqlite'),boundary:'after_commit',effect_class:'external_idempotent',intent:{operation:'create',target_sha256:sha('target'),scope_sha256:sha(dir),key_sha256:sha('fixture-key'),request_sha256:sha(canary),precondition_sha256:sha('empty'),valid_from:now-5,valid_until:now+1800}};
 if(family==='git'){config.cwd=path.resolve(process.env.WORKCELL_ROOT||'../workcell');config.entry='examples/effect-assurance/adapter.kujo';config.issuer='git-local';config.repo=path.join(dir,'sink.git');cmd('git',['init','--bare','--quiet',config.repo]);config.old_oid=cmd('git',['--git-dir='+config.repo,'hash-object','-w','--stdin'],cwd,'before');config.new_oid=cmd('git',['--git-dir='+config.repo,'hash-object','-w','--stdin'],cwd,canary);config.intent.operation='update';config.intent.request_sha256=sha(config.new_oid);config.intent.precondition_sha256=sha(config.old_oid);cmd('git',['--git-dir='+config.repo,'update-ref','refs/kujo-targets/'+config.intent.target_sha256,config.old_oid]);}
 if(family==='ability'){
  const app=path.resolve(process.env.ABILITY_ROOT||'../ability'),entry='examples/application-assurance/gateway.kujo';const definitionLines=cmd(runtime,['run',entry,'definition'],app).split('\n'),definition=JSON.parse(definitionLines[0]);const principal={type:'user',id:'user-1',tenant_id:'tenant-1',claims:{}};
  fs.writeFileSync(path.join(dir,'invocation.json'),json({schema:'kujo.ability.invocation/v1',invocation_id:'invocation-1',ability_id:definition.id,ability_version:definition.version,definition_digest:definitionLines[1],input:{body:canary},principal,request_id:'request-1',trace_id:'trace-1',surface:'sdk',idempotency_key:'application-key',approval:{},metadata:{}}));
  const sql=s=>cmd('sqlite3',[path.join(dir,'application.sqlite'),s]);
  sql(`PRAGMA journal_mode=WAL; CREATE TABLE sessions(token TEXT PRIMARY KEY,principal TEXT NOT NULL,valid_from INTEGER NOT NULL,valid_until INTEGER NOT NULL,revoked INTEGER NOT NULL DEFAULT 0); CREATE TABLE requests(key TEXT PRIMARY KEY,request TEXT NOT NULL,profile TEXT NOT NULL,owner TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN ('active','ready','completed'))); CREATE TABLE business_effects(key TEXT PRIMARY KEY,tx TEXT UNIQUE NOT NULL,profile TEXT NOT NULL,body TEXT NOT NULL); CREATE TABLE receipts(key TEXT PRIMARY KEY,raw TEXT NOT NULL,digest TEXT NOT NULL,tx TEXT NOT NULL); CREATE TABLE audit(phase TEXT NOT NULL,invocation TEXT NOT NULL); INSERT INTO sessions VALUES('${sha(token)}','${json(principal)}',${now-2},${now+1800},0); CREATE TRIGGER receipt_failure BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT, 'receipt persistence unavailable'); END;`);
  const failed=JSON.parse(cmd(runtime,['run',entry,dir,'execute','receipt_failure'],app));assert.equal(failed.code,'ability_idempotency_commit_failed');sql('DROP TRIGGER receipt_failure');const observed=JSON.parse(cmd(runtime,['run',entry,dir,'observe',''],app));assert.equal(observed.ok,true);const p=observed.profile;
  // Authenticate the altered principal too: denial must be portability, not just
  // a mismatched token/principal. Failed checks leave the business store untouched.
  const invocationPath=path.join(dir,'invocation.json'),original=fs.readFileSync(invocationPath,'utf8');
  for(const claims of [{ratio:1.5},{'non ASCII é':'value'}]){
   const changed=JSON.parse(original);changed.principal.claims=claims;
   fs.writeFileSync(invocationPath,json(changed));sql(`UPDATE sessions SET principal='${json(changed.principal)}'`);
   const refused=JSON.parse(cmd(runtime,['run',entry,dir,'observe','portable-v1'],app));assert.equal(refused.ok,false);assert.equal(refused.code,'ability_request_mismatch');
  }
  fs.writeFileSync(invocationPath,original);sql(`UPDATE sessions SET principal='${json(principal)}'`);

  config={runtime,cwd:app,issuer:'ability-local',application_key_digest:p.key_digest,effect_class:'external_idempotent',profile_sha256:sha(json(p)),transaction_sha256:p.transaction_sha256,intent:{operation:'create',target_sha256:p.target_sha256,scope_sha256:p.principal_sha256,key_sha256:sha(p.key_digest),request_sha256:p.request_digest,precondition_sha256:sha(json(p))}};
 }
 config.beta=scenario==='beta'||scenario==='alpha-in-beta';
 fs.writeFileSync(path.join(dir,'config.json'),json(config));if(family==='sqlite')cmd(runtime,['run',config.entry,dir,'init']);
 const installed=controller(dir,'install');const started=controller(dir,'start');assert.equal(started.ok,true,JSON.stringify(started));
 const ptr=JSON.parse(fs.readFileSync(path.join(dir,'state-pointer.json')));
 const beforeResult=fs.readFileSync(path.join(dir,'result-1.json'));
 if(config.beta){
  const before=fs.readFileSync(path.join(ptr.run_dir,'state.json'));
  const old=JSON.parse(cmd(runtime,['run','old-probe.kujo',path.dirname(ptr.run_dir),ptr.run_id],older));assert.equal(old.accepted,false);
  assert.deepEqual(fs.readFileSync(path.join(ptr.run_dir,'state.json')),before);
 }
 const historical=controller(dir,'historical-beta');assert.equal(historical.ok,true);assert.ok(historical.checks>=30);
 fs.writeFileSync(path.join(dir,'beta-conformance.json'),JSON.stringify(historical));
 assert.deepEqual(fs.readFileSync(path.join(dir,'result-1.json')),beforeResult);
 const phase=scenario==='alpha-in-beta'?'assure-alpha':scenario==='beta-in-alpha'?'assure-beta':'assure';
 assert.equal(controller(dir,phase).ok,true);
 const checkpoint=controller(dir,'checkpoint');assert.equal(checkpoint.ok,true);fs.writeFileSync(path.join(dir,'checkpoint-id'),checkpoint.checkpoint.checkpoint_id);
 const stateBefore=fs.readFileSync(path.join(ptr.run_dir,'state.json'));
 const operator=JSON.parse(fs.readFileSync(path.join(dir,'operator-store.json')));operator.selected='legacy';fs.writeFileSync(path.join(dir,'operator-store.json'),json(operator));
 const answer=controller(dir,'resume');
 if(scenario.includes('-in-')){
  assert.equal(answer.ok,false,JSON.stringify(answer));
  assert.equal(fs.readFileSync(path.join(dir,'action-invocations'),'utf8'),'1\n');
  // Denial journal/revision may advance, but authority and business invocation do not.
  const after=JSON.parse(fs.readFileSync(path.join(ptr.run_dir,'state.json'),'utf8').split('\n').slice(1).join('\n'));
  const before=JSON.parse(stateBefore.toString().split('\n').slice(1).join('\n'));
  assert.deepEqual(after.assurance_negotiation,before.assurance_negotiation);
  proofs.push({family,scenario,portable_identity_checks:family==='ability'?2:0,denied:answer.error?.code||answer.code,result_bytes_unchanged:true});continue;
 }
 assert.equal(answer.ok,true,JSON.stringify(answer));assert.equal(answer.policy.config_revision,installed.r1);
 assert.equal(answer.policy.schema,'dispatch.assurance-negotiation/v1'+(config.beta?'beta1':'alpha1'));
 assert.deepEqual(fs.readFileSync(path.join(dir,'result-1.json')),beforeResult);
 let effects=1;if(family==='sqlite')effects=Number(cmd('sqlite3',[config.db,'SELECT count(*) FROM logical_effects']));if(family==='ability')effects=Number(cmd('sqlite3',[path.join(dir,'application.sqlite'),'SELECT count(*) FROM business_effects']));if(family==='git')assert.equal(cmd('git',['--git-dir='+config.repo,'rev-parse','refs/kujo-targets/'+config.intent.target_sha256]),config.new_oid);assert.equal(effects,1);
 const state=JSON.parse(fs.readFileSync(path.join(ptr.run_dir,'state.json'),'utf8').split('\n').slice(1).join('\n'));assert.equal(state.steps[1].status,'completed');const journal=fs.readFileSync(path.join(ptr.run_dir,'control-events.jsonl'),'utf8');assert.ok(journal.includes('assurance_policy_selected'));assert.ok(journal.includes('assurance_replay_admitted'));assert.equal(journal.includes(canary),false);assert.equal(journal.includes(token),false);
 proofs.push({family,scenario,portable_identity_checks:family==='ability'?2:0,required:true,fresh_controller:true,checkpoint:true,descendant:true,logical_effects:effects,config_revision:installed.r1});
}
for(const text of logs){assert.equal(text.includes(canary),false);assert.equal(text.includes(token),false);}fs.writeFileSync(path.join(root,'proof.json'),JSON.stringify(proofs,null,2));console.log(JSON.stringify({root,proofs,privacy:true}));
