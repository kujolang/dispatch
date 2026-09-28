import {createCodec,contentRef,CorrelationError} from '../dist/sdk.js';
import {encode} from '../dist/codec.js';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const corpus=JSON.parse(readFileSync(new URL('../assets/sdk-conformance.json',import.meta.url)));
const results=[];
for(const c of corpus.cases){
 let result;
 try{
  const registration=structuredClone(corpus.registration);
  if(c.op==='bad_registration')registration.participant.fields.call_id='arbitrary';
  if(c.op==='null_registration')registration.participant=null;
  if(c.op==='no_effect_registration')registration.effect=null;
  const sdk=createCodec(registration),d=structuredClone(corpus.handoff);
  if(c.op==='registration_copy')registration.participant.fields.call_id='arbitrary';
  for(const [key,v] of Object.entries(c.change??{})){const keys=key.split('.');let x=d;for(const k of keys.slice(0,-1))x=x[k];x[keys.at(-1)]=v;}
  let text=encode(d),wire=Buffer.from(text);
  if(c.wire==='whitespace')wire=Buffer.from(text+'\n');
  if(c.wire==='reordered')wire=Buffer.from(JSON.stringify(d));
  if(c.wire==='duplicate')wire=Buffer.from('{"schema":"kujo.interop-handoff/v1alpha1",'+text.slice(1));
  if(c.wire==='alternate_escape')wire=Buffer.from(text.replace('run-1','run\\u002d1'));
  if(c.wire==='invalid_utf8')wire=Buffer.from([255]);
  if(c.wire==='oversize')wire=Buffer.alloc(6145,32);
  if(c.wire==='surrogate')wire=Buffer.from(text.replace('run-1','\\ud800'));
  if(c.op==='match'){assert.equal(sdk.matchExpected(wire,corpus.handoff),true);result={code:'match'};}
  else if(c.op==='reference_string'){contentRef(text);throw Error('accepted string');}
  else if(c.op==='reference')result={code:'ok',ref:contentRef(Buffer.from([0,255,10]))};
  else{
   const bytes=c.op==='provisional'?sdk.provisional(d):c.op==='terminal_report'?sdk.terminalReport(d):c.op==='finalize_after_readback'?sdk.finalizeAfterReadback(d):sdk.encodeHandoff(sdk.parseHandoff(wire));
   result={code:'ok',hex:Buffer.from(bytes).toString('hex'),ref:contentRef(bytes),value:sdk.parseHandoff(bytes)};
  }
 }catch(e){if(c.op==='match')assert(e instanceof CorrelationError);result={code:e.code??'unexpected'};}
 assert.equal(result.code,c.expected,c.name);
 results.push({name:c.name,...result});
}
console.log(JSON.stringify({schema:corpus.schema,cases:results}));
