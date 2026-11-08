import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { backToDocument } from "./engine";

/* Briques du ruban : mêmes recettes que la librairie (IconButton 28 px / rayon 7, Popover rayon 9, survol voile, actif orange/20),
   écrites ici car les portails de la librairie rendent dans <body>, hors du Shadow DOM de l'éditeur. */

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// ── Popover (fixed, ancré au déclencheur, fermé au clic dehors / Échap) ─────────────────────────────
export function Popover({
  trigger, children, align = "left", up = false, panelClassName = "",
}: {
  trigger: (o: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  /** Ouvre le menu au-dessus du déclencheur (barre d'état). */
  up?: boolean;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useLayoutEffect(() => {
    if (!open || !root.current) return;
    const r = root.current.getBoundingClientRect();
    setPos({ left: r.left, top: r.bottom + 6 });
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !pos || !panel.current) return;
    const p = panel.current.getBoundingClientRect();
    const maxLeft = window.innerWidth - p.width - 8;
    const left = align === "right" ? Math.max(8, root.current!.getBoundingClientRect().right - p.width) : Math.min(pos.left, maxLeft);
    const wantTop = up ? Math.max(8, root.current!.getBoundingClientRect().top - p.height - 6) : pos.top;
    if (Math.abs(left - pos.left) > 1 || Math.abs(wantTop - pos.top) > 1) setPos({ left: Math.max(8, left), top: wantTop });
  }, [open, pos, align, up]);

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (!e.composedPath().includes(root.current!) && !e.composedPath().includes(panel.current!)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("keydown", key, true);
    return () => { document.removeEventListener("pointerdown", down, true); document.removeEventListener("keydown", key, true); };
  }, [open]);

  return (
    <div ref={root} className="relative inline-flex">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          ref={panel}
          role="menu"
          style={{ position: "fixed", left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? "visible" : "hidden" }}
          className={cx("z-50 min-w-52 rounded-xl border border-vc-line-strong bg-vc-accent p-1.5 shadow-2xl", panelClassName)}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon, label, hint, checked, onClick, disabled, danger }: { icon?: ReactNode; label: ReactNode; hint?: string; checked?: boolean; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button" role="menuitem" disabled={disabled} onClick={() => { onClick(); backToDocument(); }}
      className={cx("flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-vc-veil-strong disabled:cursor-default disabled:opacity-40", danger && "text-vc-danger")}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">{checked ? <IconCheck size={15} aria-hidden /> : icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint && <span className="ml-4 shrink-0 text-xs text-vc-text/45">{hint}</span>}
    </button>
  );
}
export const MenuSep = () => <div className="my-1 h-px bg-vc-line" />;

// ── Boutons ─────────────────────────────────────────────────────────────────────────────────────────
interface BtnProps { label: string; icon: ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void; className?: string; caret?: boolean; onPointerDown?: (e: React.PointerEvent) => void }
/** Bouton d'icône 28 px (IconButton de la librairie) : survol voile, actif = orange/20. */
export function Btn({ label, icon, active, disabled, onClick, className, caret, onPointerDown }: BtnProps) {
  return (
    <button
      type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled}
      onPointerDown={onPointerDown ?? ((e) => e.preventDefault())}
      onClick={() => { onClick?.(); }}
      className={cx(
        "inline-flex h-7 min-w-7 shrink-0 cursor-pointer items-center justify-center gap-0.5 rounded-lg px-1.5 transition-colors hover:bg-vc-veil-strong disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent",
        active && "bg-vc-main/20 text-vc-main hover:bg-vc-main/25", className,
      )}
    >
      {icon}
      {caret && <IconChevronDown size={11} aria-hidden className="opacity-60" />}
    </button>
  );
}

