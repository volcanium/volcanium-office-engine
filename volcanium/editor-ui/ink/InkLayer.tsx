import { useEffect, useRef, useState } from "react";
import { getApi, useEngine } from "../engine";
import { compact, hits, strokePath, usePen, type Stroke } from "./pen";
import { inkStore, useInkCanWrite, useStrokes } from "./inkStore";

/* Calque de dessin posé sur la page du document. Le moteur dessine dans un canevas : on lui demande où se trouve chaque page à l'écran
   (ConvertCoordsToCursorWR / ConvertCoordsFromCursor2 de son DrawingDocument) et on pose chaque trait sur SA page, en dixièmes de millimètre.
   Donc le dessin suit le défilement et le zoom. Inactif (stylo éteint), les clics le traversent. */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Pt = { x: number; y: number };
interface Affine { ox: number; oy: number; s: number } // pixel (repère du document) = origine + mm × s
/** Géométrie de la page au repère du document, déduite de l'API PUBLIQUE du moteur (ses objets internes sont renommés dans la version livrée) :
 *  pages empilées, 20 px d'espace au-dessus et entre elles, centrées dans la zone d'affichage ; échelle = zoom × 96 / 25,4 px par mm (mesuré sur le moteur réel). */
const GAP = 20, PX_MM = 96 / 25.4;
function layout(zoom: number): { pages: Affine[]; viewer: DOMRect } | null {
  try {
    const api = getApi() as any, v = document.getElementById("id_viewer");
    if (!v) return null;
    const vr = v.getBoundingClientRect(), s = (zoom / 100) * PX_MM, off = Number(api.GetCurrentPixOffsetY()) || 0, n = Number(api.getCountPages()) || 0;
    const pages: Affine[] = [];
    let top = vr.top + GAP - off;
    for (let i = 0; i < n; i++) {
      const sz = api.asc_getPageSize(i);
      pages.push({ ox: vr.left + (vr.width - sz.W * s) / 2, oy: top, s });
      top += sz.H * s + GAP;
    }
    return { pages, viewer: vr };
  } catch { return null; }
}
/** Page sous le pointeur (la plus proche si on est entre deux pages ou dans une marge). */
const pageAt = (lay: { pages: Affine[] }, y: number, heights: number[]): number => {
  let best = 0, bd = Infinity;
  lay.pages.forEach((a, i) => { const h = heights[i] ?? 0, d = y < a.oy ? a.oy - y : y > a.oy + h ? y - (a.oy + h) : 0; if (d < bd) { bd = d; best = i; } });
  return best;
};
const pageHeights = (): number[] => { try { const api = getApi() as any; return Array.from({ length: Number(api.getCountPages()) || 0 }, (_, i) => api.asc_getPageSize(i).H); } catch { return []; } };
const newId = (): string => { const b = new Uint8Array(6); crypto.getRandomValues(b); return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_"); };
const MM_PX = 0.2646; // 1 px CSS = 0,2646 mm : l'épaisseur du stylo (px à 100 %) devient une épaisseur de page, donc suit le zoom

export default function InkLayer() {
  const pen = usePen();
  const strokes = useStrokes();
  const eng = useEngine();
  const zoomRef = useRef(100);
  zoomRef.current = eng.zoom ?? 100;
  const svg = useRef<SVGSVGElement>(null);
  const [affines, setAffines] = useState<Record<number, Affine>>({}); // repère du calque (svg)
  const [live, setLive] = useState<{ pts: Pt[]; page: number; erased: Set<string> } | null>(null);
  const drawing = useRef<{ pts: Pt[]; page: number; erased: Set<string>; id: number } | null>(null);
  const canWrite = useInkCanWrite(); // lecture seule (ou droit retiré en cours de route) : on affiche le dessin, on n'en ajoute pas
  const active = pen.active && canWrite;
  const capturing = active && pen.tool !== "select"; // le calque ne reçoit les clics que pour le stylo et la gomme

  // Position des pages à l'écran, relue à chaque image tant qu'il y a quelque chose à afficher (défilement, zoom, redimensionnement).
  useEffect(() => {
    if (!active && strokes.length === 0) return undefined;
    let raf = 0, last = "";
    const pages = [...new Set(strokes.map((s) => s.pg))];
    const tick = () => {
      const el = svg.current, lay = layout(zoomRef.current);
      if (el && lay) {
        const r = el.getBoundingClientRect(), next: Record<number, Affine> = {};
        for (const pg of pages) { const a = lay.pages[pg]; if (a) next[pg] = { ox: a.ox - r.left, oy: a.oy - r.top, s: a.s }; }
        const key = JSON.stringify(next);
        if (key !== last) { last = key; setAffines(next); }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, strokes]);

  const local = (e: { clientX: number; clientY: number }): Pt => { const r = svg.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  /** Affine d'une page dans le repère du calque, relue au moment voulu. */
  const affineNow = (page: number): Affine | null => {
    const lay = layout(zoomRef.current), el = svg.current;
    const a = lay?.pages[page];
    if (!a || !el) return null;
    const r = el.getBoundingClientRect();
    return { ox: a.ox - r.left, oy: a.oy - r.top, s: a.s };
  };
  const eraseAt = (pt: Pt, erased: Set<string>) => {
    for (const st of inkStore.get()) {
      if (erased.has(st.id)) continue;
      const a = affineNow(st.pg); if (!a) continue;
      if (hits({ p: st.p, w: st.w * MM_PX * 10 }, ((pt.x - a.ox) / a.s) * 10, ((pt.y - a.oy) / a.s) * 10, ((pen.width + 4) / a.s) * 10)) erased.add(st.id);
    }
  };
  const down = (e: React.PointerEvent) => {
    if (!capturing || drawing.current || (e.pointerType === "mouse" && e.button !== 0)) return;
    const lay = layout(zoomRef.current);
    if (!lay || lay.pages.length === 0) return;
    e.preventDefault();
    svg.current!.setPointerCapture(e.pointerId);
    const p = local(e), page = pageAt(lay, e.clientY, pageHeights().map((h) => h * lay.pages[0]!.s));
    const st = { pts: [p], page, erased: new Set<string>(), id: e.pointerId };
    if (pen.tool === "eraser") eraseAt(p, st.erased);
    drawing.current = st;
    setLive({ pts: st.pts, page, erased: st.erased });
  };
  const move = (e: React.PointerEvent) => {
    const d = drawing.current;
    if (!d || d.id !== e.pointerId) return;
    const evs = (e.nativeEvent as PointerEvent).getCoalescedEvents?.() ?? [];
    for (const ev of evs.length ? evs : [e.nativeEvent]) { const p = local(ev); d.pts.push(p); if (pen.tool === "eraser") eraseAt(p, d.erased); }
    setLive({ pts: d.pts, page: d.page, erased: new Set(d.erased) });
  };
  const up = (e: React.PointerEvent) => {
    const d = drawing.current;
    if (d && d.id !== e.pointerId) return;
    drawing.current = null; setLive(null);
    if (!d) return;
    if (pen.tool === "eraser") {
      const del = inkStore.get().filter((s) => d.erased.has(s.id));
      if (del.length) inkStore.apply({ add: [], del });
      return;
    }
    const a = affineNow(d.page);
    if (!a) return;
    const p = compact(d.pts.map((pt) => ({ x: ((pt.x - a.ox) / a.s) * 10, y: ((pt.y - a.oy) / a.s) * 10 })));
    if (p.length < 4) return;
    const st: Stroke = { id: newId(), c: pen.color, w: pen.width, pg: d.page, p };
    inkStore.apply({ add: [st], del: [] });
  };
  // Défilement à la molette pendant que le stylo est actif : transmis au moteur (ViewScrollToY est absolu).
  const wheel = (e: React.WheelEvent) => { try { const api = getApi() as any; api.ViewScrollToY(Math.max(0, Number(api.GetCurrentPixOffsetY()) + e.deltaY)); } catch { /* sans effet */ } };

  const pathProps = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;
  const livePath = live && live.pts.length ? strokePath(live.pts.flatMap((p) => [Math.round(p.x), Math.round(p.y)])) : null;
  return (
    <svg ref={svg} aria-hidden data-ink="" className={capturing ? "vo-ink-on" : ""}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 5, overflow: "hidden", touchAction: capturing ? "none" : "auto", userSelect: "none", cursor: capturing ? (pen.tool === "eraser" ? "cell" : "crosshair") : "default" }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onWheel={wheel} onContextMenu={(e) => { if (capturing) e.preventDefault(); }}>
      {strokes.map((s) => {
        const a = affines[s.pg];
        if (!a) return null;
        return <path key={s.id} transform={`translate(${a.ox} ${a.oy}) scale(${a.s / 10})`} d={strokePath(s.p)} {...pathProps} stroke={s.c} strokeWidth={s.w * MM_PX * 10} opacity={live?.erased.has(s.id) ? 0.2 : 1} />;
      })}
      {livePath && pen.tool === "pen" && <path d={livePath} {...pathProps} stroke={pen.color} strokeWidth={(pen.width * zoomRef.current) / 100} />}
    </svg>
  );
}
