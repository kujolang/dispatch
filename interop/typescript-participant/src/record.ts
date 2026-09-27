// Host-only recording worker: no execution/admission API and no effect knowledge.
import {produce} from './codec.js';
try {let raw='';for await(const chunk of process.stdin){raw+=chunk;if(Buffer.byteLength(raw)>6144)throw Error('bound');}process.stdout.write(produce(JSON.parse(raw)));}
catch {process.stdout.write('{"ok":false,"code":"record_invalid"}');process.exitCode=1;}
