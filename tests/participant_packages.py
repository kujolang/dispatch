"""Local unpublished artifact rehearsal. Maintenance harness, not SDK/host authority."""
import hashlib,json,os,shutil,subprocess,sys,tarfile,tempfile,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
TS=ROOT/'packages/participant-sdk-ts'; PY=ROOT/'packages/participant-sdk-python'
OUT=Path(tempfile.mkdtemp(prefix='kujo-sdk-packages-')).resolve()
ENV=dict(os.environ,SOURCE_DATE_EPOCH='1790553600',PYTHONPATH='',PYTHONHOME='')
ENV.pop('PYTHONHOME',None)
def run(args,cwd=OUT):
 p=subprocess.run([str(x) for x in args],cwd=cwd,env=ENV,capture_output=True,timeout=240)
 if p.returncode: raise AssertionError((args,p.stdout.decode()[-4000:],p.stderr.decode()[-4000:]))
 return p.stdout.decode()
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def verify_artifact(p,expected):
 if sha(p)!=expected: raise ValueError('package_artifact_mismatch')
def dump(p,x):p.write_text(json.dumps(x,sort_keys=True,indent=2)+'\n')
buildpy=Path(os.environ.get('SDK_BUILD_PYTHON',str(ROOT/'.ci/participant-sdk-build/bin/python')))
run(['npm','ci','--ignore-scripts','--no-audit'],TS)
assert (TS/'dependency-lock.json').read_bytes()==(TS/'package-lock.json').read_bytes()
run(['npm','run','build'],TS)
assert (TS/'dist/index.d.ts').read_bytes()==(ROOT/'packages/typescript-api.snapshot.d.ts').read_bytes()
assert (PY/'src/kujo_participant_sdk/__init__.pyi').read_bytes()==(ROOT/'packages/python-api.snapshot.pyi').read_bytes()
artifacts=OUT/'artifacts';artifacts.mkdir()
pack=json.loads(run(['npm','pack','--ignore-scripts','--json','--pack-destination',artifacts],TS))[0]
tgz=artifacts/pack['filename']; initial=sha(tgz)
substitute=artifacts/'substituted.bin';substitute.write_bytes(tgz.read_bytes()+b'changed')
try:
 verify_artifact(substitute,initial)
 raise AssertionError('substituted artifact admitted')
except ValueError as e: assert str(e)=='package_artifact_mismatch'
substitute.unlink()
run(['npm','pack','--ignore-scripts','--json','--pack-destination',artifacts],TS)
assert sha(tgz)==initial
run([buildpy,'-m','build','--no-isolation','--outdir',artifacts],PY)
wheel=next(artifacts.glob('*.whl'));sdist=next(artifacts.glob('*.tar.gz'))
wheelsha=sha(wheel);sdistsha=sha(sdist)
repeat=OUT/'repeat';run([buildpy,'-m','build','--no-isolation','--outdir',repeat],PY)
assert sha(repeat/wheel.name)==wheelsha
# gzip source archives may retain build timestamps; report actual comparison.
repro={'npm':True,'wheel':True,'sdist':sha(repeat/sdist.name)==sdistsha}
with tarfile.open(tgz) as t:
 names=t.getnames();assert all(n.startswith(('package/dist/','package/assets/')) or n in ['package/package.json','package/README.md','package/API.md','package/LICENSE','package/dependency-lock.json'] for n in names),names
with zipfile.ZipFile(wheel) as z:
 wn=z.namelist();assert all(n.startswith(('kujo_participant_sdk/','kujo_participant_sdk-0.1.0a1.dist-info/')) for n in wn)
 assert not any('/tests/' in n or '/host/' in n or '__pycache__' in n for n in wn)
with tarfile.open(sdist) as t: sn=t.getnames();assert not any('/tests/' in n or '/host/' in n for n in sn)
cons=ROOT/'tests/package-consumers'
def setup(name):
 p=OUT/name;p.mkdir()
 for f in cons.iterdir():
  if f.is_file():shutil.copyfile(f,p/f.name)
 shutil.copyfile(ROOT/'docs/contracts/participant-sdk/conformance.json',p/'conformance.json')
 return p
ts=setup('ts');dump(ts/'package.json',{'private':True,'type':'module'})
verify_artifact(tgz,initial)
run(['npm','install','--ignore-scripts','--no-audit',tgz],ts)
# Assert registry-resolved transitive artifacts equal the committed production lock.
expected=json.loads((TS/'package-lock.json').read_bytes())['packages']
actual=json.loads((ts/'package-lock.json').read_bytes())['packages']
for name,entry in expected.items():
 if name and not entry.get('dev'):
  assert actual[name]['version']==entry['version'] and actual[name]['integrity']==entry['integrity']
