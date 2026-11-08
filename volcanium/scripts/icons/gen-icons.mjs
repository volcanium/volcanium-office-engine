// Remplace les icônes de barre d'outils d'ONLYOFFICE (CC BY-SA 4.0) par des icônes Tabler (MIT) ou par des tracés originaux (extra-icons.mjs) : AUCUNE icône d'amont ne doit rester.
// - SVG 2.5x : le CSS d'amont colorie par `fill` -> on convertit les traits de Tabler en formes pleines (svg-outline-stroke).
// - PNG 1x..2x : sprites utilisés quand le ratio de pixels est < 2,5 ; chaque PNG = [état normal | état actif] côte à côte.
// Usage : node gen-icons.mjs   (depuis scripts/icons, après `npm install`)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import outlineStroke from "svg-outline-stroke";
import { extraLookup } from "./extra-icons.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APPS = path.resolve(HERE, "../../upstream/web-apps/apps");
const TABLER = path.join(HERE, "node_modules/@tabler/icons/icons/outline");
const map = JSON.parse(fs.readFileSync(path.join(HERE, "icon-map.json"), "utf8"));
delete map._doc;

/** Entrée d'icône pour un nom d'emplacement : `{ key, src }` (src = SVG trait 24 px, trait 2) ou `null`. */
const entryOf = (name) => {
  for (const n of [name, name.replace(/-rtl$/, ""), name.replace(/^btn-big-/, "btn-"), name.replace(/^btn-big-/, "btn-").replace(/-rtl$/, "")]) {
    const t = map[n];
    if (t) return tablerEntry(t);
  }
  for (const n of [name, name.replace(/^btn-big-/, "btn-")]) {
    const x = extraLookup(n);
    if (x?.tabler) return tablerEntry(x.tabler);
    if (x?.svg) return { key: `custom:${n}`, src: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${x.svg}</svg>` };
  }
  return null;
};
const tablerEntry = (t) => {
  const file = path.join(TABLER, `${t}.svg`);
  if (!fs.existsSync(file)) throw new Error(`icône Tabler inconnue : ${t}`);
  return { key: t, src: fs.readFileSync(file, "utf8") };
};

const outlined = new Map(); // clé -> "d" attribute(s)
function strokeSvg(e, w, h, color, sw = 1.5) {
  const inner = e.src.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<path stroke="none"[^>]*\/>/, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}
async function glyph(e) {
  if (outlined.has(e.key)) return outlined.get(e.key);
  // `svg-outline-stroke` rastérise puis vectorise (potrace) : on rastérise à 10x pour un tracé net (viewBox 240).
  const out = await outlineStroke(e.src.replace(/stroke-width="2"/, 'stroke-width="1.25"').replace(/ width="24"/, ' width="240"').replace(/ height="24"/, ' height="240"'), { optTolerance: 0.3 });
  const ds = [...out.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
  outlined.set(e.key, ds);
  return ds;
}
const svgOf = (ds, w, h, color = "#000") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 240 240" fill="none">${ds.map((d) => `<path fill="${color}" fill-rule="evenodd" clip-rule="evenodd" d="${d}"/>`).join("")}</svg>\n`;

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p); else yield p;
  }
}

const stats = { svg: 0, png: 0, unmappedNames: new Set(), mappedNames: new Set(), errors: [] };
for (const app of ["common", "documenteditor", "spreadsheeteditor", "presentationeditor"]) {
  const root = path.join(APPS, app, "main/resources/img/toolbar");
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root)) {
    const ext = path.extname(file);
    const name = path.basename(file, ext).replace(/@.*$/, "");
    if (![".svg", ".png"].includes(ext) || !/^btn-|^animation-|^emptyicon/.test(name)) continue;
    if (ext === ".png" && !/\/(1x|1\.25x|1\.5x|1\.75x|2x)\//.test(file)) continue;
    if (ext === ".svg" && !/\/2\.5x\//.test(file)) continue;
    const t = entryOf(name);
    if (!t) { stats.unmappedNames.add(name); continue; }
    try {
      const ds = await glyph(t);
      if (ext === ".svg") {
        const head = fs.readFileSync(file, "utf8").slice(0, 300);
        const m = head.match(/width="(\d+)"\s+height="(\d+)"/);
        const [w, h] = m ? [+m[1], +m[2]] : [24, 24];
        fs.writeFileSync(file, svgOf(ds, w, h));
        stats.svg++;
      } else {
        const meta = await sharp(file).metadata();
        const h = meta.height, w = meta.width; // w = 2h : [normal | actif]
        const half = Math.round(w / 2);
        const render = async (color) => sharp(Buffer.from(strokeSvg(t, half, h, color)), { density: 72 * 4 }).resize(half, h).png().toBuffer();
        const normal = await render("#373737"), active = await render("#e9e9e9");
        await sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
          .composite([{ input: normal, left: 0, top: 0 }, { input: active, left: half, top: 0 }])
          .png().toFile(file + ".tmp");
        fs.renameSync(file + ".tmp", file);
        stats.png++;
      }
      stats.mappedNames.add(name);
    } catch (e) { stats.errors.push(`${name}: ${e.message}`); }
  }
}
const report = { svgFiles: stats.svg, pngFiles: stats.png, mapped: [...stats.mappedNames].sort(), unmapped: [...stats.unmappedNames].filter((n) => !stats.mappedNames.has(n)).sort(), errors: stats.errors };
fs.writeFileSync(path.join(HERE, "last-run.json"), JSON.stringify(report, null, 1));
console.log(`SVG remplacés : ${report.svgFiles} ; PNG remplacés : ${report.pngFiles}`);
console.log(`noms couverts : ${report.mapped.length} ; non couverts : ${report.unmapped.length} ; erreurs : ${report.errors.length}`);
if (report.errors.length) console.log(report.errors.slice(0, 10).join("\n"));
