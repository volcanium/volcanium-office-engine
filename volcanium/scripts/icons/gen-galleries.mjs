// Galeries d'icônes d'ONLYOFFICE (CC BY-SA 4.0) : `shapetypes.svg` (formes, 172 symboles 20 px), `charttypes.svg` (graphiques, 45 symboles 40 px), `equationicons.svg` (équations, 12 symboles).
// Chaque symbole est RE-DESSINÉ ici (tracés originaux, générés par programme ; équations : icônes Tabler MIT) ; seuls les identifiants des symboles sont ceux que l'interface attend.
// Usage : node gen-galleries.mjs   (depuis scripts/icons) -> réécrit les trois fichiers dans upstream/web-apps/apps/common/main/resources/img/toolbar/ et leurs copies de deploy/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import outlineStroke from "svg-outline-stroke";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TB = path.resolve(HERE, "../../upstream/web-apps/apps/common/main/resources/img/toolbar");
const TABLER = path.join(HERE, "node_modules/@tabler/icons/icons/outline");
const R = (n) => +n.toFixed(2);

// ---------------------------------------------------------------- aides de dessin (grille 20 x 20) ----------------------------------------------
const P = (d) => `<path d="${d}"/>`;
const pts = (a, close = true) => `<path d="M${a.map(([x, y]) => `${R(x)} ${R(y)}`).join(" L")}${close ? " Z" : ""}"/>`;
const polyN = (n, r = 8, rot = -90, cx = 10, cy = 10) => pts(Array.from({ length: n }, (_, i) => { const a = ((rot + (360 / n) * i) * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }));
const starN = (n, r1 = 8.5, r2 = 3.8) => pts(Array.from({ length: n * 2 }, (_, i) => { const a = ((-90 + (180 / n) * i) * Math.PI) / 180; const r = i % 2 ? r2 : r1; return [10 + r * Math.cos(a), 10 + r * Math.sin(a)]; }));
const arcPts = (cx, cy, rx, ry, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const arcLine = (cx, cy, rx, ry, a0, a1) => pts(arcPts(cx, cy, rx, ry, a0, a1), false);
const rot90 = (a, k) => a.map(([x, y]) => { let [px, py] = [x - 10, y - 10]; for (let i = 0; i < k; i++) [px, py] = [-py, px]; return [px + 10, py + 10]; });
const circle = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
const rect = (x, y, w, h, rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const dotAt = (x, y) => P(`M${x} ${y}h.01`);
const line = (x1, y1, x2, y2) => P(`M${x1} ${y1}L${x2} ${y2}`);
const head = (x, y, dir, s = 2.4) => { // pointe de flèche ouverte en (x,y) orientée selon dir (radians)
  const l = (d) => `${R(x - s * Math.cos(dir + d))} ${R(y - s * Math.sin(dir + d))}`;
  return P(`M${l(0.6)}L${x} ${y}L${l(-0.6)}`);
};

// flèche pleine vers la droite (contour) ; les autres sens en pivotant
const RIGHT = [[2, 7.5], [10, 7.5], [10, 4], [18, 10], [10, 16], [10, 12.5], [2, 12.5]];
const arrow = (k) => pts(rot90(RIGHT, k));
const LRARROW = [[1.5, 10], [6, 5.5], [6, 8], [14, 8], [14, 5.5], [18.5, 10], [14, 14.5], [14, 12], [6, 12], [6, 14.5]];
const QUAD = [[10, 1.5], [13.5, 5], [11.5, 5], [11.5, 8.5], [15, 8.5], [15, 6.5], [18.5, 10], [15, 13.5], [15, 11.5], [11.5, 11.5], [11.5, 15], [13.5, 15], [10, 18.5], [6.5, 15], [8.5, 15], [8.5, 11.5], [5, 11.5], [5, 13.5], [1.5, 10], [5, 6.5], [5, 8.5], [8.5, 8.5], [8.5, 5], [6.5, 5]];

// appel de texte : cadre + trait d'attache ; `accent` ajoute la barre d'accentuation
const callout = (n, border, accent) => {
  const frame = border ? rect(7, 3, 11, 9) : P("M7 3h11M7 12h11");
  const tail = n === 1 ? line(7, 8, 2, 17) : n === 2 ? P("M7 8H3l-1 9") : P("M7 8H4l-2 3 .5 6");
  return frame + tail + (accent ? line(7, 2, 7, 13) : "");
};
const flow = {
  AlternateProcess: () => rect(2, 5, 16, 10, 3),
  Collate: () => P("M3 3h14L3 17h14z"),
  Connector: () => circle(10, 10, 7),
  Decision: () => P("M10 2l8 8-8 8-8-8z"),
  Delay: () => P("M3 3h8a7 7 0 0 1 0 14H3z"),
  Display: () => P("M2 10l4-6h8a4 6 0 0 1 0 12H6z"),
  Document: () => P("M3 3h14v11c-3 3-6-2-14 1z"),
  Extract: () => P("M10 3l7.5 13h-15z"),
  InputOutput: () => P("M6 4h12l-4 12H2z"),
  InternalStorage: () => rect(3, 3, 14, 14) + P("M7 3v14M3 7h14"),
  MagneticDisk: () => P("M3 5a7 2.5 0 0 1 14 0v10a7 2.5 0 0 1-14 0z") + P("M3 5a7 2.5 0 0 0 14 0"),
  MagneticDrum: () => P("M2 6a2.5 4 0 0 1 2.5-3H15a2.5 7 0 0 1 0 14H4.5A2.5 4 0 0 1 2 14z") + P("M15 3a2.5 7 0 0 0 0 14"),
  MagneticTape: () => P("M17 17H10a7 7 0 1 1 7-7v7zM10 17h7"),
  ManualInput: () => P("M3 7l14-3v13H3z"),
  ManualOperation: () => P("M3 4h14l-3 12H6z"),
  Merge: () => P("M2.5 4h15L10 17z"),
  Multidocument: () => P("M6 3h12v9") + P("M4 5h12v9") + P("M2 7h12v9c-2 2-5-1-12 0z"),
  OffpageConnector: () => P("M3 3h14v9l-7 5-7-5z"),
  OnlineStorage: () => P("M5 4h13a3 6 0 0 0 0 12H5a3 6 0 0 1 0-12z"),
  Or: () => circle(10, 10, 7.5) + P("M2.5 10h15M10 2.5v15"),
  PredefinedProcess: () => rect(2, 4, 16, 12) + P("M5 4v12M15 4v12"),
  Preparation: () => polyN(6, 8.5, 0),
  Process: () => rect(2, 4, 16, 12),
  PunchedCard: () => P("M7 3h11v14H2V8z"),
  PunchedTape: () => P("M2 4c3-2 6 2 8 0s5-2 8 0v11c-3-2-6 2-8 0s-5-2-8 0z"),
  Sort: () => P("M10 2l8 8-8 8-8-8z") + P("M2 10h16"),
  SummingJunction: () => circle(10, 10, 7.5) + P("M4.7 4.7l10.6 10.6M15.3 4.7L4.7 15.3"),
  Terminator: () => rect(2, 5, 16, 10, 5),
};
const action = (inner) => rect(2.5, 2.5, 15, 15) + inner;

const SHAPES = {
  accentBorderCallout1: () => callout(1, true, true), accentBorderCallout2: () => callout(2, true, true), accentBorderCallout3: () => callout(3, true, true),
  accentCallout1: () => callout(1, false, true), accentCallout2: () => callout(2, false, true), accentCallout3: () => callout(3, false, true),
  borderCallout1: () => callout(1, true, false), borderCallout2: () => callout(2, true, false), borderCallout3: () => callout(3, true, false),
  callout1: () => callout(1, false, false), callout2: () => callout(2, false, false), callout3: () => callout(3, false, false),
  actionButtonBackPrevious: () => action(P("M12 6.5v7L7 10z")), actionButtonBeginning: () => action(P("M12 6.5v7L7.5 10zM6.5 6.5v7")), actionButtonBlank: () => rect(2.5, 2.5, 15, 15),
  actionButtonDocument: () => action(P("M7.5 5h3.5l2 2v8h-5.5z")), actionButtonEnd: () => action(P("M8 6.5v7l4.5-3.5zM13.5 6.5v7")), actionButtonForwardNext: () => action(P("M8 6.5v7l5-3.5z")),
  actionButtonHelp: () => action(P("M8 8a2 2 0 1 1 3 1.7c-.7.4-1 .8-1 1.6M10 14h.01")), actionButtonHome: () => action(P("M6 10l4-3.5 4 3.5v4.5H6zM8.5 14.5V12h3v2.5")),
  actionButtonInformation: () => action(P("M10 9v5M10 6.2h.01")), actionButtonMovie: () => action(rect(6, 7, 6, 6) + P("M12 9l2.5-1.5v5L12 11")),
  actionButtonReturn: () => action(P("M13.5 7.5v3a2 2 0 0 1-2 2H7") + P("M9 10.5L7 12.5l2 2")), actionButtonSound: () => action(P("M6.5 8.5h2l3-2.5v8l-3-2.5h-2zM13.5 8a3 3 0 0 1 0 4")),
  arc: () => arcLine(4, 16, 13, 13, -90, 0),
  bentArrow: () => pts([[2, 17], [2, 10], [4, 6], [8, 5], [12, 5], [12, 2], [18, 7], [12, 12], [12, 8.5], [8, 8.5], [6.5, 9.5], [6, 11], [6, 17]]),
  bentConnector5: () => P("M2 16h4V4h8v12h4"), bentConnector5WithArrow: () => P("M2 16h4V4h8v12h2") + head(18.5, 16, 0), bentConnector5WithTwoArrows: () => P("M3.5 16h2.5V4h8v12h2") + head(1.5, 16, Math.PI) + head(18.5, 16, 0),
  bentUpArrow: () => pts([[2, 12], [12, 12], [12, 8], [10, 8], [14.5, 2.5], [19, 8], [17, 8], [17, 17], [2, 17]]),
  bevel: () => rect(2.5, 2.5, 15, 15) + rect(6, 6, 8, 8) + P("M2.5 2.5L6 6M17.5 2.5L14 6M2.5 17.5L6 14M17.5 17.5L14 14"),
  blockArc: () => pts([...arcPts(10, 14, 8, 11, 180, 360, 20), ...arcPts(10, 14, 4.2, 6, 360, 180, 20)]),
  bracePair: () => P("M6 3c-2 0-3 .8-3 2.5V8c0 1-.7 2-2 2 1.3 0 2 1 2 2v2.5C3 16.2 4 17 6 17M14 3c2 0 3 .8 3 2.5V8c0 1 .7 2 2 2-1.3 0-2 1-2 2v2.5c0 1.7-1 2.5-3 2.5"),
  can: () => P("M3 5a7 2.5 0 0 1 14 0v10a7 2.5 0 0 1-14 0z") + P("M3 5a7 2.5 0 0 0 14 0"),
  chevron: () => pts([[2, 3.5], [12, 3.5], [18, 10], [12, 16.5], [2, 16.5], [8, 10]]),
  chord: () => pts([...arcPts(10, 10, 8, 8, -40, 220, 28)]),
  circularArrow: () => arcLine(10, 11, 7, 7, 160, 410) + pts([[15.5, 1.5], [18.5, 7], [12.5, 7.5]]),
  cloud: () => P("M5.5 16a3.5 3.5 0 0 1-.5-7 4.5 4.5 0 0 1 8.5-1.5A4 4 0 0 1 14.5 16z"),
  cloudCallout: () => P("M6 13a3 3 0 0 1-.5-6 4 4 0 0 1 7.5-1.2A3.5 3.5 0 0 1 14.5 13z") + circle(5, 15.5, 1.1) + circle(2.6, 18, .7),
  corner: () => pts([[3, 3], [9, 3], [9, 11], [17, 11], [17, 17], [3, 17]]),
  cube: () => P("M3 6h10v11H3zM3 6l4-3h10l-4 3M17 3v11l-4 3"),
  curvedConnector3: () => P("M2 16c8 0 8-12 16-12"), curvedConnector3WithArrow: () => P("M2 16c7 0 7-12 14-12") + head(18.5, 4, 0), curvedConnector3WithTwoArrows: () => P("M4 16c6 0 6-12 12-12") + head(1.5, 16, Math.PI) + head(18.5, 4, 0),
  curvedDownArrow: () => P("M3 10c0-5 5-7 10-6") + P("M3 10c2-2 5-3 7-3") + P("M12 1.5l4 3-4 3") + P("M16 4.5c1 1 2 3 2 5") ,
  curvedLeftArrow: () => P("M17 3c-5 0-7 4-7 7s2 7 7 7") + P("M13.5 8.5L10 12l3.5 3.5") + P("M10 12c3 0 5 .5 7 3"),
  curvedRightArrow: () => P("M3 3c5 0 7 4 7 7s-2 7-7 7") + P("M6.5 8.5L10 12l-3.5 3.5") + P("M10 12c-3 0-5 .5-7 3"),
  curvedUpArrow: () => P("M3 10c0 5 5 7 10 6") + P("M3 10c2 2 5 3 7 3") + P("M12 18.5l4-3-4-3") + P("M16 15.5c1-1 2-3 2-5"),
  decagon: () => polyN(10, 8.5, -90), diagStripe: () => pts([[2, 18], [2, 11], [11, 2], [18, 2]]),
  diamond: () => P("M10 2l8 8-8 8-8-8z"), dodecagon: () => polyN(12, 8.5, -75),
  donut: () => circle(10, 10, 8) + circle(10, 10, 4), doubleWave: () => P("M2 7c3-3 4 3 8 0s5 3 8 0M2 14c3-3 4 3 8 0s5 3 8 0"),
  downArrow: () => arrow(1), downArrowCallout: () => P("M3 2h14v7H3z") + P("M7.5 9v4.5H5L10 18.5l5-5h-2.5V9"),
  ellipse: () => `<ellipse cx="10" cy="10" rx="8" ry="6"/>`, ellipseRibbon: () => P("M2 4c4 2 12 2 16 0v8c-4 2-12 2-16 0z") + P("M2 4l2 4-2 4M18 4l-2 4 2 4"), ellipseRibbon2: () => P("M2 8c4-2 12-2 16 0v8c-4-2-12-2-16 0z") + P("M2 8l2 4-2 4M18 8l-2 4 2 4"),
  foldedCorner: () => P("M3 3h14v9l-5 5H3z") + P("M17 12h-5v5"), frame: () => rect(2.5, 2.5, 15, 15) + rect(6, 6, 8, 8),
  halfFrame: () => pts([[3, 3], [17, 3], [13.5, 7], [7, 7], [7, 13.5], [3, 17]]),
  heart: () => P("M10 17l-6.2-6.2a4.2 4.2 0 0 1 5.9-6L10 5l.3-.2a4.2 4.2 0 0 1 5.9 6z"), heptagon: () => polyN(7, 8.5, -90), hexagon: () => polyN(6, 8.5, 0),
  homePlate: () => pts([[2, 4], [13, 4], [18, 10], [13, 16], [2, 16]]), horizontalScroll: () => P("M5 4h12v10H5") + P("M5 4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12") + P("M5 4a2 2 0 0 1 0 4M5 8h2"),
  irregularSeal1: () => pts([[2, 7], [6, 6], [6, 2], [9.5, 5], [12, 2], [13, 6], [18, 5], [15, 9], [18, 13], [13, 12], [12, 17], [9, 13.5], [5, 17], [6, 12], [2, 11], [5, 9]]),
  irregularSeal2: () => pts([[2, 8], [7, 7], [5, 3], [9.5, 5.5], [11, 2], [13, 5.5], [17, 3.5], [15, 8], [18.5, 9.5], [15, 12], [17, 16.5], [12, 15], [10, 18.5], [8, 15], [3.5, 17], [6, 12], [2, 11]]),
  leftArrow: () => arrow(2), leftArrowCallout: () => P("M7 3h10v14H7z") + P("M7 7.5H5V5L1.5 10 5 15v-2.5h2"),
  leftBrace: () => P("M14 3c-2.5 0-4 1-4 3v2c0 1.2-.8 2-3 2 2.2 0 3 .8 3 2v2c0 2 1.5 3 4 3"), leftBracket: () => P("M14 3H8v14h6"),
  leftRightArrow: () => pts(LRARROW), leftRightArrowCallout: () => P("M6 3h8v14H6z") + P("M6 7.5H4.5V5.5L1.5 10l3 4.5v-2H6M14 7.5h1.5V5.5l3 4.5-3 4.5v-2H14"),
  leftRightUpArrow: () => pts([[10, 1.5], [14, 5.5], [11.5, 5.5], [11.5, 9], [15, 9], [15, 6.5], [18.5, 11], [15, 15.5], [15, 13], [5, 13], [5, 15.5], [1.5, 11], [5, 6.5], [5, 9], [8.5, 9], [8.5, 5.5], [6, 5.5]]),
  leftUpArrow: () => pts([[1.5, 14], [5.5, 10.5], [5.5, 12.5], [8, 12.5], [8, 5.5], [5.5, 5.5], [9.5, 1.5], [13.5, 5.5], [11, 5.5], [11, 15.5], [5.5, 15.5], [5.5, 17.5]]),
  lightningBolt: () => pts([[11, 1.5], [4, 11], [9, 11], [7.5, 18.5], [16, 8], [11, 8]]),
  line: () => line(3, 17, 17, 3), lineWithArrow: () => line(3, 17, 16, 4) + head(17.5, 2.5, -Math.PI / 4, 3), lineWithTwoArrows: () => line(4.5, 15.5, 15.5, 4.5) + head(17.5, 2.5, -Math.PI / 4, 3) + head(2.5, 17.5, (3 * Math.PI) / 4, 3),
  mathDivide: () => P("M3 10h14M10 4.5h.01M10 15.5h.01"), mathEqual: () => P("M3 7.5h14M3 12.5h14"), mathMinus: () => P("M3 10h14"), mathMultiply: () => P("M4.5 4.5l11 11M15.5 4.5l-11 11"),
  mathNotEqual: () => P("M3 7.5h14M3 12.5h14M13 3L7 17"), mathPlus: () => P("M3 10h14M10 3v14"),
  moon: () => P("M14 17A8 8 0 0 1 8 2.5a7 7 0 1 0 6 14.5z"), noSmoking: () => circle(10, 10, 8) + P("M4.5 4.5l11 11"),
  notchedRightArrow: () => pts([[2, 7.5], [10, 7.5], [10, 4], [18, 10], [10, 16], [10, 12.5], [2, 12.5], [4.5, 10]]), octagon: () => polyN(8, 8.5, -67.5),
  parallelogram: () => P("M6 4h12l-4 12H2z"), pentagon: () => polyN(5, 8.5, -90),
  pie: () => pts([[10, 10], ...arcPts(10, 10, 8, 8, -90, 180, 24)]), plaque: () => P("M3 6a3 3 0 0 0 3-3h8a3 3 0 0 0 3 3v8a3 3 0 0 0-3 3H6a3 3 0 0 0-3-3z"),
  plus: () => pts([[7, 2.5], [13, 2.5], [13, 7], [17.5, 7], [17.5, 13], [13, 13], [13, 17.5], [7, 17.5], [7, 13], [2.5, 13], [2.5, 7], [7, 7]]),
  polyline1: () => P("M3 16l5-10 4 7 5-9"), polyline2: () => P("M3 15c3-9 5-9 7-4s5 2 7-6"),
  quadArrow: () => pts(QUAD), quadArrowCallout: () => rect(6, 6, 8, 8) + P("M10 1.5l2.5 3H7.5zM10 18.5l-2.5-3h5zM1.5 10l3-2.5v5zM18.5 10l-3 2.5v-5z"),
  rect: () => rect(2, 4, 16, 12), "rect-1": () => rect(2, 4, 16, 12),
  ribbon: () => P("M6 3h8v9H6zM6 7H2l2 3-2 3h4M14 7h4l-2 3 2 3h-4"),
  ribbon2: () => P("M6 8h8v9H6zM6 12H2l2-3-2-3h4M14 12h4l-2-3 2-3h-4"),
  rightArrow: () => arrow(0), rightArrowCallout: () => P("M3 3h10v14H3z") + P("M13 7.5h2V5l3.5 5-3.5 5v-2.5h-2"),
  rightBrace: () => P("M6 3c2.5 0 4 1 4 3v2c0 1.2.8 2 3 2-2.2 0-3 .8-3 2v2c0 2-1.5 3-4 3"), rightBracket: () => P("M6 3h6v14H6"),
  round1Rect: () => P("M2 4h11a5 5 0 0 1 5 5v7H2z"), round2DiagRect: () => P("M2 9a5 5 0 0 1 5-5h11v7a5 5 0 0 1-5 5H2z"), round2SameRect: () => P("M2 9a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v7H2z"), roundRect: () => rect(2, 4, 16, 12, 4),
  rtTriangle: () => pts([[3, 3], [3, 17], [17, 17]]), smileyFace: () => circle(10, 10, 8) + dotAt(7.2, 8) + dotAt(12.8, 8) + P("M6.5 12a4 4 0 0 0 7 0"),
  snip1Rect: () => pts([[2, 4], [13, 4], [18, 9], [18, 16], [2, 16]]), snip2DiagRect: () => pts([[6, 4], [18, 4], [18, 12], [14, 16], [2, 16], [2, 8]]), snip2SameRect: () => pts([[6, 4], [14, 4], [18, 8], [18, 16], [2, 16], [2, 8]]),
  snipRoundRect: () => P("M2 9a5 5 0 0 1 5-5h6l5 5v7H2z"), spline: () => P("M2 15C5 2 9 2 10 10s5 8 8-5"),
  star4: () => starN(4, 8.5, 3), star5: () => starN(5), star6: () => starN(6, 8.5, 4.8), star7: () => starN(7, 8.5, 5), star8: () => starN(8, 8.5, 5.5), star10: () => starN(10, 8.5, 6), star12: () => starN(12, 8.5, 6.5), star16: () => starN(16, 8.5, 7), star24: () => starN(24, 8.5, 7.4), star32: () => starN(32, 8.5, 7.6),
  stripedRightArrow: () => pts([[7, 7.5], [10, 7.5], [10, 4], [18, 10], [10, 16], [10, 12.5], [7, 12.5]]) + P("M2 7.5v5M4.5 7.5v5"),
  sun: () => circle(10, 10, 3.6) + P("M10 1.5v2.4M10 16.1v2.4M1.5 10h2.4M16.1 10h2.4M4 4l1.7 1.7M14.3 14.3L16 16M16 4l-1.7 1.7M5.7 14.3L4 16"),
  teardrop: () => P("M10 2.5c4 4.5 7 7.4 7 10.5a7 7 0 0 1-14 0c0-3.1 3-6 7-10.5z"),
  textRect: () => rect(2, 3, 16, 14) + P("M6.5 7h7M10 7v7"), trapezoid: () => P("M6 4h8l4 12H2z"), triangle: () => P("M10 3l8 14H2z"),
  upArrow: () => arrow(3), upArrowCallout: () => P("M3 11h14v7H3z") + P("M7.5 11V6.5H5L10 1.5l5 5h-2.5V11"), upDownArrow: () => pts(rot90(LRARROW, 1)),
  uturnArrow: () => P("M3 17V8a5 5 0 0 1 10 0v2") + P("M10 9l3 3.5 3-3.5"), verticalScroll: () => P("M4 5h10v12M4 5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2M14 17a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4") + P("M16 5h-2M4 5a2 2 0 0 1 0-2"),
  wave: () => P("M2 6c3-3 5 3 8 0s5 3 8 0v8c-3 3-5-3-8 0s-5-3-8 0z"),
  wedgeEllipseCallout: () => `<ellipse cx="10" cy="8" rx="8" ry="6"/>` + P("M6 13l-3 5 6.5-3.4"), wedgeRectCallout: () => P("M2 3h16v10h-8l-4 5v-5H2z"), wedgeRoundRectCallout: () => P("M5 3h10a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-5l-4 5v-5H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"),
};
for (const [k, f] of Object.entries(flow)) SHAPES[`flowChart${k}`] = f;

// ---------------------------------------------------------------- graphiques (grille 40 x 40) : barres / lignes / secteurs pleins ---------------------
const F = (x, y, w, h, o = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${o < 1 ? ` opacity="${o}"` : ""}/>`;
const PATH = (d, o = 1) => `<path d="${d}"${o < 1 ? ` opacity="${o}"` : ""}/>`;
const axis = F(5, 33, 30, 1.5, 0.5);
const cols = (stack, pct, three) => {
  const h = stack ? [[10, 8, 6], [14, 10, 6], [8, 12, 8]] : [[14], [22], [10], [18]];
  let out = axis;
  if (!stack) [[7, 14], [15, 22], [23, 10], [31, 18]].forEach(([x, hh], i) => { out += F(x - 0, 33 - hh, 5, hh, i % 2 ? 0.55 : 1); });
  else h.forEach((segs, i) => { let y = 33; segs.forEach((s, j) => { const hh = pct ? s * 1.1 : s; y -= hh; out += F(8 + i * 9, y, 6, hh - 0.5, [1, 0.6, 0.3][j]); }); });
  if (three) out += PATH("M7 12l3-3h5l-3 3z", 0.4) + PATH("M35 16l-3-3v8l3 3z", 0.4);
  return out;
};
const bars = (stack, pct, three) => `<g transform="matrix(0 1 -1 0 40 0)">${cols(stack, pct, three)}</g>`;
const lineChart = (marker, stack, three) => {
  const A = [[6, 28], [14, 20], [22, 24], [34, 10]], B = [[6, 33], [14, 27], [22, 30], [34, 20]];
  const poly = (a, o) => PATH(`M${a.map(([x, y]) => `${x} ${y}`).join(" L")}`, o).replace("/>", ' fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>');
  let out = axis + poly(A, 1) + (stack ? poly(B, 0.55) : poly(B.map(([x, y]) => [x, y - 6]), 0.55));
  if (marker) for (const [x, y] of A) out += `<circle cx="${x}" cy="${y}" r="2.2"/>`;
  if (three) out += PATH("M6 12l4-4h24l-4 4z", 0.3);
  return out;
};
const pie = (donut, three) => {
  const r0 = donut ? 7 : 0;
  const slice = (a0, a1, o) => {
    const p = (a, r) => { const q = (a * Math.PI) / 180; return [R(20 + r * Math.cos(q)), R(20 + r * Math.sin(q))]; };
    const [x0, y0] = p(a0, 14), [x1, y1] = p(a1, 14), [x2, y2] = p(a1, r0), [x3, y3] = p(a0, r0);
    const big = a1 - a0 > 180 ? 1 : 0;
    return PATH(donut ? `M${x0} ${y0}A14 14 0 ${big} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${big} 0 ${x3} ${y3}Z` : `M20 20L${x0} ${y0}A14 14 0 ${big} 1 ${x1} ${y1}Z`, o);
  };
  let out = slice(-90, 150, 1) + slice(150, 270, 0.4);
  if (three) out += PATH("M6 24a14 7 0 0 0 28 0v4a14 7 0 0 1-28 0z", 0.5);
  return out;
};
const area = (stack) => axis + PATH(stack ? "M6 33V22l9-6 9 5 10-9v21z" : "M6 33V20l9-8 9 7 10-10v24z", 0.6) + PATH(stack ? "M6 33V28l9-3 9 3 10-6v11z" : "M6 33V27l9-4 9 4 10-6v12z");
const CHARTS = {
  "chart-column-normal": () => cols(false), "chart-column-stack": () => cols(true), "chart-column-pstack": () => cols(true, true), "chart-column-3d-normal": () => cols(false, false, true), "chart-column-3d-stack": () => cols(true, false, true), "chart-column-3d-pstack": () => cols(true, true, true), "chart-column-3d-normal-per": () => cols(false, false, true),
  "chart-line-normal": () => lineChart(false), "chart-line-stack": () => lineChart(false, true), "chart-line-pstack": () => lineChart(false, true), "chart-line-normal-marker": () => lineChart(true), "chart-line-stack-marker": () => lineChart(true, true), "chart-line-pstack-marker": () => lineChart(true, true), "chart-line-3d": () => lineChart(false, false, true),
  "chart-pie-normal": () => pie(false), "chart-pie-doughnut": () => pie(true), "chart-pie-3d-normal": () => pie(false, true),
  "chart-bar-normal": () => bars(false), "chart-bar-stack": () => bars(true), "chart-bar-pstack": () => bars(true, true), "chart-bar-3d-normal": () => bars(false, false, true), "chart-bar-3d-stack": () => bars(true, false, true), "chart-bar-3d-pstack": () => bars(true, true, true),
  "chart-area-normal": () => area(false), "chart-area-stack": () => area(true), "chart-area-pstack": () => area(true),
  "chart-point-normal": () => axis + [[9, 26], [14, 18], [19, 24], [24, 12], [30, 16], [33, 8], [12, 30], [27, 24]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.4"${i % 2 ? ' opacity="0.55"' : ""}/>`).join(""),
  "chart-point-smooth-marker": () => axis + PATH("M7 27C13 10 19 32 24 18s7-8 10-12").replace("/>", ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>') + [[7, 27], [15, 22], [24, 18], [34, 6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.3"/>`).join(""),
  "chart-point-smooth": () => axis + PATH("M7 27C13 10 19 32 24 18s7-8 10-12").replace("/>", ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  "chart-point-line-marker": () => axis + PATH("M7 27L15 14l9 12 10-20").replace("/>", ' fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>') + [[7, 27], [15, 14], [24, 26], [34, 6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.3"/>`).join(""),
  "chart-point-line": () => axis + PATH("M7 27L15 14l9 12 10-20").replace("/>", ' fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'),
  "chart-stock-normal": () => axis + [[9, 12, 26], [17, 8, 22], [25, 14, 30], [33, 10, 24]].map(([x, a, b]) => F(x - 0.75, a - 3, 1.5, b - a + 6) + F(x - 3.5, a + 3, 3.5, 2) + F(x, b - 4, 3.5, 2)).join(""),
  "chart-combo-bar-line": () => cols(false) + PATH("M8 22L17 12l9 6 8-10", 1).replace("/>", ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  "chart-combo-bar-line-sec": () => cols(false) + PATH("M8 24L17 9l9 8 8-12").replace("/>", ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>') + F(36, 6, 1.5, 28, 0.5),
  "chart-combo-area-bar": () => area(false) + F(8, 24, 5, 9) + F(18, 20, 5, 13) + F(28, 22, 5, 11),
  "chart-combo-custom": () => cols(false) + PATH("M8 12h24M8 8h24", 0.5).replace("/>", ' stroke="currentColor" fill="none" stroke-width="1.5"/>') + `<circle cx="32" cy="9" r="3.5"/>`,
  "chart-spark-line": () => PATH("M5 28l7-10 6 6 8-12 9 8").replace("/>", ' fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'),
  "chart-spark-column": () => [[7, 14], [14, 24], [21, 10], [28, 20]].map(([x, h]) => F(x, 33 - h, 5, h)).join(""),
  "chart-spark-win": () => [[7, 1], [14, 1], [21, -1], [28, 1], [34, -1]].map(([x, s]) => F(x - 2, s > 0 ? 8 : 21, 5, 11, s > 0 ? 1 : 0.5)).join("") + F(4, 19.5, 33, 1, 0.5),
  "chart-surface-normal": () => PATH("M4 28l10-14 10 6 12-12v18l-12 8-10-6-10 6z", 0.7) + PATH("M4 28l10-14v14l10 6V20l12-12", 0.4).replace("/>", ' fill="none" stroke="currentColor" stroke-width="1.2"/>'),
  "chart-surface-wireframe": () => PATH("M4 28l10-14 10 6 12-12v18l-12 8-10-6-10 6z").replace("/>", ' fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>') + PATH("M14 14v14M24 20v14M9 21l10 6 12-12M19 17l10 6").replace("/>", ' fill="none" stroke="currentColor" stroke-width="1"/>'),
  "chart-contour-normal": () => `<circle cx="20" cy="20" r="15" opacity="0.3"/><circle cx="20" cy="20" r="10" opacity="0.55"/><circle cx="20" cy="20" r="5"/>`,
  "chart-contour-wireframe": () => [15, 10, 5].map((r) => `<circle cx="20" cy="20" r="${r}" fill="none" stroke="currentColor" stroke-width="1.6"/>`).join(""),
  "chart-radar": () => [14, 8].map((r) => polyOf(5, r, "none")).join("") + PATH("M20 6L31 17 27 30 12 30 8 17Z").replace("/>", ' fill="none" stroke="currentColor" stroke-width="2"/>'),
  "chart-radar-with-markers": () => [14, 8].map((r) => polyOf(5, r, "none")).join("") + PATH("M20 8L30 18 26 29 13 28 9 17Z").replace("/>", ' fill="none" stroke="currentColor" stroke-width="2"/>') + [[20, 8], [30, 18], [26, 29], [13, 28], [9, 17]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2"/>`).join(""),
  "chart-filled-radar": () => [14, 8].map((r) => polyOf(5, r, "none")).join("") + PATH("M20 8L30 18 26 29 13 28 9 17Z", 0.6),
};
function polyOf(n, r, fill) {
  const p = Array.from({ length: n }, (_, i) => { const a = ((-90 + (360 / n) * i) * Math.PI) / 180; return `${R(20 + r * Math.cos(a))} ${R(20.5 + r * Math.sin(a))}`; });
  return `<path d="M${p.join(" L")} Z" fill="${fill}" stroke="currentColor" stroke-width="1.2"/>`;
}

// ---------------------------------------------------------------- équations : icônes Tabler (MIT) -----------------------------------------------------
const EQ = { accent: "math-symbols", bracket: "brackets", fraction: "math-x-divide-y", function: "math-function", integral: "math-integral", largeOperator: "sum", limAndLog: "math-lower", matrix: "brackets-contain", operator: "math-equal-greater", radical: "square-root-2", script: "math-x-minus-y", symbols: "omega" };

// ---------------------------------------------------------------- assemblage ---------------------------------------------------------------------------
const SCALE = 20; // `svg-outline-stroke` rastérise puis vectorise : on dessine à 20x pour un tracé net ; le viewBox des symboles suit.
async function outlineMarkup(inner, vb, sw) {
  const px = vb * SCALE;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb} ${vb}" width="${px}" height="${px}" fill="none" stroke="#000" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  const out = await outlineStroke(svg, { optTolerance: 0.3 });
  return [...out.matchAll(/ d="([^"]+)"/g)].map((m) => `<path fill-rule="evenodd" clip-rule="evenodd" d="${m[1]}"/>`).join("\n");
}
async function buildShapes() {
  let out = `<svg aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden;" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n`;
  const ids = [...fs.readFileSync(path.join(TB, "shapetypes.svg"), "utf8").matchAll(/symbol id="svg-icon-([^"]+)"/g)].map((m) => m[1]);
  const missing = ids.filter((i) => !SHAPES[i]);
  if (missing.length) throw new Error(`formes sans dessin : ${missing.join(", ")}`);
  for (const id of ids) out += `<symbol id="svg-icon-${id}" viewBox="0 0 ${20 * SCALE} ${20 * SCALE}">\n${await outlineMarkup(SHAPES[id](), 20, 1.1)}\n</symbol>\n`;
  return out + "</svg>\n";
}
async function buildCharts() {
  const src = fs.readFileSync(path.join(TB, "charttypes.svg"), "utf8");
  const ids = [...src.matchAll(/symbol id="(chart-[^"]+)"/g)].map((m) => m[1]);
  const missing = ids.filter((i) => !CHARTS[i]);
  if (missing.length) throw new Error(`graphiques sans dessin : ${missing.join(", ")}`);
  const head = src.slice(0, src.indexOf("<symbol"));
  let out = head;
  for (const id of ids) {
    // Remplissages directs (pas de contour) : on retire seulement les attributs `currentColor` des traits, remplacés par un contour rendu plein.
    const raw = CHARTS[id]();
    const strokeParts = [...raw.matchAll(/<(path|circle)[^>]*stroke="currentColor"[^>]*\/>/g)].map((m) => m[0]);
    let fillPart = raw;
    for (const s of strokeParts) fillPart = fillPart.replace(s, "");
    fillPart = fillPart;
    const stroked = strokeParts.length ? await outlineMarkup(strokeParts.map((s) => s.replace(/stroke="currentColor"/, 'stroke="#000"')).join(""), 40, 2) : "";
    out += `<symbol id="${id}" viewBox="0 0 40 40">\n${fillPart}\n<g transform="scale(${1 / SCALE})">${stroked}</g>\n</symbol>\n`;
  }
  return out + "</svg>\n";
}
async function buildEquations() {
  const src = fs.readFileSync(path.join(TB, "equationicons.svg"), "utf8");
  const ids = [...src.matchAll(/symbol id="([^"]+)"/g)].map((m) => m[1]);
  let out = src.slice(0, src.indexOf("<symbol"));
  for (const id of ids) {
    const t = EQ[id.replace(/^svg-icon-/, "")];
    if (!t) throw new Error(`équation sans icône : ${id}`);
    const file = path.join(TABLER, `${t}.svg`);
    if (!fs.existsSync(file)) throw new Error(`icône Tabler inconnue : ${t}`);
    const s = fs.readFileSync(file, "utf8").replace(/stroke-width="2"/, 'stroke-width="1.5"');
    const o = await outlineStroke(s.replace(/ width="24"/, ` width="${24 * SCALE}"`).replace(/ height="24"/, ` height="${24 * SCALE}"`), { optTolerance: 0.3 });
    out += `<symbol id="${id}" viewBox="0 0 ${24 * SCALE} ${24 * SCALE}">\n${[...o.matchAll(/ d="([^"]+)"/g)].map((m) => `<path fill-rule="evenodd" clip-rule="evenodd" d="${m[1]}"/>`).join("\n")}\n</symbol>\n`;
  }
  return out + "</svg>\n";
}

const outputs = { "shapetypes.svg": await buildShapes(), "charttypes.svg": await buildCharts(), "equationicons.svg": await buildEquations() };
for (const [name, text] of Object.entries(outputs)) {
  fs.writeFileSync(path.join(TB, name), text);
  const dep = path.resolve(TB, "../../../../../../deploy/web-apps/apps/common/main/resources/img/toolbar", name);
  if (fs.existsSync(path.dirname(dep))) fs.writeFileSync(dep, text);
  console.log(name, text.length, "octets");
}
