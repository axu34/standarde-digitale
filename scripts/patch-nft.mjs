import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nftPath = join(root, ".next/server/app/api/audit/route.js.nft.json");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const extras = [
  join(root, "node_modules/playwright-core/browsers.json"),
  join(root, "node_modules/playwright-core/package.json"),
  ...walk(join(root, "node_modules/@sparticuz/chromium/bin")),
];

const nft = JSON.parse(readFileSync(nftPath, "utf8"));
const existing = new Set(nft.files);
let added = 0;
for (const abs of extras) {
  const rel = relative(dirname(nftPath), abs);
  if (!existing.has(rel)) {
    nft.files.push(rel);
    existing.add(rel);
    added += 1;
  }
}
writeFileSync(nftPath, JSON.stringify(nft));
console.log(`NFT patch: +${added} files for /api/audit (now ${nft.files.length})`);
