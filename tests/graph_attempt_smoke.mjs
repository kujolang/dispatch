import {setup,program,policy,run,pop,actor,assert,state,root,read,write,join,fs} from './static_policy_helpers.mjs';
const node=(id)=>({...program(id),terminal_contract:'program-attempt/v1alpha1',max_attempts:2,on_unsuccessful:{action:'retry_same_node'}});
const d=setup('reservation',[node('A')],{graph_policy:policy(),graph_accounting:'dispatch.graph-attempt-accounting/v1alpha1'});
function change(action){const a=pop(d,'attempt','A','assess',{action});assert.equal(a.ok,true,JSON.stringify(a));const b=pop(d,'attempt','A','apply',{action,candidate:a.candidate,actor});assert.equal(b.ok,true,JSON.stringify(b));return b}
change('reserve');assert.equal(state(d).graph_attempts.A.length,1);
change('release');assert.ok(state(d).graph_attempts.A[0].release);
change('reserve');assert.equal(state(d).graph_attempts.A.length,2);
const cfg=read(join(d,'A/host.json'));cfg.require_resource=true;write(join(d,'A/host.json'),cfg);
const next=read(join(d,'A-retry/host.json'));next.require_resource=true;write(join(d,'A-retry/host.json'),next);fs.writeFileSync(join(d,'A-retry/required-resource'),'available');
let drive=run(d,'drive');assert.equal(drive.ok,true,JSON.stringify(drive));assert.ok(state(d,'A').node_execution_refusal);assert.equal(state(d,'A').node_execution_admission,undefined);
drive=run(d,'drive');assert.equal(drive.ok,true,JSON.stringify(drive));assert.equal(state(d).node_completions.A.terminal.outcome,'failed');
change('retry');assert.equal(state(d).graph_attempts.A.at(-1).ordinal,2);
drive=run(d,'drive');assert.equal(drive.ok,true,JSON.stringify(drive));assert.ok(state(d,'A-retry').node_execution_admission);
assert.equal(state(d,'A').node_execution_admission,undefined);
const report=pop(d,"accounting","graph");assert.equal(report.ok,true,JSON.stringify(report));assert.equal(report.report.authority,"informational");assert.equal(report.report.budget.consumed,2);assert.equal(report.report.attempts.at(-1).admission,"consumed");assert.equal(report.report.attempts.find(a=>a.accounting==="released").accounting,"released");
console.log(JSON.stringify({ok:true,root,checks:9}));
