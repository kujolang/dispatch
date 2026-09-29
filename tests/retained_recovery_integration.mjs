import fs from 'node:fs';import {join,resolve} from 'node:path';import {tmpdir} from 'node:os';import {spawn,spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
let cwd=process.cwd();
const kujo=process.env.KUJO_BIN||'kujo',root=fs.mkdtempSync(join(tmpdir(),'sequential-effects-'));
const hash=x=>createHash('sha256').update(x).digest('hex'), read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v));
const env={...process.env,KUJO_MODULE_PATH:resolve('..'),DISPATCH_OFFLINE_FIXTURE:'true',DISPATCH_ALLOW_ANY_OUTPUT_ROOT:'true'};
function command(program,args,input){const p=spawnSync(program,args,{encoding:'utf8',input,timeout:60000,env,cwd,maxBuffer:8*1024*1024});assert.equal(p.status,0,p.stdout+p.stderr);assert.equal(p.stderr,'');return p.stdout.trim()}
const snapshots=new Map();
let serial=0;const requestFile=(d,r)=>{const p=join(d,'request-'+serial+++'.json');write(p,r);return p};
function run(d,r,mode='operate'){const result=JSON.parse(command(kujo,['run','tests/sequential_effect_fixture.kujo',d,mode,requestFile(d,r)]));if(result.ok)snapshots.set(d,result);else snapshots.delete(d);return result}
const inspect=d=>run(d,{operation:'inspect'});
function op(d,operation,fields={},mode='operate'){const before=snapshots.get(d)||inspect(d);assert.equal(before.ok,true,JSON.stringify(before));return run(d,{operation,expected:before.cursor,...fields},mode)}
const refresh=d=>op(d,'refresh',{effect_id:'C'}),select=(d,id='C')=>op(d,'select',{effect_id:id});
function active(d,operation,extra={},mode='operate'){return op(d,operation,{attempt_id:(snapshots.get(d)||inspect(d)).lifecycle.active,...extra},mode)}
function git(d,args,input){return command('git',['--git-dir='+join(d,'sink.git'),...args],input)}
function setup(family,name,extra={}){const d=join(root,family+'-'+name);fs.mkdirSync(d);let old='',next='';if(family==='git'){command('git',['init','--bare','--quiet',join(d,'sink.git')]);old=git(d,['hash-object','-w','--stdin'],'old');next=git(d,['hash-object','-w','--stdin'],'new')}
 const now=Math.floor(Date.now()/1000);const intents=['A','B','C','D'].map(id=>({operation:family==='git'?'update':'create',target_sha256:hash(d+(family==='git'?'/sink.git:'+id:'/sink.db')),scope_sha256:hash('scope'),key_sha256:hash(id),request_sha256:hash(family==='git'?next:'request-'+id),precondition_sha256:hash(family==='git'?old:'empty'),valid_from:now-10,valid_until:now+3500}));
 write(join(d,'host.json'),{family,old_oid:old,new_oid:next,intents,...extra});if(family==='git')for(const intent of intents)git(d,['update-ref','refs/kujo-targets/'+intent.target_sha256,old]);assert.equal(JSON.parse(command(kujo,['run','tests/sequential_effect_fixture.kujo',d,'init'])).ok,true);return d}

function recovery(d,action='plan',plan){const ptr=read(join(d,'pointer.json'));let args=['run','dispatch.kujo','recover',action,ptr.run_id];if(plan){const p=join(d,'repair.json');write(p,plan);args.push(p,'--operator','test-operator')}args.push('--output-root',join(d,'runs'),'--json');const p=spawnSync(kujo,args,{encoding:'utf8',env,cwd,timeout:60000});assert.equal(p.stderr,'',p.stderr);return JSON.parse(p.stdout.trim())}
function statePath(d){return join(read(join(d,'pointer.json')).run_dir,'state.json')}
function truth(d){const cfg=read(join(d,'host.json'));if(cfg.family==='git')return git(d,['for-each-ref','--format=%(refname)','refs/kujo-effects/']).split('\n').filter(Boolean).length;return Number(command('sqlite3',[join(d,'sink.db'),'SELECT count(*) FROM mutation_audit;']))}
const proofs=[];
for(const family of ['sqlite','git']){
 const d=setup(family,'recovery');assert.equal(refresh(d).ok,true);assert.equal(select(d).ok,true);
 const prior=fs.readFileSync(statePath(d),'utf8');const admitted=active(d,'admit');assert.equal(admitted.ok,true);
 fs.writeFileSync(statePath(d),prior);
 const planned=recovery(d);assert.equal(planned.ok,true,JSON.stringify(planned));assert.ok(planned.plan.repairs.includes('reconstruct_lifecycle_checkpoint'));
 assert.equal(planned.assessment.lifecycle.attempts[admitted.lifecycle.active].consumed,true);
 const applied=recovery(d,'apply',planned.plan);assert.equal(applied.ok,true,JSON.stringify(applied));
 const reloaded=inspect(d);assert.equal(reloaded.ok,true,JSON.stringify(reloaded));assert.equal(reloaded.lifecycle.attempts[admitted.lifecycle.active].consumed,true);
 assert.equal(active(d,'admit').ok,false);assert.equal(recovery(d,'apply',planned.plan).ok,false);assert.equal(truth(d),3);
 proofs.push(family+'-stale-state-consumption');
}

