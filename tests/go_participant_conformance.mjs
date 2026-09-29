import {spawnSync} from 'node:child_process';
import {readFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const binary=join(mkdtempSync(join(tmpdir(),'go-participant-')),'participant');
const build=spawnSync('go',['build','-o',binary,'.'],{cwd:'interop/go-participant',encoding:'utf8',env:{...process.env,GOTOOLCHAIN:'local',GOPROXY:'off'}});assert.equal(build.status,0,build.stderr);
const invoke=(mode,input)=>spawnSync(binary,[mode],{input,encoding:'utf8',timeout:10000,maxBuffer:128*1024});
const corpus=JSON.parse(readFileSync('interop/python-participant/assets/parity.json'));
let count=0;
for(const item of corpus.cases){const wire=item.wire.replaceAll('@RUNTIME@','go');if(item.mode!=='encode'){const p=invoke('parse',wire);assert.equal(p.status===0,item.parse_accept,item.name+' parse');count++}
 const input=item.mode==='encode'?wire:JSON.stringify({wire_hex:Buffer.from(wire).toString('hex'),expected:JSON.parse(JSON.stringify(corpus.expected).replaceAll('@RUNTIME@','go'))});
 const p=invoke(item.mode==='encode'?'encode':'match',input);assert.equal(p.status===0,item.accept,item.name);count++;
}
const paths=['tests/vectors/commitments.json','tests/vectors/sqlite-commitments.json',(process.env.WORKCELL_ROOT||'../workcell')+'/tests/vectors/git-assurance-commitments.json',(process.env.ABILITY_ROOT||'../ability')+'/tests/vectors/application-assurance-commitments.json','tests/vectors/effect-set.json','tests/vectors/effect-selection.json','tests/vectors/effect-lifecycle.json','tests/vectors/parent-finalization.json'];
const vectors=paths.flatMap(path=>JSON.parse(readFileSync(path)).vectors);
for(const v of vectors){assert.equal(invoke('hash',v.preimage_utf8).stdout,'sha256:'+v.sha256,v.name);if(v.recipe!=='exact_utf8')assert.equal(invoke('encode',JSON.stringify(v.input)).stdout,v.preimage_utf8,v.name);count++}
// The new concepts must agree with the existing independent TypeScript and Python codecs.
const {encode}=await import('../interop/typescript-participant/dist/codec.js');
for(const v of ['tests/vectors/effect-set.json','tests/vectors/effect-selection.json','tests/vectors/effect-lifecycle.json','tests/vectors/parent-finalization.json'].flatMap(p=>JSON.parse(readFileSync(p)).vectors)){assert.equal(encode(v.input),v.preimage_utf8);const py=spawnSync('interop/python-participant/.venv/bin/python',['-I','interop/python-participant/run.py','encode'],{input:JSON.stringify(v.input),encoding:'utf8'});assert.equal(py.status,0,py.stderr);assert.equal(py.stdout,v.preimage_utf8)}
const valid=corpus.cases.find(c=>c.name==='valid').wire.replaceAll('@RUNTIME@','go');
const messages=[{jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'proof',version:'1'}}},{jsonrpc:'2.0',method:'notifications/initialized'},{jsonrpc:'2.0',id:2,method:'tools/list'},{jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'record_handoff',arguments:{wire:valid}}},{jsonrpc:'2.0',id:4,method:'tools/call',params:{name:'record_handoff',arguments:{wire:valid+' '}}},{jsonrpc:'2.0',id:5,method:'execute',params:{}}];
const p=invoke('mcp',messages.map(m=>JSON.stringify(m)).join('\n')+'\n');assert.equal(p.status,0,p.stderr);const answers=p.stdout.trim().split('\n').map(JSON.parse);assert.equal(answers.length,5);assert.equal(answers[0].result.protocolVersion,'2024-11-05');assert.equal(answers[1].result.tools.length,1);assert.equal(answers[2].result.content[0].text,valid);assert.equal(answers[2].result.isError,false);assert.equal(answers[3].result.isError,true);assert.equal(answers[4].error.code,-32601);
for(const raw of [Buffer.from([0xff]),Buffer.from('{"x":"\\ud800"}'),Buffer.from('{"x":-0}'),Buffer.from('{"x":1,"x":1}'),Buffer.from('{"x":1.0}'),Buffer.from('{"x":9007199254740992}')])assert.notEqual(invoke('canonical',raw).status,0);
for(const raw of ['{"x":"\\ud800"}','{"x":1,"x":1}'])assert.notEqual(invoke('encode',raw).status,0);
const premature=invoke('mcp',JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list'})+'\n');assert.ok(JSON.parse(premature.stdout).error);
console.log(JSON.stringify({ok:true,checks:count,mcpChecks:5,malformedChecks:9,wireSHA256:createHash('sha256').update(valid).digest('hex'),independence:'Go standard library; CLI and MCP share one codec'}));
