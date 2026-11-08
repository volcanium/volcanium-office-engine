// Stylo : état (outil, couleur, épaisseur) et géométrie des traits. Repris À L'IDENTIQUE de l'app Notes (interne/notes, apps/panel/src/features/editor : penStore.ts et ink.ts),
// pour que le dessin se comporte de la même façon dans toute la suite. Seule différence : les points d'un trait sont ici rattachés à une PAGE du document (voir InkLayer.tsx).
import { useSyncExternalStore } from "react";

/** « select » : le calque laisse passer les clics (on peut cliquer et écrire dans le document sans quitter le mode dessin). */
export type PenTool = "pen" | "eraser" | "select";
export interface PenState { active: boolean; tool: PenTool; color: string; width: number }
export const PEN_COLORS = ["#000000", "#ef4444", "#f97316", "#22c55e", "#2563eb", "#8b5cf6", "#ec4899"] as const;
export const PEN_WIDTHS = [2, 4, 8, 14] as const;

let state: PenState = { active: false, tool: "pen", color: "#000000", width: 4 };
const listeners = new Set<() => void>();
export const penStore = {
  get: (): PenState => state,
  set(patch: Partial<PenState>): void { state = { ...state, ...patch }; listeners.forEach((l) => l()); },
  subscribe(l: () => void): () => void { listeners.add(l); return () => { listeners.delete(l); }; },
};
export const usePen = (): PenState => useSyncExternalStore(penStore.subscribe, penStore.get);

/** Trait : couleur, épaisseur (px écran à 100 %), points [x0,y0,x1,y1…] en dixièmes de millimètre dans le repère de la page `pg`. */
export interface Stroke { id: string; c: string; w: number; pg: number; p: number[] }

/** Trait lisse : courbes quadratiques passant par les milieux des segments (identique à Notes). */
export function strokePath(p: number[]): string {
  if (p.length < 4) return `M${p[0]} ${p[1]}`;
  let d = `M${p[0]} ${p[1]}`;
  for (let i = 2; i < p.length - 2; i += 2) d += `Q${p[i]} ${p[i + 1]} ${(p[i]! + p[i + 2]!) / 2} ${(p[i + 1]! + p[i + 3]!) / 2}`;
  return `${d}L${p[p.length - 2]} ${p[p.length - 1]}`;
}

/** Le point (x, y) touche-t-il ce trait (à `r` près) ? Distance au segment, pour la gomme (identique à Notes). */
export function hits(s: { p: number[]; w: number }, x: number, y: number, r: number): boolean {
  const rr = (r + s.w / 2) ** 2;
  for (let i = 0; i < s.p.length - 2; i += 2) {
    const ax = s.p[i]!, ay = s.p[i + 1]!, bx = s.p[i + 2]!, by = s.p[i + 3]!;
    const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
    const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len));
    const ex = ax + t * dx - x, ey = ay + t * dy - y;
    if (ex * ex + ey * ey <= rr) return true;
  }
  return s.p.length === 2 ? (s.p[0]! - x) ** 2 + (s.p[1]! - y) ** 2 <= rr : false;
}

/** Points bruts -> trait compact : entiers, points trop proches retirés, un simple point devient un petit segment. */
export function compact(points: { x: number; y: number }[]): number[] {
  const p: number[] = [];
  let lx = Number.NaN, ly = Number.NaN;
  for (const pt of points) {
    const x = Math.round(pt.x), y = Math.round(pt.y);
    if (Math.abs(x - lx) < 1 && Math.abs(y - ly) < 1) continue;
    p.push(x, y); lx = x; ly = y;
  }
  if (p.length === 2) p.push(p[0]! + 1, p[1]!);
  return p;
}
