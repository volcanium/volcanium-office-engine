import { useSyncExternalStore } from "react";
import type { Stroke } from "./pen";

/* Traits du dessin du document + historique (annuler / rétablir ne concerne que les traits tant que le stylo est actif, comme dans Notes).
   Le dessin est ENREGISTRÉ AVEC LE FICHIER et partagé en direct : ce cadre (page du moteur, autre origine que l'API) n'a ni cookie ni accès à l'API ;
   il parle à la page hôte (`src/features/editor/inkBridge.ts`, même origine que l'API) par postMessage, et c'est l'hôte qui tient la WebSocket `/ws/ink`.
     cadre -> hôte : { vo:"ink", type:"hello" } · { vo:"ink", type:"op", add:[trait], del:[id] }
     hôte -> cadre : { vo:"ink", type:"init", strokes, role } · { type:"op", add, del } · { type:"role", role } · { type:"status", live }
   Une opération est un ENSEMBLE (ajouts / suppressions) : rejouer ne change rien ; annuler = l'opération inverse, envoyée comme les autres. */
const w = window as unknown as { DE?: { getController(n: string): { document?: { key?: string; title?: string } } } };
/** Ancien stockage (navigateur seul) : repris une fois dans le fichier à la première ouverture, puis effacé. */
const legacyKey = (): string => { try { const d = w.DE?.getController("Main").document; return `vo-ink:${d?.key || d?.title || "doc"}`; } catch { return "vo-ink:doc"; } };

type Op = { add: Stroke[]; del: Stroke[] };
type Role = "edit" | "view";
let strokes: Stroke[] = [];
let role: Role | null = null; // `null` : pas encore reçu l'état du serveur
let live = false;
const undoStack: Op[] = [], redoStack: Op[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const parentOrigin = (): string => { try { return document.referrer ? new URL(document.referrer).origin : "*"; } catch { return "*"; } };
const post = (msg: Record<string, unknown>): void => { try { window.parent.postMessage({ vo: "ink", ...msg }, parentOrigin()); } catch { /* sans hôte : sans effet */ } };
const send = (add: Stroke[], del: string[]): void => post({ type: "op", add, del });
const merge = (add: Stroke[], delIds: string[]): void => {
  const gone = new Set([...delIds, ...add.map((s) => s.id)]);
  strokes = [...strokes.filter((s) => !gone.has(s.id)), ...add];
};

function importLegacy(): void {
  if (role !== "edit") return;
  try {
    const key = legacyKey();
    const old = JSON.parse(localStorage.getItem(key) ?? "[]") as Stroke[];
    if (Array.isArray(old) && old.length) { const have = new Set(strokes.map((s) => s.id)); const add = old.filter((s) => !have.has(s.id)); if (add.length) { merge(add, []); send(add, []); } }
    localStorage.removeItem(key);
  } catch { /* stockage indisponible : sans effet */ }
}

let helloTimer: ReturnType<typeof setInterval> | undefined;
if (window.parent !== window) {
  window.addEventListener("message", (e: MessageEvent) => {
    const d = e.data as { vo?: string; type?: string; strokes?: Stroke[]; add?: Stroke[]; del?: string[]; role?: Role; live?: boolean } | null;
    if (!d || typeof d !== "object" || d.vo !== "ink" || e.source !== window.parent) return;
    if (d.type === "init") {
      strokes = Array.isArray(d.strokes) ? d.strokes : []; role = d.role === "view" ? "view" : "edit"; live = true;
      undoStack.length = 0; redoStack.length = 0; // l'historique d'avant une reconnexion ne correspond plus à l'état du serveur
      clearInterval(helloTimer); importLegacy(); emit();
    } else if (d.type === "op") { merge(Array.isArray(d.add) ? d.add : [], Array.isArray(d.del) ? d.del : []); emit(); }
    else if (d.type === "role") { role = d.role === "view" ? "view" : "edit"; emit(); }
    else if (d.type === "status") { live = d.live === true; emit(); }
  });
  // L'hôte répond par l'état complet ; on redemande tant qu'il n'est pas là (l'hôte peut être plus lent que le moteur).
  post({ type: "hello" });
  helloTimer = setInterval(() => post({ type: "hello" }), 2000);
}

export const inkStore = {
  get: (): Stroke[] => strokes,
  subscribe(l: () => void): () => void { listeners.add(l); return () => { listeners.delete(l); }; },
  /** Peut-on dessiner ? Faux en lecture seule (droit du fichier) et tant que le serveur n'a pas répondu. */
  canWrite: (): boolean => role === "edit",
  /** Connecté au serveur (les traits partent tout de suite) ; sinon l'hôte les garde et les envoie à la reconnexion. */
  isLive: (): boolean => live,
  /** Applique une opération (ajout et / ou suppression de traits), l'envoie, et l'enregistre dans l'historique. */
  apply(op: Op): void {
    if (role !== "edit") return;
    merge(op.add, op.del.map((s) => s.id));
    send(op.add, op.del.map((s) => s.id));
    undoStack.push(op); redoStack.length = 0; emit();
  },
  undo(): void { const op = undoStack.pop(); if (!op) return; this.reverse(op, false); redoStack.push(op); },
  redo(): void { const op = redoStack.pop(); if (!op) return; this.reverse(op, true); undoStack.push(op); },
  reverse(op: Op, forward: boolean): void {
    if (role !== "edit") return;
    const [add, del] = forward ? [op.add, op.del] : [op.del, op.add];
    merge(add, del.map((s) => s.id));
    send(add, del.map((s) => s.id));
    emit();
  },
  canUndo: (): boolean => undoStack.length > 0,
  canRedo: (): boolean => redoStack.length > 0,
};
export const useStrokes = (): Stroke[] => useSyncExternalStore(inkStore.subscribe, inkStore.get);
export const useInkCanWrite = (): boolean => useSyncExternalStore(inkStore.subscribe, inkStore.canWrite);
