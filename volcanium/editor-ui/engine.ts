// Pont vers le moteur des éditeurs (sdkjs) : on réutilise l'API d'ONLYOFFICE et ses contrôleurs, jamais son interface.
// L'objet `api` est celui du contrôleur « Toolbar » du traitement de texte (DE).
import { useEffect, useState, useSyncExternalStore } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type DocApi = Record<string, any> & {
  asc_registerCallback(name: string, fn: (...args: any[]) => void): void;
};

const w = window as any;
/** Application d'amont de la page : DE (texte), SSE (tableur) ou PE (présentation). */
export const app = (): any => w.DE ?? w.SSE ?? w.PE;
export type EditorKind = "doc" | "sheet" | "slide";
export const editorKind = (): EditorKind => (w.DE ? "doc" : w.SSE ? "sheet" : "slide");
export const getToolbarController = (): any => app()?.getController("Toolbar");
export const mainController = (): any => app()?.getController("Main");
/** L'API du moteur : celle du contrôleur « Toolbar » en édition ; en lecture seule la barre d'outils n'existe pas, on prend celle du contrôleur principal (c'est le même objet). */
export const getApi = (): DocApi => getToolbarController()?.api ?? mainController()?.api;
export const getToolbarView = (): any => getToolbarController()?.toolbar;

/** Le document est-il ouvert en LECTURE SEULE ? `null` tant que la configuration n'est pas lue. */
export const readOnlyMode = (): boolean | null => {
  try {
    const m = mainController();
    const mode = m?.editorConfig?.mode;
    if (typeof mode !== "string") return null;
    return mode !== "edit" || m.editorConfig?.permissions?.edit === false || m.appOptions?.permissions?.edit === false;
  } catch { return null; }
};

/** Vrai quand la coque de lecture seule est montée (voir `main.tsx`). */
export let readerMode = false;

export function waitForApi(timeoutMs = 60000): Promise<DocApi> {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const tick = () => {
      try {
        const ro = readOnlyMode();
        const api = getApi() as DocApi | undefined;
        if (api && typeof api.asc_registerCallback === "function") {
          // Lecture seule : pas de barre d'outils à attendre. Édition : on attend que la barre d'outils d'amont soit construite.
          if (ro === true) { readerMode = true; return resolve(api); }
          if (ro === false && getToolbarView()?.cmbFontName) return resolve(api);
        }
      } catch { /* l'application d'amont n'est pas encore montée */ }
      if (Date.now() - t0 > timeoutMs) return reject(new Error("API du moteur introuvable"));
      setTimeout(tick, 250);
    };
    tick();
  });
}

/** Rend la main au document après une commande (sinon le clavier reste dans notre bouton). */
export function backToDocument(): void {
  try { w.Common?.NotificationCenter?.trigger("edit:complete"); } catch { /* sans effet */ }
}

// ── État du moteur ────────────────────────────────────────────────────────────────────────────────
export interface EngineState {
  bold: boolean; italic: boolean; underline: boolean; strike: boolean; sup: boolean; sub: boolean;
  undo: boolean; redo: boolean; canCopy: boolean; paint: boolean; marks: boolean;
  align: number | null; size: number | null; fontName: string | null; style: string | null;
  textColor: string | null; highlight: string | null; lineSpacing: number | null; zoom: number | null;
  bullets: boolean; numbers: boolean;
}
const INITIAL: EngineState = {
  bold: false, italic: false, underline: false, strike: false, sup: false, sub: false,
  undo: false, redo: false, canCopy: false, paint: false, marks: false,
  align: null, size: null, fontName: null, style: null, textColor: null, highlight: null, lineSpacing: null, zoom: null,
  bullets: false, numbers: false,
};

let state: EngineState = INITIAL;
const listeners = new Set<() => void>();
export const set = (patch: Partial<EngineState>) => {
  let changed = false;
  for (const k of Object.keys(patch) as (keyof EngineState)[]) if (state[k] !== patch[k]) { changed = true; break; }
  if (!changed) return;
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
export const useEngine = (): EngineState => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state);

const hex = (c: any): string | null => {
  try {
    if (!c || (c.get_auto && c.get_auto())) return null;
    return [c.get_r(), c.get_g(), c.get_b()].map((v: number) => v.toString(16).padStart(2, "0")).join("");
  } catch { return null; }
};

