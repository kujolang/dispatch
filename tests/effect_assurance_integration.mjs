import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
const cwd=process.cwd(), runtime=process.env.KUJO_BIN||'kujo', workcell=path.resolve(process.env.WORKCELL_ROOT||'../workcell');
const root=path.resolve('tests/tmp/effect-assurance-'+Date.now());fs.mkdirSync(root,{recursive:true});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const write=(dir,name,x)=>fs.writeFileSync(path.join(dir,name),typeof x==='string'?x:JSON.stringify(x));
const canary='SECRET_CUSTOMER_MESSAGE_sk-wave-c-do-not-copy';
const logs=[];
function run(command,args,dir=cwd,input){const r=spawnSync(command,args,{cwd:dir,input,encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024,env:{...process.env,DISPATCH_OFFLINE_FIXTURE:'true',DISPATCH_ALLOW_ANY_OUTPUT_ROOT:'true'}});logs.push(r.stdout||'',r.stderr||'');assert.equal(r.status,0,`${command} ${args.join(' ')}\n${r.stdout}\n${r.stderr}`);assert.equal(r.stderr,'');return r.stdout.trim();}
const kujo=(entry,args,dir=cwd)=>run(runtime,['run',entry,...args],dir);
async function concurrentApply(config,dir){return await new Promise((resolve,reject)=>{const child=spawn(runtime,['run',config.entry,dir,'apply'],{cwd:config.cwd});let out='',err='';const timer=setTimeout(()=>{child.kill('SIGKILL');reject(new Error('concurrent adapter timeout'));},15000);child.stdout.on('data',x=>out+=x);child.stderr.on('data',x=>err+=x);child.on('exit',code=>{clearTimeout(timer);try{assert.equal(code,0,err);assert.equal(err,'');logs.push(out);resolve(JSON.parse(out));}catch(e){reject(e);}});});}
const proofs=[];
for(const family of ['sqlite','git'])for(const scenario of ['before_commit','after_commit','expired','non-idempotent']){
 const boundary=scenario==='before_commit'?'before_commit':'after_commit';
 const dir=path.join(root,family+'-'+scenario);fs.mkdirSync(dir);
 const now=Math.floor(Date.now()/1000);
 const config={runtime:runtime.includes('/')?path.resolve(runtime):runtime,cwd,entry:'examples/effect-assurance/sqlite-adapter.kujo',issuer:'sqlite-local',db:path.join(dir,'sink.sqlite'),boundary,effect_class:scenario==='non-idempotent'?'external_non_idempotent':'external_idempotent',intent:{operation:'create',target_sha256:sha('target-'+family),scope_sha256:sha('local-account/environment/run-step-'+dir),key_sha256:sha('fixture-key'),request_sha256:sha(canary),precondition_sha256:sha('empty'),valid_from:now-5,valid_until:now+(scenario==='expired'?12:1800)}};
 if(family==='git'){
   config.cwd=workcell;config.entry='examples/effect-assurance/adapter.kujo';config.issuer='git-local';config.repo=path.join(dir,'sink.git');
   run('git',['init','--bare','--quiet',config.repo]);
   config.old_oid=run('git',['--git-dir='+config.repo,'hash-object','-w','--stdin'],cwd,'before');
   config.new_oid=run('git',['--git-dir='+config.repo,'hash-object','-w','--stdin'],cwd,canary);
   config.intent.operation='update';config.intent.request_sha256=sha(config.new_oid);config.intent.precondition_sha256=sha(config.old_oid);
   run('git',['--git-dir='+config.repo,'update-ref','refs/kujo-targets/'+config.intent.target_sha256,config.old_oid]);
 }
 write(dir,'config.json',config);
 if(family==='sqlite')kujo(config.entry,[dir,'init']);
 assert.equal(kujo('tests/effect_assurance_fixture.kujo',[dir,'start']),'PAUSED_AFTER_REAL_CRASH');
 assert.equal(kujo('tests/effect_assurance_fixture.kujo',[dir,'assure']),'ASSURANCE_RECORDED');
 const raw=fs.readFileSync(path.join(dir,'assurance.json'),'utf8'), doc=JSON.parse(raw), resultRaw=fs.readFileSync(path.join(dir,'result-1.json'),'utf8');
 assert.equal(doc.observed_state,boundary==='before_commit'?'not_started':'committed');
 if(scenario==='expired'||scenario==='non-idempotent'){
   if(scenario==='expired')Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,Math.max(0,(doc.valid_until*1000-Date.now())+100));
   const pointer=JSON.parse(fs.readFileSync(path.join(dir,'state-pointer.json'))), statePath=path.join(pointer.run_dir,'state.json'), before=fs.readFileSync(statePath,'utf8');
   const denied=JSON.parse(kujo('tests/effect_assurance_fixture.kujo',[dir,'resume']));
   assert.equal(denied.code,scenario==='expired'?'assurance_expired_or_future':'assurance_existing_policy_denied');
   assert.equal(fs.readFileSync(statePath,'utf8'),before);
   if(scenario==='expired')assert.equal(JSON.parse(kujo(config.entry,[dir,'apply'],config.cwd)).ok,false);
   proofs.push({family,scenario,assurance:doc,decision:denied,state_unchanged:true});
   console.log('PASS '+family+' '+scenario+': real effect, continuation blocked, state intact');continue;
 }
 const cases=[{name:'valid',raw,at:now,want:true}];
 const add=(name,change,extra={})=>{const d=structuredClone(doc);change(d);cases.push({name,raw:JSON.stringify(d),at:now,want:false,...extra});};
 for(const field of ['run_id','step_id','attempt_id','effect_id'])add('wrong-'+field,d=>d[field]+='-other');
 for(const field of ['result_sha256','target_sha256','scope_sha256','key_sha256','request_sha256','precondition_sha256','transaction_sha256'])add('wrong-'+field,d=>d[field]=sha('other'));
 add('forged-issuer',d=>d.issuer='other-adapter');add('malformed-issuer',d=>d.issuer='https://user:secret@evil.invalid');
 add('unsupported-assurance',d=>d.assurance='safe');
 for(const level of ['claimed','observed'])add('insufficient-'+level,d=>d.assurance=level,{expected:{assurance:level}});
 add('unknown-version',d=>d.schema='dispatch.effect-assurance/v999');add('missing-field',d=>delete d.scope_sha256);
 add('sensitive-extension',d=>d.payload=canary);add('wrong-observation',d=>d.observed_state=boundary==='before_commit'?'committed':'not_started');
 add('malicious-url',d=>d.evidence_ref='https://user:secret@evil.invalid/evidence');add('traversal-ref',d=>d.evidence_ref='../../secrets');
 add('wrong-evidence-digest',d=>d.evidence_ref='sha256:'+sha('other'));
 add('expired',()=>{},{at:doc.valid_until});add('before-validity',()=>{},{at:doc.valid_from-1});
 add('invalid-clock',()=>{},{at:1.5});add('absent-adapter',()=>{},{no_adapter:true});
 add('changed-result-bytes',()=>{},{result_raw:resultRaw+'\n'});
 add('stale-live-transaction',d=>d.transaction_sha256=sha('other'),{expected:{transaction_sha256:sha('other')}});
 add('substituted-live-target',d=>d.target_sha256=sha('other'),{expected:{target_sha256:sha('other')}});
 add('extended-guarantee',d=>d.valid_until+=1);
 const nonIdempotent=resultRaw.replace('external_idempotent','external_non_idempotent');
 add('non-idempotent',d=>{d.replay_class='external_non_idempotent';d.result_sha256=sha(nonIdempotent);},{expected:{replay_class:'external_non_idempotent',result_sha256:sha(nonIdempotent)},result_raw:nonIdempotent});
 add('scope-live-substitution',d=>d.scope_sha256=sha('other'),{expected:{scope_sha256:sha('other')}});
 add('input-live-substitution',d=>d.request_sha256=sha('other'),{expected:{request_sha256:sha('other')}});
 const wrongAttempt=JSON.stringify({...JSON.parse(resultRaw),attempt:2});
 add('numeric-attempt-mismatch',d=>d.result_sha256=sha(wrongAttempt),{expected:{result_sha256:sha(wrongAttempt)},result_raw:wrongAttempt});
 add('completion-mismatch',d=>d.reported_state='committed');
 add('compensation-claim',d=>d.compensation='verified');
 for(const value of [-1,1.5,'123',null])add('invalid-expiry-'+JSON.stringify(value),d=>d.valid_until=value);
 cases.push({name:'conflicting-documents',raw:JSON.stringify([doc,{...doc,observed_state:'unknown'}]),at:now,want:false});
 cases.push({name:'invalid-json',raw:'{',at:now,want:false},{name:'oversize',raw:' '.repeat(8193),at:now,want:false});
 write(dir,'cases.json',cases);
 const answers=JSON.parse(kujo('tests/effect_assurance_fixture.kujo',[dir,'cases']));
 for(let i=0;i<cases.length;i++){
   assert.equal(answers[i].answer.ok,cases[i].want,JSON.stringify(answers[i]));
   const name=cases[i].name;
   if(name.startsWith('wrong-')&&name!=='wrong-observation'&&name!=='wrong-evidence-digest')assert.equal(answers[i].answer.code,'assurance_binding_mismatch',name);
   if(['stale-live-transaction','substituted-live-target','scope-live-substitution','input-live-substitution'].includes(name))assert.equal(answers[i].answer.code,'assurance_verification_failed',name);
   if(name==='numeric-attempt-mismatch')assert.equal(answers[i].answer.code,'assurance_attempt_mismatch');
   if(name==='non-idempotent')assert.equal(answers[i].answer.code,'assurance_existing_policy_denied');
   if(name==='absent-adapter')assert.equal(answers[i].answer.code,'assurance_issuer_untrusted');
 }
 assert.equal(kujo('tests/effect_assurance_fixture.kujo',[dir,'continuation_cases']),'CONTINUATION_TARGET_REJECTED');
 // Bounded local resolution never follows producer references or links.
 write(dir,'oversize.json',' '.repeat(8193));fs.symlinkSync(path.join(dir,'assurance.json'),path.join(dir,'linked.json'));
 write(dir,'file-cases.json',[{path:'../config.json',digest:sha(raw)},{path:path.join(dir,'assurance.json'),digest:sha(raw)},{path:'linked.json',digest:sha(raw)},{path:'oversize.json',digest:sha(' '.repeat(8193))},{path:'https://evil.invalid/x',digest:sha(raw)}]);
 const fileAnswers=JSON.parse(kujo('tests/effect_assurance_fixture.kujo',[dir,'file_cases']));assert.ok(fileAnswers.every(x=>x.ok===false));
 // Real continuation path rejects a subject mismatch without mutating state or sink.
 const pointer=JSON.parse(fs.readFileSync(path.join(dir,'state-pointer.json'))),statePath=path.join(pointer.run_dir,'state.json');
 const stateBefore=fs.readFileSync(statePath,'utf8');
 const bad=JSON.stringify({...doc,step_id:'wrong-step'});write(dir,'assurance.json',bad);write(dir,'assurance.sha256',sha(bad));
 assert.equal(JSON.parse(kujo('tests/effect_assurance_fixture.kujo',[dir,'resume'])).ok,false);
 assert.equal(fs.readFileSync(statePath,'utf8'),stateBefore);
 // Exact-byte digest rejection precedes parsing/trust resolution.
 write(dir,'assurance.json',raw);write(dir,'assurance.sha256',sha('tamper'));
 assert.equal(JSON.parse(kujo('tests/effect_assurance_fixture.kujo',[dir,'resume'])).code,'assurance_digest_mismatch');
 write(dir,'assurance.sha256',sha(raw));
 const replay=JSON.parse(kujo('tests/effect_assurance_fixture.kujo',[dir,'resume']));assert.equal(replay.code,'REPLAY_COMPLETED');
 const concurrent=await Promise.all([concurrentApply(config,dir),concurrentApply(config,dir)]);assert.ok(concurrent.every(x=>x.ok));
 const common=JSON.parse(fs.readFileSync(path.join(dir,'common-conformance.json'),'utf8'));assert.ok(common.checks>=60);assert.equal(common.profile,family==='sqlite'?'dispatch.sqlite-unique':'workcell.git-cas');
 if(family==='sqlite'){
   const count=run('sqlite3',[config.db,'SELECT count(*) FROM logical_effects;']);assert.equal(count,'1');
 }else{
   assert.equal(run('git',['--git-dir='+config.repo,'rev-parse','refs/kujo-targets/'+config.intent.target_sha256]),config.new_oid);
   assert.equal(run('git',['--git-dir='+config.repo,'for-each-ref','--format=%(refname)','refs/kujo-effects/']).split('\n').length,1);
 }
 // Sink rejects changed input under the same scoped key after replay.
 const original=structuredClone(config);config.intent.request_sha256=sha('changed request');write(dir,'config.json',config);
 assert.equal(JSON.parse(kujo(config.entry,[dir,'apply'],config.cwd)).ok,false);write(dir,'config.json',original);
 if(family==='git'){
   run('git',['--git-dir='+config.repo,'update-ref','refs/kujo-targets/'+config.intent.target_sha256,config.old_oid]);
   assert.equal(JSON.parse(kujo(original.entry,[dir,'observe'],original.cwd)).ok,false);
   assert.equal(JSON.parse(kujo(original.entry,[dir,'apply'],original.cwd)).ok,false);
 }
 assert.ok(!raw.includes(canary));assert.ok(!JSON.stringify(answers).includes(canary));
 proofs.push({family,boundary,cases:cases.length,checks:answers,assurance:doc,replay,logical_effects:1,concurrent_retries:concurrent.length,common});
 console.log(`PASS ${family} ${boundary}: real SIGKILL, ${cases.length} assurance cases, Dispatch replay, one logical effect`);
}
assert.ok(!logs.join('').includes(canary));
write(root,'proof.json',{proofs,privacy:'canary absent from assurance and diagnostics'});
console.log('Evidence: '+root+'/proof.json');
