// Independent maintenance checker: imports only platform libraries, no ecosystem code.
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
export function canonical(x,depth=0){
 assert.ok(depth<=8);
 if(typeof x==='string'){for(const c of x){const n=c.codePointAt(0);assert.ok(n<0xd800||n>0xdfff);}return JSON.stringify(x);}
 if(x===null||typeof x==='boolean')return JSON.stringify(x);
 if(typeof x==='number'){assert.ok(Number.isSafeInteger(x)&&!Object.is(x,-0));return String(x);}
 if(Array.isArray(x)){assert.ok(x.length<=64);return '['+x.map(v=>canonical(v,depth+1)).join(',')+']';}
 assert.equal(typeof x,'object');const keys=Object.keys(x).sort();assert.ok(keys.length<=64);
 return '{'+keys.map(k=>{assert.match(k,/^[A-Za-z0-9_.:-]{1,128}$/);return JSON.stringify(k)+':'+canonical(x[k],depth+1);}).join(',')+'}';
}
let count=0;
for(const path of process.argv.slice(2)){
 const bytes=fs.readFileSync(path);assert.ok(bytes.length<=1048576);const suite=JSON.parse(bytes);
 assert.equal(suite.schema,'dispatch.commitment-vectors/v1');assert.equal(suite.algorithm,'sha256');assert.equal(suite.encoding,'utf-8');assert.equal(suite.output,'lowercase-hex-unprefixed');assert.ok(suite.vectors.length<=128);
 const hashes=new Map();for(const v of suite.vectors){assert.ok(['exact_utf8','alpha_json','portable_json','ability_v1_json','ability_v2_json'].includes(v.recipe));
 const raw=v.recipe==='exact_utf8'?v.input:canonical(v.input);assert.equal(typeof raw,'string');canonical(raw);assert.ok(Buffer.byteLength(raw)<=8192);assert.equal(raw,v.preimage_utf8);assert.equal(Buffer.from(raw).toString('hex'),v.preimage_hex);
 const hash=crypto.createHash('sha256').update(raw,'utf8').digest('hex');assert.match(v.sha256,/^[0-9a-f]{64}$/);assert.equal(hash,v.sha256,v.name);assert.ok(!hashes.has(v.name));hashes.set(v.name,hash);count++;}
 for(const [a,b] of suite.distinct){assert.ok(hashes.has(a)&&hashes.has(b));assert.notEqual(hashes.get(a),hashes.get(b));}
}
if(process.argv.length>2)console.log(JSON.stringify({checker:'independent-node',vectors:count,ok:true}));
