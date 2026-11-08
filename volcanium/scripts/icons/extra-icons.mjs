// Icônes de barre d'outils SANS équivalent direct dans icon-map.json : remplacées par (a) des icônes Tabler (MIT) choisies par sens, ou
// (b) des tracés ORIGINAUX générés ici (chemins animés, galeries), dessinés sur la grille 24 px de Tabler (trait 2, bouts ronds).
// Rien de ce fichier ne vient d'ONLYOFFICE : les noms de fichiers sont seulement les emplacements que l'interface d'amont attend.
// `extraLookup(name)` -> { tabler: "nom" } | { svg: "<balisage trait>" } | null.

const R = (n, d = 2) => +n.toFixed(d);
/** Courbe paramétrique échantillonnée en polyligne lissée par les jointures rondes. t in [0,1]. */
function curve(fn, n = 48, close = false) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const [x, y] = fn(i / n); pts.push(`${R(x)} ${R(y)}`); }
  return `<path d="M${pts.join(" L")}${close ? " Z" : ""}"/>`;
}
const dot = (x, y) => `<path d="M${R(x)} ${R(y)}h.01"/>`;
const poly = (n, r = 8.5, rot = -90, cx = 12, cy = 12) => {
  const p = [];
  for (let i = 0; i < n; i++) { const a = ((rot + (360 / n) * i) * Math.PI) / 180; p.push(`${R(cx + r * Math.cos(a))} ${R(cy + r * Math.sin(a))}`); }
  return `<path d="M${p.join(" L")} Z"/>`;
};
const star = (n, r1 = 9, r2 = 4.2) => {
  const p = [];
  for (let i = 0; i < n * 2; i++) { const a = ((-90 + (180 / n) * i) * Math.PI) / 180; const r = i % 2 ? r2 : r1; p.push(`${R(12 + r * Math.cos(a))} ${R(12 + r * Math.sin(a))}`); }
  return `<path d="M${p.join(" L")} Z"/>`;
};
const arrowTo = (x1, y1, x2, y2) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 3.2;
  const l = (d) => `${R(x2 - h * Math.cos(a + d))} ${R(y2 - h * Math.sin(a + d))}`;
  return `<path d="M${x1} ${y1} L${x2} ${y2}"/><path d="M${l(0.6)} L${x2} ${y2} L${l(-0.6)}"/>`;
};

