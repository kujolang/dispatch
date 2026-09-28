"""Run with the operator-installed virtualenv's python -I run.py COMMAND."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent / 'src'))
from kujo_participant.codec import assets_check, encode, parse, match, digest, decode, Invalid

def main():
    assets_check()
    mode = sys.argv[1]
    if mode == 'test':
        import unittest
        suite = unittest.defaultTestLoader.discover(str(Path(__file__).resolve().parent / 'tests'))
        return 0 if unittest.TextTestRunner(verbosity=2).run(suite).wasSuccessful() else 1
    if mode == 'participant':
        from kujo_participant.process import participate
        participate(int(sys.argv[2]))
        return 0
    data = sys.stdin.buffer.read(32769)
    if len(data) > 32768:
        raise Invalid()
    if mode == 'encode':
        raw = encode(decode(data))
    elif mode == 'parse':
        raw = encode(parse(data))
    elif mode == 'match':
        item = decode(data, 32768)
        raw = encode(match(bytes.fromhex(item['wire_hex']), item['expected']))
    else:
        raise Invalid()
    sys.stdout.buffer.write(raw)
    return 0

if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception:
        print('interop_invalid', file=sys.stderr)
        sys.exit(1)
