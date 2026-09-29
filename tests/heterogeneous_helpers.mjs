export * from './node_composition_helpers.mjs';
import {run,state,assert,complete,finalize,read,write,join} from './node_composition_helpers.mjs';
export const program=(id,depends_on=[],inputs=[],optional=false)=>({id,depends_on,inputs,optional,terminal_contract:'parent-finalization/v1alpha1'});
export const evaluator=(id,source)=>({id,depends_on:[source],inputs:[{name:'input',source_node:source,source_output:'report',type_id:'kujo.example/node-summary/v1'}],terminal_contract:'evaluation-result/v1',kind:'evaluator'});
export const human=(id,depends_on,inputs=[])=>({id,depends_on,inputs,terminal_contract:'intervention-decision/v2',kind:'human_review'});
export const actor={id:'local-operator',type:'human',authenticated_by:'installed-local-host',authorization:'graph-finalization'};
export function gop(d,operation,fields={},extra={}){return run(d,'graph-op','graph',{operation,...fields},extra)}
export function finishProgram(d,id){complete(d,id);return finalize(d,id)}
export function finishEval(d,id){assert.equal(run(d,'evaluate',id).ok,true);const a=gop(d,'node-assess',{node_id:id});assert.equal(a.ok,true,JSON.stringify(a));const f=gop(d,'node-finalize',{node_id:id,candidate:a.candidate});assert.equal(f.ok,true,JSON.stringify(f));return f}
export function humanDecision(d,id,action='approve_override'){const opened=gop(d,'review-open',{node_id:id});assert.equal(opened.ok,true,JSON.stringify(opened));const {review}=opened;return {schema:'kujo.intervention-decision/v2',decision_id:'review-'+review.request.state_revision,request_id:review.request.request_id,boundary_id:review.boundary.boundary_id,expected_state_revision:review.request.state_revision,subject:{run_id:state(d).run_id,step_id:id,decision_instance:'1'},input_binding_ref:review.binding_ref,action,reason:'Review exact inputs',decided_at:new Date().toISOString(),actor:{...actor,authorization:'graph-review'}}}
export function finishHuman(d,id,action='approve_override'){const decision=humanDecision(d,id,action),a=gop(d,'node-assess',{node_id:id,decision});assert.equal(a.ok,true,JSON.stringify(a));const f=gop(d,'node-finalize',{node_id:id,decision,candidate:a.candidate});assert.equal(f.ok,true,JSON.stringify(f));return f}
export function finishGraph(d){const a=gop(d,'graph-assess');assert.equal(a.ok,true,JSON.stringify(a));const f=gop(d,'graph-finalize',{candidate:a.candidate,actor});assert.equal(f.ok,true,JSON.stringify(f));return f}
export function patch(path,fn){const value=read(path);fn(value);write(path,value)}
