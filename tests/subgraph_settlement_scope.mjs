// Every helper invocation loads a fresh Kujo controller. No persisted state edits.
import {
  setup, program, human, evaluator, finishHuman, finishProgram, policy,
  resourceOptions, run, rapply, rop, report, gop, pop, apply, actor, state,
  assert, fresh, request, evalRow, fs, join, root
} from './resource_helpers.mjs';

const proofs = [];
const pass = name => { proofs.push(name); console.log('PASS ' + name); };
const group = members => ({id: 'SG', entry: ['H'], members, policy: 'required-success'});
const blocked = d => {
  const result = gop(d, 'graph-assess');
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.candidate.outcome, 'blocked');
  assert.equal(gop(d, 'graph-finalize', {candidate: result.candidate, actor}).ok, false);
};
const outcome = (d, expected) => {
  const result = pop(d, 'subgraph', 'SG');
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.candidate.outcome, expected);
  return result.candidate;
};

const p = setup('scope-program', [
  human('H', []), human('G', ['H']), human('X', ['H']),
  program('O', ['X'], [], true)
], resourceOptions(policy([], [group(['G'])]), 0));
run(p, 'drive'); finishHuman(p, 'H'); run(p, 'drive');
finishHuman(p, 'G'); finishHuman(p, 'X');
const before = outcome(p, 'completed');
rapply(p, 'reserve', {nodes: ['O']});
const ledger = state(p).graph_attempts;
assert.equal(pop(p, 'subgraph', 'SG', 'apply', {candidate: before, actor}).ok, false);
const samples = [];
for (let i = 0; i < 3; i++) {
  const start = performance.now(); outcome(p, 'completed');
  samples.push(performance.now() - start);
}
blocked(p); apply(p, 'subgraph', 'SG');
assert.deepEqual(state(p).graph_attempts, ledger);
assert.equal(report(p).report.programs.reserved, 1);
assert.equal(state(p, 'O').node_execution_admission, undefined);
assert.equal(pop(p, 'subgraph', 'SG', 'apply', {candidate: before, actor}).ok, false);
blocked(p);
pass('unrelated held program does not block group; graph stays blocked, stale/duplicate apply rejects, reservation stays held');

const e = setup('scope-eval', [
  program('A'), human('H', ['A']), human('G', ['H']),
  {...evaluator('E', 'A'), optional: true}
], resourceOptions(policy([], [group(['G'])], 1), 1));
run(e, 'drive'); finishProgram(e, 'A'); run(e, 'drive');
finishHuman(e, 'H'); run(e, 'drive'); finishHuman(e, 'G');
rapply(e, 'reserve', {nodes: ['E']}); outcome(e, 'completed'); blocked(e);
pass('unrelated held Eval does not block group but still blocks graph');
await fresh(e, request(e, 'dispatch', {node_id: 'E'}),
  {NODE_CRASH: 'after_graph_eval_dispatched'}, 'CRASH:after_graph_eval_dispatched');
const consumed = evalRow(e, 'E');
assert.ok(consumed.dispatch); assert.equal(consumed.resolution, null);
assert.equal(fs.existsSync(join(e, 'E/eval-executions.log')), false);
outcome(e, 'completed'); blocked(e); apply(e, 'subgraph', 'SG');
assert.deepEqual(evalRow(e, 'E'), consumed);
assert.equal(rop(e, 'dispatch', {node_id: 'E'}).ok, false);
assert.equal(rop(e, 'release', {node_id: 'E'}).ok, false);
assert.equal(report(e).report.evaluations.consumed, 1); blocked(e);
pass('SIGKILL after unrelated Eval dispatch permits only group settlement; no redelivery, refund or graph finalization');

for (const action of ['abort', 'cancel']) {
  const d = setup('scope-member-' + action, [
    program('A'), human('H', ['A']), human('R', ['H']), human('X', ['H']),
    program('P', ['H', 'X'], [], true),
    {...evaluator('E', 'A'), depends_on: ['A', 'H'], optional: true}
  ], resourceOptions(policy([], [group(['R', 'P', 'E'])], 2), 1));
  run(d, 'drive'); finishProgram(d, 'A'); run(d, 'drive');
  finishHuman(d, 'H'); run(d, 'drive'); finishHuman(d, 'X');
  rapply(d, 'reserve', {nodes: ['P']}); finishHuman(d, 'R', action);
  outcome(d, 'blocked'); blocked(d);
  const held = pop(d, 'attempt', 'P', 'assess', {action: 'release'});
  assert.equal(held.ok, true, JSON.stringify(held));
  assert.equal(pop(d, 'attempt', 'P', 'apply', {action: 'release', candidate: held.candidate, actor}).ok, true);
  outcome(d, action === 'abort' ? 'failed' : 'cancelled');
  rapply(d, 'reserve', {nodes: ['E']}); outcome(d, 'blocked'); blocked(d);
  await fresh(d, request(d, 'dispatch', {node_id: 'E'}),
    {NODE_CRASH: 'after_graph_eval_dispatched'}, 'CRASH:after_graph_eval_dispatched');
  outcome(d, 'blocked'); blocked(d);
  assert.equal(rop(d, 'release', {node_id: 'E'}).ok, false);
  assert.equal(report(d).report.evaluations.consumed, 1);
  pass(action + ': held optional member program/Eval and uncertain member Eval prevent group and graph sealing');
}
console.log(JSON.stringify({ok: true, checks: proofs.length, proofs,
  measurement: {operation: 'fresh-process subgraph assessment, unrelated held program', samples_ms: samples}, root}));