async function killAt(d,request,point){snapshots.delete(d);const p=spawn(kujo,['run','tests/sequential_effect_fixture.kujo',d,point,requestFile(d,request)],{env,cwd,stdio:['ignore','pipe','pipe']});let out='',err='';const timer=setTimeout(()=>p.kill('SIGKILL'),60000);p.stdout.on('data',b=>{out+=b;if(out.includes('CRASH:'+point))p.kill('SIGKILL')});p.stderr.on('data',b=>err+=b);const status=await new Promise(r=>p.on('exit',(code,signal)=>r({code,signal})));clearTimeout(timer);assert.ok(out.includes('CRASH:'+point),out+err);assert.equal(status.signal,'SIGKILL');assert.equal(err,'')}

function damage(d,fn){const p=read(join(d,'pointer.json'));fn(p.run_dir)}
function repair(d){const beforeTruth=truth(d);const plan=recovery(d);assert.equal(plan.ok,true,JSON.stringify(plan));assert.ok(plan.plan.repairs.length);const result=recovery(d,'apply',plan.plan);assert.equal(result.ok,true,JSON.stringify(result));assert.equal(inspect(d).ok,true);assert.equal(truth(d),beforeTruth);return plan}
for(const name of ['orphan-control','exact-duplicate','cancel-tail','rebind-tail','torn','conflict','hash','ahead','missing-claim','lifecycle-orphan','stale-plan','revoked','expired','missing-workspace']){
 const d=setup('sqlite',name);assert.equal(refresh(d).ok,true);assert.equal(select(d).ok,true);
 const before=fs.readFileSync(statePath(d),'utf8');
 if(name==='cancel-tail'){assert.equal(active(d,'cancel',{reason:'operator_cancelled'}).ok,true);fs.writeFileSync(statePath(d),before);repair(d);assert.equal(active(d,'admit').ok,false)}
 else if(name==='rebind-tail'){assert.equal(refresh(d).ok,true);const basis=fs.readFileSync(statePath(d),'utf8');assert.equal(active(d,'rebind').ok,true);fs.writeFileSync(statePath(d),basis);repair(d);assert.equal(inspect(d).lifecycle.attempts[inspect(d).lifecycle.active].rebindings.length,1)}
 else if(['orphan-control','exact-duplicate','stale-plan','revoked','expired','missing-workspace'].includes(name)){
  damage(d,dir=>{const p=join(dir,'control-events.jsonl'),lines=fs.readFileSync(p,'utf8').trim().split('\n');if(name==='exact-duplicate')lines.push(lines.at(-1));else lines.pop();fs.writeFileSync(p,lines.join('\n'))});
  if(name==='stale-plan'){const plan=recovery(d);damage(d,dir=>fs.writeFileSync(join(dir,'effect-lifecycle','unexpected.claim'),'bad'));assert.equal(recovery(d,'apply',plan.plan).ok,false)}
  else{if(name==='revoked'){const cfg=read(join(d,'host.json'));cfg.status='revoked';write(join(d,'host.json'),cfg)}
   if(name==='expired'||name==='missing-workspace'){const st=JSON.parse(before.split('\n').slice(1).join('\n'));if(name==='expired')st.steps[0].execution_result.preservation_outcome.retain_until='2000-01-01T00:00:00Z';else {const cfg=read(join(d,'host.json'));cfg.effect_set.environment_valid=false;write(join(d,'host.json'),cfg)}fs.writeFileSync(statePath(d),'DISPATCH_ASSURANCE_STATE_V1BETA1\n'+JSON.stringify(st))}
   if(name==='expired'){assert.equal(recovery(d).ok,false)}else repair(d);if(['revoked','missing-workspace'].includes(name))assert.equal(active(d,'admit').ok,false);
  }
 } else{
  if(name==='missing-claim')assert.equal(active(d,'admit').ok,true);
  damage(d,dir=>{const p=join(dir,'control-events.jsonl'),lines=fs.readFileSync(p,'utf8').trim().split('\n');if(name==='torn')fs.appendFileSync(p,'\n{"sequence":');
   if(name==='conflict'){const event=JSON.parse(lines.at(-1));event.kind='conflict';fs.appendFileSync(p,'\n'+JSON.stringify(event))}
   if(name==='hash'){const f=fs.readdirSync(join(dir,'effect-lifecycle')).find(x=>x.endsWith('.json'));fs.appendFileSync(join(dir,'effect-lifecycle',f),' ')}
   if(name==='ahead'){fs.rmSync(join(dir,JSON.parse(lines.at(-1)).record_ref));lines.pop();fs.writeFileSync(p,lines.join('\n'))}
   if(name==='missing-claim'){const f=fs.readdirSync(join(dir,'effect-lifecycle')).find(x=>x.endsWith('.claim'));fs.rmSync(join(dir,'effect-lifecycle',f))}
   if(name==='lifecycle-orphan'){const event={schema:'dispatch.effect-lifecycle-event/v1alpha1',kind:'cancelled',prior_revision:999,prior_journal:hash('wrong'),data:{attempt_id:hash('wrong'),reason:'operator_cancelled'}};const canonical=v=>v&&typeof v==='object'&&!Array.isArray(v)?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);const raw=canonical(event);fs.writeFileSync(join(dir,'effect-lifecycle',hash(raw)+'.json'),raw)}
  });const plan=recovery(d);if(name==='lifecycle-orphan'){assert.equal(plan.ok,true);assert.equal(plan.plan.repairs.length,0);assert.equal(plan.assessment.classification,'needs_operator_review')}else assert.equal(plan.ok,false,JSON.stringify(plan));
 }
 proofs.push(name)
}
for(const point of ['after_admission','after_mutation','after_observation']){
 const d=setup('git','crash-'+point);assert.equal(refresh(d).ok,true);assert.equal(select(d).ok,true);const selected=inspect(d),before=fs.readFileSync(statePath(d),'utf8');
 await killAt(d,{operation:'admit',expected:selected.cursor,attempt_id:selected.lifecycle.active},point);
 // Deliberately stale the derived checkpoint after a real controller death.
 fs.writeFileSync(statePath(d),before);repair(d);const view=inspect(d);assert.equal(view.lifecycle.attempts[selected.lifecycle.active].consumed,true);assert.equal(active(d,'admit').ok,false);
 if(point==='after_mutation'){assert.equal(active(d,'verify').ok,true);assert.equal(inspect(d).lifecycle.attempts[selected.lifecycle.active].observation.observed_state,'committed')}
 if(point==='after_admission'){assert.equal(active(d,'verify').ok,true);assert.equal(inspect(d).lifecycle.attempts[selected.lifecycle.active].observation.observed_state,'not_started');assert.equal(active(d,'admit').ok,false)}
 assert.equal(truth(d),point==='after_admission'?2:3);proofs.push('sigkill-'+point)
}


