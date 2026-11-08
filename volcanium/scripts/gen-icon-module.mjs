// Génère apps/web/editor-ui/icons.generated.ts : correspondance « classe d'icône ONLYOFFICE -> composant Tabler » pour le ruban React.
// Source : scripts/icons/icon-map.json (mêmes correspondances que le remplacement des icônes de l'interface d'amont).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const map = JSON.parse(fs.readFileSync(path.join(HERE, "icons/icon-map.json"), "utf8")); delete map._doc;
const pascal = (n) => "Icon" + n.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("");
const pkg = fs.readFileSync(path.join(HERE, "../apps/web/node_modules/@tabler/icons-react/dist/tabler-icons-react.d.ts"), "utf8");
const exists = (c) => new RegExp(`\\b${c}\\b`).test(pkg);
const used = [...new Set(Object.values(map))].map((t) => [t, pascal(t)]);
const ok = used.filter(([, c]) => exists(c)), missing = used.filter(([, c]) => !exists(c));
const lines = [
  "// FICHIER GÉNÉRÉ par scripts/gen-icon-module.mjs : ne pas éditer.",
  `import { ${ok.map(([, c]) => c).join(", ")}, type Icon } from "@tabler/icons-react";`, "",
  "export const ICONS: Record<string, Icon> = {",
  ...Object.entries(map).filter(([, t]) => ok.some(([tt]) => tt === t)).map(([k, t]) => `  "${k}": ${pascal(t)},`),
  "};", "",
];
fs.writeFileSync(path.join(HERE, "../apps/web/editor-ui/icons.generated.ts"), lines.join("\n"));
console.log(`${Object.keys(map).length} classes ; ${ok.length} icônes Tabler importées ; manquantes dans le paquet : ${missing.map(([t]) => t).join(", ") || "aucune"}`);
