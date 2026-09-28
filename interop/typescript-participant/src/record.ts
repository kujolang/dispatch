// Host-only recording worker: no execution/admission API and no effect knowledge.
import {sdk} from './installed-sdk.js';
try {let raw='';for await(const chunk of process.stdin){raw+=chunk;if(Buffer.byteLength(raw)>6144)throw Error('bound');}process.stdout.write(sdk.finalizeAfterReadback(JSON.parse(raw)));}
catch {process.stdout.write('{"ok":false,"code":"record_invalid"}');process.exitCode=1;}
