// Operator-installed local host, NOT participant/library code. No legacy participant imports.
import fs from 'node:fs';import path from 'node:path';import {fork,spawnSync} from 'node:child_process';import {randomUUID} from 'node:crypto';
import {encode,parse,match,ref,hash,id,closed,NS,EXT,GIT} from '../dist/codec.js';
const root=process.argv[2], attempt=process.argv[3], mode=process.argv[4]||'run';
const fail=()=>{throw Error('host_denied');};
process.on('uncaughtException',()=>{process.stdout.write('{"ok":false,"code":"host_unavailable"}\n');process.exit(1);});
if(!root||!fs.lstatSync(root).isDirectory()||fs.lstatSync(root).isSymbolicLink()||!/^([1-9][0-9]*)$/.test(attempt))fail();
function location(name){if(!/^(?:[A-Za-z0-9_.-]+|artifacts\/[0-9a-f]{64}\.json)$/.test(name)||name==='..')fail();return path.join(root,name);}
function read(name,limit=8192){const fd=fs.openSync(location(name),fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{if(!fs.fstatSync(fd).isFile())fail();const b=Buffer.alloc(limit+1),n=fs.readSync(fd,b,0,b.length,0);if(n>limit)fail();return new TextDecoder('utf-8',{fatal:true}).decode(b.subarray(0,n));}finally{fs.closeSync(fd);}}
function write(name,bytes,replace=false){const dest=location(name),file=replace?dest+'.'+randomUUID():dest;let fd;try{fd=fs.openSync(file,'wx',0o600);}catch(e){if(!replace&&e.code==='EEXIST'&&read(name,1048576)===bytes)return;throw e;}try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}if(replace)fs.renameSync(file,dest);const dir=fs.openSync(path.dirname(dest),'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}}
function artifact(bytes){const r=ref(bytes);write('artifacts/'+r.slice(7)+'.json',bytes);return r;}
if(fs.lstatSync(location('artifacts')).isSymbolicLink())fail();
const cfg=JSON.parse(read('config.json')), ticket=JSON.parse(read('ts-ticket-'+attempt+'.json'));
const effect={schema:GIT,values:{workcell_effect_id:'workcell-logical-native-1',transaction_sha256:hash(encode(cfg.intent))}};
function invoke(mode='apply'){const r=spawnSync(cfg.runtime,['run','examples/effect-assurance/adapter.kujo',root,mode],{cwd:cfg.cwd,env:{PATH:'/usr/bin:/bin'},encoding:'utf8',timeout:15000,maxBuffer:8192});if(r.status!==0||r.stderr||!JSON.parse(r.stdout).ok)fail();return JSON.parse(r.stdout);}
function nativeRecord(context){const r=spawnSync(process.execPath,[cfg.package_record||new URL('../dist/record.js',import.meta.url).pathname],{env:{},input:encode(context),encoding:'utf8',timeout:5000,maxBuffer:6144});if(r.status!==0||r.stderr)fail();match(r.stdout,context);return r.stdout;}
// Attaching selected evidence publishes another native generic artifact; no historical rewrite.
if(mode==='attach'){
 const oldRef=read('ts-handoff-'+attempt+'.ref',128),raw=read('artifacts/'+oldRef.slice(7)+'.json',6144);if(ref(raw)!==oldRef)fail();
 const doc=parse(raw), assurance=read('ts-selected.json');doc.assurance_ref=artifact(assurance);
 write('ts-bound-handoff-'+attempt+'.ref',artifact(nativeRecord(doc)),true);
 console.log('{"ok":true}');process.exit(0);
}
const child=fork(cfg.package_worker||new URL('../dist/participant.js',import.meta.url),[],{env:{},execArgv:[],stdio:['pipe','pipe','pipe','ipc'],cwd:path.dirname(new URL(import.meta.url).pathname)});
let state='initial',context,result,recorded=false,output='',finished=false;
const timer=setTimeout(()=>child.kill('SIGKILL'),20000);
for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{output+=b;if(Buffer.byteLength(output)>1024)child.kill('SIGKILL');});
function create(knowledge,ids,evidence=null){const stamp=new Date().toISOString(),subject={run_id:ticket.subject.run_id,step_id:ticket.subject.step_id,attempt_id:attempt};
 result={schema:'kujo.execution-result/v1',result_id:subject.run_id+':'+attempt,subject,producer:{name:'external-typescript-host',version:'1'},status:knowledge==='reported'?'success':'indeterminate',classification:'unknown',started_at:stamp,finished_at:stamp,attempt:Number(attempt),effects:[{effect_id:ticket.subject.effect_id,class:'external_idempotent',state:'unknown',idempotency_key:'fixture-key',enforced_by:'git-local',enforcement_evidence_ref:evidence||ref('provisional-unobserved')}],evidence:[],preservation_outcome:ticket.preservation,participant_correlation:{...ids,completion_knowledge:knowledge}};
 const raw=encode(result);return {schema:'kujo.interop-handoff/v1alpha1',subject:ticket.subject,participant:{namespace:NS,invocation_id:ids.invocation_id},completion_knowledge:knowledge,execution_result_ref:artifact(raw),assurance_ref:null,participant_extension:{schema:EXT,values:{call_id:ids.call_id,process_instance_id:ids.process_instance_id}},effect_extension:effect};}
child.on('message',m=>{try{
 if(Buffer.byteLength(JSON.stringify(m))>8192)fail();closed(m,['n','op','data']);if(!Number.isSafeInteger(m.n)||m.n<1)fail();
 let data=null;
 if(m.op==='admit'&&state==='initial'){
  closed(m.data,['call_id','process_instance_id']);if(!id(m.data.process_instance_id)||m.data.call_id!==ticket.call_id||ticket.valid_until_ms<=Date.now()||JSON.parse(read('ts-current.json')).attempt!==attempt)fail();
  const claim=fs.openSync(location('ts-claim-'+attempt),'wx',0o600);fs.writeFileSync(claim,'claimed');fs.fsyncSync(claim);fs.closeSync(claim);
  const d=fs.openSync(root,'r');fs.fsyncSync(d);fs.closeSync(d);
  const ids={call_id:m.data.call_id,process_instance_id:m.data.process_instance_id,invocation_id:randomUUID()};
  write('ts-identities-'+attempt+'.json',encode(ids));context=create('unknown',ids);state='admitted';data=context;
 }else if(m.op==='record'&&(state==='admitted'||state==='executed')){
  if(typeof m.data!=='string')fail();match(m.data,context);const r=artifact(m.data);write('ts-handoff-'+attempt+'.ref',r,true);write('result-'+attempt+'.json',encode(result),true);if(state==='admitted')write('ts-prepared-'+attempt+'.ref',r);recorded=true;state=state==='admitted'?'prepared':'finished';
 }else if(m.op==='execute'&&state==='prepared'&&m.data===null){
  if(ticket.valid_until_ms<=Date.now()||JSON.parse(read('ts-current.json')).attempt!==attempt)fail();
  state='executing';if(attempt==='1'&&cfg.boundary==='before_commit'){child.kill('SIGKILL');return;}
  invoke();if(attempt==='1'&&cfg.boundary==='after_commit'){child.kill('SIGKILL');return;}
  context=create('reported',JSON.parse(read('ts-identities-'+attempt+'.json')),invoke('observe').observation.evidence_ref);state='executed';data=context;
 }else fail();
 child.send({n:m.n,ok:true,data});
 }catch{state='denied';child.send({n:m?.n,ok:false},()=>child.kill('SIGKILL'));}});
child.on('exit',(code,signal)=>{if(finished)return;finished=true;clearTimeout(timer);if(recorded)write('ts-termination-'+attempt+'.json',encode({exit_code:code,signal,phase:state}));if(recorded&&signal==='SIGKILL'&&state==='executing'){context=create('unknown',JSON.parse(read('ts-identities-'+attempt+'.json')),invoke('observe').observation.evidence_ref);const raw=nativeRecord(context);write('ts-handoff-'+attempt+'.ref',artifact(raw),true);write('result-'+attempt+'.json',encode(result),true);}
const ok=recorded&&(state==='finished'||signal==='SIGKILL'&&state==='executing');console.log(JSON.stringify({ok,completion_knowledge:state==='finished'?'reported':'unknown',terminated:signal==='SIGKILL'}));});
try {child.stdin.end(read('ts-request-'+attempt+'.json',512));}catch{child.stdin.end('{}');}