/** Grand bouton : icône au-dessus, légende dessous (Tableau, Image, Page vide…). */
export function BigBtn({ label, icon, active, disabled, onClick, caret, onCaret }: { label: string; icon: ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void; caret?: boolean; onCaret?: () => void }) {
  return (
    <div data-anchor className="flex flex-col items-stretch">
      <button
        type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled}
        onPointerDown={(e) => e.preventDefault()} onClick={onClick}
        className={cx("flex h-8 min-w-12 cursor-pointer flex-col items-center justify-center rounded-t-lg rounded-b-none px-2 transition-colors hover:bg-vc-veil-strong disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent", !caret && "rounded-b-lg", active && "bg-vc-main/20 text-vc-main")}
      >
        {icon}
      </button>
      <button
        type="button" tabIndex={caret ? 0 : -1} disabled={disabled} onPointerDown={(e) => e.preventDefault()} onClick={onCaret ?? onClick}
        className={cx("flex h-[18px] min-w-12 cursor-pointer items-start justify-center gap-0.5 rounded-b-lg px-1.5 text-[11px] leading-[14px] text-vc-text/80 transition-colors hover:bg-vc-veil-strong disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent", !caret && "rounded-t-lg")}
      >
        <span className="whitespace-nowrap">{label}</span>{caret && <IconChevronDown size={10} aria-hidden className="mt-[3px] opacity-60" />}
      </button>
    </div>
  );
}

export const Sep = () => <span aria-hidden className="mx-1 h-5 w-px shrink-0 self-center bg-vc-line" />;

/** Groupe du ruban : contenu seul, séparé du suivant par un trait vertical (la légende ne sert que de nom accessible). */
export function Group({ label, children, className }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <div role="group" aria-label={label} className="flex shrink-0 items-center border-r border-vc-line-strong px-2.5 last:border-r-0">
      <div className={cx("flex items-center gap-0.5", className)}>{children}</div>
    </div>
  );
}
export const Stack = ({ children }: { children: ReactNode }) => <div className="flex flex-col justify-center gap-1">{children}</div>;
export const Row = ({ children }: { children: ReactNode }) => <div className="flex items-center gap-0.5">{children}</div>;

// ── Couleurs ────────────────────────────────────────────────────────────────────────────────────────
const GRAYS = ["000000", "434343", "666666", "999999", "B7B7B7", "CCCCCC", "D9D9D9", "EFEFEF", "F3F3F3", "FFFFFF"];
const HUES: string[][] = [
  ["980000", "CC0000", "E06666", "EA9999", "F4CCCC"], ["E69138", "FF9900", "F6B26B", "F9CB9C", "FCE5CD"],
  ["BF9000", "FFD966", "FFE599", "FFF2CC", "FFFF00"], ["38761D", "6AA84F", "93C47D", "B6D7A8", "D9EAD3"],
  ["134F5C", "45818E", "76A5AF", "A2C4C9", "D0E0E3"], ["1155CC", "3C78D8", "6D9EEB", "A4C2F4", "C9DAF8"],
  ["351C75", "674EA7", "8E7CC3", "B4A7D6", "D9D2E9"], ["741B47", "A64D79", "C27BA0", "D5A6BD", "EAD1DC"],
];
export function ColorGrid({ onPick, autoLabel, noneLabel }: { onPick: (hex: string | "auto" | "none") => void; autoLabel?: string; noneLabel?: string }) {
  return (
    <div className="w-[228px]">
      {(autoLabel || noneLabel) && (
        <button type="button" onClick={() => onPick(autoLabel ? "auto" : "none")} className="mb-1.5 w-full cursor-pointer rounded-lg px-2 py-1.5 text-left text-sm hover:bg-vc-veil-strong">{autoLabel ?? noneLabel}</button>
      )}
      <div className="grid grid-cols-10 gap-1">
        {GRAYS.map((h) => <Swatch key={h} hex={h} onPick={onPick} />)}
        {[0, 1, 2, 3, 4].map((row) => HUES.map((hue, i) => <Swatch key={`${row}-${i}`} hex={hue[row] ?? "FFFFFF"} onPick={onPick} />)).flat()}
      </div>
      <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-vc-veil-strong">
        <input type="color" className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0" onChange={(e) => onPick(e.target.value.slice(1).toUpperCase())} />
        Couleur personnalisée…
      </label>
    </div>
  );
}
const Swatch = ({ hex, onPick }: { hex: string; onPick: (h: string) => void }) => (
  <button type="button" title={`#${hex}`} aria-label={`#${hex}`} onClick={() => onPick(hex)} className="h-[18px] w-[18px] cursor-pointer rounded-sm border border-vc-line-strong transition-transform hover:scale-125" style={{ background: `#${hex}` }} />
);
