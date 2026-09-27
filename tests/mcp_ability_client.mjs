// Operator client fixture: real newline-delimited STDIO, no automatic replay.
import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import {createInterface} from 'node:readline';import assert from 'node:assert/strict';
const [root,attempt,mode='run']=process.argv.slice(2),config=JSON.parse(fs.readFileSync(path.join(root,'config.json'))),inv=JSON.parse(fs.readFileSync(path.join(root,'invocation.json')));
if(mode==='attach'){
 // Artifact paths are digest-only and checked through Kujo's confined reader.
 process.exitCode=2;throw Error('attach is owned by the controller fixture');
}
const child=spawn(process.execPath,['examples/controlled-ability/server.mjs',root,attempt,mode],{cwd:config.mcp_root,env:{ABILITY_GATEWAY_SESSION:process.env.ABILITY_GATEWAY_SESSION||''},stdio:['pipe','pipe','pipe']});
let stderr='',closed=false;const pending=new Map();
child.stderr.on('data',d=>{stderr+=d;if(stderr.length>8192)child.kill();});
const lines=createInterface({input:child.stdout});lines.on('line',line=>{assert(Buffer.byteLength(line)<=16384);const v=JSON.parse(line),p=pending.get(v.id);if(p){pending.delete(v.id);p(v);}});
child.on('exit',()=>{closed=true;for(const p of pending.values())p(null);pending.clear();});
function rpc(id,method,params={}){return new Promise(resolve=>{if(closed)return resolve(null);pending.set(id,resolve);child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');});}
const timer=setTimeout(()=>child.kill('SIGKILL'),60000);
try{
 assert((await rpc('initialize','initialize',{protocolVersion:'2025-11-25'})).result.serverInfo.name==='kujo-ability');
 const listed=await rpc('catalog','tools/list');assert(listed.result.tools.some(t=>t.name==='publish'));
 let input=inv.input,name='publish',id='rpc-call-'+attempt;
 if(mode==='standalone'){input={...input,_kujo:{invocationId:inv.invocation_id,idempotencyKey:inv.idempotency_key}};id='standalone-call';}
 if(mode.startsWith('inject:'))input={...input,[mode.slice(7)]:'producer-assertion'};
 if(mode==='wrong-tool')name='other';
 if(mode==='wrong-rpc')id='other-rpc';
 if(mode==='run'){
  for(const field of ['_kujo','dispatch_run_id','dispatch_step_id','dispatch_attempt_id','dispatch_effect_id','assurance_profile','config_revision','verifier_id','principal','evidence_root','evidence_path','assurance_ref','authorize_replay']){
   const denied=await rpc(id,'tools/call',{name,arguments:{...input,[field]:'https://untrusted.invalid/secret'}});assert.equal(denied.result.structuredContent.outcome,'not_admitted');
  }
  const wrongTool=await rpc(id,'tools/call',{name:'other',arguments:input});assert.equal(wrongTool.result.structuredContent.outcome,'not_admitted');
  const wrongId=await rpc('substituted','tools/call',{name,arguments:input});assert.equal(wrongId.result.structuredContent.outcome,'not_admitted');
 }
 const response=await rpc(id,'tools/call',{name,arguments:input});
 if(response){assert(!JSON.stringify(response).includes('PRIVATE_GATEWAY_EXCEPTION'));fs.writeFileSync(path.join(root,'mcp-response-'+attempt+'-'+mode.replaceAll(':','-')+'.json'),JSON.stringify(response),{mode:0o600});console.log(JSON.stringify({ok:true,transport:'response',outcome:response.result?.structuredContent?.outcome??'standalone',isError:!!response.result?.isError}));}
 else {console.log(JSON.stringify({ok:true,transport:'stdio_lost',outcome:'completion_uncertain'}));}
 assert.equal(stderr,'');
}finally{clearTimeout(timer);child.stdin.end();if(!closed)child.kill('SIGTERM');}
