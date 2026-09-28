"""Participant side of an inherited, local host channel. No effect configuration."""
import socket
import struct
import uuid
from .codec import decode, encode, parse, request, require


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
        raw=encode(initial['handoff']);parse(raw)
        send(channel,{'wire':raw.decode()});return
    call=request(encode(initial['request']))
    send(channel,{'op':'admit','call_id':call['call_id'],'process_instance_id':str(uuid.uuid4())})
    context=receive(channel);require(context.get('ok') is True)
    raw=encode(context['handoff']);parse(raw)
    send(channel,{'op':'record','wire':raw.decode()})
    require(receive(channel)=={'ok':True})
    send(channel,{'op':'execute'})
    final=receive(channel);require(final.get('ok') is True)
    raw=encode(final['handoff']);parse(raw)
    send(channel,{'op':'record','wire':raw.decode()})
    require(receive(channel)=={'ok':True})
