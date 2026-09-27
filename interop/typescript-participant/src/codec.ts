import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {Ajv2020} from 'ajv/dist/2020.js';
export const NS = 'kujolang.typescript-process';
export const EXT = 'kujolang.typescript-process-correlation/v1alpha1';
export const GIT = 'workcell.git-correlation/v1alpha1';
export type Doc = Record<string, any>;
export function reject(): never {throw new Error('interop_invalid');}
export const hash = (raw: string|Buffer): string => createHash('sha256').update(raw).digest('hex');
export const ref = (raw: string|Buffer): string => 'sha256:'+hash(raw);
export function id(x: unknown): x is string {return typeof x==='string'&&Buffer.byteLength(x)<=128&&/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(x)&&!/[\r\n]/.test(x);}
export function reference(x: unknown): x is string {return typeof x==='string'&&x.length===71&&/^sha256:[0-9a-f]{64}$/.test(x);}
export function closed(x: any, keys: string[]): void {
 if(!x||Array.isArray(x)||typeof x!=='object')reject();
 const actual=Object.keys(x);
 if(actual.length!==keys.length||keys.some(key=>!Object.hasOwn(x,key)))reject();
}
// Independently derived from portable-json/v1; no ecosystem implementation imports.
export function encode(value: unknown): string {
 function visit(v: any, depth: number): string {
  if(depth>8)reject();
  if(v===null)return 'null';
  if(typeof v==='string'){if(!v.isWellFormed())reject();return JSON.stringify(v);}
  if(typeof v==='boolean')return String(v);
  if(typeof v==='number'){if(!Number.isSafeInteger(v)||Object.is(v,-0))reject();return String(v);}
  if(Array.isArray(v)){if(v.length>64)reject();return '['+v.map(x=>visit(x,depth+1)).join(',')+']';}
  if(typeof v!=='object'||Object.getPrototypeOf(v)!==Object.prototype)reject();
  const names=Object.keys(v).sort();if(names.length>64)reject();
  for(const name of names)if(!/^[A-Za-z0-9_.:-]{1,128}$/.test(name)||/[\r\n]/.test(name))reject();
  return '{'+names.map(k=>JSON.stringify(k)+':'+visit(v[k],depth+1)).join(',')+'}';
 }
 const raw=visit(value,0);if(Buffer.byteLength(raw)>8192)reject();return raw;
}
const assets = new URL('../assets/',import.meta.url);
const manifest: Record<string,string> = JSON.parse(readFileSync(new URL('manifest.json',assets),'utf8'));
const ajv = new Ajv2020({strict:true,allErrors:false});
function schema(name: string) {const bytes=readFileSync(new URL(name,assets));if(hash(bytes)!==manifest[name])reject();return ajv.compile<Doc>(JSON.parse(bytes.toString('utf8')));}
const core = schema('core.schema.json'), participant=schema('participant.schema.json'), effect=schema('git.schema.json');
function parseUnchecked(raw: Buffer|string): Doc {
 const bytes=Buffer.isBuffer(raw)?raw:Buffer.from(raw);if(bytes.length>6144)reject();
 const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);const d=JSON.parse(text);
 // This equality also rejects duplicate members, reordered keys and alternate escapes.
 if(encode(d)!==text||!core(d)||!participant(d.participant_extension)||d.participant.namespace!==NS)reject();
 if(!id(d.participant_extension.values.call_id)||!id(d.participant_extension.values.process_instance_id))reject();
 if(d.effect_extension!==null&&(!effect(d.effect_extension)||!id(d.effect_extension.values.workcell_effect_id)))reject();
 for(const x of [...Object.values(d.subject),...Object.values(d.participant)])if(!id(x))reject();
 if(!reference(d.execution_result_ref)||(d.assurance_ref!==null&&!reference(d.assurance_ref)))reject();
 if(!/^[1-9][0-9]*$/.test(d.subject.attempt_id))reject();
 const {participant_extension:pe,effect_extension:ee,...projection}=d;
 if(Buffer.byteLength(encode(projection))>2048)reject();
 for(const ext of [pe,ee])if(ext!==null){
  if(Buffer.byteLength(encode(ext))>2048||Object.keys(ext.values).length>16)reject();
  for(const [k,v] of Object.entries(ext.values))if(!id(k)||(v!==null&&(typeof v!=='string'||Buffer.byteLength(v)>128)))reject();
 }
 return d;
}
export function parse(raw: Buffer|string): Doc {
 try {return parseUnchecked(raw);} catch {return reject();}
}
export function match(raw: string, expected: Doc): Doc {const d=parse(raw);if(encode(d)!==encode(expected))reject();return d;}
export function request(raw: unknown): {call_id:string} {closed(raw,['call_id']);if(!id((raw as Doc).call_id))reject();return raw as {call_id:string};}
export function produce(context: Doc): string {const raw=encode(context);parse(raw);return raw;}
