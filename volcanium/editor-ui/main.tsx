import { createRoot } from "react-dom/client";
import { ToastProvider, VolcaniumProvider } from "@volcanium/volcanium-components";
import css from "./ui.css?inline";
import Shell, { ReaderShell } from "./Shell";
import MobileShell, { useMobile } from "./Mobile";
import { editorKind, keyGuard, readerMode, waitForApi, wireEngine, wireReaderEngine } from "./engine";
import { wireDoc } from "./doc";
import "./bridge";

/* Interface Volcanium des éditeurs : la coque (en-tête, onglets, ruban, panneaux, barre d'état) est 100 % React + librairie Volcanium.
   Du moteur d'amont on ne garde que le canevas du document et ses contrôleurs ; l'ancienne interface reste dans le DOM, hors écran,
   pour que les fonctions pas encore réécrites (fenêtres de réglages, menus) restent atteignables. */
const HIDE_UPSTREAM = `
body.vo-custom #app-title, body.vo-custom #toolbar, body.vo-custom.vo-doc #statusbar, body.vo-custom.vo-slide #statusbar {
  position: fixed !important; left: -12000px !important; top: 0 !important; width: 1800px !important; }
body.vo-custom #left-menu, body.vo-custom #right-menu { position: fixed !important; left: -12000px !important; top: 0 !important; }
body.vo-custom #status-zoom-box { display: none !important; }
/* Téléphone : la barre des feuilles du tableur ne garde que les onglets (ni message d'enregistrement ni zoom d'amont, déjà dans notre interface). */
body.vo-mobile #statusbar .status-label { display: none !important; }
body.vo-custom #toolbar { z-index: 50 !important; }
/* Barres de défilement natives de l'interface d'amont (listes, fenêtres) : fines et discrètes, comme la librairie. */
body.vo-custom * { scrollbar-width: thin; scrollbar-color: rgba(128,128,134,.45) transparent; }
body.vo-custom.vo-sheet #statusbar { position: fixed !important; left: calc(var(--vo-l, 0px) + 10px) !important; width: calc(var(--vo-w, 100%) - 20px) !important; top: calc(var(--vo-t, 0px) + var(--vo-h, 0px) - 25px) !important; height: 25px !important; z-index: 2 !important; }
body.vo-custom.vo-sheet .vo-stage { left: calc(var(--vo-l, 0px) + 10px) !important; top: calc(var(--vo-t, 0px) + 6px) !important; width: calc(var(--vo-w, 100%) - 20px) !important; height: calc(var(--vo-h, 100%) - 25px - 6px) !important; }
body.vo-custom .dropdown-menu { visibility: visible; }
body.vo-custom #file-menu-panel { z-index: 200 !important; }
body.vo-custom .vo-stage { position: fixed !important; left: var(--vo-l, 0) !important; top: var(--vo-t, 0) !important; width: var(--vo-w, 100%) !important; height: var(--vo-h, 100%) !important; z-index: 1 !important; background: transparent; }
`;

/** Téléphone (< 640 px, ou tactile < 768 px) : coque minimale « lire et écrire » ; sinon la coque de bureau, inchangée. */
function Root() {
  const mobile = useMobile();
  if (mobile) return <MobileShell reader={readerMode} />;
  return readerMode ? <ReaderShell /> : <Shell />;
}

async function mount() {
  const api = await waitForApi();
  if (readerMode) wireReaderEngine(api); else wireEngine(api);
  wireDoc(api);
  if (document.getElementById("vo-root")) return;
  const extra = document.createElement("style");
  extra.textContent = HIDE_UPSTREAM;
  document.head.appendChild(extra);
  const host = document.createElement("div");
  host.id = "vo-root";
  host.style.cssText = "position:fixed;inset:0;z-index:5;pointer-events:none";
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = css;
  const wrap = document.createElement("div");
  const dark = document.body.classList.contains("theme-type-dark");
  wrap.setAttribute("data-theme", dark ? "dark" : "light");
  wrap.className = "vo-app";
  wrap.style.cssText = "height:100%;font-family:'DM Sans',system-ui,sans-serif";
  shadow.append(style, wrap);
  // nos clics ne doivent pas atteindre les gestionnaires « clic dehors » de l'éditeur d'amont
  // Les clics et appuis de souris sur NOTRE interface ne doivent pas atteindre le moteur : il reprend le focus clavier à chaque « mouseup »
  // (la frappe partirait dans le document au lieu de nos champs) et ferme ses menus sur les clics extérieurs.
  for (const ev of ["click", "mousedown", "mouseup", "pointerup", "touchend", "dblclick"]) wrap.addEventListener(ev, (e) => e.stopPropagation());
  // Un champ de saisie de la coque prend le clavier AVANT que le focus bouge : sinon le moteur le reprend et la frappe part dans le document.
  const isField = (e: Event) => { const t = e.composedPath()[0] as HTMLElement | undefined; return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA"); };
  wrap.addEventListener("pointerdown", (e) => { if (isField(e)) keyGuard.on(); }, true);
  wrap.addEventListener("focusin", (e) => { if (isField(e)) keyGuard.on(); });
  wrap.addEventListener("focusout", (e) => { const to = (e as FocusEvent).relatedTarget as HTMLElement | null; if (isField(e) && !(to && (to.tagName === "INPUT" || to.tagName === "TEXTAREA"))) keyGuard.off(); });
  // Frappe dans un de nos champs : jamais transmise au moteur (les événements d'un Shadow DOM ont pour cible l'hôte, qu'il prend pour un élément du document).
  for (const ev of ["keydown", "keypress", "keyup", "beforeinput", "input", "paste", "copy", "cut"]) {
    wrap.addEventListener(ev, (e) => { const t = e.composedPath()[0] as HTMLElement | undefined; if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) e.stopPropagation(); });
  }
  document.body.classList.add("vo-custom", `vo-${editorKind()}`);
  // Conteneur du canevas : #editor-container (texte, présentation) ou, pour le tableur, l'élément de mise en page qui contient #editor_sdk.
  (document.getElementById("editor-container") ?? document.getElementById("editor_sdk")?.parentElement?.parentElement)?.classList.add("vo-stage");
  // Interface d'amont masquée dès le chargement (index.html) : on la révèle seulement quand la coque est montée, sans flash de l'ancienne interface.
  requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById("vo-boot")?.remove()));
  createRoot(wrap).render(
    <VolcaniumProvider config={{ lang: "fr" }}>
      <ToastProvider>
        <Root />
      </ToastProvider>
    </VolcaniumProvider>,
  );
}
mount().catch((e) => console.error("[vo-ui]", e));
