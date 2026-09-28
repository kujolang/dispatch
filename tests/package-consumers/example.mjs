import {createCodec,contentRef} from '@kujolang/participant-sdk';
import {readFileSync} from 'node:fs';
const {registration,handoff}=JSON.parse(readFileSync(new URL('./conformance.json',import.meta.url)));
const codec=createCodec(registration);
const bytes=codec.provisional(handoff);
if(codec.matchExpected(bytes,handoff)!==true)throw Error('mismatch');
console.log(contentRef(bytes));
