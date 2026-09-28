import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {createCodec,contentRef} from '@kujolang/participant-sdk';
const registration=JSON.parse(fs.readFileSync(new URL('./registration.json',import.meta.url)));
const c=createCodec(registration);
const s={schema:'kujo.interop-handoff/v1alpha1',subject:{run_id:'proof-run',step_id:'proof-step',attempt_id:'1',effect_id:'proof-effect'},participant:{namespace:'pilot.lantern',invocation_id:'proof-invocation'},completion_knowledge:'unknown',execution_result_ref:contentRef(Buffer.from('standalone mock result')),assurance_ref:null,participant_extension:{schema:registration.participant.schema,values:{session_tag:'proof-session',exchange_tag:'proof-exchange'}},effect_extension:null};
const provisional=c.provisional(s);assert.deepEqual(c.parseHandoff(provisional),s);assert.equal(c.matchExpected(provisional,s),true);assert.equal(contentRef(provisional),'sha256:'+crypto.createHash('sha256').update(provisional).digest('hex'));
const terminal={...s,completion_knowledge:'reported'};c.terminalReport(terminal);
const final={...s,assurance_ref:contentRef(Buffer.from('standalone mock assurance'))};const finalized=c.finalizeAfterReadback(final);assert.equal(c.parseHandoff(finalized).completion_knowledge,'unknown');assert.notEqual(contentRef(finalized),contentRef(provisional));
fs.writeFileSync(new URL('./proof-snapshot.json',import.meta.url),JSON.stringify(s));console.log(JSON.stringify({pass:true,provisional_ref:contentRef(provisional),finalized_ref:contentRef(finalized),synthetic_inputs:'standalone only; host mode never invents IDs or references'}));
