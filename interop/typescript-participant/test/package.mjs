import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {encode,hash} from '../dist/codec.js';
const root=path.resolve(import.meta.dirname,'..');
test('published portable vectors independently reproduced',()=>{
 const corpus=JSON.parse(fs.readFileSync(root+'/assets/commitment-vectors.json'));
 for(const v of corpus.vectors){
  const raw=v.recipe==='exact_utf8'?v.input:encode(v.input);
  assert.equal(raw,v.preimage_utf8,v.name);assert.equal(Buffer.from(raw).toString('hex'),v.preimage_hex,v.name);assert.equal(hash(raw),v.sha256,v.name);
 }
});
test('packaged assets retain exact published hashes',()=>{
 const manifest=JSON.parse(fs.readFileSync(root+'/assets/manifest.json'));
 for(const [name,digest] of Object.entries(manifest))assert.equal(hash(fs.readFileSync(root+'/assets/'+name)),digest,name);
});
test('independent package runs away from all ecosystem checkouts and rejects schema substitution',()=>{
 const dest=fs.mkdtempSync(path.join(os.tmpdir(),'ts-interop-isolation-'));
 try{
  for(const name of ['dist','assets','package.json','package-lock.json','test'])fs.cpSync(root+'/'+name,dest+'/'+name,{recursive:true});
  // Only pinned generic npm libraries are shared; no ecosystem implementation source.
  fs.cpSync(root+'/node_modules',dest+'/node_modules',{recursive:true});
  const check=()=>spawnSync(process.execPath,['--input-type=module','-e',"import {encode} from './dist/codec.js';console.log(encode({b:null,a:'independent'}));"],{cwd:dest,env:{},encoding:'utf8',timeout:5000});
  assert.equal(check().stdout,'{"a":"independent","b":null}\n');assert.equal(check().status,0);
  const sdk=spawnSync(process.execPath,['test/sdk-conformance.mjs'],{cwd:dest,env:{},encoding:'utf8',timeout:5000});
  assert.equal(sdk.status,0,sdk.stderr);assert.equal(JSON.parse(sdk.stdout).cases.length,45);
  fs.appendFileSync(dest+'/assets/core.schema.json',' ');assert.notEqual(check().status,0);
 }finally{fs.rmSync(dest,{recursive:true,force:true});}
});
test('direct process without host cannot invent admission',()=>{
 const p=spawnSync(process.execPath,[root+'/dist/participant.js'],{env:{},input:'{"call_id":"standalone"}',encoding:'utf8',timeout:5000});
 assert.equal(p.status,1);assert.equal(p.stdout,'{"ok":false,"code":"participant_unavailable"}\n');assert.equal(p.stderr,'');
});
