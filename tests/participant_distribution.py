"""Private localhost distribution rehearsal; no registry publication or replay policy."""
import base64,copy,functools,hashlib,http.server,importlib.util,json,os,re,shutil,subprocess,sys,tarfile,tempfile,threading,urllib.request,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(tempfile.mkdtemp(prefix='kujo-private-distribution-'))
FEED=OUT/'feed';FEED.mkdir()
sha=lambda b:hashlib.sha256(b).hexdigest()
def dump(p,x):p.write_text(json.dumps(x,sort_keys=True,indent=2)+'\n')
def run(args,cwd,ok=True):
 env={'PATH':os.environ['PATH'],'HOME':str(OUT/'home'),'PIP_CONFIG_FILE':os.devnull,'PIP_NO_INDEX':'1','PIP_DISABLE_PIP_VERSION_CHECK':'1','npm_config_registry':'http://127.0.0.1:1','npm_config_cache':str(cwd/'npm-cache'),'npm_config_userconfig':os.devnull,'npm_config_globalconfig':str(OUT/'empty-global-npmrc')}
 p=subprocess.run(list(map(str,args)),cwd=cwd,env=env,capture_output=True,timeout=240)
 if ok:assert p.returncode==0,(args,p.stdout[-2000:],p.stderr[-2000:])
 else:assert p.returncode!=0
 return p.stdout
review=json.loads((ROOT/'docs/evidence/participant-sdk-packaging/package-manifest.json').read_bytes())
archives=ROOT/'.ci/participant-packages/artifacts'
for name,digest in review['artifacts'].items():
 if name.endswith('.tar.gz'):continue # runtime is wheel-only; no sdist build on consumers
 data=(archives/name).read_bytes();assert sha(data)==digest; (FEED/name).write_bytes(data)
TGZ=next(FEED.glob('*.tgz')).name;WHEEL=next(FEED.glob('*.whl')).name
with tarfile.open(FEED/TGZ) as t:
 npm_lock=json.load(t.extractfile('package/dependency-lock.json'));npm_meta=json.load(t.extractfile('package/package.json'))
 npm_assets=sha(t.extractfile('package/assets/manifest.json').read())
 npm_asset_files=json.load(t.extractfile('package/assets/manifest.json'));capabilities=json.load(t.extractfile('package/assets/capabilities.json'))
with zipfile.ZipFile(FEED/WHEEL) as z:
 py_lock=z.read('kujo_participant_sdk/assets/dependencies.lock');py_assets=sha(z.read('kujo_participant_sdk/assets/manifest.json'))
# Feed operator prepares reviewed dependencies. Only this preparation contacts npm.
prod={k:v for k,v in npm_lock['packages'].items() if k and not v.get('dev')}
for path,e in prod.items():
 name=e['resolved'].rsplit('/',1)[1]
 with urllib.request.urlopen(e['resolved'],timeout=30) as response:data=response.read(16*1024*1024)
 assert 'sha512-'+base64.b64encode(hashlib.sha512(data).digest()).decode()==e['integrity']
 (FEED/name).write_bytes(data)
allowed=set(re.findall(rb'--hash=sha256:([a-f0-9]{64})',py_lock))
for p in (ROOT/'interop/python-participant/wheelhouse').glob('*.whl'):
 if sha(p.read_bytes()).encode() in allowed:shutil.copyfile(p,FEED/p.name)
(FEED/'requirements.lock').write_bytes(py_lock+b'\nkujo-participant-sdk==0.1.0a1 --hash=sha256:'+review['artifacts'][WHEEL].encode()+b'\n')
# Relative local archives let npm install offline after authenticated acquisition.
pkg={'name':'private-ts-consumer','version':'0.0.0','private':True,'type':'module','dependencies':{'@kujolang/participant-sdk':'file:download/'+TGZ}}
lock={'name':pkg['name'],'version':pkg['version'],'lockfileVersion':3,'requires':True,'packages':{'':{k:v for k,v in pkg.items() if k in ('name','version','dependencies')}}}
for key,e in prod.items():
 lock['packages'][key]={**e,'resolved':'file:download/'+e['resolved'].rsplit('/',1)[1]}
