// No filesystem, Git, Dispatch or retry implementation. Host is an inherited IPC peer.
import {randomUUID} from 'node:crypto';
import {request} from './codec.js';
import {sdk} from './installed-sdk.js';
let next=0;
function rpc(op: string, data: unknown): Promise<any> {
 return new Promise((resolve,reject)=>{
  const n=++next, timer=setTimeout(()=>reject(new Error('host_unavailable')),15000);
  const receive=(m:any)=>{if(m?.n===n){clearTimeout(timer);process.off('message',receive);m.ok?resolve(m.data):reject(new Error('not_admitted'));}};
  process.on('message',receive);process.send?.({n,op,data});
 });
}
try {
 if(!process.send)throw new Error('host_unavailable');
 let raw='';for await(const chunk of process.stdin){raw+=chunk;if(Buffer.byteLength(raw)>512)throw new Error('invalid_request');}
 const input=request(JSON.parse(raw));
 const context=await rpc('admit',{...input,process_instance_id:randomUUID()});
 // Persist participant-authored UNKNOWN handoff before the effect can start.
 await rpc('record',Buffer.from(sdk.provisional(context)).toString('utf8'));
 const completion=await rpc('execute',null);
 await rpc('record',Buffer.from(sdk.terminalReport(completion)).toString('utf8'));
 process.stdout.write('{"ok":true,"completion_knowledge":"reported"}\n');
 process.disconnect?.();
} catch {process.stdout.write('{"ok":false,"code":"participant_unavailable"}\n');process.disconnect?.();process.exitCode=1;}
