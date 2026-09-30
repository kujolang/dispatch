export * from './heterogeneous_helpers.mjs';
import {run,assert,actor} from './heterogeneous_helpers.mjs';
export const policy=(branches=[],subgraphs=[],limit=8)=>({schema:'dispatch.static-graph-policy/v1alpha1',branches,subgraphs,budget:{max_program_dispatches:limit,on_exhaustion:'block'}});
export const branch=(id,source,predicate,cases)=>({id,source,predicate,cases:Object.entries(cases).map(([value,nodes])=>({value,nodes}))});
export const accepted=(node,id,values)=>({...node,accept_terminal:{[id]:values}});
export const routed=(node,id)=>({...node,on_unsuccessful:{action:'route',branch:id}});
export function pop(d,kind,id,operation='assess',fields={},extra={}){return run(d,'policy-op','graph',{kind,id,operation,...fields},extra)}
export function apply(d,kind,id){const a=pop(d,kind,id);assert.equal(a.ok,true,JSON.stringify(a));const r=pop(d,kind,id,'apply',{candidate:a.candidate,actor});assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.continuation,'not_authorized');return r}
