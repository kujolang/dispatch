// No filesystem, Git, Dispatch or retry implementation. Host is an inherited IPC peer.
import { randomUUID } from 'node:crypto';
const request=x=>{if(!x||Object.keys(x).join()!=='call_id'||typeof x.call_id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(x.call_id)||/[\r\n]/.test(x.call_id))throw Error('invalid_request');return x;};
import { sdk } from './registration.mjs';
let next = 0;
function rpc(op, data) {
    return new Promise((resolve, reject) => {
        const n = ++next, timer = setTimeout(() => reject(new Error('host_unavailable')), 15000);
        const receive = (m) => { if (m?.n === n) {
            clearTimeout(timer);
            process.off('message', receive);
            m.ok ? resolve(m.data) : reject(new Error('not_admitted'));
        } };
        process.on('message', receive);
        process.send?.({ n, op, data });
    });
}
try {
    if (!process.send)
        throw new Error('host_unavailable');
    let raw = '';
    for await (const chunk of process.stdin) {
        raw += chunk;
        if (Buffer.byteLength(raw) > 512)
            throw new Error('invalid_request');
    }
    const input = request(JSON.parse(raw));
    const context = await rpc('admit', { ...input, process_instance_id: randomUUID() });
    // Persist participant-authored UNKNOWN handoff before the effect can start.
    await rpc('record', Buffer.from(sdk.provisional(context)).toString('utf8'));
    const completion = await rpc('execute', null);
    await rpc('record', Buffer.from(sdk.terminalReport(completion)).toString('utf8'));
    process.stdout.write('{"ok":true,"completion_knowledge":"reported"}\n');
    process.disconnect?.();
}
catch {
    process.stdout.write('{"ok":false,"code":"participant_unavailable"}\n');
    process.disconnect?.();
    process.exitCode = 1;
}