// Two independently started operators apply the same exact plan under the real lock.
{
 const d=setup('sqlite','repair-race');assert.equal(refresh(d).ok,true);assert.equal(select(d).ok,true);
 damage(d,dir=>{const p=join(dir,'control-events.jsonl');fs.writeFileSync(p,fs.readFileSync(p,'utf8').trim().split('\n').slice(0,-1).join('\n'))});
 const plan=recovery(d).plan,p=join(d,'repair.json');write(p,plan);const ptr=read(join(d,'pointer.json'));
 const contender=()=>new Promise((resolve,reject)=>{const child=spawn(kujo,['run','dispatch.kujo','recover','apply',ptr.run_id,p,'--operator','race','--output-root',join(d,'runs'),'--json'],{env,cwd});let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.on('exit',()=>{try{assert.equal(err,'');resolve(JSON.parse(out))}catch(e){reject(e)}})});
 const results=await Promise.all([contender(),contender()]);assert.equal(results.filter(x=>x.ok).length,1);assert.equal(inspect(d).ok,true);assert.equal(truth(d),2);proofs.push('fresh-operator-contention');
}
// Fault injection is confined to a disposable source copy. Production has no
// environment-controlled crash switch. Kill the actual immutable-write path.
{
 const original=cwd,copy=join(root,'controllers','dispatch');fs.mkdirSync(copy,{recursive:true});fs.cpSync(resolve('src'),join(copy,'src'),{recursive:true});fs.copyFileSync(resolve('dispatch.kujo'),join(copy,'dispatch.kujo'));
 for(const dir of ['schemas','examples'])fs.symlinkSync(resolve(dir),join(copy,dir));fs.symlinkSync(resolve('../workcell'),join(root,'controllers','workcell'));fs.mkdirSync(join(copy,'tests'));fs.copyFileSync(resolve('tests/sequential_effect_fixture.kujo'),join(copy,'tests/sequential_effect_fixture.kujo'));
 const journal=join(copy,'src/core/control_journal.kujo');let code=fs.readFileSync(journal,'utf8');const point='    append_file(path, line)';assert.ok(code.includes(point));code=code.replace(point,'    if env("RECOVERY_CRASH") == kind {print("CRASH:immutable_control");sleep(30000)}\n'+point);fs.writeFileSync(journal,code);
 const lifecycle=join(copy,'src/core/sequential_effects.kujo');let lifecycleCode=fs.readFileSync(lifecycle,'utf8');const admitPoint='        state = append(state, "admitted",';assert.ok(lifecycleCode.includes(admitPoint));lifecycleCode=lifecycleCode.replace(admitPoint,'        if env("RECOVERY_CRASH") == "claim_written" {print("CRASH:immutable_control");sleep(30000)}\n'+admitPoint);fs.writeFileSync(lifecycle,lifecycleCode);
 cwd=copy;
 for(const phase of ['effect_lifecycle_recorded','retained_host_reconciled','claim_written']){
  const d=setup('sqlite','native-crash-'+phase);assert.equal(refresh(d).ok,true);assert.equal(select(d).ok,true);let argv;
  if(phase==='claim_written'){const view=inspect(d);argv=['run','tests/sequential_effect_fixture.kujo',d,'operate',requestFile(d,{operation:'admit',expected:view.cursor,attempt_id:view.lifecycle.active})]}
  else if(phase==='effect_lifecycle_recorded'){
   const view=inspect(d);argv=['run','tests/sequential_effect_fixture.kujo',d,'operate',requestFile(d,{operation:'cancel',expected:view.cursor,attempt_id:view.lifecycle.active,reason:'operator_cancelled'})];
  }else{
   damage(d,dir=>{const p=join(dir,'control-events.jsonl');fs.writeFileSync(p,fs.readFileSync(p,'utf8').trim().split('\n').slice(0,-1).join('\n'))});const plan=recovery(d).plan;const p=join(d,'repair.json');write(p,plan);argv=['run','dispatch.kujo','recover','apply',read(join(d,'pointer.json')).run_id,p,'--operator','crash-operator','--output-root',join(d,'runs'),'--json'];
  }
  const child=spawn(kujo,argv,{env:{...env,RECOVERY_CRASH:phase},cwd});let out='',err='';const timer=setTimeout(()=>child.kill('SIGKILL'),60000);child.stdout.on('data',b=>{out+=b;if(out.includes('CRASH:immutable_control'))child.kill('SIGKILL')});child.stderr.on('data',b=>err+=b);await new Promise(r=>child.on('exit',r));clearTimeout(timer);assert.ok(out.includes('CRASH:immutable_control'),out+err);assert.equal(err,'');
  if(phase==='claim_written'){const report=recovery(d);assert.equal(report.assessment.consumed_claims.length,1);assert.equal(report.assessment.lifecycle.attempts[report.assessment.lifecycle.active].consumed,true);assert.equal(report.assessment.lifecycle.attempts[report.assessment.lifecycle.active].admission_recorded,false);assert.equal(active(d,'admit').ok,false);assert.equal(truth(d),2);proofs.push('native-write-sigkill-claim-consumption');continue}
  repair(d);const current=inspect(d);assert.equal(current.ok,true);if(phase==='effect_lifecycle_recorded')assert.equal(active(d,'admit').ok,false);proofs.push('native-write-sigkill-'+phase);
 }
 cwd=original;
}


