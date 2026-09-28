import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {createCodec,contentRef,SDKError,CorrelationError} from '@kujolang/participant-sdk';
const corpus=JSON.parse(fs.readFileSync(new URL('../onboarding/typescript/sdk-conformance.json',import.meta.url)));
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const results=[];
for(const test of corpus.cases){let actual;try{
 const registration=structuredClone(corpus.registration);const c=createCodec(registration);const d=structuredClone(corpus.handoff);
 for(const [path,value]of Object.entries(test.change??{})){const parts=path.split('.');let at=d;for(const k of parts.slice(0,-1))at=at[k];at[parts.at(-1)]=value;}
 let wire=Buffer.from(canonical(d));
 switch(test.wire){
 case 'whitespace':wire=Buffer.from(' '+wire);break;
 case 'reordered':wire=Buffer.from(JSON.stringify(d));break;
 case 'duplicate':wire=Buffer.from('{"schema":"kujo.interop-handoff/v1alpha1",'+wire.toString().slice(1));break;
 case 'alternate_escape':wire=Buffer.from(wire.toString().replace('run-1','\\u0072un-1'));break;
 case 'invalid_utf8':wire=Buffer.from([0xff]);break;
 case 'oversize':wire=Buffer.alloc(6145,32);break;
 case 'surrogate':wire=Buffer.from(wire.toString().replace('run-1','\\ud800'));break;
 }
 switch(test.op){
 case 'parse':c.parseHandoff(wire);break;
 case 'provisional':c.provisional(d);break;
 case 'terminal_report':c.terminalReport(d);break;
 case 'finalize_after_readback':assert.deepEqual(c.parseHandoff(c.finalizeAfterReadback(d)),d);break;
 case 'match':assert.equal(c.matchExpected(wire,corpus.handoff),true);actual='match';break;
 case 'registration_copy':registration.participant.fields.call_id='nonsense';registration.namespace='mutated';c.parseHandoff(wire);break;
 case 'bad_registration':registration.participant.fields.call_id='nonsense';createCodec(registration);break;
 case 'null_registration':registration.participant=null;createCodec(registration);break;
 case 'no_effect_registration':registration.effect=null;createCodec(registration).parseHandoff(wire);break;
 case 'reference':assert.equal(contentRef(wire),'sha256:'+crypto.createHash('sha256').update(wire).digest('hex'));break;
 case 'reference_string':contentRef(wire.toString());break;
 default:throw Error('unimplemented operation');
 }
 actual??='ok';
 }catch(e){actual=e instanceof SDKError||e instanceof CorrelationError?e.code:'runner_error';}
 results.push({name:test.name,operation:test.op,expected:test.expected,actual,pass:actual===test.expected});
}
console.log(JSON.stringify({total:results.length,passed:results.filter(x=>x.pass).length,results},null,2));if(results.some(x=>!x.pass))process.exitCode=1;
