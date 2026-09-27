// Kill a real Kujo adapter after its explicit transaction boundary, before reply.
import {spawn} from 'node:child_process';
const [runtime, cwd, entry, root, boundary] = process.argv.slice(2);
const child = spawn(runtime, ['run', entry, root, boundary], {cwd, stdio:['ignore','pipe','pipe']});
let output='', error='', killed=false;
const timer=setTimeout(()=>{child.kill('SIGKILL'); process.exitCode=1;},15000);
child.stdout.on('data', chunk=>{output+=chunk; if(output.includes('CRASH_BOUNDARY')&&!killed){killed=true;child.kill('SIGKILL');}});
child.stderr.on('data', chunk=>{error+=chunk;});
child.on('close', (_code, signal)=>{clearTimeout(timer);if(!killed||signal!=='SIGKILL'||error!==''){console.error('Adapter crash boundary was not reached');process.exitCode=1;}else console.log('VERIFIED_SIGKILL');});
