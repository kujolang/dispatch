# Acquisition and verification commands

These are the exact verification/acquisition snippets retained in this agent's tool-call history, transcribed here. They are not a shell session recording. Run from `/tmp/kujo-source-blind-adopter.ed0Hgo`. The original `journal.json` is unchanged.

The manifest's expected SHA-256 came separately from the coordinator. The initial command was:

```sh
shasum -a 256 onboarding/frozen-inputs.json
```

Observed digest: `37ed7e530b573bf0939243cc2c7337d527c1f82238b1ee73ab987b977cfca405`. I compared this with the coordinator-supplied digest before trusting the file inventory. The original shell call also printed the manifest, task, host interface and pins for reading; those reads did not modify inputs.

The exact manifest-file verification snippet was:

```sh
node --input-type=module <<'JS'
import fs from 'node:fs'; import crypto from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync('onboarding/frozen-inputs.json'));
const results=Object.entries(manifest.files).map(([file,hash])=>({file,pass:crypto.createHash('sha256').update(fs.readFileSync('onboarding/'+file)).digest('hex')===hash}));
fs.writeFileSync('input-verification.json',JSON.stringify(results,null,2)); if(results.some(r=>!r.pass)) process.exit(1);
console.log({verified:results.length});
JS
```

Observed: `{ verified: 39 }`, exit 0. Every named input was read as opaque bytes for hashing; this is distinct from consulting documentation or implementation.

After saving `comprehension.md`, I created the new consumer and copied the frozen install declarations:

```sh
mkdir -p consumer/download consumer/empty-cache
cp onboarding/artifacts/package.json onboarding/artifacts/package-lock.json consumer/
```

The exact acquisition snippet was:

```sh
node --input-type=module <<'JS'
import fs from 'node:fs';import crypto from 'node:crypto';
const pins=JSON.parse(fs.readFileSync('onboarding/reviewed-pins.json')).files;
const results=[];
for(const [name,hash] of Object.entries(pins).filter(([n])=>n.endsWith('.tgz'))){const url='http://127.0.0.1:18763/'+name;const r=await fetch(url);if(!r.ok)throw Error('acquisition '+r.status);const b=Buffer.from(await r.arrayBuffer());if(crypto.createHash('sha256').update(b).digest('hex')!==hash)throw Error('digest');fs.writeFileSync('consumer/download/'+name,b);results.push({url,sha256:hash,verified:true});}fs.writeFileSync('acquisition.json',JSON.stringify(results,null,2));
JS
```

This selected the six `.tgz` entries from the verified pins: SDK, Ajv, fast-deep-equal, fast-uri, json-schema-traverse and require-from-string. Each fetched body was checked against its separately frozen SHA-256 before being written into `consumer/download/`. There was no alternate feed, registry lookup or dependency upgrade.

The exact install command was:

```sh
npm ci --prefix consumer --offline --ignore-scripts --no-audit --cache consumer/empty-cache --registry http://127.0.0.1:9 > install.log 2>&1
```

It exited 0. `consumer/empty-cache` was newly created for this install. All lockfile resolutions point at the downloaded local archives. The offline option forbids registry acquisition; the configured registry additionally points at an unused loopback port. Replaying this command in the existing directory would no longer use an initially empty cache; for reproduction, use a new isolated consumer/cache with copies of the same frozen package declarations and exact verified archives.

Runtime observed before installation: `node --version` returned `v26.7.0`. Public proof and conformance imports use only the installed `@kujolang/participant-sdk` root exports. The original evidence files are `input-verification.json`, `acquisition.json`, `install.log` and `journal.json`; the registration explanation remains `registration-meaning.md`.
