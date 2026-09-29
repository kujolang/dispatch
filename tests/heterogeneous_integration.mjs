import {fs,setup,program,evaluator,human,edge,run,state,assert,finishProgram,finishEval,finishHuman,finishGraph,gop,humanDecision,actor,read,write,join,patch,complete,decision,finalize} from './heterogeneous_helpers.mjs';
let checks=0;const pass=name=>{checks++;console.log('PASS '+name)}, denied=r=>assert.equal(r.ok,false,JSON.stringify(r));
const d=setup('heterogeneous-success',[program('A'),evaluator('E','A'),human('H',['A'],[edge('A')]),program('B',['E','H'],[edge('A')])]);
assert.equal(gop(d,'graph-assess').candidate.outcome,'blocked');assert.equal(run(d,'drive').ok,true);
denied(run(d,'op','A',{operation:'parent-inspect',decision:decision(d,'A')}));assert.equal(fs.existsSync(join(d,'B','executions.log')),false);pass('unresolved program effects block parent and downstream');
finishProgram(d,'A');assert.equal(run(d,'drive').ok,true);assert.equal(gop(d,'graph-assess').candidate.outcome,'blocked');pass('producer terminal is not Eval or human completion');
assert.equal(run(d,'evaluate','E').ok,true);const evalPath=join(d,'E','evaluation.json'),original=read(evalPath);
for(const [name,change] of [
 ['wrong evaluation subject',v=>v.subject.run_id='wrong'],
 ['wrong original result identity',v=>v.input_evidence_ids[0]='sha256:'+'0'.repeat(64)],
 ['stale evaluated output',v=>v.input_evidence_ids[1]='sha256:'+'1'.repeat(64)],
 ['wrong evaluator revision',v=>v.evaluator.configuration_sha256='2'.repeat(64)],
 ['incomplete evaluation',v=>{v.evaluation_status='error';v.verdict='indeterminate'}]
]){const v=structuredClone(original);change(v);write(evalPath,v);denied(gop(d,'node-assess',{node_id:'E'}));pass(name)}
write(evalPath,original);const ea=gop(d,'node-assess',{node_id:'E'});assert.equal(ea.ok,true,JSON.stringify(ea));assert.equal(gop(d,'node-finalize',{node_id:'E',candidate:ea.candidate}).ok,true);pass('Eval terminal uses actual evaluation-result without execution-result');
const review=humanDecision(d,'H');const hostPath=join(d,'host.json');
for(const [name,change] of [
 ['wrong human subject',v=>v.subject.step_id='B'],
 ['stale human revision',v=>v.expected_state_revision--],
 ['wrong human input binding',v=>v.input_binding_ref='sha256:'+'3'.repeat(64)],
 ['unauthorized human actor',v=>v.actor.authenticated_by='chat-claim']
]){const v=structuredClone(review);change(v);denied(gop(d,'node-assess',{node_id:'H',decision:v}));pass(name)}
let ha=gop(d,'node-assess',{node_id:'H',decision:review});assert.equal(ha.ok,true,JSON.stringify(ha));denied(gop(d,'node-finalize',{node_id:'H',decision:review,candidate:ha.candidate},{GRAPH_REVOKE:'before_terminal'}));patch(hostPath,v=>v.operator_enabled=true);pass('live human authority revocation between assessment and decision rejects');
const blocked=gop(d,'graph-assess');assert.equal(blocked.candidate.outcome,'blocked');denied(gop(d,'graph-finalize',{candidate:blocked.candidate,actor}));pass('pending human prevents graph completion');
ha=gop(d,'node-assess',{node_id:'H',decision:review});assert.equal(gop(d,'node-finalize',{node_id:'H',decision:review,candidate:ha.candidate}).ok,true);denied(gop(d,'node-finalize',{node_id:'H',decision:{...review,action:'abort'},candidate:ha.candidate}));pass('authorized approval is immutable; conflicting denial rejects');
assert.equal(state(d,'B').node_execution_admission,undefined);assert.equal(run(d,'drive').ok,true);const bs=state(d,'B');assert.equal(bs.node_input_binding.schema,'dispatch.node-input-binding/v1alpha2');assert.deepEqual(bs.node_input_binding.predecessors.map(x=>x.terminal.contract),['evaluation-result/v1','intervention-decision/v2']);assert.equal(bs.node_input_binding.inputs[0].producer_node,'A');assert.equal(bs.effect_lifecycle,undefined);pass('heterogeneous join records why B proceeds and grants no effect admission');
complete(d,'B');assert.equal(gop(d,'graph-assess').candidate.outcome,'blocked');const bOutput=join(d,'B','output.json'),bBytes=fs.readFileSync(bOutput);fs.unlinkSync(bOutput);denied(run(d,'op','B',{operation:'parent-inspect',decision:decision(d,'B')}));fs.writeFileSync(bOutput,bBytes);pass('missing consumer output blocks its independent finalization');finalize(d,'B');assert.equal(run(d,'drive').ok,true);assert.equal(state(d).status,'paused');assert.equal(state(d).graph_finalization,undefined);pass('all node facts without graph decision stay nonterminal');
const outputPath=join(d,'A','output.json'),bytes=fs.readFileSync(outputPath);fs.writeFileSync(outputPath,'{}');denied(gop(d,'graph-assess'));fs.writeFileSync(outputPath,bytes);pass('changed required output cannot finalize graph');
const saved=fs.readFileSync(join(state(d).run_dir,'state.json'));const corrupted=state(d);corrupted.workflow_definition.steps[0].optional=true;const header=saved.toString().split('\n')[0];fs.writeFileSync(join(state(d).run_dir,'state.json'),header+'\n'+JSON.stringify(corrupted));denied(gop(d,'graph-assess'));fs.writeFileSync(join(corrupted.run_dir,'state.json'),saved);pass('required membership cannot be downgraded');
const added=state(d);added.workflow_definition.steps.push({...added.workflow_definition.steps[0],id:'new-required'});fs.writeFileSync(join(added.run_dir,'state.json'),header+'\n'+JSON.stringify(added));denied(gop(d,'graph-assess'));fs.writeFileSync(join(added.run_dir,'state.json'),saved);pass('new required descendant invalidates anchored definition');
const stale=gop(d,'graph-assess');assert.equal(run(d,'drive').ok,true);denied(gop(d,'graph-finalize',{candidate:stale.candidate,actor}));pass('stale graph assessment cannot become terminal authority');
const before=JSON.stringify(state(d,'A').parent_finalization);assert.equal(finishGraph(d).outcome,'completed');assert.equal(state(d).status,'completed');assert.equal(JSON.stringify(state(d,'A').parent_finalization),before);assert.equal(read(join(d,'B','output.json')).value,2);pass('explicit graph success preserves independent node truth');

