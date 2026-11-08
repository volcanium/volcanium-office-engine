// Autres images d'interface d'ONLYOFFICE (CC BY-SA 4.0) : logos, favicons, formats de fichier, modèles, motifs, dégradés, styles de trait, symboles… RE-DESSINÉES ici
// (tracés originaux, mêmes noms, dimensions et identifiants de symboles que ceux attendus par l'interface d'amont ; icônes de glyphes : Tabler, MIT).
// Usage : node gen-misc-images.mjs (depuis scripts/icons) ; écrit dans upstream/web-apps/apps/**/resources/img (et deploy/ si présent).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WA = path.resolve(HERE, "../../upstream/web-apps");
const APPS = path.join(WA, "apps");
const TABLER = path.join(HERE, "node_modules/@tabler/icons/icons/outline");
const log = [];

const rel = (r) => path.join(APPS, r);
const headText = (r) => execFileSync("git", ["show", `HEAD:apps/${r}`], { cwd: WA, encoding: "utf8", maxBuffer: 1 << 26 });
const headBuf = (r) => execFileSync("git", ["show", `HEAD:apps/${r}`], { cwd: WA, maxBuffer: 1 << 26 });
function put(r, data) {
  for (const base of [APPS, path.join(WA, "deploy/web-apps/apps")]) {
    const f = path.join(base, r);
    if (base !== APPS && !fs.existsSync(f)) continue;
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, data);
  }
  log.push(r);
}
const tabler = (name) => { const s = fs.readFileSync(path.join(TABLER, `${name}.svg`), "utf8"); return s.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<path stroke="none"[^>]*\/>/, ""); };
/** Glyphe Tabler (24 px) placé dans une boîte x,y,w,h, trait `color`. */
const glyph = (name, x, y, size, color, sw = 2) => `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${tabler(name)}</g>`;
const png = (svg, w, h) => sharp(Buffer.from(svg), { density: 72 * 4 }).resize(w, h).png().toBuffer();
const dims = (r) => { const t = headText(r).slice(0, 400); const m = /width="(\d+(?:\.\d+)?)(?:px)?"\s+height="(\d+(?:\.\d+)?)/.exec(t) ?? /height="(\d+)(?:px)?"[^>]*viewBox="0 0 (\d+) /.exec(t); return m ? [+m[1], +m[2]] : null; };

// ---------------------------------------------------------------- marque (chevron Volcanium) -------------------------------------------------------
const MARK = ["M0 89.9378L20.8498 79.613L0 69.9931V45.6945L66.3782 78.2446C67.0163 78.5764 67.5157 79.1016 67.8764 79.8203C68.237 80.5114 68.4174 81.2301 68.4174 81.9765C68.4174 82.7505 68.2509 83.4831 67.918 84.1742C67.585 84.8376 67.0718 85.349 66.3782 85.7084L0 120V89.9378Z", "M69 30.0622L48.1502 40.387L69 50.0069V74.3055L2.62183 41.7554C1.98372 41.4236 1.48432 40.8984 1.12364 40.1797C0.762967 39.4886 0.58263 38.7699 0.58263 38.0235C0.58263 37.2495 0.749095 36.5169 1.08203 35.8258C1.41497 35.1624 1.92817 34.651 2.62183 34.2916L69 0V30.0622Z"];
const mark = (w, h, fill) => { const s = Math.min(w, h) * 0.8 / 120; return `<g transform="translate(${(w - 69 * s) / 2} ${(h - 120 * s) / 2}) scale(${s})">${MARK.map((d) => `<path d="${d}" fill="${fill}"/>`).join("")}</g>`; };
const logoSvg = (w, h, fill) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${mark(w, h, fill)}</svg>\n`;
for (const [r, fill] of [["common/main/resources/img/about/logo_s.svg", "#ff714d"], ["common/main/resources/img/about/logo-white_s.svg", "#ffffff"], ["common/main/resources/img/header/header-logo_s.svg", "#ffffff"], ["common/main/resources/img/header/dark-logo_s.svg", "#1f1f22"], ["common/embed/resources/img/logo.svg", "#ff714d"], ["common/forms/resources/img/logo.svg", "#ff714d"]]) {
  const d = dims(r) ?? [85, 20];
  put(r, logoSvg(d[0], d[1], fill));
}
// favicons (ICO = 16 et 32 px en PNG)
async function ico() {
  const imgs = [];
  for (const s of [16, 32]) imgs.push(await png(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><rect width="${s}" height="${s}" rx="${s / 5}" fill="#1f1f22"/>${mark(s, s, "#ff714d")}</svg>`, s, s));
  const head = Buffer.alloc(6); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
  let off = 6 + 16 * imgs.length; const ents = [], parts = [];
  imgs.forEach((b, i) => { const e = Buffer.alloc(16); const s = [16, 32][i]; e[0] = s; e[1] = s; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(b.length, 8); e.writeUInt32LE(off, 12); off += b.length; ents.push(e); parts.push(b); });
  return Buffer.concat([head, ...ents, ...parts]);
}
const icoBuf = await ico();
for (const app of ["documenteditor", "spreadsheeteditor", "presentationeditor"]) put(`${app}/main/resources/img/favicon.ico`, icoBuf);

