// Black-box installed-package rehearsal. No fixture imports or state mutations.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const source=process.cwd(),root=fs.mkdtempSync(path.join(os.tmpdir(),'dispatch-operator-'));
const installation=path.join(root,'installed'),home=path.join(root,'home'),evidence=path.join(root,'evidence');
for(const p of [installation,home,evidence])fs.mkdirSync(p,{recursive:true});
const files=spawnSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).stdout.split('\0').filter(Boolean);
for(const file of files){if(!fs.statSync(path.join(source,file)).isFile())continue;const p=path.join(installation,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.copyFileSync(path.join(source,file),p)}
const deps=process.env.DISPATCH_OPERATOR_DEPS||path.join(source,'.operator-deps');
for(const name of ['workcell','eval']){const from=path.join(deps,name);assert.ok(fs.existsSync(from),'Install pinned operator dependencies first: bash scripts/install_operator_dependencies.sh');fs.cpSync(from,path.join(installation,'.operator-deps',name),{recursive:true})}
const runtime=path.resolve(process.env.KUJO_BIN||'../kujo/target/release/kujo');
const env={HOME:home,PATH:process.env.PATH,KUJO_BIN:runtime,TMPDIR:root,LANG:'C',DISPATCH_ROOT:installation};
const entry=path.join(installation,'scripts/operator.sh');let sequence=0;
function command(args,{allowFailure=false,json=true}={}){const serial=sequence++;return new Promise((done,reject)=>{const p=spawn('bash',[entry,...args],{env,cwd:home});let out='',err='';const timer=setTimeout(()=>p.kill('SIGKILL'),240000);p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);p.on('close',(status,signal)=>{clearTimeout(timer);fs.writeFileSync(path.join(evidence,`${serial}.json`),JSON.stringify({argv:args,status,signal,stdout:out,stderr:err}));try{assert.equal(err,'',err);assert.equal(signal,null,out);if(!allowFailure)assert.equal(status,0,out);let value=json?JSON.parse(out):out;if(json)assert.equal(value.ok,status===0,JSON.stringify(value));done(value)}catch(e){reject(e)}})})}
const publicHelp=spawnSync(runtime,['run',path.join(installation,'dispatch.kujo'),'operator','--help'],{env,cwd:home,encoding:'utf8'});assert.equal(publicHelp.status,0,publicHelp.stderr);assert.match(publicHelp.stdout,/Experimental local batch-summary/);
const check=(v)=>{assert.equal(v.ok,true,JSON.stringify(v));return v};
async function initialize(name,settings={}){const d=path.join(root,name),config=path.join(root,name+'.json');fs.writeFileSync(config,JSON.stringify({schema:'dispatch.batch-summary/v1alpha1',amounts:[12,18,20],expected_total:50,program_limit:2,eval_limit:1,...settings}));check(await command(['init',d,config]));return d}
async function plan(d,action,id='graph'){return check(await command(['plan',d,action,id]))}
async function apply(d,p,allowFailure=false){const file=path.join(evidence,`plan-${sequence}.json`);fs.writeFileSync(file,JSON.stringify(p));return command(['apply',d,file],{allowFailure})}
async function operation(d,action,id='graph'){return check(await apply(d,await plan(d,action,id)))}
async function run(d){return check(await command(['run',d]))}
async function inspect(d){return check(await command(['inspect',d,'--json']))}
async function finish(d,id){for(const action of ['refresh','select','admit','refresh','parent-finalize'])await operation(d,action,id);await run(d)}
function snapshot(directory){const entries=[];function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&!e.name.endsWith('.lock'))entries.push([path.relative(directory,p),createHash('sha256').update(fs.readFileSync(p)).digest('hex')])}}walk(directory);return entries.sort((a,b)=>a[0].localeCompare(b[0]))}
const proofs=[];function pass(s){proofs.push(s);console.log('PASS '+s)}
async function prefix(d){await operation(d,'reserve','A');await run(d);await finish(d,'A');await command(['review',d])}
async function crashReservation(d){
 const reservation=await plan(d,'reserve','A'),requestFile=path.join(evidence,'crash-reservation.json');fs.writeFileSync(requestFile,JSON.stringify(reservation));
 const records=path.join(d,'runs',reservation.run_id,'control-records'),known=new Set(fs.readdirSync(records));
 await new Promise((done,reject)=>{let killed=false,out='',err='';const child=spawn('bash',[entry,'apply',d,requestFile],{env,cwd:home});
  const scan=()=>{for(const name of fs.readdirSync(records)){if(known.has(name)||!name.endsWith('.json'))continue;try{const record=JSON.parse(fs.readFileSync(path.join(records,name),'utf8'));if(record.kind==='graph_resources_reserved'&&!killed){killed=true;child.kill('SIGKILL')}}catch{}}};
  const watcher=fs.watch(records,scan),interval=setInterval(scan,5),timeout=setTimeout(()=>child.kill('SIGKILL'),120000);
  child.stdout.on('data',x=>out+=x);child.stderr.on('data',x=>err+=x);child.on('close',(code,signal)=>{watcher.close();clearInterval(interval);clearTimeout(timeout);fs.writeFileSync(path.join(evidence,'crash.json'),JSON.stringify({code,signal,killed,out,err}));try{assert.ok(killed,'did not reach durable reservation');assert.equal(signal,'SIGKILL');done()}catch(e){reject(e)}})
 });
 const recovery=await plan(d,'recover');if(recovery.request.plan.repairs.length)check(await apply(d,recovery));
 const report=await inspect(d);assert.equal(report.resources.report.programs.consumed,0);assert.equal(report.resources.report.programs.reserved,1);assert.equal(report.nodes.find(n=>n.node_id==='A').output,undefined);
 pass('real SIGKILL after immutable reservation; fresh recovery retains capacity without execution or replay');
}
async function happy(){const d=await initialize('happy');await crashReservation(d);await run(d);await finish(d,'A');await command(['review',d]);
 const before=snapshot(d),approval=await plan(d,'approve','H');await inspect(d);assert.deepEqual(snapshot(d),before);pass('inspection and candidate planning leave durable contents unchanged');
 const wrong=structuredClone(approval);wrong.request.decision.subject.run_id='wrong';assert.equal((await apply(d,wrong,true)).ok,false);await command(['review',d]);assert.equal((await apply(d,approval,true)).ok,false);await operation(d,'approve','H');const reviewed=await inspect(d);assert.equal(reviewed.resources.report.evaluations.consumed,0);pass('wrong/stale human decisions rejected; authorized approval does not dispatch Eval');
 await operation(d,'reserve','E');await operation(d,'eval-dispatch','E');await operation(d,'observe','E');await operation(d,'node-finalize','E');await operation(d,'branch');await operation(d,'reserve','B');await run(d);await finish(d,'B');await operation(d,'graph-finalize');
 const result=await inspect(d);assert.equal(result.outcome.receipt.candidate.outcome,'completed');assert.equal(result.resources.report.programs.consumed,2);assert.equal(result.resources.report.evaluations.consumed,1);assert.equal(result.resources.report.evaluations.available,0);assert.equal(result.resources.report.monetary_cost.value,null);assert.equal(result.resources.report.totals.reported_input_tokens.total,null);assert.ok(result.resources.report.totals.process_wall_ns.known_sum>0);
 const a=result.nodes.find(n=>n.node_id==='A'),b=result.nodes.find(n=>n.node_id==='B');assert.equal(b.output.value,50);assert.ok(b.output.sources.includes('sha256:'+a.output_sha256));assert.equal(b.output.source_ref,result.source_ref);assert.equal(result.outcome.receipt.candidate.nodes.find(n=>n.node_id==='R').reason,'not_selected');
 const human=await command(['inspect',d],{json:false});assert.match(human,/Graph terminal decision: completed/);assert.match(human,/Monetary cost \[unknown\]: unknown/);fs.writeFileSync(path.join(evidence,'happy-human.txt'),human);
 fs.writeFileSync(path.join(evidence,'happy-report.json'),JSON.stringify(result,null,2));pass('installed happy path finalizes with exact provenance and exhausted budgets; unknown usage remains null');
}
async function qualityFailure(){const d=await initialize('quality-failure',{expected_total:99});await prefix(d);await operation(d,'approve','H');await operation(d,'reserve','E');await operation(d,'eval-dispatch','E');await operation(d,'node-finalize','E');await operation(d,'branch');assert.equal((await command(['plan',d,'reserve','B'],{allowFailure:true})).ok,false);await operation(d,'reserve','R');await run(d);await finish(d,'R');await operation(d,'graph-finalize');const report=await inspect(d);assert.equal(report.outcome.receipt.candidate.outcome,'completed');assert.equal(report.outcome.receipt.candidate.nodes.find(n=>n.node_id==='B').reason,'not_selected');assert.equal(report.nodes.find(n=>n.node_id==='E').terminal.terminal.outcome,'failed');fs.writeFileSync(path.join(evidence,'failure-report.json'),JSON.stringify(report,null,2));pass('real Eval failure routes repair; failed verdict survives and inactive consumer consumes nothing')}
async function exhaustion(){const d=await initialize('exhausted',{eval_limit:0});await prefix(d);await operation(d,'approve','H');const denied=await command(['plan',d,'reserve','E'],{allowFailure:true});assert.equal(denied.ok,false);assert.match(JSON.stringify(denied),/eval_plan_capacity/);const report=await inspect(d);assert.equal(report.resources.report.evaluations.available,0);assert.notEqual(report.outcome.candidate.outcome,'completed');pass('exhaustion names Eval capacity and blocks new work without rewriting completed producer')}
await happy();await qualityFailure();await exhaustion();
console.log(JSON.stringify({ok:true,proofs,root,evidence,installation,runtime}));