lock['packages']['node_modules/@kujolang/participant-sdk']={'version':npm_meta['version'],'resolved':'file:download/'+TGZ,'integrity':'sha512-'+base64.b64encode(hashlib.sha512((FEED/TGZ).read_bytes()).digest()).decode(),'dependencies':npm_meta['dependencies'],'engines':npm_meta['engines']}
dump(FEED/'package-lock.json',lock);dump(FEED/'package.json',pkg)
pins={'schema':'kujo.private-sdk-distribution/v1alpha1','packages':[{'name':npm_meta['name'],'version':npm_meta['version'],'archive':TGZ,'sha256':review['artifacts'][TGZ],'asset_manifest_sha256':npm_assets},{'name':'kujo-participant-sdk','version':'0.1.0a1','archive':WHEEL,'sha256':review['artifacts'][WHEEL],'asset_manifest_sha256':py_assets}], 'files':{p.name:sha(p.read_bytes()) for p in sorted(FEED.iterdir())}}
dump(OUT/'reviewed-pins.json',pins)
# Pins travel out of band. Feed has no authority to replace them.
spec=importlib.util.spec_from_file_location('acquire',ROOT/'tests/distribution-consumers/acquire.py');a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
requests=[]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_GET(self):requests.append(self.path);super().do_GET()
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(FEED)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start();base='http://127.0.0.1:'+str(server.server_port)
negatives=[]
def altered(name,label,content):
 original=(FEED/name).read_bytes()
 try:
  (FEED/name).write_bytes(content)
  try:a.acquire(base,pins,OUT/('denied-'+label));raise AssertionError('accepted substitution')
  except (ValueError,urllib.error.HTTPError):negatives.append(label)
 finally:(FEED/name).write_bytes(original)
altered(TGZ,'same-version-replacement',b'other package same name/version')
altered(WHEEL,'altered-wheel',(FEED/WHEEL).read_bytes()+b'changed')
altered(TGZ,'wrong-name-collision',(FEED/WHEEL).read_bytes())
for label,version in [('older','0.0.1'),('newer','9.0.0')]:
 d=copy.deepcopy(lock);d['packages']['node_modules/@kujolang/participant-sdk']['version']=version
 altered('package-lock.json',label,json.dumps(d).encode())
for label,key,value in [('dependency-version','version','99.0.0'),('missing-integrity','integrity',None),('registry-fallback','resolved','https://registry.npmjs.org/evil')]:
 d=copy.deepcopy(lock);e=d['packages']['node_modules/ajv'];e[key]=value
 altered('package-lock.json',label,json.dumps(d).encode())
altered('requirements.lock','missing-python-hash',b'kujo-participant-sdk==0.1.0a1\n')
altered('package-lock.json','missing-npm-lock',b'{}')
altered('ajv-8.20.0.tgz','dependency-archive-substitution',b'poisoned cached dependency')
# Real repacked asset changes are rejected by reviewed archive digest before install.
import io
for member,label in [('package/assets/core.schema.json','schema-substitution'),('package/assets/manifest.json','manifest-substitution'),('package/assets/capabilities.json','capability-substitution')]:
 buf=io.BytesIO()
 with tarfile.open(FEED/TGZ) as src,tarfile.open(fileobj=buf,mode='w:gz') as dst:
  for item in src:
   data=src.extractfile(item).read() if item.isfile() else None
   if item.name==member:data+=b' ';item.size=len(data)
   dst.addfile(item,io.BytesIO(data) if data is not None else None)
 altered(TGZ,label,buf.getvalue())
# Missing artifact is a hard acquisition failure, no cache or registry fallback.
saved=(FEED/TGZ).read_bytes();(FEED/TGZ).unlink()
try:
 try:a.acquire(base,pins,OUT/'denied-missing');raise AssertionError('missing accepted')
 except urllib.error.HTTPError:negatives.append('missing-artifact')
