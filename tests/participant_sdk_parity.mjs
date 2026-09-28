// SDK API parity, not a shared implementation. Both processes read pinned corpus.
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const run=(exe,args)=>{const p=spawnSync(exe,args,{env:{},encoding:'utf8',maxBuffer:1048576});assert.equal(p.status,0,p.stderr);return JSON.parse(p.stdout);};
const ts=run(process.execPath,['interop/typescript-participant/test/sdk-conformance.mjs']);
const py=run('interop/python-participant/.venv/bin/python',['-I','interop/python-participant/run.py','sdk-conformance']);
assert.deepEqual(py,ts);
console.log(JSON.stringify({ok:true,schema:ts.schema,cases:ts.cases.length,comparison:'exact bytes, content references, normalized values, error/correlation categories'}));
