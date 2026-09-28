// Experimental pure SDK facade. Independent TS codec; no host/effect capability.
import {assetsCheck,encode,parseRegistered,id,reference} from './_codec.js';
import {createHash} from 'node:crypto';
type Doc=Record<string,any>;
export const CONFORMANCE='kujo.participant-sdk-conformance/v1alpha1';
export type Field = 'identifier'|'sha256'|'reference'|'nullable_identifier';
export type Extension = {schema:string,fields:Record<string,Field>};
export type Registration = {namespace:string,participant:Extension,effect:Extension|null};
export class SDKError extends Error {constructor(public readonly code:string){super(code);}}
export class CorrelationError extends SDKError {}
const fail=(code:string):never=>{throw new SDKError(code);};
const exact=(x:any,keys:string[])=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const schemaID=(s:any)=>typeof s==='string'&&s.length<=128&&/^[A-Za-z0-9][A-Za-z0-9_.:-]*\/v[1-9][0-9]*(?:alpha|beta)?[0-9]*$/.test(s)&&!/[\r\n]/.test(s);
export function contentRef(bytes:Uint8Array):string {
 if(!(bytes instanceof Uint8Array))return fail('invalid_handoff');
 return 'sha256:'+createHash('sha256').update(bytes).digest('hex');
}
export function createCodec(registration:Registration){
 try{assetsCheck();}catch{return fail('sdk_assets_invalid');}
 let r:Registration;
 try {
  // Copy once. No mutable registry, dynamic loader or producer-selected validator.
  r=JSON.parse(encode(registration));
  if(!exact(r,['namespace','participant','effect'])||!id(r.namespace))throw Error();
  for(const x of [r.participant,r.effect]){
   if(x===null){if(x===r.participant)throw Error();continue;}
   if(!exact(x,['schema','fields'])||!schemaID(x.schema)||!x.fields||Array.isArray(x.fields)||typeof x.fields!=='object'||Object.keys(x.fields).length>16)throw Error();
   for(const [k,v] of Object.entries(x.fields))if(!id(k)||!['identifier','sha256','reference','nullable_identifier'].includes(v))throw Error();
  }
 }catch{return fail('invalid_registration');}
 const owner=(d:Doc)=>{
  if(d.participant.namespace!==r.namespace)return fail('unsupported_extension');
  for(const [ext,spec] of [[d.participant_extension,r.participant],[d.effect_extension,r.effect]] as [any,Extension|null][]){
   if(ext===null){if(spec===r.participant)return fail('unsupported_extension');continue;}
   if(spec===null||ext.schema!==spec.schema)return fail('unsupported_extension');
   if(!exact(ext.values,Object.keys(spec.fields)))return fail('invalid_handoff');
   for(const [key,kind] of Object.entries(spec.fields)){
    const v=ext.values[key];const ok=kind==='identifier'?id(v):kind==='nullable_identifier'?(v===null||id(v)):kind==='reference'?reference(v):typeof v==='string'&&/^[0-9a-f]{64}$/.test(v)&&v.length===64;
    if(!ok)return fail('invalid_handoff');
   }
  }
 };
 const parseHandoff=(bytes:Uint8Array):Doc=>{
  if(!(bytes instanceof Uint8Array))return fail('invalid_handoff');
  if(bytes.byteLength>6144)return fail('bounds_exceeded');
  try{return parseRegistered(Buffer.from(bytes),owner);}catch(e){if(e instanceof SDKError)throw e;return fail('invalid_handoff');}
 };
 const encodeHandoff=(doc:Doc):Uint8Array=>{
  try{const b=Buffer.from(encode(doc));parseHandoff(b);return b;}catch(e){if(e instanceof SDKError)throw e;return fail('invalid_handoff');}
 };
 const matchExpected=(bytes:Uint8Array,expected:Doc):true=>{
  const d=parseHandoff(bytes),e=parseHandoff(encodeHandoff(expected));
  for(const [field,code] of [['subject','subject_mismatch'],['participant','participant_mismatch'],['execution_result_ref','result_ref_mismatch'],['assurance_ref','assurance_ref_mismatch'],['participant_extension','extension_mismatch'],['effect_extension','extension_mismatch'],['completion_knowledge','knowledge_mismatch']])if(encode(d[field])!==encode(e[field]))throw new CorrelationError(code);
  return true;
 };
 const record=(doc:Doc,knowledge?:string):Uint8Array=>{
  const bytes=encodeHandoff(doc);if(knowledge!==undefined&&parseHandoff(bytes).completion_knowledge!==knowledge)return fail('invalid_knowledge');return bytes;
 };
 return Object.freeze({encodeHandoff,parseHandoff,matchExpected,
  provisional:(d:Doc)=>record(d,'unknown'),terminalReport:(d:Doc)=>record(d,'reported'),
  finalizeAfterReadback:(d:Doc)=>record(d)});
}