const failed=setup('evaluation-failure',[program('A'),evaluator('E','A'),program('B',['E'],[edge('A')])]);run(failed,'drive');finishProgram(failed,'A');run(failed,'drive');patch(join(failed,'E','host.json'),v=>v.expected_value=99);assert.equal(finishEval(failed,'E').outcome,'failed');run(failed,'drive');assert.equal(fs.existsSync(join(failed,'B','executions.log')),false);assert.equal(finishGraph(failed).outcome,'failed');assert.equal(state(failed,'A').parent_finalization.candidate.outcome,'completed');pass('anchored Eval fail policy yields failed graph and blocks B without rewriting A');

const optional=setup('optional-and-completion-only',[program('A'),program('O',['A'],[edge('A')],true),program('B',['A'],[edge('A')]),human('H',['A'])]);
assert.equal(gop(optional,'optional-cancel',{node_id:'O',actor}).ok,true);assert.equal(state(optional).steps[1].status,'cancelled');assert.equal(state(optional,'O').node_execution_admission,undefined);run(optional,'drive');finishProgram(optional,'A');run(optional,'drive');finishProgram(optional,'B');run(optional,'drive');assert.equal(gop(optional,'graph-assess').candidate.outcome,'blocked');assert.equal(state(optional,'B').node_input_binding.predecessors.length,1);finishHuman(optional,'H');assert.equal(finishGraph(optional).outcome,'completed');pass('optional cancellation is not execution; completion-only H independently gates graph success');
console.log(JSON.stringify({ok:true,checks,evidence:[d,failed,optional]}));
