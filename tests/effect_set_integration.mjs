import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,appendFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const kujo=process.env.KUJO_BIN||'kujo', root=mkdtempSync(join(tmpdir(),'effect-set-'));
mkdirSync(join(root,'artifacts'));
const canon=x=>Array.isArray(x)?'['+x.map(canon).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canon(x[k])).join(',')+'}':JSON.stringify(x);
const hash=x=>createHash('sha256').update(x).digest('hex'), ref=x=>'sha256:'+hash(x),clone=x=>structuredClone(x);
const now=Math.floor(Date.now()/1000);
const subject={run_id:'set-run',step_id:'action',attempt_id:'1'};
const effects=['A','B','C','D'].map((effect_id,i)=>({effect_id,class:i===1?'external_non_idempotent':'external_idempotent',state:i<2?'unknown':'not_started'}));
const result={schema:'kujo.execution-result/v1',result_id:'set-result',subject,producer:{name:'effect-set-host',version:'1'},status:'indeterminate',classification:'unknown',started_at:'2026-09-29T00:00:00Z',finished_at:'2026-09-29T00:00:00Z',attempt:1,effects,evidence:[]};
const intents=effects.map(e=>({operation:'create',target_sha256:hash('target-'+e.effect_id),scope_sha256:hash('scope'),key_sha256:hash('key-'+e.effect_id),request_sha256:hash('request-'+e.effect_id),precondition_sha256:hash('empty'),valid_from:now-10,valid_until:now+3500}));
const plan={schema:'dispatch.effect-plan/v1alpha1',subject,config_ref:ref('configuration-1'),registration_ref:ref('registration-1'),preserve_until:now+3000,effects:effects.map((e,i)=>({effect_id:e.effect_id,operation:'create',target_ref:'sha256:'+intents[i].target_sha256,scope_ref:'sha256:'+intents[i].scope_sha256,request_ref:'sha256:'+intents[i].request_sha256,key_ref:'sha256:'+intents[i].key_sha256,profile:i===1?'unverified.external':'dispatch.sqlite-unique',profile_revision:'1beta1',authority:i===1?'external':'local-sqlite'}))};
const host={plan,intents,result_raw:canon(result)};
writeFileSync(join(root,'host.json'),canon(host));
function run(mode,at=now){const p=spawnSync(kujo,['run','tests/effect_set_fixture.kujo',root,mode,String(at)],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024});assert.equal(p.status,0,p.stderr+p.stdout);assert.equal(p.stderr,'');return p.stdout.trim()}
async function killAt(mode,marker){const p=spawn(kujo,['run','tests/effect_set_fixture.kujo',root,mode,String(now)],{stdio:['ignore','pipe','pipe']});let out='',err='';const timer=setTimeout(()=>p.kill('SIGKILL'),20000);p.stdout.on('data',b=>{out+=b;if(out.includes(marker))p.kill('SIGKILL')});p.stderr.on('data',b=>err+=b);const status=await new Promise(r=>p.on('exit',(code,signal)=>r({code,signal})));clearTimeout(timer);assert.ok(out.includes(marker),out+err);assert.equal(status.signal,'SIGKILL');assert.equal(err,'');return out}
run('init');await killAt('participant','CRASH_BOUNDARY');await killAt('record','CONTROLLER_DURABLE');
const first=JSON.parse(run('assess'));
assert.equal(first.ok,true);assert.equal(first.parent_replay,'prohibited');
assert.deepEqual(first.effects.map(e=>e.observed_state),['committed','unknown','not_started','not_started']);
assert.equal(first.effects[2].next_action,'inspect_or_revalidate');assert.equal(first.effects[2].blocked_by,'B');assert.equal(first.effects[3].blocked_by,'B');
const expired=JSON.parse(run('assess',now+30));assert.equal(expired.effects[0].historical_observation,'committed');assert.equal(expired.effects[0].observed_state,'unknown');assert.equal(expired.effects[0].freshness,'stale');
const oldFiles=Object.fromEntries(readdirSync(join(root,'artifacts')).map(f=>[f,readFileSync(join(root,'artifacts',f),'utf8')]));
run('renew',now+30);const renewed=JSON.parse(run('assess',now+30));assert.equal(renewed.effects[0].observed_state,'committed');for(const [f,raw] of Object.entries(oldFiles))assert.equal(readFileSync(join(root,'artifacts',f),'utf8'),raw);
// Independent process and MCP record the actual lost B report against a host-owned
// single-effect result. This is a separate child record, not a reinterpretation of
// the parent result by the historical single-effect consumer.
const binary=join(root,'participant');const build=spawnSync('go',['build','-o',binary,'.'],{cwd:'interop/go-participant',encoding:'utf8',env:{...process.env,GOTOOLCHAIN:'local',GOPROXY:'off'}});assert.equal(build.status,0,build.stderr);
const child={...result,result_id:'child-B',effects:[effects[1]]};const childRaw=canon(child);writeFileSync(join(root,'child-result.json'),childRaw);writeFileSync(join(root,'artifacts',hash(childRaw)+'.json'),childRaw);
const handoff={schema:'kujo.interop-handoff/v1alpha1',subject:{...subject,effect_id:'B'},participant:{namespace:'kujolang.go-process',invocation_id:'go-B'},completion_knowledge:'unknown',execution_result_ref:ref(childRaw),assurance_ref:null,participant_extension:{schema:'kujolang.go-process-correlation/v1alpha1',values:{call_id:'call-B',process_instance_id:'go-1'}},effect_extension:null};
const wire=canon(handoff);writeFileSync(join(root,'host-handoff.json'),wire);
const recorded=spawnSync(binary,['record'],{input:wire,encoding:'utf8'});assert.equal(recorded.status,0,recorded.stderr);assert.equal(recorded.stdout,wire);writeFileSync(join(root,'go-handoff.json'),recorded.stdout);assert.equal(JSON.parse(run('correlate-go')).ok,true);
const messages=[{jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'effect-set-host',version:'1'}}},{jsonrpc:'2.0',method:'notifications/initialized'},{jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'record_handoff',arguments:{wire}}}];
const mcp=spawnSync(binary,['mcp'],{input:messages.map(JSON.stringify).join('\n')+'\n',encoding:'utf8'});assert.equal(mcp.status,0);const response=JSON.parse(mcp.stdout.trim().split('\n').at(-1));assert.equal(response.result.content[0].text,wire);assert.equal(response.result.isError,false);
const forged=clone(handoff);forged.completion_knowledge='reported';writeFileSync(join(root,'go-handoff.json'),canon(forged));assert.equal(JSON.parse(run('correlate-go')).ok,false);writeFileSync(join(root,'go-handoff.json'),wire);
assert.equal(JSON.parse(run('assess',now+30)).parent_replay,'prohibited');
// Two independently launched contenders use the same sink-enforced key.
const contenders=await Promise.all([1,2].map(()=>new Promise((done,reject)=>{const p=spawn(kujo,['run','tests/effect_set_fixture.kujo',root,'apply-first']);let out='',err='';p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);p.on('exit',c=>c===0&&err===''?done(JSON.parse(out)):reject(Error(err)))})));assert.ok(contenders.every(x=>x.ok));
assert.equal(JSON.parse(run('count'))[0].n,2);
const state=JSON.parse(readFileSync(join(root,'state.json'))),set=JSON.parse(readFileSync(join(root,'artifacts',state.effect_set_ref.slice(7)+'.json')));
const artifacts=Object.fromEntries(readdirSync(join(root,'artifacts')).map(f=>['sha256:'+f.slice(0,-5),readFileSync(join(root,'artifacts',f),'utf8')]));
const live=Object.fromEntries(set.observations.filter(Boolean).map(r=>{const x=JSON.parse(artifacts[r]);return [x.effect_id,x]}));
const base={name:'valid',result_raw:host.result_raw,set_raw:canon(set),plan,artifacts,live:{...live,B:null},at:now+30};
const cases=[base];function add(name,fn){const x=clone(base);x.name=name;fn(x);cases.push(x)}
add('unconfirmed',x=>x.live.A=null);add('deleted-record',x=>x.live.A.state='not_started');add('revoked-credential',x=>x.live.A=null);add('changed-ref',x=>x.live.A.evidence_ref=ref('changed'));
add('expired-resource',x=>x.at=now+60);add('future-evidence',x=>x.at=now+29);add('preservation-expired',x=>x.at=plan.preserve_until);
for(const field of ['config_ref','registration_ref'])add('changed-'+field,x=>x.plan[field]=ref('changed'));
add('changed-authority',x=>x.plan.effects[0].authority='other');add('wrong-target',x=>x.plan.effects[0].target_ref=ref('other'));add('wrong-attempt',x=>x.plan.subject.attempt_id='2');add('wrong-result',x=>x.result_raw+=' ');
add('reordered',x=>x.plan.effects.reverse());add('duplicate-effect',x=>{x.plan.effects[1]=clone(x.plan.effects[0]);const s=JSON.parse(x.set_raw);s.plan_ref=ref(canon(x.plan));x.set_raw=canon(s)});
add('duplicate-logical-key',x=>{x.plan.effects[1]={...x.plan.effects[0],effect_id:'B'};const s=JSON.parse(x.set_raw);s.plan_ref=ref(canon(x.plan));s.observations=[null,null,null,null];x.set_raw=canon(s)});
add('too-many-effects',x=>{x.plan.effects=Array(9).fill(x.plan.effects[0]);const s=JSON.parse(x.set_raw);s.plan_ref=ref(canon(x.plan));x.set_raw=canon(s)});
add('tampered-artifact',x=>x.artifacts[set.observations[0]]+=' ');add('unknown-field',x=>{const s=JSON.parse(x.set_raw);s.admission=true;x.set_raw=canon(s)});add('duplicate-wire-key',x=>x.set_raw='{"schema":"dispatch.effect-set/v1alpha1",'+x.set_raw.slice(1));add('noncanonical',x=>x.set_raw+='\n');add('invalid-clock',x=>x.at=-1);
add('claim-success-without-verifier',x=>{const r=JSON.parse(x.result_raw);r.status='success';r.effects[1].state='committed';x.result_raw=canon(r);const s=JSON.parse(x.set_raw);s.result_ref=ref(x.result_raw);s.observations=[null,null,null,null];x.set_raw=canon(s)});
// Changing counts or repeating claims never changes the unavailable B verifier.
add('three-claims',x=>{const r=JSON.parse(x.result_raw);r.evidence=[{type:'claim',ref:ref('claim-1')},{type:'claim',ref:ref('claim-2')},{type:'claim',ref:ref('claim-3')}];x.result_raw=canon(r);const s=JSON.parse(x.set_raw);s.result_ref=ref(x.result_raw);s.observations=[null,null,null,null];x.set_raw=canon(s)});
function rebind(x,states){const r=JSON.parse(x.result_raw);r.effects.forEach((e,i)=>e.state=states[i]);x.result_raw=canon(r);const s=JSON.parse(x.set_raw);s.result_ref=ref(x.result_raw);s.observations=states.map((state,i)=>{const o={...live.A,effect_id:effects[i].effect_id,state:state==='unknown'?'committed':state,result_ref:s.result_ref};const raw=canon(o),reference=ref(raw);x.artifacts[reference]=raw;x.live[o.effect_id]=o;return reference});x.set_raw=canon(s)}
add('all-complete',x=>rebind(x,['unknown','unknown','unknown','unknown']));
add('first-unstarted-candidate',x=>rebind(x,['unknown','not_started','not_started','not_started']));
add('all-unstarted',x=>rebind(x,['not_started','not_started','not_started','not_started']));
writeFileSync(join(root,'cases.json'),JSON.stringify(cases));const answers=JSON.parse(run('cases'));
for(const {name,answer} of answers){assert.equal(answer.parent_replay,'prohibited',name);assert.equal(answer.continuation,'review_required',name);if(['all-complete','first-unstarted-candidate','all-unstarted','valid','unconfirmed','deleted-record','revoked-credential','changed-ref','expired-resource','future-evidence','preservation-expired','claim-success-without-verifier','three-claims'].includes(name)){assert.equal(answer.ok,true,name);if(!['valid','all-complete','first-unstarted-candidate','all-unstarted','preservation-expired'].includes(name))assert.equal(answer.effects[0].observed_state,'unknown',name)}else assert.equal(answer.ok,false,name)}
const byName=Object.fromEntries(answers.map(x=>[x.name,x.answer]));assert.equal(byName['all-complete'].condition,'all_observed_complete');assert.equal(byName['first-unstarted-candidate'].effects[1].next_action,'candidate_for_locked_admission');assert.equal(byName['first-unstarted-candidate'].effects[2].next_action,'inspect_or_revalidate');assert.equal(byName['all-unstarted'].effects[0].next_action,'candidate_for_locked_admission');
run('delete-first');assert.equal(JSON.parse(run('assess',now+30)).effects[0].freshness,'unconfirmed');
appendFileSync(join(root,'control-events.jsonl'),'\n{"torn":');const torn=spawnSync(kujo,['run','tests/effect_set_fixture.kujo',root,'assess',String(now+30)],{encoding:'utf8'});assert.notEqual(torn.status,0);
console.log(JSON.stringify({ok:true,root,scenarios:['A: two SIGKILLs; retained A/unknown B/unstarted C,D','B: claim without verifier','C: expiry/append-only renewal','D: two sink-key contenders','journal tamper refused'],assessmentCases:cases.length,first,expired,renewed}));