// ---------------------------------------------------------------- icônes de fichier (doc-formats) -------------------------------------------------------
const CAT = {
  text: "#4f7bd9", sheet: "#3aa655", slides: "#e0573b", pdf: "#d0342c", other: "#7a7a80",
};
const EXT = {
  text: "doc docm docx docxf dotm dotx epub fb2 fodt html htm mht odt oform ott rtf txt xml md", sheet: "csv fods ods ots xls xlsm xlsb xlsx xltm xltx", slides: "fodp odp otp pot potm potx pps ppsm ppsx ppt pptm pptx", pdf: "pdf djvu xps oxps",
};
const catOf = (name) => Object.entries(EXT).find(([, v]) => v.split(" ").includes(name.toLowerCase()))?.[0] ?? "other";
const GLYPH = { text: "file-text", sheet: "table", slides: "presentation", pdf: "file-type-pdf", other: "file" };
const pageSvg = (w, h, cat, label) => {
  const c = CAT[cat], f = Math.min(w, h * 0.8) * 0.28;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M${w * 0.06} ${h * 0.06}h${w * 0.65}l${w * 0.23} ${w * 0.23}V${h * 0.94}H${w * 0.06}z" fill="#fff" stroke="${c}" stroke-width="${Math.max(1, w / 24)}" stroke-linejoin="round"/><path d="M${w * 0.71} ${h * 0.06}v${w * 0.23}h${w * 0.23}" stroke="${c}" stroke-width="${Math.max(1, w / 24)}" stroke-linejoin="round"/>${glyph(GLYPH[cat], (w - f * 1.6) / 2, h * 0.38, f * 1.6, c, 1.6)}</svg>\n`;
};
const fmtDir = "common/main/resources/img/doc-formats";
const ls = (d) => execFileSync("git", ["ls-tree", "--name-only", "HEAD", `apps/${d}/`], { cwd: WA, encoding: "utf8" }).split("\n").filter(Boolean).map((p) => path.basename(p));
for (const f of ls(fmtDir).filter((n) => n.endsWith(".svg") && !/^formats/.test(n))) {
  const name = f.replace(".svg", "").replace(/@\d+$/, ""); const [w, h] = dims(`${fmtDir}/${f}`) ?? [24, 30];
  put(`${fmtDir}/${f}`, pageSvg(w, h, catOf(name), name));
}
for (const f of ls(`${fmtDir}/large`).filter((n) => n.endsWith(".svg"))) {
  const name = f.replace(".svg", ""); const [w, h] = dims(`${fmtDir}/large/${f}`) ?? [80, 100];
  put(`${fmtDir}/large/${f}`, pageSvg(w, h, catOf(name), name));
}
// planches (formats.png 1200x30 + échelles, formats@2.5x.svg) : une cellule carrée par format, glyphe neutre
for (const f of ls(fmtDir).filter((n) => /^formats/.test(n))) {
  if (f.endsWith(".png")) {
    const b = headBuf(`${fmtDir}/${f}`); const m = await sharp(b).metadata();
    const n = Math.round(m.width / m.height), s = m.height;
    const cells = Array.from({ length: n }, (_, i) => glyph("file", i * s + s * 0.15, s * 0.1, s * 0.7, CAT.other, 1.5)).join("");
    put(`${fmtDir}/${f}`, await png(`<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${m.height}" viewBox="0 0 ${m.width} ${m.height}">${cells}</svg>`, m.width, m.height));
  } else {
    const t = headText(`${fmtDir}/${f}`); const m = /viewBox="0 0 (\d+) (\d+)"/.exec(t) ?? [0, 1200, 30]; const W = +m[1], H = +m[2], s = H, n = Math.round(W / H);
    put(`${fmtDir}/${f}`, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${Array.from({ length: n }, (_, i) => glyph("file", i * s + s * 0.15, s * 0.1, s * 0.7, CAT.other, 1.5)).join("")}</svg>\n`);
  }
}
// pages vierges / modèles / fichiers récents
for (const app of ["documenteditor", "presentationeditor", "spreadsheeteditor"]) {
  const cat = app === "documenteditor" ? "text" : app === "spreadsheeteditor" ? "sheet" : "slides";
  for (const f of ["blank.svg", "file-template.svg", "recent-file.svg"]) {
    const r = `${app}/main/resources/img/${f}`;
    try { headText(r); } catch { continue; }
    const d = dims(r) ?? (f === "recent-file.svg" ? [24, 30] : [96, 96]);
    put(r, pageSvg(d[0], d[1], cat, f));
  }
}
// modèles proposés à la création (128 px)
const TPL = { contracts: ["file-text", "#4f7bd9"], letter: ["mail", "#e0573b"], list: ["list-check", "#3aa655"], plan: ["calendar", "#7a7a80"] };
for (const [n, [g, c]] of Object.entries(TPL)) put(`api/documents/resources/templates/${n}.png`, await png(`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect x="20" y="8" width="88" height="112" rx="6" fill="#fff" stroke="${c}" stroke-width="3"/>${[48, 64, 80, 96].map((y) => `<path d="M34 ${y}h60" stroke="#c8c8cc" stroke-width="4" stroke-linecap="round"/>`).join("")}${glyph(g, 44, 18, 40, c, 1.6)}</svg>`, 128, 128));

// ---------------------------------------------------------------- petites images ------------------------------------------------------------------------
const two = async (name, color) => png(`<svg xmlns="http://www.w3.org/2000/svg" width="56" height="28" viewBox="0 0 56 28">${glyph(name, 6, 6, 16, "#373737", 2.2)}${glyph(name, 34, 6, 16, "#e9e9e9", 2.2)}</svg>`, 56, 28);
for (const base of ["common/embed/resources/img", "common/forms/resources/img"]) {
  for (const sc of ["", "@1.5x", "@2x"]) {
    for (const [n, g] of [["next-field", "chevron-right"], ["previous-field", "chevron-left"]]) {
      try { headBuf(`${base}/${n}${sc}.png`); } catch { continue; }
      const m = await sharp(headBuf(`${base}/${n}${sc}.png`)).metadata();
      put(`${base}/${n}${sc}.png`, await png(`<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${m.height}" viewBox="0 0 56 28">${glyph(g, 6, 6, 16, "#373737", 2.2)}${glyph(g, 34, 6, 16, "#e9e9e9", 2.2)}</svg>`, m.width, m.height));
    }
  }
}
for (const sc of ["", "@1.25x", "@1.5x", "@1.75x", "@2x"]) {
  const R2 = "common/main/resources/img/right-panels/rowscols_icon"; try { const b = headBuf(`${R2}${sc}.png`); const m = await sharp(b).metadata();
  put(`${R2}${sc}.png`, await png(`<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${m.height}" viewBox="0 0 56 32">${glyph("layout-grid", 4, 4, 24, "#373737", 1.6)}${glyph("layout-grid", 32, 4, 24, "#e9e9e9", 1.6)}</svg>`, m.width, m.height)); } catch { /* absent */ }
  const P2 = "common/main/resources/img/plugin/icon_add_on_default"; try { const pb = headBuf(`${P2}${sc}.png`); const pm = await sharp(pb).metadata(); put(`${P2}${sc}.png`, await png(`<svg xmlns="http://www.w3.org/2000/svg" width="${pm.width}" height="${pm.height}" viewBox="0 0 31 31">${glyph("puzzle", 3, 3, 25, "#7a7a80", 1.8)}</svg>`, pm.width, pm.height)); } catch { /* absent */ }
  const S2 = "common/main/resources/img/controls/Scroll_center"; try { const sb = headBuf(`${S2}${sc}.png`); const sm = await sharp(sb).metadata(); put(`${S2}${sc}.png`, await png(`<svg xmlns="http://www.w3.org/2000/svg" width="${sm.width}" height="${sm.height}" viewBox="0 0 14 13">${[1, 3.6, 6.2, 8.8, 11.4].map((y) => `<rect x="2.5" y="${y}" width="9" height="1" fill="#7a7a80"/>`).join("")}</svg>`, sm.width, sm.height)); } catch { /* absent */ }
}
put("common/main/resources/img/controls/Scroll_center.svg", `<svg width="7" height="13" viewBox="0 0 7 13" fill="none" xmlns="http://www.w3.org/2000/svg">${[0, 2.6, 5.2, 7.8, 10.4].map((y) => `<rect x="1" y="${y}" width="5" height="1" fill="#000"/>`).join("")}</svg>\n`);
for (const [f, g] of [["AutoColor", "palette"], ["NoFill", "ban"]]) for (const sc of ["", "@2x"]) { try { const b = headBuf(`presentationeditor/main/resources/img/toolbar/${f}${sc}.png`); const m = await sharp(b).metadata(); put(`presentationeditor/main/resources/img/toolbar/${f}${sc}.png`, await png(`<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${m.height}" viewBox="0 0 16 16">${glyph(g, 1, 1, 14, "#000", 1.8)}</svg>`, m.width, m.height)); } catch { /* absent */ } }

