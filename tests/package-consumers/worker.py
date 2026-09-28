"""Participant side of an inherited, local host channel. No effect configuration."""
import socket
import struct
import uuid
import json, re, sys
from kujo_participant_sdk import create_codec

def require(value):
    if not value: raise ValueError('participant_invalid')
def encode(value):
    return json.dumps(value,sort_keys=True,separators=(',',':')).encode()
def decode(raw):
    require(len(raw)<=8192)
    return json.loads(raw)
def request(raw):
    d=decode(raw)
    require(type(d) is dict and set(d)=={'call_id'} and type(d['call_id']) is str and re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}',d['call_id']))
    return d
sdk=create_codec({'namespace':'kujolang.python-process','participant':{'schema':'kujolang.python-process-correlation/v1alpha1','fields':{'call_id':'identifier','process_instance_id':'identifier'}},'effect':{'schema':'workcell.git-correlation/v1alpha1','fields':{'workcell_effect_id':'identifier','transaction_sha256':'sha256'}}})



def receive(channel):
    def exact(count):
        value=b''
        while len(value)<count:
            part=channel.recv(count-len(value));require(bool(part));value+=part
        return value
    count=struct.unpack('!I',exact(4))[0];require(count<=8192)
    return decode(exact(count))


def send(channel, value):
    raw=encode(value);channel.sendall(struct.pack('!I',len(raw))+raw)


def participate(fd):
    channel=socket.socket(fileno=fd);channel.settimeout(15)
    initial=receive(channel)
    if initial.get('mode')=='record':
        # Fresh recording-only process has no execute operation.
        raw=sdk.finalize_after_readback(initial['handoff'])
        send(channel,{'wire':raw.decode()});return
    call=request(encode(initial['request']))
    send(channel,{'op':'admit','call_id':call['call_id'],'process_instance_id':str(uuid.uuid4())})
    context=receive(channel);require(context.get('ok') is True)
    raw=sdk.provisional(context['handoff'])
    send(channel,{'op':'record','wire':raw.decode()})
    require(receive(channel)=={'ok':True})
    send(channel,{'op':'execute'})
    final=receive(channel);require(final.get('ok') is True)
    raw=sdk.terminal_report(final['handoff'])
    send(channel,{'op':'record','wire':raw.decode()})
    require(receive(channel)=={'ok':True})

try: participate(int(sys.argv[-1]))
except Exception: sys.exit(1)
