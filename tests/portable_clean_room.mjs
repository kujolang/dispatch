// Temporary tree contains public contracts/examples plus independent checkers only.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import{spawnSync}from'node:child_process';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'kujo-assurance-portability-'));
const workcell=process.env.WORKCELL_ROOT||'../workcell',ability=process.env.ABILITY_ROOT||'../ability';
const vectors=['tests/vectors/commitments.json','tests/vectors/sqlite-commitments.json',workcell+'/tests/vectors/git-assurance-commitments.json',ability+'/tests/vectors/application-assurance-commitments.json'];
for(const p of [...vectors,'schemas/effect-assurance-v1alpha1.schema.json','schemas/effect-assurance-v1beta1.schema.json','scripts/portability/check_vectors.mjs','scripts/portability/check_vectors.py','scripts/portability/check_artifacts.mjs','docs/contracts/portable-commitments.md','docs/contracts/sqlite-assurance-profile.md',workcell+'/docs/contracts/git-assurance-profile.md',ability+'/docs/contracts/application-assurance-profile.md'])fs.copyFileSync(p,path.join(root,path.basename(p)));
for(const [name,source] of [['dispatch.sqlite-unique','docs/contracts'],['workcell.git-cas',workcell+'/docs/contracts'],['ability.application-gateway',ability+'/docs/contracts']])fs.copyFileSync(source+'/bindings-v1beta1.schema.json',path.join(root,name+'.schema.json'));
fs.copyFileSync('tests/vectors/assurance-artifacts.json',path.join(root,'artifacts.json'));
for(const [exe,args]of [['node',['check_vectors.mjs',...vectors.map(p=>path.basename(p))]],['python3',['check_vectors.py',...vectors.map(p=>path.basename(p))]],['node',['check_artifacts.mjs',root]]]){const r=spawnSync(exe,args,{cwd:root,encoding:'utf8',timeout:20000});assert.equal(r.status,0,r.stdout+r.stderr);process.stdout.write(r.stdout);}
assert.ok(!fs.existsSync(path.join(root,'src')));console.log(JSON.stringify({clean_room:root,no_ecosystem_implementation:true}));