# Reinstall exclusively through this verified lock, with lifecycle scripts disabled.
run(['npm','ci','--ignore-scripts','--no-audit','--offline'],ts)
py=setup('py');run([sys.executable,'-m','venv',py/'venv']);python=py/'venv/bin/python'
run([python,'-m','pip','install','--no-index','--only-binary=:all:','--require-hashes','--find-links',ROOT/'interop/python-participant/wheelhouse','-r',PY/'requirements.lock'])
verify_artifact(wheel,wheelsha)
run([python,'-m','pip','install','--no-deps',wheel])
run([python,'-m','pip','check'])
tr=json.loads(run(['node','conformance.mjs'],ts));pr=json.loads(run([python,'-I',py/'conformance.py'],py));assert tr==pr and len(tr['cases'])==45
assert run(['node','example.mjs'],ts).strip()==run([python,'-I',py/'example.py'],py).strip()
tsroot=ts/'node_modules/@kujolang/participant-sdk'
pyroot=Path(run([python,'-I','-c','import kujo_participant_sdk,pathlib; print(pathlib.Path(kujo_participant_sdk.__file__).parent)']).strip())
assert str(OUT) in str(pyroot) and str(ROOT) not in str(pyroot)
exports=json.loads(run(['node','--input-type=module','-e',"import * as s from '@kujolang/participant-sdk';console.log(JSON.stringify(Object.keys(s).sort()))"],ts))
assert exports==['CONFORMANCE','CorrelationError','SDKError','contentRef','createCodec']
assert json.loads(run([python,'-I','-c','import kujo_participant_sdk as s,json; print(json.dumps(sorted(s.__all__)))']))==['CONFORMANCE','CorrelationError','SDKError','content_ref','create_codec']
run(['node',TS/'node_modules/typescript/bin/tsc','--noEmit','--strict','--skipLibCheck','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext',ts/'types.ts'],ts)
# No exported internal subpath; Python underscore modules are explicitly private, not a sandbox.
run(['node','--input-type=module','-e',"try{await import('@kujolang/participant-sdk/dist/_codec.js');process.exit(1)}catch(e){if(e.code!=='ERR_PACKAGE_PATH_NOT_EXPORTED')throw e}"],ts)
for package,command,where in [(tsroot,['node','example.mjs'],ts),(pyroot,[python,'-I',py/'example.py'],py)]:
 for name in ['core.schema.json','manifest.json']:
  f=package/'assets'/name;saved=f.read_bytes()
  try:
   f.write_bytes(saved+b' ')
   p=subprocess.run([str(x) for x in command],cwd=where,env=ENV,capture_output=True)
   assert p.returncode!=0 and b'sdk_assets_invalid' in p.stderr
  finally:f.write_bytes(saved)
# Source/archive provenance is installation evidence, not a new production revision algorithm.
def installation(where,package,artifact,language):
 files=[]
 paths=[p for p in package.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc']
 paths += [where/n for n in (['worker.mjs','record.mjs','registration.mjs'] if language=='ts' else ['worker.py'])]
 for p in sorted(paths):files.append({'root':str(p.parent),'path':p.name,'sha256':sha(p)})
 assert len(files)<=64
 bindings={'package_worker':str(where/('worker.mjs' if language=='ts' else 'worker.py'))}
 if language=='ts': bindings['package_record']=str(where/'record.mjs')
 else: bindings['package_python']=str(python)
 dump(where/'installation.json',{'schema':'kujo.participant-package-installation/v1alpha1','artifact_sha256':sha(artifact),'bindings':bindings,'files':files})
 cfg={'package_manifest_root':str(where),'package_worker':str(where/('worker.mjs' if language=='ts' else 'worker.py')),'package_probe_files':[str(package/('dist/index.js' if language=='ts' else '_sdk.py')),str(package/'assets/core.schema.json')]}
 if language=='ts':cfg['package_record']=str(where/'record.mjs')
 else:cfg['package_python']=str(python)
 dump(where/'config.json',cfg)
installation(ts,tsroot,tgz,'ts');installation(py,pyroot,wheel,'py')
source={str(p.relative_to(ROOT)):sha(p) for base in [TS,PY] for p in base.rglob('*') if p.is_file() and not any(x in p.parts for x in ['node_modules','dist','build','__pycache__']) and '.egg-info' not in str(p)}
report={'schema':'kujo.participant-package-rehearsal/v1alpha1','root':str(OUT),'artifacts':{p.name:sha(p) for p in artifacts.iterdir()},'reproducible':repro,'ts_contents':names,'wheel_contents':wn,'sdist_contents':sn,'conformance':{'ts':45,'python':45,'exact_parity':True},'source_sha256':source,'tools':{'node':run(['node','--version']).strip(),'npm':run(['npm','--version']).strip(),'python':run([python,'--version']).strip(),'build':run([buildpy,'-m','build','--version']).strip()},'api_snapshot_sha256':sha(ROOT/'packages/api-snapshot.json'),'asset_substitution_denials':4,'artifact_substitution_rejected':True,'dependencies_match_lock':True,'ts_config':str(ts/'config.json'),'python_config':str(py/'config.json')}
dump(OUT/'report.json',report)
print(json.dumps({'ok':True,'report':str(OUT/'report.json'),'ts_config':report['ts_config'],'python_config':report['python_config'],'conformance':report['conformance'],'reproducible':repro}))
