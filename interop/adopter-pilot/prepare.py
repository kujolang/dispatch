"""Reproduce the reviewed installation offline; never builds an SDK or fetches."""
import hashlib,json,os,shutil,subprocess,sys,tempfile
from pathlib import Path
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
PINS=ROOT/'docs/evidence/participant-sdk-distribution/reviewed-pins.json'

def prepare(feed,destination):
    pins=json.loads(PINS.read_bytes())
    destination.mkdir(mode=0o700);(destination/'download').mkdir()
    for name,expected in pins['files'].items():
        if not (name.endswith('.tgz') or name in ('package.json','package-lock.json')):continue
        source=feed/name
        if source.is_symlink() or not source.is_file():raise ValueError('reviewed_artifact_missing')
        raw=source.read_bytes()
        if hashlib.sha256(raw).hexdigest()!=expected:raise ValueError('reviewed_artifact_mismatch')
        (destination/name if name.endswith('.json') else destination/'download'/name).write_bytes(raw)
    for name in ('participant.mjs','registration.json'):shutil.copyfile(HERE/'consumer'/name,destination/name)
    subprocess.run([shutil.which('npm'),'ci','--offline','--ignore-scripts','--no-audit','--no-fund','--cache',str(destination/'cache')],cwd=destination,check=True,capture_output=True,
                   env={'PATH':os.environ['PATH'],'HOME':str(destination),'npm_config_registry':'http://127.0.0.1:1'})
    return destination

if __name__=='__main__':
    if len(sys.argv)!=3:raise SystemExit('usage: prepare.py REVIEWED_FEED NEW_CONSUMER_DIRECTORY')
    print(prepare(Path(sys.argv[1]).resolve(),Path(sys.argv[2]).resolve()))
