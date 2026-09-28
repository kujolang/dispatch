import fs from 'node:fs';
import {createCodec} from '@kujolang/participant-sdk';
const codec=createCodec(JSON.parse(fs.readFileSync(new URL('./registration.json',import.meta.url))));
// Check object member uniqueness before JSON.parse discards duplicate members.
function parseMessage(bytes){
 const s=new TextDecoder('utf-8',{fatal:true}).decode(bytes); let i=0;
 function ws(){while(/\s/.test(s[i]??'')&&i<s.length)i++;}
 function string(){const start=i++;while(i<s.length){if(s[i]==='\\'){i+=2;continue;}if(s[i++]==='"')return JSON.parse(s.slice(start,i));}throw Error();}
 function value(){ws();if(s[i]==='{'){i++;ws();const keys=new Set();if(s[i]==='}'){i++;return;}for(;;){ws();if(s[i]!=='"')throw Error();const k=string();if(keys.has(k))throw Error();keys.add(k);ws();if(s[i++]!==':')throw Error();value();ws();const c=s[i++];if(c==='}')return;if(c!==',')throw Error();}}else if(s[i]==='['){i++;ws();if(s[i]===']'){i++;return;}for(;;){value();ws();const c=s[i++];if(c===']')return;if(c!==',')throw Error();}}else if(s[i]==='"')string();else {const start=i;while(i<s.length&&!/[\s,}\]]/.test(s[i]))i++;if(i===start)throw Error();JSON.parse(s.slice(start,i));}}
 value();ws();if(i!==s.length)throw Error();return JSON.parse(s);
}
let pending=Buffer.alloc(0), phase='initial';
function respond(snapshot,operation){const wire=operation(snapshot);codec.matchExpected(wire,snapshot);process.stdout.write(JSON.stringify({wire:Buffer.from(wire).toString('utf8')})+'\n');}
try {
 for await(const chunk of process.stdin){pending=Buffer.concat([pending,chunk]);for(;;){const end=pending.indexOf(10);if(end<0)break;if(end+1>16384)throw Error();const m=parseMessage(pending.subarray(0,end));pending=pending.subarray(end+1);if(!m||Array.isArray(m)||Object.keys(m).sort().join(',')!=='mode,snapshot')throw Error();
 if(phase==='initial'&&m.mode==='record'){respond(m.snapshot,codec.finalizeAfterReadback);phase='done';}
 else if(phase==='initial'&&m.mode==='participate'){respond(m.snapshot,codec.provisional);phase='terminal';}
 else if(phase==='terminal'&&m.mode==='terminal'){respond(m.snapshot,codec.terminalReport);phase='done';}
 else throw Error();
 if(phase==='done'){if(pending.length)throw Error();process.exit(0);}
 }if(pending.length>=16384)throw Error();}
 if(pending.length)throw Error();
} catch {process.stderr.write('invalid_host_message\n');process.exitCode=1;}
