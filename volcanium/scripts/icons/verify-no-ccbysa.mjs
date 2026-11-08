// Vérifie qu'AUCUNE image d'amont (ONLYOFFICE, CC BY-SA 4.0) n'est livrée telle quelle : compare par hachage git (blob) chaque image du build (`deploy/`) et chaque
// image SOURCE des applications livrées avec les images du commit d'amont (HEAD de upstream/web-apps). Sortie : liste des images encore identiques à l'amont.
// Usage : node verify-no-ccbysa.mjs   (code de sortie 1 s'il en reste)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const WA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../upstream/web-apps");
const IMG = /\.(svg|png|gif|jpe?g|ico|webp|bmp)$/i;
const tree = execFileSync("git", ["ls-tree", "-r", "HEAD"], { cwd: WA, encoding: "utf8", maxBuffer: 1 << 28 }).split("\n").filter(Boolean).map((l) => { const [meta, p] = l.split("\t"); return [meta.split(" ")[2], p]; });
const upstream = new Map(tree.filter(([, p]) => IMG.test(p)).map(([h, p]) => [h, p]));
const blobHash = (f) => execFileSync("git", ["hash-object", f], { cwd: WA, encoding: "utf8" }).trim();
function* walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) yield* walk(p); else yield p; } }
const roots = ["deploy", ...["common/main", "documenteditor/main", "spreadsheeteditor/main", "presentationeditor/main", "api"].map((a) => `apps/${a}`)].map((r) => path.join(WA, r)).filter(fs.existsSync);
const files = [];
for (const r of roots) for (const f of walk(r)) if (IMG.test(f) && !/\/resources\/help\//.test(f)) files.push(f);
// git hash-object --stdin-paths : un seul processus
const out = execFileSync("git", ["hash-object", "--stdin-paths"], { cwd: WA, input: files.join("\n"), encoding: "utf8", maxBuffer: 1 << 28 }).split("\n").filter(Boolean);
const same = files.filter((f, i) => upstream.has(out[i])).map((f) => path.relative(WA, f));
console.log(`images contrôlées : ${files.length} ; encore identiques à l'amont : ${same.length}`);
const by = {}; for (const f of same) { const k = f.replace(/\/[^/]*$/, "").replace(/@\d.*$/, ""); by[k] = (by[k] ?? 0) + 1; }
for (const [k, n] of Object.entries(by).sort((a, b) => b[1] - a[1])) console.log(String(n).padStart(5), k);
fs.writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "last-verify.json"), JSON.stringify({ checked: files.length, identical: same }, null, 1));
process.exit(same.length ? 1 : 0);
