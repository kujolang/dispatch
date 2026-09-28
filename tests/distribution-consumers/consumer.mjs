import {createCodec,contentRef} from '@kujolang/participant-sdk';
import {readFileSync} from 'node:fs';
const {registration,handoff}=JSON.parse(readFileSync(new URL('./consumer.json',import.meta.url)));
const codec=createCodec(registration);
const first=codec.provisional(handoff);
const report=codec.terminalReport({...handoff,completion_knowledge:'reported'});
const final=codec.finalizeAfterReadback(handoff);
console.log(JSON.stringify({match:codec.matchExpected(first,handoff),ref:contentRef(first),knowledge:[first,report,final].map(w=>codec.parseHandoff(w).completion_knowledge)}));
