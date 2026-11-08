import { IconButton } from "@volcanium/volcanium-components";
import { IconEraser, IconPencil, IconPointer } from "@tabler/icons-react";
import { Popover } from "../kit";
import { PEN_COLORS, PEN_WIDTHS, penStore, usePen } from "./pen";

/** Palette du stylo (reprise de Notes) : flottante au bas de la page, stylo / gomme, épaisseur (menu à un bouton), 7 couleurs + couleur personnalisée.
 *  Pas de « Terminé » : on quitte en recliquant sur « Dessiner » dans le ruban ; annuler / rétablir (Historique) agissent sur les traits tant que le stylo est actif. */
export default function PenPalette() {
  const pen = usePen();
  const isCustom = pen.tool === "pen" && !(PEN_COLORS as readonly string[]).includes(pen.color);
  const btn = (active: boolean) => (active ? "bg-vc-main/20 text-vc-main" : "");
  const dot = (n: number) => <span className="rounded-full bg-current" style={{ width: Math.min(n + 2, 16), height: Math.min(n + 2, 16) }} />;
  return (
    <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center px-2">
    <div role="toolbar" aria-label="Stylo" className="vo-ink-on flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-vc-line-strong bg-vc-container/95 px-2.5 py-1.5 shadow-xl backdrop-blur">
      <IconButton label="Sélectionner du texte (cliquer dans le document)" aria-pressed={pen.tool === "select"} className={btn(pen.tool === "select")} onClick={() => penStore.set({ tool: "select" })}><IconPointer size={18} /></IconButton>
      <IconButton label="Stylo" aria-pressed={pen.tool === "pen"} className={btn(pen.tool === "pen")} onClick={() => penStore.set({ tool: "pen" })}><IconPencil size={18} /></IconButton>
      <IconButton label="Gomme" aria-pressed={pen.tool === "eraser"} className={btn(pen.tool === "eraser")} onClick={() => penStore.set({ tool: "eraser" })}><IconEraser size={18} /></IconButton>
      <span aria-hidden className="mx-0.5 h-6 w-px bg-vc-line" />
      <Popover up trigger={({ open, toggle }) => (
        <button type="button" onClick={toggle} aria-haspopup="menu" aria-expanded={open} aria-label="Épaisseur" title="Épaisseur" className={`grid h-8 w-8 cursor-pointer place-items-center rounded-lg hover:bg-vc-veil ${open ? "bg-vc-veil-strong" : ""}`}>{dot(pen.width)}</button>
      )} panelClassName="min-w-0">
        {(close) => (
          <div className="flex items-center gap-0.5" role="group" aria-label="Épaisseur">
            {PEN_WIDTHS.map((n) => (
              <button key={n} type="button" aria-label={`Épaisseur ${n}`} aria-pressed={pen.width === n} onClick={() => { penStore.set({ width: n }); close(); }} className={`grid h-8 w-8 cursor-pointer place-items-center rounded-lg hover:bg-vc-veil ${btn(pen.width === n)}`}>{dot(n)}</button>
            ))}
          </div>
        )}
      </Popover>
      <span aria-hidden className="mx-0.5 h-6 w-px bg-vc-line" />
      <div className="flex items-center gap-1" role="group" aria-label="Couleur">
        {PEN_COLORS.map((c) => (
          <button key={c} type="button" aria-label={`Couleur ${c}`} aria-pressed={pen.color === c && pen.tool === "pen"} onClick={() => penStore.set({ color: c, tool: "pen" })}
            className={`h-6 w-6 cursor-pointer rounded-full border ${pen.color === c && pen.tool === "pen" ? "ring-2 ring-vc-main ring-offset-2 ring-offset-vc-container" : "border-vc-line-strong"}`} style={{ background: c }} />
        ))}
        <label className={`relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border ${isCustom ? "ring-2 ring-vc-main ring-offset-2 ring-offset-vc-container" : "border-vc-line-strong"}`} title="Couleur personnalisée" style={{ background: isCustom ? pen.color : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }}>
          <span className="sr-only">Couleur personnalisée</span>
          <input type="color" value={pen.color} onChange={(e) => penStore.set({ color: e.target.value.toLowerCase(), tool: "pen" })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </label>
      </div>
    </div>
    </div>
  );
}
