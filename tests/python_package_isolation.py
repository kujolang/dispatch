"""Copyable offline package proof; wheel cache is installation input only."""
import pathlib,subprocess,tempfile,shutil,sys,json
source=pathlib.Path('interop/python-participant').resolve()
with tempfile.TemporaryDirectory(prefix='kujo-independent-python-') as directory:
    package=pathlib.Path(directory)/'participant';package.mkdir()
    for name in ('src','tests','assets','docs'):shutil.copytree(source/name,package/name,ignore=shutil.ignore_patterns('__pycache__'))
    for name in ('run.py','requirements.lock'):shutil.copy2(source/name,package/name)
    subprocess.run([sys.executable,'-I','-m','venv',str(package/'.venv')],check=True)
    python=package/'.venv/bin/python'
    subprocess.run([str(python),'-I','-m','pip','install','--no-index','--find-links',str(source/'wheelhouse'),'--only-binary=:all:','--require-hashes','-r',str(package/'requirements.lock')],check=True)
    subprocess.run([str(python),'-I',str(package/'run.py'),'test'],cwd=package,env={},check=True)
    schema=package/'assets/core.schema.json';schema.write_bytes(schema.read_bytes()+b' ')
    rejected=subprocess.run([str(python),'-I',str(package/'run.py'),'parse'],input=b'{}',capture_output=True,cwd=package,env={})
    assert rejected.returncode==1 and rejected.stderr==b'interop_invalid\n'
    print(json.dumps({'ok':True,'external_copy':True,'network':False,'ecosystem_imports':False}))
