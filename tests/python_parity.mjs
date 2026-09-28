// Black-box use of the documented TypeScript codec API. No implementation reading.
import {parse,match,encode} from '../interop/typescript-participant/dist/codec.js';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const corpus=JSON.parse(readFileSync('interop/python-participant/assets/parity.json'));
const hash=b=>createHash('sha256').update(b).digest('hex');
let checked=0, parserChecks=0;
for(const item of corpus.cases){
  const pythonWire=item.wire.replaceAll('@RUNTIME@','python');
  const tsWire=item.wire.replaceAll('@RUNTIME@','typescript');
  if(item.mode!=='encode'){
    let parsed;try{parsed={ok:true,wire:encode(parse(tsWire))};}catch{parsed={ok:false};}
    const direct=spawnSync('interop/python-participant/.venv/bin/python',['-I','interop/python-participant/run.py','parse'],{input:pythonWire,encoding:'utf8',env:{},maxBuffer:32768});
    assert.equal(direct.status===0,parsed.ok,item.name+' parser parity');
    assert.equal(parsed.ok,item.parse_accept,item.name+' parser contract');
    if(parsed.ok)assert.equal(direct.stdout.replaceAll('kujolang.python-process','kujolang.@RUNTIME@-process'),parsed.wire.replaceAll('kujolang.typescript-process','kujolang.@RUNTIME@-process'));
    parserChecks++;
  }
  let ts;try {const expected=JSON.parse(JSON.stringify(corpus.expected).replaceAll('@RUNTIME@','typescript'));const d=item.mode==='encode'?JSON.parse(tsWire):match(tsWire,expected);ts={ok:true,wire:encode(d)};}catch{ts={ok:false};}
  const expected=JSON.parse(JSON.stringify(corpus.expected).replaceAll('@RUNTIME@','python'));
  const input=item.mode==='encode'?pythonWire:JSON.stringify({wire_hex:Buffer.from(pythonWire).toString('hex'),expected});
  const child=spawnSync('interop/python-participant/.venv/bin/python',['-I','interop/python-participant/run.py',item.mode==='encode'?'encode':'match'],{input,encoding:'utf8',env:{},maxBuffer:32768});
  const py={ok:child.status===0,wire:child.stdout};
  assert.equal(py.ok,ts.ok,item.name);assert.equal(py.ok,item.accept,item.name);
  if(py.ok){
    // Only the deliberately distinct owner namespace/schema is projected.
    const a=py.wire.replaceAll('kujolang.python-process','kujolang.@RUNTIME@-process');
    const b=ts.wire.replaceAll('kujolang.typescript-process','kujolang.@RUNTIME@-process');
    assert.equal(a,b,item.name);assert.equal(hash(a),hash(b));assert.deepEqual(JSON.parse(a),JSON.parse(b));
  }
  checked++;
}
console.log(JSON.stringify({ok:true,cases:checked,parserChecks,comparison:'acceptance, owner-projected canonical bytes, SHA256 and semantics'}));
