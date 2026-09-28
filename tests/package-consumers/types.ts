import {createCodec,contentRef,SDKError,CorrelationError,type Registration} from '@kujolang/participant-sdk';
const registration:Registration={namespace:'example.process',participant:{schema:'example.process/v1alpha1',fields:{call_id:'identifier'}},effect:null};
const codec=createCodec(registration);
const raw:Uint8Array=codec.encodeHandoff({});
const parsed:Record<string,unknown>=codec.parseHandoff(raw);
const matched:true=codec.matchExpected(raw,parsed);
const reference:string=contentRef(raw);
const error:SDKError=new CorrelationError('subject_mismatch');
void [matched,reference,error];