{
 const d=join(root,'workcell-owner');fs.mkdirSync(d);const source=join(d,'source');fs.mkdirSync(source);command('git',['init','-q',source]);fs.writeFileSync(join(source,'file'),'retained source');command('git',['-C',source,'add','file']);command('git',['-C',source,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture']);
 const ownerCall=mode=>{const p=spawnSync(kujo,['run',resolve('tests/recovery_workcell_fixture.kujo'),d,mode],{cwd:resolve('../workcell'),env:{...env,KUJO_MODULE_PATH:resolve('..')+':'+resolve('.')+':'+resolve('../workcell')},encoding:'utf8',timeout:60000});assert.equal(p.status,0,p.stdout+p.stderr);assert.equal(p.stderr,'');return JSON.parse(p.stdout)};
 const owned=ownerCall('create');owned.preservation.retain_until=new Date(Date.now()+15000).toISOString().replace(/\.\d{3}Z$/,'Z');write(join(d,'preservation-input.json'),owned);ownerCall('init-dispatch');
 const loseIndex=()=>damage(d,dir=>{const p=join(dir,'control-events.jsonl');fs.writeFileSync(p,fs.readFileSync(p,'utf8').trim().split('\n').slice(0,-1).join('\n'))});
 const ownerRepair=()=>{loseIndex();const planned=recovery(d);assert.equal(planned.ok,true,JSON.stringify(planned));assert.equal(recovery(d,'apply',planned.plan).ok,true);assert.equal(recovery(d,'inspect').ok,true);assert.equal(fs.readFileSync(join(d,'action-ran'),'utf8'),'1');return planned};
 const fixed=ownerRepair();assert.equal(fixed.assessment.environment[0].workspace_available,true);ownerCall('retry-check');proofs.push('real-workcell-retention-not-admission');
 await new Promise(r=>setTimeout(r,Math.max(0,Date.parse(owned.preservation.retain_until)-Date.now()+100)));
 const expired=ownerRepair();assert.equal(expired.assessment.environment[0].expired,true);ownerCall('retry-check');proofs.push('real-workcell-preservation-expired-during-outage');
 ownerCall('cleanup');assert.equal(recovery(d).assessment.environment[0].workspace_available,false);ownerCall('retry-check');proofs.push('real-workcell-workspace-missing');
 const checkpoint=fixed.assessment.source.files.find(f=>f.path.startsWith('checkpoints/state-'));damage(d,dir=>fs.appendFileSync(join(dir,checkpoint.path),'bad'));assert.equal(recovery(d).ok,false);proofs.push('corrupt-materialization-checkpoint-rejected');
}
{
 const d=setup('git','changed-target');assert.equal(refresh(d).ok,true);assert.equal(select(d).ok,true);const prior=fs.readFileSync(statePath(d),'utf8');assert.equal(active(d,'admit').ok,true);const cfg=read(join(d,'host.json'));const oid=git(d,['hash-object','-w','--stdin'],'unrelated');git(d,['update-ref','refs/kujo-targets/'+cfg.intents[2].target_sha256,oid]);fs.writeFileSync(statePath(d),prior);repair(d);assert.equal(active(d,'verify').ok,false);assert.equal(active(d,'admit').ok,false);proofs.push('workcell-git-changed-target');
}


{
 env.DISPATCH_STATE_BACKEND='sqlite';const d=setup('sqlite','sqlite-authority');assert.equal(refresh(d).ok,true);assert.equal(select(d).ok,true);const id=read(join(d,'pointer.json')).run_id,db=join(d,'runs','.dispatch','state.db');
 const previous=command('sqlite3',[db,"SELECT state_json FROM dispatch_run_state WHERE run_id='"+id+"'"]);const prior=JSON.parse(previous.split('\n').slice(1).join('\n'));assert.equal(active(d,'admit').ok,true);
 command('sqlite3',[db,"UPDATE dispatch_run_state SET revision="+prior.revision+",state_json='"+previous.replaceAll("'","''")+"' WHERE run_id='"+id+"'"]);fs.writeFileSync(statePath(d),'corrupt secondary export');repair(d);assert.equal(active(d,'admit').ok,false);delete env.DISPATCH_STATE_BACKEND;proofs.push('sqlite-authoritative-row-over-corrupt-mirror');
}
console.log(JSON.stringify({passed:proofs.length,proofs,root}));
