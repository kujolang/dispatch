// Maintenance guard: frozen readers are actual pre-extraction source, not new code twice.
import fs from 'node:fs'; import crypto from 'node:crypto'; import assert from 'node:assert/strict';
const base='tests/fixtures/interop_legacy/', manifest=JSON.parse(fs.readFileSync(base+'manifest.json'));
for(const [name,digest] of Object.entries(manifest.original_sha256)) {
 const stored=fs.readFileSync(base+name+'.kujo','utf8');
 const original=stored.slice(stored.indexOf('\n')+1).replaceAll('export func old_load_','export func load_');
 assert.equal(crypto.createHash('sha256').update(original).digest('hex'),digest,name);
}
console.log('Frozen legacy reader hashes verified: 4');