// symboles : avertissements (g:target), chargement (use:target), icônes d'en-tête
put("common/main/resources/img/controls/warnings_s.svg", `<svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<defs><style>g {display: none;} g:target {display: inline;}</style></defs>
<g id="attention"><path d="M20 4l17 30H3z" fill="#ffd112" stroke="#ffd112" stroke-width="2" stroke-linejoin="round"/><path d="M20 14v10M20 28v2" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>
<g id="done"><circle cx="20" cy="20" r="16" fill="#009900"/><path d="M12 20l6 6 11-11" stroke="#fff" stroke-width="4"/></g>
<g id="info"><circle cx="20" cy="20" r="16" fill="#007df1"/><path d="M20 12v1M20 18v11" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>
<g id="warning"><circle cx="20" cy="20" r="16" fill="#f62211"/><rect x="10" y="17" width="20" height="6" fill="#fff"/></g>
</svg>\n`);
put("common/main/resources/img/load-mask/loading.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<style>use {display: none} use:target {display: inline}</style>
<symbol id="symb-middle" viewBox="0 0 28 28"><circle cx="14" cy="14" fill="none" stroke="#fff" stroke-width="1.5" r="10.25" stroke-dasharray="160%, 40%"/></symbol>
<symbol id="symb-small1" viewBox="0 0 20 20"><circle cx="10" cy="10" fill="none" stroke="#444" stroke-width="1.5" r="7.25" stroke-dasharray="160%, 40%"/></symbol>
<use id="middle" href="#symb-middle"/><use id="small" href="#symb-small1"/>
</svg>\n`);
const hdr = (name, vb, g) => `<symbol id="${name}" viewBox="${vb}">${g}</symbol>`;
put("common/main/resources/img/header/icons.svg", `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="28px" height="60px" viewBox="0 0 28 60" xml:space="preserve">
${hdr("svg-icon-crypted", "0 0 20 20", glyph("shield-lock", 2, 2, 16, "currentColor", 1.6))}
${hdr("svg-icon-users", "0 0 28 20", glyph("users", 6, 2, 16, "currentColor", 1.6))}
</svg>\n`);

// BorderSize : traits (épaisseur / pointillés) — symboles et viewBox identiques à l'interface
const bsIds = [...headText("common/main/resources/img/combo-border-size/BorderSize.svg").matchAll(/<symbol id="([^"]+)"[^>]*viewBox="([^"]+)"/g)].map((m) => [m[1], m[2]]);
const dash = (id) => /dash-dot-dot/.test(id) ? "8 3 2 3 2 3" : /dash-dot/.test(id) ? "8 3 2 3" : /dashes-dense|dashes-spaced|dashes/.test(id) ? (/spaced/.test(id) ? "4 5" : /dense/.test(id) ? "3 1.5" : "6 3") : /dashes-wide|wide/.test(id) ? "10 4" : /dots-dense/.test(id) ? "1 1.5" : /dots/.test(id) ? "1.2 2.2" : "";
const thick = (id) => ({ "half-pt": 0.5, "one-pt": 1, "one-and-half-pt": 1.5, "two-and-quarter-pt": 2.25, "three-pt": 3, "four-and-half-pt": 4.5, "six-pt": 6 })[id];
const bsOut = bsIds.map(([id, vb]) => {
  const [, , w, h] = vb.split(" ").map(Number);
  const th = Math.min(h, thick(id) ?? (/wave/.test(id) ? 1 : h > 2 ? 2 : 1));
  const y = (h - th) / 2;
  if (/wave/.test(id)) { const pts = Array.from({ length: 29 }, (_, i) => `${(i * w) / 28} ${h / 2 + Math.sin((i / 28) * Math.PI * 7) * (h / 2 - 0.3)}`); return `<symbol id="${id}" viewBox="${vb}"><path d="M${pts.join(" L")}" fill="none" stroke="#000" stroke-width="0.8"/></symbol>`; }
  const d = dash(id);
  return `<symbol id="${id}" viewBox="${vb}">${d ? `<path d="M0 ${h / 2}H${w}" stroke="#000" stroke-width="${th}" stroke-dasharray="${d}" fill="none"/>` : `<rect x="0" y="${y}" width="${w}" height="${th}"${id === "half-pt" ? ' opacity="0.5"' : ""}/>`}</symbol>`;
}).join("\n");
const BS = "common/main/resources/img/combo-border-size/BorderSize.svg";
put(BS, `<svg aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden;" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n${bsOut}\n</svg>\n`);
put("spreadsheeteditor/main/resources/img/toolbar/BorderSize.svg", fs.readFileSync(rel(BS), "utf8"));

// extrémités de ligne (arrows.svg) : 9 variantes par famille (3 largeurs x 3 longueurs), pointe à gauche
const arrSyms = [...headText("common/main/resources/img/right-panels/arrows.svg").matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]);
const arr = (id) => {
  const n = +(/-(\d)$/.exec(id)?.[1] ?? 5), fam = id.replace(/-\d$/, "");
  if (id === "no-arrow-5") return `<rect x="11" y="8" width="22" height="3"/>`;
  const hw = [2.8, 4.4, 6][Math.floor((n - 1) / 3)], len = [8, 12, 19][(n - 1) % 3], tip = 9, cy = 9.5;
  const body = (x0) => `<rect x="${x0}" y="${cy - 1.5}" width="${34 - x0}" height="3"/>`;
  if (fam === "arrow") return `<path d="M${tip} ${cy}L${tip + len} ${cy - hw}V${cy + hw}Z"/>${body(tip + len - 2)}`;
  if (fam === "open-arrow") return `<path d="M${tip + len} ${cy - hw}L${tip + 1} ${cy}L${tip + len} ${cy + hw}" fill="none" stroke="#000" stroke-width="2"/>${body(tip + 3)}`;
  if (fam === "dimond-arrow") return `<path d="M${tip} ${cy}L${tip + len / 2} ${cy - hw}L${tip + len} ${cy}L${tip + len / 2} ${cy + hw}Z"/>${body(tip + len - 1)}`;
  return `<ellipse cx="${tip + len / 2}" cy="${cy}" rx="${len / 2}" ry="${hw}"/>${body(tip + len - 1)}`;
};
put("common/main/resources/img/right-panels/arrows.svg", `<svg aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden;" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n${arrSyms.map((id) => `<symbol id="${id}" viewBox="0 0 44 20">${arr(id)}</symbol>`).join("\n")}\n</svg>\n`);

