// Clean-room offline structural/commitment checker. NO live trust/admission claim.
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const sha=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
function validate(s,x){
 if('const'in s)assert.deepEqual(x,s.const);if(s.enum)assert.ok(s.enum.includes(x));
 if(s.type){const t=Array.isArray(x)?'array':x===null?'null':typeof x;assert.ok(s.type==='integer'?Number.isSafeInteger(x):t===s.type);}
 if(typeof x==='string'){if(s.pattern){const match=x.match(new RegExp(s.pattern));assert.ok(match&&match[0]===x);}if(s.maxLength!==undefined)assert.ok([...x].length<=s.maxLength);if(s.minLength!==undefined)assert.ok([...x].length>=s.minLength);}
 if(typeof x==='number'){if(s.minimum!==undefined)assert.ok(x>=s.minimum);if(s.maximum!==undefined)assert.ok(x<=s.maximum);}
 if(x&&typeof x==='object'&&!Array.isArray(x)){if(s.maxProperties!==undefined)assert.ok(Object.keys(x).length<=s.maxProperties);for(const k of s.required||[])assert.ok(Object.hasOwn(x,k));if(s.additionalProperties===false)for(const k of Object.keys(x))assert.ok(Object.hasOwn(s.properties,k));for(const [k,v]of Object.entries(s.properties||{}))if(Object.hasOwn(x,k))validate(v,x[k]);}
 for(const clause of s.allOf||[])validate(clause,x);
 if(s.if){let yes=true;try{validate(s.if,x)}catch{yes=false}if(yes&&s.then)validate(s.then,x);if(!yes&&s.else)validate(s.else,x);}
}
const root=process.argv[2];const artifacts=JSON.parse(fs.readFileSync(root+'/artifacts.json'));let checks=0;
for(const item of artifacts){const doc=JSON.parse(item.assurance_raw),result=JSON.parse(item.result_raw),beta=doc.schema==='dispatch.effect-assurance/v1beta1';
 assert.ok(Buffer.byteLength(item.assurance_raw)<=8192);assert.ok(Buffer.byteLength(item.result_raw)<=1048576);
 const schema=JSON.parse(fs.readFileSync(root+'/effect-assurance-v1'+(beta?'beta1':'alpha1')+'.schema.json'));validate(schema,doc);
 const subject=beta?doc.subject:doc;assert.equal(subject.result_sha256,sha(item.result_raw));
 for(const k of ['run_id','step_id','attempt_id'])assert.equal(subject[k],result.subject[k]);assert.equal(subject.attempt_id,String(result.attempt));
 assert.equal(result.effects.length,1);const effect=result.effects[0];assert.equal(effect.effect_id,subject.effect_id);
 const bindings=beta?doc.bindings:doc;if(beta){assert.ok(['dispatch.sqlite-unique','workcell.git-cas','ability.application-gateway'].includes(doc.profile.id));validate(JSON.parse(fs.readFileSync(root+'/'+doc.profile.id+'.schema.json')),bindings);}assert.equal(bindings.replay_class,effect.class);assert.equal(bindings.reported_state,effect.state);assert.equal(effect.class,'external_idempotent');assert.equal(bindings.key_sha256,sha(effect.idempotency_key));assert.equal(doc.issuer,effect.enforced_by);assert.equal(doc.evidence_ref,effect.enforcement_evidence_ref);
 const from=beta?doc.validity.from:doc.valid_from,until=beta?doc.validity.until:doc.valid_until;assert.ok(until>from&&until-from<=3600);
 if(beta){assert.equal(canonical(doc),item.assurance_raw);assert.equal(doc.profile_sha256,sha(canonical(bindings)));assert.equal(doc.profile.id,item.profile);assert.equal(doc.profile.version,'1beta1');}
 assert.notEqual(subject.result_sha256,sha(item.result_raw+'\n'));
 // Closed schemas and exact distinct versions, not heuristic version parsing.
 for(const field of ['unexpected','schema']){const bad=structuredClone(doc);bad[field]='unknown';assert.throws(()=>validate(schema,bad));}
 checks++;
}
console.log(JSON.stringify({checker:'independent-artifacts',artifacts:checks,structure_and_commitments:true,live_authority:false}));
