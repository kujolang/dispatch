// Release transport fixture only; no remote credentials or provider certification.
import http from 'node:http';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import path from 'node:path';
const root=process.cwd();
const runtime=process.env.KUJO_BIN || 'kujo';
const sdk=path.resolve(process.env.AI_SDK_PATH || '../ai-sdk');
const requests=[];
const server=http.createServer((req,res)=>{let body='';req.on('data',b=>{body+=b;if(body.length>65536)req.destroy();});req.on('end',()=>{const x=JSON.parse(body);requests.push({method:req.method,path:req.url,model:x.model});res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({id:'local-release-probe',object:'chat.completion',created:1,model:'local-release-probe',choices:[{index:0,message:{role:'assistant',content:'Dispatch local proxy transport verified.'},finish_reason:'stop'}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}}));});});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const endpoint=`http://127.0.0.1:${server.address().port}/v1`;
const payload={provider_id:'custom',base_url:endpoint,api_key_env:'CUSTOM_API_KEY',model:'local-release-probe',messages:[{role:'user',content:'Release transport probe'}]};
try {
 const child=spawn(runtime,['run',path.join(root,'tests/fixtures/local_proxy_probe.kujo'),'--interpreter'],{cwd:root,env:{KUJO_BIN:runtime,AI_SDK_PATH:sdk,PATH:process.env.PATH,HOME:process.env.HOME,DISPATCH_ALLOWED_CUSTOM_PROVIDER_ORIGINS:endpoint,DISPATCH_ALLOW_INSECURE_LOCAL_CUSTOM_PROVIDER:'true',KUJO_AI_SDK_ALLOW_INSECURE_LOCALHOST:'true',KUJO_ALLOW_PRIVATE_NETWORK_DESTINATIONS:'1',CUSTOM_API_KEY:'local-fixture-only',DISPATCH_BRIDGE_PAYLOAD:JSON.stringify(payload)}});
 let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);
 const code=await new Promise(r=>child.on('close',r));assert.equal(code,0,err+out);const result=JSON.parse(out);assert.equal(result.ok,true,JSON.stringify(result));assert.equal(requests.length,1);assert.equal(requests[0].path,'/v1/chat/completions');console.log(JSON.stringify({status:'passed',route:'operator-approved localhost SDK/bridge HTTP route',model:payload.model,requests,remote_provider_certification:false}));
}finally{server.close();}