// ---- chemins de déplacement (diaporama) : le tracé lui-même + un point de départ -----------------------------------------------------------------
const MOTION = {
  "4-point-star": () => star(4, 9, 3.4) + dot(12, 3),
  "5-point-star": () => star(5) + dot(12, 3),
  "6-point-star": () => star(6, 9, 5) + dot(12, 3),
  "8-point-star": () => star(8, 9, 5.5) + dot(12, 3),
  "point-star": () => star(5, 9, 3.6) + dot(12, 3),
  "curvy-star": () => curve((t) => { const a = t * Math.PI * 2 - Math.PI / 2, r = 6.5 + 2.5 * Math.cos(a * 5 + Math.PI / 2 * 5); return [12 + r * Math.cos(a), 12 + r * Math.sin(a)]; }, 90, true) + dot(12, 3.5),
  "Inverted-square": () => `<path d="M5 5h14v14H5z"/>` + dot(19, 19),
  square: () => `<path d="M5 5h14v14H5z"/>` + dot(5, 5),
  "curved-square": () => `<rect x="4.5" y="4.5" width="15" height="15" rx="6"/>` + dot(12, 4.5),
  "Inverted-triangle": () => `<path d="M4 6h16L12 20z"/>` + dot(4, 6),
  "equal-triangle": () => `<path d="M12 4l8.5 15h-17z"/>` + dot(12, 4),
  "right-triangle": () => `<path d="M5 4v16h15z"/>` + dot(5, 4),
  diamond: () => `<path d="M12 3l9 9-9 9-9-9z"/>` + dot(12, 3),
  pentagon: () => poly(5, 9) + dot(12, 3),
  hexagon: () => poly(6, 9, -90) + dot(12, 3),
  octagon: () => poly(8, 9, -67.5) + dot(8.2, 3.2),
  parallelogram: () => `<path d="M8 5h13l-5 14H3z"/>` + dot(8, 5),
  trapezoid: () => `<path d="M8 5h8l5 14H3z"/>` + dot(8, 5),
  circle: () => `<circle cx="12" cy="12" r="8.5"/>` + dot(12, 3.5),
  football: () => curve((t) => { const a = t * Math.PI * 2; return [12 + 9 * Math.cos(a) * Math.cos(0.6) - 4.5 * Math.sin(a) * Math.sin(0.6), 12 + 9 * Math.cos(a) * Math.sin(0.6) + 4.5 * Math.sin(a) * Math.cos(0.6)]; }, 60, true) + dot(18.5, 7),
  teardrop: () => `<path d="M12 3c4 4.5 7 7.5 7 11a7 7 0 0 1-14 0c0-3.5 3-6.5 7-11z"/>` + dot(12, 3),
  heart: () => `<path d="M12 20l-7.2-7.2a4.7 4.7 0 0 1 6.6-6.7L12 6.7l.6-.6a4.7 4.7 0 0 1 6.6 6.7z"/>` + dot(12, 6.7),
  "cresent-moon": () => `<path d="M17.5 15.5A8 8 0 0 1 9 4a8.5 8.5 0 1 0 8.5 11.5z"/>` + dot(9, 4),
  bean: () => curve((t) => { const a = t * Math.PI * 2; const r = 7.5 + 2 * Math.cos(a + 1); return [12 + r * Math.cos(a) * 1.1, 12 + r * Math.sin(a) * 0.8 + 1.5 * Math.cos(2 * a)]; }, 60, true) + dot(19, 12),
  peanut: () => curve((t) => { const a = t * Math.PI * 2; const r = 6 - 2.3 * Math.cos(2 * a); return [12 + r * Math.cos(a) * 1.5, 12 + r * Math.sin(a) * 0.9]; }, 80, true) + dot(20, 12),
  neutron: () => `<circle cx="12" cy="12" r="1.2"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/>`,
  funnel: () => `<path d="M4 5h16l-6 8v6l-4-2v-4z"/>` + dot(4, 5),
  swoosh: () => curve((t) => [3 + 18 * t, 17 - 11 * Math.sin(t * Math.PI) * (1 - 0.3 * t) - 4 * t], 40) + dot(3, 17),
  "arc-down": () => `<path d="M4 9a8 8 0 0 0 16 0"/>` + dot(4, 9),
  "arc-up": () => `<path d="M4 15a8 8 0 0 1 16 0"/>` + dot(4, 15),
  "arc-left": () => `<path d="M15 4a8 8 0 0 0 0 16"/>` + dot(15, 4),
  "arc-right": () => `<path d="M9 4a8 8 0 0 1 0 16"/>` + dot(9, 4),
  arcs: () => `<path d="M3 12a4.5 4.5 0 0 1 9 0a4.5 4.5 0 0 1 9 0"/>` + dot(3, 12),
  "bounce-left": () => curve((t) => [20 - 17 * t, 20 - Math.abs(Math.sin(t * Math.PI * 3.5)) * 15 * (1 - t * 0.7)], 70) + dot(20, 20),
  "bounce-right": () => curve((t) => [4 + 17 * t, 20 - Math.abs(Math.sin(t * Math.PI * 3.5)) * 15 * (1 - t * 0.7)], 70) + dot(4, 20),
  "curved-x": () => `<path d="M4 4c8 4 8 12 16 16"/><path d="M20 4c-8 4-8 12-16 16"/>` + dot(4, 4),
  "curvy-left": () => `<path d="M20 5c-9 0-9 7 0 7c-9 0-9 7-16 7"/>` + dot(20, 5),
  "curvy-right": () => `<path d="M4 5c9 0 9 7 0 7c9 0 9 7 16 7"/>` + dot(4, 5),
  "s-curve-1": () => `<path d="M4 18C4 8 20 16 20 6"/>` + dot(4, 18),
  "s-curve-2": () => `<path d="M4 6c0 10 16 2 16 12"/>` + dot(4, 6),
  "decaying-wave": () => curve((t) => [3 + 18 * t, 12 - Math.sin(t * Math.PI * 4) * 8 * (1 - t)], 70) + dot(3, 12),
  wave: () => curve((t) => [3 + 18 * t, 12 - Math.sin(t * Math.PI * 3) * 5], 60) + dot(3, 12),
  "sine-wave": () => curve((t) => [3 + 18 * t, 12 - Math.sin(t * Math.PI * 2) * 7], 60) + dot(3, 12),
  heartbeat: () => `<path d="M3 12h4l2-6 4 12 2-6h6"/>` + dot(3, 12),
  zigzag: () => `<path d="M3 17l4.5-10 4.5 10 4.5-10L21 17"/>` + dot(3, 17),
  "stairs-down": () => `<path d="M4 4h5v5h5v5h5v5"/>` + dot(4, 4),
  "horizontal-figure-8": () => curve((t) => { const a = t * Math.PI * 2; return [12 + 9 * Math.cos(a), 12 + 5 * Math.sin(2 * a)]; }, 80, true) + dot(21, 12),
  "vertical-figure-8": () => curve((t) => { const a = t * Math.PI * 2; return [12 + 5 * Math.sin(2 * a), 12 + 9 * Math.cos(a)]; }, 80, true) + dot(12, 21),
  "figure-8-four": () => curve((t) => { const a = t * Math.PI * 2; return [12 + 9 * Math.cos(a) * Math.cos(2 * a) * 1.2, 12 + 9 * Math.sin(a) * Math.cos(2 * a) * 1.2]; }, 120, true) + dot(12, 12),
  spiral: () => curve((t) => { const a = t * Math.PI * 5; return [12 + 9 * t * Math.cos(a), 12 + 9 * t * Math.sin(a)]; }, 90) + dot(12, 12),
  "spiral-left": () => curve((t) => { const a = t * Math.PI * 4; return [21 - 12 * t + 0 + 7 * t * Math.cos(a) - 7 * t, 12 + 7 * t * Math.sin(a)]; }, 90) + dot(21, 12),
  "spiral-right": () => curve((t) => { const a = t * Math.PI * 4; return [3 + 12 * t - 7 * t + 7 * t * Math.cos(a), 12 + 7 * t * Math.sin(a)]; }, 90) + dot(3, 12),
  "loop-de-loop": () => curve((t) => { const a = t * Math.PI * 2; return [3 + 18 * t + 5 * Math.sin(a * 1) * 0 - 4 * Math.sin(a), 15 - 5 * Math.cos(a) + 5]; }, 70) + dot(3, 15),
  loops: () => curve((t) => { const a = t * Math.PI * 4; return [3 + 18 * t + 3 * Math.sin(a), 12 - 5 * Math.cos(a) + 5 * (t < 0.01 ? 1 : 0)]; }, 90) + dot(3, 12),
  clever: () => curve((t) => { const a = t * Math.PI * 6; return [3 + 18 * t + 2 * Math.sin(a), 12 + 6 * Math.sin(a / 1.5)]; }, 90) + dot(3, 12),
  shapes: () => `<circle cx="8" cy="8" r="4"/><path d="M13 13h7v7h-7z"/>` + dot(8, 4),
  lines: () => arrowTo(4, 7, 20, 7) + arrowTo(4, 12, 20, 12) + arrowTo(4, 17, 20, 17),
  "lines-down": () => arrowTo(12, 3, 12, 20),
  "lines-up": () => arrowTo(12, 20, 12, 3),
  "lines-left": () => arrowTo(20, 12, 3, 12),
  "lines-right": () => arrowTo(3, 12, 20, 12),
  "diagonal-down-right": () => arrowTo(4, 4, 20, 20),
  "diagonal-up-right": () => arrowTo(4, 20, 20, 4),
  "turn-down": () => `<path d="M6 4h6a4 4 0 0 1 4 4v10"/><path d="M13 15l3 4 3-4"/>` + dot(6, 4),
  "turn-down-right": () => `<path d="M5 4v6a4 4 0 0 0 4 4h10"/><path d="M15 10l4 4-4 4"/>` + dot(5, 4),
  "turn-up": () => `<path d="M6 20h6a4 4 0 0 0 4-4V6"/><path d="M13 9l3-4 3 4"/>` + dot(6, 20),
  "turn-up-right": () => `<path d="M5 20v-6a4 4 0 0 1 4-4h10"/><path d="M15 6l4 4-4 4"/>` + dot(5, 20),
  turns: () => `<path d="M4 20v-5h6v-5h6V5h4"/>` + dot(4, 20),
  custom: () => `<path d="M4 18c3-9 6 3 9-5s4-5 7-9"/>` + dot(4, 18),
  "custom-path": () => `<path d="M4 20l3.5-.8L19 7.7a2.1 2.1 0 0 0-3-3L4.8 16.5z"/><path d="M14 6l3 3"/>`,
};

