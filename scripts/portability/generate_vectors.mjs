// Repository maintenance only. Frozen outputs are independently checked in Kujo,
// Node and Python; this generator is not a runtime adapter or verifier.
import fs from 'node:fs';import crypto from 'node:crypto';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const enc=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(enc).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+enc(x[k])).join(',')+'}';
function suite(){return {schema:'dispatch.commitment-vectors/v1',algorithm:'sha256',encoding:'utf-8',output:'lowercase-hex-unprefixed',vectors:[],distinct:[]};}
function add(s,name,recipe,value,purpose=name){let raw=recipe==='exact_utf8'?value:enc(value);s.vectors.push({name,recipe,purpose,input:structuredClone(value),preimage_utf8:raw,preimage_hex:Buffer.from(raw).toString('hex'),sha256:sha(raw)});return sha(raw);}
const generic=suite();
const result={schema:'kujo.execution-result/v1',result_id:'result-1',subject:{run_id:'run-1',step_id:'action',attempt_id:'1'},producer:{name:'portable-example',version:'1'},status:'indeterminate',classification:'unknown',started_at:'2026-09-27T00:00:00Z',finished_at:'2026-09-27T00:00:00Z',attempt:1,effects:[{effect_id:'effect-1',class:'external_idempotent',state:'unknown',idempotency_key:'request-key',enforced_by:'local-authority',enforcement_evidence_ref:'sha256:'+sha('observed-evidence')}],evidence:[]};
add(generic,'result','exact_utf8',enc(result),'Exact authoritative execution-result/v1 example bytes');
add(generic,'result-whitespace','exact_utf8',enc(result)+'\n');
add(generic,'result-order','exact_utf8',JSON.stringify(result));
add(generic,'result-attempt','exact_utf8',enc({...result,attempt:2,subject:{...result.subject,attempt_id:'2'}}));
generic.distinct.push(['result','result-whitespace'],['result','result-order'],['result','result-attempt']);
for(const [name,value] of Object.entries({target:'publications',scope:'tenant-1:production',key:'request-key',request:'Hello é😀\n',precondition:'empty',empty:'',maximum_id:'a'.repeat(128),unicode:'é e\u0301 😀 \u2028',nullable:{a:null,b:'',c:[],d:{}}}))add(generic,name,typeof value==='string'?'exact_utf8':'portable_json',value);
add(generic,'target-changed','exact_utf8','other-publications');add(generic,'input-changed','exact_utf8','Hello changed');generic.distinct.push(['target','target-changed'],['request','input-changed']);
for(const version of ['alpha1','beta1']){
 const recipe=version==='alpha1'?'alpha_json':'portable_json';
 const descriptor={schema:'dispatch.assurance-configuration/v1'+version,mode:'required',fallback:'deny',profile:'dispatch.sqlite-unique',profile_version:'1'+version,issuer:'sqlite-local',mechanism:'sqlite_unique_transaction',verifier_id:'installed-local',verifier_version:'1',verifier_sha256:sha(enc([sha('verifier-source\n')])),authority_sha256:sha('operator-authority')};
 const revision=add(generic,'configuration-'+version,recipe,descriptor);
 add(generic,'policy-'+version,recipe,{schema:'dispatch.assurance-negotiation/v1'+version,mode:'required',fallback:'deny',profile:descriptor.profile,profile_version:descriptor.profile_version,config_revision:revision});
}
add(generic,'implementation','alpha_json',[sha('verifier-source\n')]);
function sink(family){const s=suite();const intent={operation:family==='sqlite'?'create':'update',target_sha256:sha('logical-target'),scope_sha256:sha('tenant:environment'),key_sha256:sha('idempotency-key'),request_sha256:sha(family==='sqlite'?'business-input':'2'.repeat(40)),precondition_sha256:sha(family==='sqlite'?'empty':'1'.repeat(40)),valid_from:1790467200,valid_until:1790470800};
 for(const [k,v] of Object.entries({target:'logical-target',scope:'tenant:environment',key:'idempotency-key',request:family==='sqlite'?'business-input':'2'.repeat(40),precondition:family==='sqlite'?'empty':'1'.repeat(40)}))add(s,k,'exact_utf8',v);
 const tx=add(s,'transaction','alpha_json',intent);
 add(s,'transaction-changed','alpha_json',{...intent,request_sha256:sha('different')});s.distinct.push(['transaction','transaction-changed']);
 const mechanism=family==='sqlite'?'sqlite_unique_transaction':'git_ref_cas_transaction';
 for(const state of ['not_started','committed'])add(s,'evidence-'+state,'alpha_json',[mechanism,tx,state]);
 const bindings={...Object.fromEntries(Object.entries(intent).filter(([k])=>!k.startsWith('valid_'))),transaction_sha256:tx,reported_state:'unknown',replay_class:'external_idempotent',observed_state:'committed'};
 add(s,'beta-profile','portable_json',bindings);
 return s;}
