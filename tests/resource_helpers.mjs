export * from './static_policy_helpers.mjs';
import {run,actor,assert,state} from './static_policy_helpers.mjs';
export const resourceOptions=(p,evals=4,required=false)=>({graph_policy:p,graph_accounting:'dispatch.graph-attempt-accounting/v1alpha1',graph_resources:{schema:'dispatch.graph-resources/v1alpha1',max_eval_attempts:evals,require_provider_usage:required}});
export const rop=(d,action,fields={},operation='assess',extra={})=>run(d,'resource-op','graph',{operation,action,...fields},extra);
export function rapply(d,action,fields={},extra={}) {const a=rop(d,action,fields);assert.equal(a.ok,true,JSON.stringify(a));const r=rop(d,action,{...fields,candidate:a.candidate,actor},'apply',extra);assert.equal(r.ok,true,JSON.stringify(r));return r}
export const report=d=>rop(d,'report',{},'report');
export const evalRow=(d,id)=>state(d).eval_attempts[id].at(-1);
export const subject=(d,id,kind='eval')=>({kind,node_id:id,attempt_id:kind==='eval'?evalRow(d,id).attempt_id:state(d,id).run_id});
export function sealEval(d,id){const a=run(d,'graph-op','graph',{operation:'node-assess',node_id:id});assert.equal(a.ok,true,JSON.stringify(a));const r=run(d,'graph-op','graph',{operation:'node-finalize',node_id:id,candidate:a.candidate});assert.equal(r.ok,true,JSON.stringify(r));return r}

import {fs,join,spawn,kujo,env,fixture,write} from './static_policy_helpers.mjs';
let serial=0;
export async function fresh(d,request,extra={},marker=null){const path=join(d,'resource-fresh-'+serial+++'.json');write(path,request);return await new Promise((done,reject)=>{const p=spawn(kujo,['run',fixture,d,'resource-op','graph',path],{env:{...env,...extra}});let out='',err='';const timer=setTimeout(()=>p.kill('SIGKILL'),180000);p.stdout.on('data',b=>{out+=b;if(marker&&out.includes(marker))p.kill('SIGKILL')});p.stderr.on('data',b=>err+=b);p.on('close',(code,signal)=>{clearTimeout(timer);try{assert.equal(err,'');if(marker){assert.ok(out.includes(marker),out);assert.equal(signal,'SIGKILL');done(null)}else{assert.equal(code,0,out);done(JSON.parse(out))}}catch(e){reject(e)}})})}
export function request(d,action,fields={}){const a=rop(d,action,fields);assert.equal(a.ok,true,JSON.stringify(a));return {operation:'apply',action,...fields,candidate:a.candidate,actor}}