// ---- Tabler (MIT) par sens ---------------------------------------------------------------------------------------------------------------------
const ANIM_BASE = {
  // entrée / sortie : même effet = même pictogramme
  Spinner: "loader", spinner: "loader", appear: "eye", Disappear: "eye-off", disappear: "eye-off", "basic-zoom": "zoom-in", blinds: "layout-rows", boomerang: "arrow-back-up", bounce: "arrow-bounce",
  "center-revolve": "rotate-360", checkerboard: "layout-grid", compress: "arrows-minimize", collapse: "arrows-minimize", contract: "arrows-minimize", credits: "movie", "curve-up": "arrow-curve-right", "curve-down": "arrow-curve-left",
  custom: "sparkles", "dissolve-in": "grain", "Dissolve-out": "grain", drop: "arrow-bar-down", expand: "arrows-maximize", fade: "circle-half-2", flip: "flip-vertical", float: "feather", "float-in": "arrow-bar-up", "float-out": "arrow-bar-down",
  "fly-in": "send", "fly-out": "send", "grow-turn": "rotate-clockwise-2", "shrink-turn": "rotate-2", "peek-in": "arrow-bar-to-right", "Peek-out": "arrow-bar-to-left", pinwheel: "windmill", "random-bars": "chart-bar", "rise-up": "arrow-big-up",
  "sink-down": "arrow-big-down", shape: "shape", "spiral-in": "spiral", "spiral-out": "spiral", split: "arrows-split-2", strips: "menu-2", swivel: "rotate-3d", wedge: "chart-pie", wheel: "chart-donut", Wheel: "chart-donut", whip: "arrow-wave-right-up", wipe: "swipe-right", zoom: "zoom-in-area",
  // accentuation
  blink: "eye", "bold-flash": "bolt", "bold-reveal": "bold", "brush-color": "brush", "color-pulse": "color-swatch", "complementary-color": "circle-half-2", "contrasting-color": "contrast-2", darken: "brightness-down", desaturate: "droplet-off",
  "fill-color": "bucket-droplet", "font-color": "text-color", "grow-or-shrink": "arrows-diagonal", "grow-with-color": "arrows-maximize", lighten: "brightness-up", "line-color": "line-dashed", "object-color": "palette", pulse: "activity", shimmer: "sparkles",
  spin: "rotate-clockwise-2", teeter: "arrows-left-right", transparency: "layers-subtract", underline: "underline", wave: "wave-sine",
};

