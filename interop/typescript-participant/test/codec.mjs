import {test} from 'node:test';import assert from 'node:assert/strict';import {encode,parse,match,request,closed,NS,EXT,GIT,ref} from '../dist/codec.js';
const doc={schema:'kujo.interop-handoff/v1alpha1',subject:{run_id:'run-1',step_id:'action',attempt_id:'1',effect_id:'effect-1'},participant:{namespace:NS,invocation_id:'invocation-1'},completion_knowledge:'unknown',execution_result_ref:ref('result'),assurance_ref:ref('assurance'),participant_extension:{schema:EXT,values:{call_id:'call-1',process_instance_id:'process-1'}},effect_extension:{schema:GIT,values:{workcell_effect_id:'logical-1',transaction_sha256:'a'.repeat(64)}}};
test('native generic shape and deterministic independent codec',()=>{assert.deepEqual(parse(encode(doc)),doc);assert.equal(encode({z:'é\n',a:null}),'{"a":null,"z":"é\\n"}');assert.equal(encode({b:2,a:1}),'{"a":1,"b":2}');for(const x of [NaN,1.5,-0,'\ud800',undefined])assert.throws(()=>encode(x));});
const attacks=[];
for(const field of ['run_id','step_id','attempt_id','effect_id'])attacks.push([field,d=>d.subject[field]='other']);
for(const field of ['execution_result_ref','assurance_ref'])attacks.push([field,d=>d[field]=ref('substitute')]);
attacks.push(['swapped refs',d=>[d.execution_result_ref,d.assurance_ref]=[d.assurance_ref,d.execution_result_ref]]);
for(const value of ['../../secret','https://example.invalid','sha256:ZZ'])attacks.push(['malformed ref '+value,d=>d.assurance_ref=value]);
for(const field of ['namespace','invocation_id'])attacks.push([field,d=>d.participant[field]='other']);
for(const value of ['x'.repeat(129),'id\n'])attacks.push(['bad identifier',d=>d.participant.invocation_id=value]);
attacks.push(['missing extension',d=>delete d.participant_extension],['unknown extension',d=>d.participant_extension.schema='unknown/v1'],['duplicate extensions',d=>d.extensions=[d.participant_extension,d.participant_extension]],['nested value',d=>d.participant_extension.values.call_id={private:'canary'}],['oversize',d=>d.participant_extension.values.call_id='x'.repeat(2049)],['reported is not commit',d=>d.completion_knowledge='committed'],['knowledge mismatch',d=>d.completion_knowledge='reported']);
for(const [name,change] of attacks)test('deny '+name,()=>{const d=structuredClone(doc);change(d);assert.throws(()=>match(encode(d),doc));});
test('wire canonical identity rejects whitespace/reordering/duplicates/invalid UTF8',()=>{const wire=encode(doc);for(const raw of [' '+wire,JSON.stringify(doc),'{"schema":"kujo.interop-handoff/v1alpha1",'+wire.slice(1),Buffer.from([0xff]),'{'])assert.throws(()=>parse(raw));});
for(const field of ['profile','repo','config_revision','dispatch_run_id','dispatch_step_id','dispatch_attempt_id','dispatch_effect_id','assurance_ref','trusted_root','verifier','principal'])test('untrusted '+field,()=>assert.throws(()=>request({call_id:'call-1',[field]:'PRIVATE_INPUT_CANARY'})));
test('standalone requires host, no fabricated authority',()=>{assert.deepEqual(request({call_id:'call-1'}),{call_id:'call-1'});assert.throws(()=>request({call_id:'x\n'}));});

for(const field of ["call_id","process_instance_id"])test("extension identifier cannot contain newline "+field,()=>{const d=structuredClone(doc);d.participant_extension.values[field]="id\n";assert.throws(()=>parse(encode(d)));});
test("null effect extension is supported without fake effect facts",()=>{const d=structuredClone(doc);d.effect_extension=null;d.assurance_ref=null;assert.deepEqual(parse(encode(d)),d);});

test("closed shape rejects joined-key collisions and inherited members",()=>{assert.throws(()=>closed({"a|b":1},["a","b"]));assert.throws(()=>closed(Object.create({a:1}),["a"]));closed({b:2,a:1},["a","b"]);});

test("codec errors never echo malformed private input",()=>{for(const raw of ["PRIVATE_INPUT_CANARY",Buffer.from([0xff])])assert.throws(()=>parse(raw),{message:"interop_invalid"});});
