"""Independent maintenance implementation, standard library only."""
import sys,json,hashlib,re

def encode(x,depth=0):
    assert depth<=8
    if x is None or isinstance(x,(str,bool)):
        return json.dumps(x,ensure_ascii=False,separators=(',',':'))
    if isinstance(x,int):
        assert abs(x)<=9007199254740991
        return str(x)
    if isinstance(x,list):
        assert len(x)<=64
        return '['+','.join(encode(v,depth+1) for v in x)+']'
    assert isinstance(x,dict) and len(x)<=64
    assert all(re.fullmatch(r'[A-Za-z0-9_.:-]{1,128}',k) for k in x)
    return '{'+','.join(encode(k)+':'+encode(x[k],depth+1) for k in sorted(x))+'}'
count=0
for path in sys.argv[1:]:
    raw=open(path,'rb').read();assert len(raw)<=1048576
    suite=json.loads(raw);assert suite['schema']=='dispatch.commitment-vectors/v1'
    assert suite['algorithm']=='sha256' and suite['encoding']=='utf-8' and suite['output']=='lowercase-hex-unprefixed'
    assert len(suite['vectors'])<=128
    hashes={}
    for v in suite['vectors']:
        assert v['recipe'] in ['exact_utf8','alpha_json','portable_json','ability_v1_json','ability_v2_json']
        text=v['input'] if v['recipe']=='exact_utf8' else encode(v['input'])
        data=text.encode('utf-8');assert len(data)<=8192
        assert text==v['preimage_utf8'] and data.hex()==v['preimage_hex']
        digest=hashlib.sha256(data).hexdigest();assert digest==v['sha256'],v['name']
        assert v['name'] not in hashes;hashes[v['name']]=digest;count+=1
    for a,b in suite['distinct']:assert hashes[a]!=hashes[b]
print(json.dumps({'checker':'independent-python','vectors':count,'ok':True}))