const MAP = {
  "animation-multiple": "stack-2", "animation-none": "ban", emptyicon: "square-dashed",
  "btn-3d-rotation": "cube-3d-sphere", "btn-add-animation": "sparkles", "btn-add-breakpoint": "circle-dot", "btn-add-layout": "layout-grid-add", "btn-add-slide-master": "layout-board", "btn-advanced-ratio": "aspect-ratio",
  "btn-animation-delay": "clock-play", "btn-animation-duration": "hourglass", "btn-animation-panel": "layout-sidebar-right", "btn-animation-parameters": "adjustments", "btn-animation-preview-start": "player-play", "btn-animation-preview-stop": "player-stop", "btn-animation-repeat": "repeat",
  "btn-big-ic-review": "message-check", "btn-ic-review": "message-check", "btn-ic-reviewview": "eye-check", "btn-big-pivot-sum": "sum", "btn-pivot-sum": "sum", "btn-big-select-range": "selector", "btn-select-range": "selector",
  "btn-big-sheet-view": "layout-list", "btn-sheet-view": "layout-list", "btn-sheet-view-close": "x", "btn-sheet-view-new": "plus", "btn-big-slicer": "filter-cog", "btn-slicer": "filter-cog", "btn-big-switch-row-column": "arrows-exchange-2", "btn-switch-row-column": "arrows-exchange-2",
  "btn-big-text": "typography", "btn-text": "typography", "btn-big-text-vertical": "text-direction-rtl", "btn-text-vertical": "text-direction-rtl", "btn-blank-rows": "row-insert-bottom",
  "btn-border-diagdown": "diagonal-arrow-right-down" /* remplacé plus bas */, "btn-border-diagup": "diagonal-arrow-right-up",
  "btn-borders-twin-all": "border-all", "btn-borders-twin-none": "border-none", "btn-borders-twin-none-all": "border-all", "btn-borders-twin-none-inner": "border-inner", "btn-borders-twin-none-outer": "border-outer",
  "btn-borders-twin-outer-inner": "border-inner", "btn-borders-twin-outer-none": "border-none", "btn-borders-twin-outer-outer": "border-outer",
  "btn-browse": "folder-open", "btn-calculated": "calculator", "btn-caption": "photo-edit", "btn-cc-plaintext": "text-size", "btn-cc-remove": "square-x", "btn-cc-richtext": "text-wrap", "btn-cell-group": "box-multiple", "btn-cell-ungroup": "box-off",
  "btn-chartcategory-combo-bar-line": "chart-histogram", "btn-chartcategory-recommended": "chart-dots-3", "btn-chartcategory-surface-normal": "chart-area-line", "btn-collapse-all": "fold", "btn-collapse-field": "fold-up", "btn-combine": "arrows-join-2",
  "btn-complex-field": "forms", "btn-cond-format": "color-filter", "btn-context": "menu-2", "btn-controls": "adjustments-horizontal", "btn-cross-reference": "link", "btn-decdecimal": "decimal", "btn-incdecimal": "decimal",
  "btn-demote": "indent-increase", "btn-promote": "indent-decrease", "btn-distribute-columns": "layout-distribute-vertical", "btn-distribute-rows": "layout-distribute-horizontal", "btn-drop-margin": "text-wrap-disabled", "btn-drop-none": "ban", "btn-drop-text": "text-wrap",
  "btn-dropcap": "letter-a", "btn-dropcap-inmargin": "letter-a", "btn-dropcap-intext": "letter-a", "btn-edit-links": "link", "btn-edit-points": "vector-bezier-2", "btn-editheader": "layout-navbar", "btn-expand-all": "fold-down", "btn-expand-field": "fold-down",
  "btn-field": "forms", "btn-filling-status": "progress-check", "btn-firstitem": "player-skip-back", "btn-lastitem": "player-skip-forward", "btn-nextitem": "player-track-next", "btn-previtem": "player-track-prev", "btn-next-field": "chevron-right", "btn-previous-field": "chevron-left",
  "btn-fixed-field": "lock", "btn-text-fixed-field": "lock", "btn-fragment-shapes": "shape-3", "btn-freeze-panes": "layout-board-split", "btn-general-ai": "sparkles", "btn-grand-totals": "sum", "btn-subtotals": "sum", "btn-guides": "ruler-measure",
  "btn-horizontal-guide": "ruler-2", "btn-vertical-guide": "ruler-2", "btn-handout-master": "notes", "btn-handout-orient": "rotate-rectangle", "btn-notes-master": "notes", "btn-notes-orient": "rotate-rectangle", "btn-notes-page": "note",
  "btn-horizontal-line": "minus", "btn-horizontal-line-center": "separator", "btn-horizontal-line-left": "separator", "btn-horizontal-line-right": "separator", "btn-hyphenation": "separator-horizontal",
  "btn-img-align": "layout-align-middle", "btn-img-group": "stack-2", "btn-img-wrap": "text-wrap", "btn-ins-chart-placeholder": "chart-bar", "btn-ins-content-placeholder": "layout-board", "btn-ins-smartart-placeholder": "hierarchy-2",
  "btn-ins-table-placeholder": "table", "btn-ins-text-placeholder": "text-size", "btn-ins-vertical-content-placeholder": "layout-board", "btn-ins-vertical-text-placeholder": "text-direction-rtl",
  "btn-insert-blank-line-after-each-item": "row-insert-bottom", "btn-remove-blank-line-after-each-item": "row-remove", "btn-repeat-all-item-labels": "repeat", "btn-line-numbering": "list-numbers", "btn-line-numbering-rtl": "list-numbers",
  "btn-linear-equation": "math-function", "btn-professional-equation": "math-function", "btn-logic": "binary-tree-2", "btn-lookup": "zoom-scan", "btn-mailmerge": "mail-forward", "btn-make-final": "circle-check", "btn-menu-header": "layout-navbar",
  "btn-none": "ban", "btn-normal": "layout", "btn-page-number-bottom-center": "number", "btn-page-number-bottom-left": "number", "btn-page-number-bottom-right": "number", "btn-page-number-top-center": "number", "btn-page-number-top-left": "number", "btn-page-number-top-right": "number", "btn-pagenum": "number",
  "btn-panel-left-collapse": "layout-sidebar-left-collapse", "btn-pivot-layout": "layout-columns", "btn-select-pivot": "table-options", "btn-preview-transitions": "player-play", "btn-remove-breakpoint": "circle-minus", "btn-remove-trace-arrows": "arrow-down-right",
  "btn-trace-dependents": "arrow-down-right", "btn-trace-precedents": "arrow-up-left", "btn-resize-table": "arrows-diagonal-2", "btn-resize-to-cell": "arrows-diagonal-minimize-2", "btn-rotate-down": "rotate-clockwise", "btn-rotate-up": "rotate",
  "btn-rotate-y-clockwise": "rotate-360", "btn-rotate-y-counterclockwise": "rotate-clockwise-2", "btn-rows-and-columns": "table", "btn-scale": "arrows-maximize", "btn-shape-distribute-hor": "layout-distribute-horizontal", "btn-shape-distribute-vert": "layout-distribute-vertical",
  "btn-shape-group": "layers-linked", "btn-shape-ungroup": "layers-off", "btn-sheet-rtl": "text-direction-rtl", "btn-quick-field": "forms", "btn-slides-per-page": "layout-grid", "btn-smart-art": "hierarchy-2", "btn-smart-cycle": "refresh", "btn-smart-hierarchy": "hierarchy", "btn-smart-list": "list-details",
  "btn-smart-matrix": "layout-grid", "btn-smart-process": "arrow-right-bar", "btn-smart-pyramid": "triangle", "btn-smart-relationship": "circles-relation", "btn-sparkline-win-loss": "chart-bar", "btn-styles": "palette", "btn-switch-mobile": "device-mobile",
  "btn-table-alt-text": "alt", "btn-table-flow": "table-down", "btn-text-from-file": "file-import", "btn-text-orient-ccw": "rotate", "btn-text-orient-cw": "rotate-clockwise", "btn-text-orient-hor": "text-direction-ltr", "btn-text-orient-rdown": "arrow-down-right",
  "btn-text-orient-rup": "arrow-up-right", "btn-text-orient-vertical": "text-direction-rtl", "btn-transition-apply-all": "checks", "btn-transition-blinds": "layout-rows", "btn-transition-box": "box", "btn-transition-checker": "layout-grid", "btn-transition-clock": "clock",
  "btn-transition-comb": "layout-columns", "btn-transition-cover": "layers-subtract", "btn-transition-cube": "cube", "btn-transition-cut": "cut", "btn-transition-dissolve": "grain", "btn-transition-doors": "door", "btn-transition-fade": "circle-half-2",
  "btn-transition-ferris": "circles", "btn-transition-flip": "flip-horizontal", "btn-transition-gallery": "layout-grid", "btn-transition-honeycomb": "hexagons", "btn-transition-morph": "transform", "btn-transition-none": "ban", "btn-transition-orbit": "atom-2",
  "btn-transition-push": "arrow-bar-right", "btn-transition-random": "dice", "btn-transition-randombars": "chart-bar", "btn-transition-ripple": "ripple", "btn-transition-rotate": "rotate-clockwise", "btn-transition-shape": "shape", "btn-transition-split": "arrows-split-2",
  "btn-transition-switch": "switch-horizontal", "btn-transition-uncover": "layers-subtract", "btn-transition-vortex": "tornado", "btn-transition-window": "window-maximize", "btn-transition-wipe": "swipe-right", "btn-transition-zoom": "zoom-in",
  "btn-wrap": "text-wrap", "btn-wrap-behind": "layers-subtract", "btn-wrap-infront": "layers-union", "btn-wrap-inline": "text-wrap-disabled", "btn-wrap-square": "square", "btn-wrap-through": "text-wrap", "btn-wrap-tight": "text-wrap", "btn-wrap-topbottom": "separator-horizontal",
  "btn-small-wrap-behind": "layers-subtract", "btn-small-wrap-infront": "layers-union", "btn-small-wrap-inline": "text-wrap-disabled", "btn-small-wrap-square": "square", "btn-small-wrap-through": "text-wrap", "btn-small-wrap-tight": "text-wrap", "btn-small-wrap-topandbottom": "separator-horizontal",
};
// Les deux traits diagonaux de bordure sont de simples diagonales dans une cellule : tracés propres.
const CUSTOM = {
  "btn-comma": `<circle cx="12" cy="9" r=".6"/><path d="M12 13v3.5a3.5 3.5 0 0 1-2.5 3.3"/>`,
  "btn-border-diagdown": `<rect x="4" y="4" width="16" height="16" rx="1" stroke-dasharray="2 3"/><path d="M4 4l16 16"/>`,
  "btn-border-diagup": `<rect x="4" y="4" width="16" height="16" rx="1" stroke-dasharray="2 3"/><path d="M4 20L20 4"/>`,
};

/** `names` : tous les noms d'icônes d'un lot ; `{ tabler }` ou `{ svg }` ou `null`. */
export function extraLookup(rawName) {
  const name = MAP[rawName] || CUSTOM[rawName] ? rawName : rawName.replace(/-rtl$/, "");
  if (CUSTOM[name]) return { svg: CUSTOM[name] };
  let m = /^animation-motion-paths-(.+)$/.exec(name);
  if (m) {
    const f = MOTION[m[1]];
    if (f) { const s = f(); if (s) return { svg: s }; }
    return null;
  }
  m = /^animation-(?:entrance|exit|emphasis)-(.+)$/.exec(name);
  if (m) return ANIM_BASE[m[1]] ? { tabler: ANIM_BASE[m[1]] } : null;
  return MAP[name] ? { tabler: MAP[name] } : null;
}

export { curve, poly, star, dot, arrowTo };