// ---------------------------------------------------------------- planches matricielles : mêmes dimensions et grille -----------------------------------
// dégradés (gradients.png 150x250 : cellules de 50, 3 colonnes) : 8 directions linéaires + radiaux
async function gradients(sc, w, h) {
  const cell = w / 3, defs = [], cells = [];
  const lin = (a) => { const r = (a * Math.PI) / 180; return `x1="${0.5 - Math.cos(r) / 2}" y1="${0.5 - Math.sin(r) / 2}" x2="${0.5 + Math.cos(r) / 2}" y2="${0.5 + Math.sin(r) / 2}"`; };
  const kinds = [...[0, 45, 90, 135, 180, 225, 270, 315].map((a) => ["l", a]), ["r", 0], ["r", 1], ["r", 2], ["r", 3], ["r", 4], ["d", 0], ["d", 1]];
  const rows = Math.round(h / cell);
  for (let i = 0; i < 3 * rows; i++) {
    const [k, a] = kinds[i % kinds.length], x = (i % 3) * cell, y = Math.floor(i / 3) * cell;
    if (k === "l") defs.push(`<linearGradient id="g${i}" ${lin(a)}><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>`);
    else if (k === "r") defs.push(`<radialGradient id="g${i}" cx="${[0.5, 0, 1, 0, 1][a]}" cy="${[0.5, 0, 0, 1, 1][a]}" r="${a ? 1 : 0.7}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>`);
    else defs.push(`<linearGradient id="g${i}" ${lin(a ? 90 : 0)}><stop offset="0" stop-color="#000"/><stop offset="0.5" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>`);
    cells.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="url(#g${i})"/>`);
  }
  return png(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs.join("")}</defs>${cells.join("")}</svg>`, w, h);
}
for (const sc of ["", "@1.25x", "@1.5x", "@1.75x", "@2x"]) { const m = await sharp(headBuf(`common/main/resources/img/right-panels/gradients${sc}.png`)).metadata(); put(`common/main/resources/img/right-panels/gradients${sc}.png`, await gradients(sc, m.width, m.height)); }
// motifs (patterns.png 112x364 : cellules de 14, 8 colonnes) : pourcentages puis rayures / quadrillages
function patternCell(i) {
  const pct = [5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90];
  if (i < pct.length) { const p = pct[i] / 100; const px = []; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (((x * 7 + y * 13 + (x ^ y) * 3) % 100) / 100 < p) px.push(`M${x} ${y}h1v1h-1z`); return `<path d="${px.join("")}"/>`; }
  const k = i - pct.length, kind = k % 8, w = 1 + (Math.floor(k / 8) % 3);
  const L = [];
  if (kind === 0) for (let y = 0; y < 8; y += 8 / (6 - w * 1.5 > 1 ? 2 : 1)) L.push(`M0 ${y}h8v${w / 2}H0z`);
  if (kind === 1) for (let x = 0; x < 8; x += 4) L.push(`M${x} 0h${w / 2}v8h-${w / 2}z`);
  if (kind === 2) for (let d = -8; d < 8; d += 4) L.push(`M${d} 8L${d + 8} 0h${w / 2}L${d + 8 + w / 2} 0z`.replace(/z$/, `L${d + w / 2} 8z`));
  if (kind === 3) for (let d = 0; d < 16; d += 4) L.push(`M${d} 0L${d - 8} 8h${w / 2}L${d - 8 + w / 2} 8z`.replace(/z$/, `L${d + w / 2} 0z`));
  if (kind === 4) for (let y = 0; y < 8; y += 4) for (let x = 0; x < 8; x += 4) L.push(`M${x} ${y}h${w}v${w}h-${w}z`);
  if (kind === 5) L.push("M0 0h4v4H0zM4 4h4v4H4z");
  if (kind === 6) for (let y = 0; y < 8; y += 4) L.push(`M0 ${y}h8v1H0z`), L.push(`M${y} 0h1v8h-1z`);
  if (kind === 7) for (let y = 0; y < 8; y += 2) for (let x = (y / 2) % 2 ? 1 : 0; x < 8; x += 2) L.push(`M${x} ${y}h1v1h-1z`);
  return `<path d="${L.join("")}"/>`;
}
async function patterns(w, h, cell) {
  const cols = 8, rows = Math.round(h / cell), s = cell / 14, cells = [];
  for (let i = 0; i < cols * rows; i++) cells.push(`<g transform="translate(${(i % cols) * cell} ${Math.floor(i / cols) * cell}) scale(${(cell - 2 * s) / 8}) translate(${s / ((cell - 2 * s) / 8)} ${s / ((cell - 2 * s) / 8)})">${patternCell(i)}</g>`);
  return png(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#fff"/>${cells.join("")}</svg>`, w, h);
}
for (const sc of ["", "@1.25x", "@1.5x", "@1.75x", "@2x"]) { const m = await sharp(headBuf(`common/main/resources/img/right-panels/patterns${sc}.png`)).metadata(); put(`common/main/resources/img/right-panels/patterns${sc}.png`, await patterns(m.width, m.height, m.width / 8)); }
// styles d'extrémités de ligne (Begin-EndStyle.png 480x400 : 5 colonnes x 20 lignes) : trait seul, puis 9 pointes à gauche, trait, 9 pointes à droite ; taille croissante
async function endStyles(w, h) {
  const cw = w / 5, ch = h / 20, out = [];
  for (let r = 0; r < 20; r++) for (let c = 0; c < 5; c++) {
    const x0 = c * cw, y = r * ch + ch / 2, sz = 3 + c * 1.5;
    const left = r >= 1 && r <= 9, right = r >= 11, kind = ((left ? r - 1 : r - 11) % 9);
    const line = `<path d="M${x0 + 8} ${y}H${x0 + cw - 8}" stroke="#000" stroke-width="2"/>`;
    if (!left && !right) { out.push(line.replace(`M${x0 + 8}`, `M${x0 + cw * 0.15}`)); continue; }
    const dir = left ? 1 : -1, tip = left ? x0 + 10 : x0 + cw - 10;
    const fam = [0, 1, 2, 3, 0, 1, 2, 3, 0][kind];
    const marker = fam === 0 ? `<path d="M${tip} ${y}l${dir * sz * 2} ${-sz}v${sz * 2}z"/>` : fam === 1 ? `<path d="M${tip + dir * sz * 2} ${y - sz}L${tip} ${y}L${tip + dir * sz * 2} ${y + sz}" fill="none" stroke="#000" stroke-width="1.6"/>` : fam === 2 ? `<path d="M${tip} ${y}l${dir * sz} ${-sz}l${dir * sz} ${sz}l${-dir * sz} ${sz}z"/>` : `<circle cx="${tip + dir * sz}" cy="${y}" r="${sz}"/>`;
    out.push(line + marker);
  }
  return png(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${out.join("")}</svg>`, w, h);
}
for (const sc of ["", "@1.5x", "@2x"]) { const m = await sharp(headBuf(`common/main/resources/img/right-panels/Begin-EndStyle${sc}.png`)).metadata(); put(`common/main/resources/img/right-panels/Begin-EndStyle${sc}.png`, await endStyles(m.width, m.height)); }

// mise en forme conditionnelle (cf-icons.svg : barres et échelles de couleurs) et points de formulaire (form-points.svg)
const COL = { blue: "#4f7bd9", green: "#3aa655", lightblue: "#7fc4f0", purple: "#9c5fc9", red: "#e0573b", yellow: "#f2c230", white: "#ffffff" };
const cfIds = [...headText("spreadsheeteditor/main/resources/img/cf-icons.svg").matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]);
const cf = (id) => {
  const m = /^bar-(solid|gradient)-(\w+)$/.exec(id);
  if (m) { const c = COL[m[2]]; return [4, 9, 14].map((y, i) => m[1] === "solid" ? `<rect x="3" y="${y + 1}" width="${19 - i * 5}" height="4" fill="${c}"/>` : `<rect x="3" y="${y + 1}" width="${19 - i * 5}" height="4" fill="${c}" opacity="${1 - i * 0.3}"/>`).join(""); }
  const cols = id.replace("color-scale-", "").split("-").map((n) => COL[n]);
  return cols.map((c, i) => `<rect x="${3 + (i * 19) / cols.length}" y="3" width="${19 / cols.length + 0.2}" height="19" fill="${c}" stroke="#d0d0d4" stroke-width="0.3"/>`).join("");
};
put("spreadsheeteditor/main/resources/img/cf-icons.svg", `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden">\n${cfIds.map((id) => `<symbol id="${id}" viewBox="0 0 25 25">${cf(id)}</symbol>`).join("\n")}\n</svg>\n`);
const fp = (x, k) => `${k !== "Point" && k !== "EndPoint" ? `<path d="M${x + 10} 14H${x + 20}" stroke="#000" stroke-width="2"/>` : ""}${k !== "Point" && k !== "StartPoint" ? `<path d="M${x} 14H${x + 10}" stroke="#000" stroke-width="2"/>` : ""}<circle cx="${x + 10}" cy="14" r="${k === "Point" ? 3.5 : 3}" fill="#000"/>`;
put("documenteditor/main/resources/img/form-points.svg", `<svg style="position:absolute;width:0;height:0;overflow:hidden" xmlns="http://www.w3.org/2000/svg">\n${["Point", "StartPoint", "MiddlePoint", "EndPoint"].map((k, i) => `<symbol id="svg-icon-${k}" viewBox="${i * 20} 0 20 28">${fp(i * 20, k)}</symbol>`).join("\n")}\n</svg>\n`);
// puces et numérotations (bullets-and-numbering.png 38 x 722 : 19 lignes de 38 px) : aperçus redessinés (texte système)
const BN = [["None"], ["•"], ["○"], ["■"], ["✜"], ["➢"], ["✓"], ["◆"], ["1)", "a)", "i)"], ["1.", "1.1.", "1.1.1."], ["✜", "➢", "▪"], ["1.", "2.", "3."], ["1)", "2)", "3)"], ["I.", "II.", "III."], ["a)", "b)", "c)"], ["A.", "B.", "C."], ["a.", "b.", "c."], ["i.", "ii.", "iii."], ["—"]];
for (const sc of ["", "@1.5x", "@2x"]) {
  const m = await sharp(headBuf(`common/main/resources/img/toolbar/bullets-and-numbering${sc}.png`)).metadata(); const k = m.width / 38;
  const rows = BN.map((r, i) => {
    const y0 = i * 38 * k;
    if (r.length === 1) return `<text x="${19 * k}" y="${y0 + 22 * k}" font-size="${(r[0].length > 2 ? 8 : 14) * k}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" fill="#222">${r[0]}</text>`;
    return r.map((t, j) => `<text x="${3 * k}" y="${y0 + (11 + j * 9) * k}" font-size="${6.5 * k}" font-family="Helvetica, Arial, sans-serif" fill="#222">${t}</text><path d="M${14 * k + j * 2 * k} ${y0 + (9 + j * 9) * k}H${35 * k}" stroke="#999" stroke-width="${k}"/>`).join("");
  }).join("");
  put(`common/main/resources/img/toolbar/bullets-and-numbering${sc}.png`, await png(`<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${m.height}" viewBox="0 0 ${m.width} ${m.height}">${rows}</svg>`, m.width, m.height));
}
// drapeaux de la liste des langues (flags.png 48x204 : 3 colonnes x 17 lignes de 16x12) : tuiles NEUTRES (drapeau générique), plus aucune image d'amont
for (const sc of ["", "@1.5x", "@2x"]) {
  const m = await sharp(headBuf(`common/main/resources/img/controls/flags${sc}.png`)).metadata(); const cw = m.width / 3, ch = m.height / 17;
  const tiles = Array.from({ length: 51 }, (_, i) => { const x = (i % 3) * cw, y = Math.floor(i / 3) * ch; return `<rect x="${x + cw * 0.06}" y="${y + ch * 0.1}" width="${cw * 0.88}" height="${ch * 0.8}" fill="#c8c8cc"/><rect x="${x + cw * 0.06}" y="${y + ch * 0.1}" width="${cw * 0.1}" height="${ch * 0.8}" fill="#7a7a80"/>`; }).join("");
  put(`common/main/resources/img/controls/flags${sc}.png`, await png(`<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${m.height}" viewBox="0 0 ${m.width} ${m.height}">${tiles}</svg>`, m.width, m.height));
}
put("spreadsheeteditor/main/resources/img/v2/iconshuge@2.5x.svg", '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute"/>\n');
fs.writeFileSync(path.join(HERE, "last-run-misc.json"), JSON.stringify({ rewritten: log.length, files: log }, null, 1));
console.log(`images remplacées : ${log.length}`);