const ability=suite(),principal={type:'user',id:'user-1',tenant_id:'tenant-1',claims:{}},input={body:'Hello é😀\n'};
const def={schema:'kujo.ability/v1',id:'kujo.fixture.publication.create',version:'1.0.0',description:'Publish one application record.',input_schema:{type:'object',required:['body'],properties:{body:{type:'string',maxLength:1024}},additionalProperties:false},output_schema:{type:'object',required:['transaction'],properties:{transaction:{type:'string'}},additionalProperties:false},effects:[{kind:'write',resource:'kujo.application.publications'}],idempotency:{mode:'keyed'}};
const definition=add(ability,'definition','ability_v1_json',def);
const keyObject={tenant_id:principal.tenant_id,principal_type:principal.type,principal_id:principal.id,idempotency_key:'application-key'};
const key=add(ability,'key','ability_v1_json',keyObject);add(ability,'key-other-tenant','ability_v1_json',{...keyObject,tenant_id:'tenant-2'});ability.distinct.push(['key','key-other-tenant']);
const requestObject={ability_id:def.id,ability_version:def.version,definition_digest:definition,input,principal};
const request=add(ability,'request','ability_v1_json',requestObject);add(ability,'request-changed-input','ability_v1_json',{...requestObject,input:{body:'changed'}});ability.distinct.push(['request','request-changed-input']);
const profile={schema:'ability.application-assurance/v1alpha1',ability_id:def.id,ability_version:def.version,definition_digest:definition,surface:'sdk',principal_sha256:add(ability,'principal','ability_v2_json',principal),tenant_sha256:add(ability,'tenant','exact_utf8',principal.tenant_id),key_digest:key,request_digest:request,input_sha256:add(ability,'input','exact_utf8',input.body),intent_sha256:add(ability,'intent','ability_v2_json',{input,principal}),target_sha256:add(ability,'target','exact_utf8','kujo.application.publications'),operation:'create'};
profile.transaction_sha256=add(ability,'transaction','ability_v2_json',profile);
const profileHash=add(ability,'profile','ability_v2_json',profile);
add(ability,'profile-other-transaction','ability_v2_json',{...profile,transaction_sha256:sha('other')});ability.distinct.push(['profile','profile-other-transaction']);
const scope=profile.principal_sha256;add(ability,'scope','ability_v2_json',principal);
const keyHash=add(ability,'envelope-key','exact_utf8',key);
add(ability,'precondition','alpha_json',profile);
add(ability,'evidence-null-receipt','ability_v2_json',{profile,business_state:'committed',receipt_sha256:null,verification:'authenticated_sqlite_readback'});
add(ability,'beta-profile','portable_json',{operation:'create',target_sha256:profile.target_sha256,scope_sha256:scope,key_sha256:keyHash,request_sha256:request,precondition_sha256:profileHash,transaction_sha256:profile.transaction_sha256,reported_state:'unknown',replay_class:'external_idempotent',observed_state:'committed'});
for(const [path,data] of [['tests/vectors/commitments.json',generic],['tests/vectors/sqlite-commitments.json',sink('sqlite')],['../workcell/tests/vectors/git-assurance-commitments.json',sink('git')],['../ability/tests/vectors/application-assurance-commitments.json',ability]])fs.writeFileSync(path,JSON.stringify(data,null,2)+'\n');