let wired = false;
/** Lecture seule : seul le zoom est relu du moteur (le reste de l'état d'édition n'existe pas). */
export function wireReaderEngine(api: DocApi): void {
  try { api.asc_registerCallback("asc_onZoomChange", (p: unknown) => set({ zoom: typeof p === "number" ? p : null })); } catch { /* sans effet */ }
}

export function wireEngine(api: DocApi): void {
  if (wired) return;
  wired = true;
  const refreshFont = () => {
    try { set({ fontName: api.get_TextProps()?.get_TextPr()?.get_FontFamily()?.get_Name() ?? null }); } catch { /* pas de sélection */ }
    try {
      const hl = api.get_TextProps()?.get_TextPr()?.get_HighLight();
      set({ highlight: hl === -1 || hl == null ? null : hl.get_hex().toUpperCase() });
    } catch { /* idem */ }
  };
  const on = (name: string, fn: (...a: any[]) => void) => api.asc_registerCallback(name, (...a: any[]) => { fn(...a); queueMicrotask(refreshFont); });
  on("asc_onBold", (v) => set({ bold: v === true }));
  on("asc_onItalic", (v) => set({ italic: v === true }));
  on("asc_onUnderline", (v) => set({ underline: v === true }));
  on("asc_onStrikeout", (v) => set({ strike: v === true }));
  on("asc_onVerticalAlign", (v) => set({ sup: v === 1, sub: v === 2 }));
  on("asc_onCanUndo", (v) => set({ undo: v === true }));
  on("asc_onCanRedo", (v) => set({ redo: v === true }));
  on("asc_onCanCopyCut", (c) => set({ canCopy: c === true }));
  on("asc_onPrAlign", (v) => set({ align: typeof v === "number" ? v : null }));
  on("asc_onFontSize", (v) => set({ size: typeof v === "number" ? v : null }));
  on("asc_onParaStyleName", (v) => set({ style: typeof v === "string" ? v : null }));
  on("asc_onTextColor", (c) => set({ textColor: hex(c) }));
  on("asc_onShowParaMarks", (v) => set({ marks: v === true }));
  on("asc_onPaintFormatChanged", (v) => set({ paint: typeof v === "number" ? v > 0 : v === true }));
  on("asc_onZoomChange", (p) => set({ zoom: typeof p === "number" ? p : null }));
  on("asc_onParaSpacingLine", (vc) => {
    try { set({ lineSpacing: vc.get_Line() == null || vc.get_LineRule() !== 1 ? null : vc.get_Line() }); } catch { /* sans effet */ }
  });
  on("asc_onMarkerFormatChanged", () => { /* états des listes : lus via asc_GetNumberingPr au besoin */ });
  refreshFont();
}

// ── Helpers de commandes ───────────────────────────────────────────────────────────────────────────
export function fontNames(): string[] {
  try { return getToolbarView().cmbFontName.store.pluck("name") as string[]; } catch { return []; }
}
export interface StyleItem { title: string; imageUrl: string }
export function styleItems(): StyleItem[] {
  try {
    return getToolbarView().listStyles.menuPicker.store.models.map((m: any) => ({ title: m.get("title"), imageUrl: m.get("imageUrl") }));
  } catch { return []; }
}
export const rgb = (hexValue: string): any => w.Common.Utils.ThemeColor.getRgbColor(hexValue);
export function autoColor(): any { const c = new w.Asc.asc_CColor(); c.put_auto(true); return c; }

/** Styles du document (vignettes) : chargés par le moteur après l'ouverture, donc relus tant qu'ils évoluent. */
export function useStyles(): StyleItem[] {
  const [list, setList] = useState<StyleItem[]>(() => styleItems());
  useEffect(() => {
    const t = setInterval(() => setList((prev) => {
      const next = styleItems();
      return prev.length === next.length && prev[0]?.imageUrl === next[0]?.imageUrl && prev[prev.length - 1]?.title === next[next.length - 1]?.title ? prev : next;
    }), 1000);
    return () => clearInterval(t);
  }, []);
  return list;
}

/** Tant qu'un de nos champs de saisie a le focus, le moteur ne doit pas capter le clavier (sinon la frappe va dans le document). */
export const keyGuard = {
  on: () => { try { getApi().asc_enableKeyEvents?.(false); } catch { /* sans effet */ } },
  off: () => { try { getApi().asc_enableKeyEvents?.(true); } catch { /* sans effet */ } },
};