finally:(FEED/TGZ).write_bytes(saved)
consumers=[]
for lang in ('ts','py'):
 where=OUT/('consumer-'+lang);where.mkdir();a.acquire(base,pins,where/'download');dump(where/'reviewed-pins.json',pins)
 shutil.copyfile(ROOT/'tests/distribution-consumers/acquire.py',where/'acquire.py')
 # Public API examples and conformance, not SDK implementation imports.
 for n in ['conformance.mjs','conformance.py','worker.mjs','record.mjs','registration.mjs','worker.py']:
  text=(ROOT/'tests/package-consumers'/n).read_text().replace('kujolang.typescript-process','example.private-ts-consumer').replace('kujolang.python-process','example.private-python-consumer')
  (where/n).write_text(text)
 shutil.copyfile(ROOT/'docs/contracts/participant-sdk/conformance.json',where/'conformance.json')
 if lang=='ts':
  for n in ['package.json','package-lock.json']:shutil.copyfile(where/'download'/n,where/n)
  run(['npm','ci','--offline','--ignore-scripts','--no-audit','--no-fund'],where)
  package=where/'node_modules/@kujolang/participant-sdk';python=None
  # npm retains exact locked production closure.
  assert json.loads((where/'package-lock.json').read_bytes())==lock
 else:
  run([sys.executable,'-m','venv',where/'venv'],where);python=where/'venv/bin/python'
  run([python,'-m','pip','install','--no-index','--no-cache-dir','--only-binary=:all:','--require-hashes','--find-links',where/'download','-r',where/'download/requirements.lock'],where)
  run([python,'-m','pip','check'],where)
  package=Path(run([python,'-I','-c','import kujo_participant_sdk,pathlib;print(pathlib.Path(kujo_participant_sdk.__file__).parent)'],where).decode().strip())
 assert str(ROOT) not in str(package) and sha((package/'assets/manifest.json').read_bytes())==(npm_assets if lang=='ts' else py_assets)
 namespace='example.private-'+('ts' if lang=='ts' else 'python')+'-consumer';schema=namespace+'-correlation/v1alpha1'
 bindings={'package_worker':str(where/('worker.mjs' if lang=='ts' else 'worker.py')),'consumer_namespace':namespace,'consumer_schema':schema}
 bindings.update({'package_record':str(where/'record.mjs')} if lang=='ts' else {'package_python':str(python)})
 paths=[p for p in package.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc']
 paths += [where/'reviewed-pins.json', where/'download'/('package-lock.json' if lang=='ts' else 'requirements.lock')]
 paths += [where/n for n in (['worker.mjs','record.mjs','registration.mjs'] if lang=='ts' else ['worker.py'])]
 files=[{'root':str(p.parent),'path':p.name,'sha256':sha(p.read_bytes())} for p in sorted(paths)];assert len(files)<=64
 dump(where/'installation.json',{'schema':'kujo.participant-package-installation/v1alpha1','artifact_sha256':review['artifacts'][TGZ if lang=='ts' else WHEEL],'bindings':bindings,'files':files})
 dump(where/'config.json',{**bindings,'package_manifest_root':str(where),'package_probe_files':[str(package/('dist/index.js' if lang=='ts' else '_sdk.py')),str(package/'assets/core.schema.json')]})
 consumers.append((lang,where,python,package))
server.shutdown();server.server_close();thread.join();shutil.rmtree(FEED)
# No live feed for any consumer execution or real controller test.
results=[]
for lang,where,python,package in consumers:
 result=json.loads(run(['node','conformance.mjs'] if lang=='ts' else [python,'-I',where/'conformance.py'],where));assert len(result['cases'])==45;results.append(result)
 # New owner exercises every recording helper from public API.
 corpus=json.loads((where/'conformance.json').read_bytes());d=corpus['handoff'];reg=corpus['registration'];ns='example.private-'+('ts' if lang=='ts' else 'python')+'-consumer'
 reg['namespace']=ns;reg['participant']['schema']=ns+'-correlation/v1alpha1';d['participant']['namespace']=ns;d['participant_extension']['schema']=reg['participant']['schema']
 dump(where/'consumer.json',{'registration':reg,'handoff':d})
 for ext in ['mjs','py']:shutil.copyfile(ROOT/'tests/distribution-consumers'/('consumer.'+ext),where/('consumer.'+ext))
 output=json.loads(run(['node','consumer.mjs'] if lang=='ts' else [python,'-I',where/'consumer.py'],where));assert output['match'] and output['knowledge']==['unknown','reported','unknown']
assert results[0]==results[1]
report={'schema':'kujo.private-sdk-distribution-rehearsal/v1alpha1','root':str(OUT),'pins':pins,'negative_cases':negatives,'feed_removed':True,'conformance':{'ts':45,'python':45,'exact_parity':True},'consumer_configs':{lang:str(where/'config.json') for lang,where,_,_ in consumers},'request_count':len(requests),'assets':npm_asset_files,'capabilities':capabilities,'install_manifests':{lang:sha((where/'installation.json').read_bytes()) for lang,where,_,_ in consumers},'tools':{'python':sys.version,'node':run(['node','--version'],OUT).decode().strip(),'npm':run(['npm','--version'],OUT).decode().strip()}}
dump(OUT/'report.json',report);print(json.dumps(report))
