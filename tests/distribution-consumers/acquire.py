"""Consumer acquisition mechanism. Pins are supplied out of band by the operator.
No registry discovery, redirects, credentials, lifecycle scripts or admission.
"""
import hashlib,json,re,urllib.request,urllib.parse
from pathlib import Path
MAX=16*1024*1024
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args):raise ValueError('redirect_denied')

def acquire(base,pins,destination):
    url=urllib.parse.urlsplit(base)
    if url.scheme!='http' or url.hostname!='127.0.0.1' or url.username or url.password or url.query or url.fragment:raise ValueError('feed_denied')
    destination=Path(destination);destination.mkdir()
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
    for name,expected in pins['files'].items():
        if not re.fullmatch(r'[A-Za-z0-9_.-]+',name) or name in ('.','..') or not re.fullmatch('[0-9a-f]{64}',expected):raise ValueError('pin_invalid')
        with opener.open(base+'/'+name,timeout=10) as response:data=response.read(MAX+1)
        if len(data)>MAX or hashlib.sha256(data).hexdigest()!=expected:raise ValueError('artifact_mismatch')
        with (destination/name).open('xb') as f:f.write(data)
    # No package manager is called until the complete reviewed closure is acquired.
    return destination
