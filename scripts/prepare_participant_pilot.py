"""Freeze reviewed public inputs only. Does not implement or simulate an adopter."""
import argparse,hashlib,json,tarfile,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sha=lambda b:hashlib.sha256(b).hexdigest()
p=argparse.ArgumentParser();p.add_argument('destination',type=Path);a=p.parse_args()
out=a.destination.resolve();out.mkdir(parents=True,exist_ok=False)
pins_raw=(ROOT/'docs/evidence/participant-sdk-distribution/reviewed-pins.json').read_bytes()
pins=json.loads(pins_raw);archive=out/'artifacts';archive.mkdir()
for name,expected in pins['files'].items():
    data=(ROOT/'.ci/participant-distribution/retained'/name).read_bytes()
    if sha(data)!=expected:raise ValueError('reviewed_artifact_mismatch')
    (archive/name).write_bytes(data)
(out/'reviewed-pins.json').write_bytes(pins_raw)
for lang in ['typescript','python']:(out/lang).mkdir()
ts=next(x for x in pins['packages'] if x['name'].startswith('@'))
py=next(x for x in pins['packages'] if not x['name'].startswith('@'))
assets=['core.schema.json','interop.md','portable-json.md','sdk-design.md','sdk-conformance.json','sdk-conformance-manifest.json','capabilities.json','manifest.json']
with tarfile.open(archive/ts['archive']) as t:
    for name in ['README.md','API.md']:(out/'typescript'/name).write_bytes(t.extractfile('package/'+name).read())
    for name in assets:(out/'typescript'/name).write_bytes(t.extractfile('package/assets/'+name).read())
with zipfile.ZipFile(archive/py['archive']) as z:
    from email.parser import BytesParser
    metadata=BytesParser().parsebytes(z.read('kujo_participant_sdk-0.1.0a1.dist-info/METADATA'))
    (out/'python/README.md').write_text(metadata.get_payload())
    (out/'python/API.md').write_bytes(z.read('kujo_participant_sdk/assets/api.md'))
    for name in assets:(out/'python'/name).write_bytes(z.read('kujo_participant_sdk/assets/'+name))
for name in ['HOST_INTERFACE.md','ADOPTER_TASK.md']:(out/name).write_bytes((ROOT/'docs/pilot/participant-sdk'/name).read_bytes())
files={str(f.relative_to(out)):sha(f.read_bytes()) for f in sorted(out.rglob('*')) if f.is_file()}
manifest={'schema':'kujo.participant-pilot-inputs/v1alpha1','status':'frozen-awaiting-adopter','files':files,'sdk_packages':pins['packages'],'documentation_provenance':'Extracted from exact reviewed packages; Python README is the wheel METADATA description. Host/task specs are coordinator-owned public pilot inputs.'}
raw=(json.dumps(manifest,sort_keys=True,indent=2)+'\n').encode();(out/'frozen-inputs.json').write_bytes(raw)
print(json.dumps({'bundle':str(out),'manifest_sha256':sha(raw),'files':len(files),'adoption_claim':False}))
