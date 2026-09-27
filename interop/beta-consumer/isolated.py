"""Clean-room execution and dependency audit; no source from any adapter copied."""
import ast
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
here=Path(__file__).parent
allowed={'hashlib','json','re','sys','pathlib','jsonschema','copy','subprocess','tempfile','unittest','consumer'}
imports=set()
for name in ['consumer.py','test_consumer.py']:
    tree=ast.parse((here/name).read_text())
    for node in ast.walk(tree):
        if isinstance(node,ast.Import):imports.update(x.name.split('.')[0] for x in node.names)
        if isinstance(node,ast.ImportFrom):imports.add(node.module.split('.')[0])
assert imports<=allowed, imports-allowed
with tempfile.TemporaryDirectory(prefix='independent-beta-') as temp:
    root=Path(temp)
    for name in ['consumer.py','test_consumer.py']:shutil.copyfile(here/name,root/name)
    for name in ['publications','observations']:shutil.copytree(here/name,root/name)
    env=dict(os.environ);env.pop('PYTHONPATH',None)
    result=subprocess.run([sys.executable,'-I','-c',"import sys;sys.path.insert(0,'.');import unittest;unittest.main(module='test_consumer',verbosity=2)"],cwd=root,env=env,capture_output=True,text=True)
    print(result.stdout,end='');print(result.stderr,end='')
    if result.returncode:sys.exit(result.returncode)
    (here/'evidence').mkdir(exist_ok=True)
    shutil.copyfile(root/'evidence/decisions.json',here/'evidence/decisions.json')
    audit={'imports':sorted(imports),'implementation_sources':['consumer.py','test_consumer.py'],
           'ecosystem_implementation_imports':[], 'backend_implementations_copied':False,
           'files':{str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file() and '__pycache__' not in str(p)}}
    (here/'evidence/independence.json').write_text(json.dumps(audit,indent=2)+'\n')
    print('ISOLATED_CONSUMER_PASS')
