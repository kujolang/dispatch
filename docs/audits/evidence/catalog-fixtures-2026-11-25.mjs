import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const output = process.argv[2];
if (!output) throw new Error("Pass a new fixture directory under tests/tmp");
mkdirSync(dirname(output), { recursive: true });
mkdirSync(output);
for (const size of [240, 960]) {
  const root = join(output, String(size));
  const runs = {};
  for (let index = 0; index < size; index++) {
    const id = `run-fixture-${String(index).padStart(4, "0")}`;
    const key = ((index * 13) % 61) % 60;
    runs[id] = { updated_at: `2026-11-25 20:13:${String(key).padStart(2, "0")}` };
    mkdirSync(join(root, id), { recursive: true });
    writeFileSync(join(root, id, "state.json"), "{}\n");
  }
  writeFileSync(join(root, ".dispatch-run-index.json"), JSON.stringify({ version: 1, runs }));
}
