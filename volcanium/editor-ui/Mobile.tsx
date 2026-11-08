import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  IconAlignCenter, IconAlignJustified, IconAlignLeft, IconAlignRight, IconArrowBackUp, IconArrowForwardUp, IconBold, IconBook, IconChevronLeft, IconChevronRight,
  IconDots, IconDownload, IconItalic, IconLayoutGrid, IconLayoutSidebar, IconList, IconListNumbers, IconMessage, IconPencil, IconPercentage, IconPhoto,
  IconPlus, IconPrinter, IconSearch, IconSlideshow, IconTable, IconTextColor, IconTextDecrease, IconTextIncrease, IconUnderline, IconUserPlus, IconX, IconLink,
  IconBucket, IconArrowsHorizontal, IconColumnInsertRight, IconZoomIn, IconZoomOut, IconLetterCase, IconBorderAll, IconCoin,
} from "@tabler/icons-react";
import mark from "../public/favicon.svg?inline";
import InkLayer from "./ink/InkLayer";
import PenPalette from "./ink/PenPalette";
import { penStore, usePen } from "./ink/pen";
import { useInkCanWrite } from "./ink/inkStore";
import { autoColor, backToDocument, editorKind, getApi, rgb, useEngine, useStyles } from "./engine";
import { readMe, setEditMode, useDoc } from "./doc";
import { bridgeIcon } from "./bridge";
import { act, useOrig, type Def } from "./Generic";
import { Popover, MenuItem, MenuSep } from "./kit";
import { CommentsPanel, NavPanel, SearchPanel, TitleField, downloadCopy, printDoc, shareFile, useStagePlacement } from "./Shell";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* Coque TÉLÉPHONE / TABLETTE (< 640 px, ou tactile jusqu'à 1024 px) : le minimum pour LIRE et ÉCRIRE, comme Word mobile.
   En-tête compact (retour, titre, commentaires, « ⋯ »), canevas du moteur pleine largeur, barre de mise en forme ancrée en bas (une rangée qui défile,
   cibles de 44 px). Ni onglets, ni ruban, ni règle, ni barre d'état : tout le reste est dans le menu « ⋯ » ou dans des tiroirs plein écran. */

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const QUERY = "(max-width: 639px), (pointer: coarse) and (max-width: 1024px)";
const subscribe = (l: () => void) => { const m = window.matchMedia(QUERY); m.addEventListener("change", l); return () => m.removeEventListener("change", l); };
/** Vrai sur téléphone ou tablette tactile : réactif au redimensionnement et à la rotation. */
export const useMobile = (): boolean => useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);

const api = (): any => getApi();
const kindOf = () => editorKind();

// ── Briques ───────────────────────────────────────────────────────────────────────────────────────
/** Bouton de la barre du bas : 44 px, ne vole jamais le focus au document (le clavier reste ouvert, la sélection aussi). */
function TB({ label, icon, onClick, active, disabled, wide }: { label: string; icon: ReactNode; onClick?: () => void; active?: boolean; disabled?: boolean; wide?: boolean }) {
  return (
    <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled} onPointerDown={(e) => e.preventDefault()} onClick={onClick}
      className={cx("flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-vc-text active:bg-vc-veil-strong disabled:cursor-default disabled:opacity-35", wide ? "min-w-14 px-2" : "min-w-11", active && "bg-vc-main/20 text-vc-main")}>
      {icon}
    </button>
  );
}
/** Bouton relié à un contrôle d'origine (tableur, présentation) : état actif / grisé relu du vrai contrôle. */
function OB({ d }: { d: Def }) {
  const st = useOrig(d);
  return <TB label={d.l} icon={d.i} active={st.active} disabled={st.disabled} onClick={act(d)} />;
}
const Div = () => <span aria-hidden className="mx-0.5 h-6 w-px shrink-0 self-center bg-vc-line-strong" />;

const SWATCHES = ["000000", "666666", "CC0000", "E69138", "BF9000", "38761D", "1155CC", "674EA7", "A64D79", "FFFFFF"];
function Swatches({ onPick, autoLabel }: { onPick: (hex: string | "auto") => void; autoLabel?: string }) {
  return (
    <div className="w-[236px]">
      {autoLabel && <button type="button" onClick={() => onPick("auto")} className="mb-1 flex h-11 w-full cursor-pointer items-center rounded-lg px-2.5 text-left text-sm active:bg-vc-veil-strong">{autoLabel}</button>}
      <div className="grid grid-cols-5 gap-2 p-1">
        {SWATCHES.map((h) => <button key={h} type="button" aria-label={`#${h}`} onClick={() => onPick(h)} className="h-10 cursor-pointer rounded-lg border border-vc-line-strong" style={{ background: `#${h}` }} />)}
      </div>
    </div>
  );
}

// ── Menu « ⋯ » ────────────────────────────────────────────────────────────────────────────────────
function MoreMenu({ reader, onSearch, onNav, onSlides }: { reader: boolean; onSearch: () => void; onNav: () => void; onSlides: () => void }) {
  const KIND = kindOf();
  const d = useDoc();
  const me = readMe();
  const pen = usePen();
  const canInk = useInkCanWrite();
  const [mode, setMode] = useState<"edit" | "view">("edit");
  const zoomBy = (f: number) => { try { if (KIND === "sheet") api().asc_setZoom(Math.max(0.1, Math.min(5, ((api().asc_getZoom?.() ?? 1) as number) * f))); else if (f > 1) api().zoomIn(); else api().zoomOut(); } catch { /* sans effet */ } };
  return (
    <Popover align="right" panelClassName="w-64" trigger={({ toggle }) => <TB label="Plus d’actions" icon={<IconDots size={22} />} onClick={toggle} />}>
      {(close) => {
        const go = (fn: () => void) => () => { close(); fn(); };
        const item = (icon: ReactNode, label: string, fn: () => void, checked?: boolean) => <div className="[&_button]:min-h-11"><MenuItem icon={icon} label={label} checked={checked} onClick={go(fn)} /></div>;
        return (<>
          {!reader && !me?.id.startsWith("ext:") && item(<IconUserPlus size={18} />, "Partager", shareFile)}
          {item(<IconSearch size={18} />, "Rechercher", onSearch)}
          {KIND === "doc" && item(<IconLayoutSidebar size={18} />, "Plan et pages", onNav)}
          {KIND === "slide" && item(<IconLayoutGrid size={18} />, "Diapositives", onSlides)}
          {KIND === "slide" && item(<IconSlideshow size={18} />, "Présenter", () => { try { (window as any).Common.NotificationCenter.trigger("preview:start", Math.max(0, (d.page ?? 1) - 1), false, false, true); } catch { /* sans effet */ } })}
          <MenuSep />
          {item(<IconArrowsHorizontal size={18} />, "Ajuster à la largeur", () => { try { api().zoomFitToWidth(); } catch { /* sans effet */ } })}
          {item(<IconZoomIn size={18} />, "Zoom +", () => zoomBy(1.2))}
          {item(<IconZoomOut size={18} />, "Zoom −", () => zoomBy(1 / 1.2))}
          {!reader && (<>
            <MenuSep />
            {item(<IconBook size={18} />, "Mode lecture", () => { const n = mode === "view" ? "edit" : "view"; setMode(n); setEditMode(n); }, mode === "view")}
            {KIND === "doc" && canInk && item(<IconPencil size={18} />, "Dessiner au stylo", () => penStore.set({ active: !pen.active, tool: "pen" }), pen.active)}
          </>)}
          <MenuSep />
          {item(<IconDownload size={18} />, "Télécharger une copie", downloadCopy)}
          {item(<IconPrinter size={18} />, "Imprimer", printDoc)}
        </>);
      }}
    </Popover>
  );
}

// ── En-tête ───────────────────────────────────────────────────────────────────────────────────────
function MHeader({ reader, count, onComments, ...menu }: { reader: boolean; count: number; onComments: () => void; onSearch: () => void; onNav: () => void; onSlides: () => void }) {
  const d = useDoc();
  const KIND = kindOf();
  const saved = d.modified === false || d.modified === null;
  const sub = [reader ? "Lecture seule" : saved ? "Enregistré" : "Enregistrement…", KIND !== "sheet" && d.page != null ? `${KIND === "slide" ? "Diapo" : "Page"} ${d.page}/${d.pages ?? "—"}` : null].filter(Boolean).join(" · ");
  return (
    <header className="flex h-14 shrink-0 items-center gap-1 border-b border-vc-line bg-vc-back px-1.5">
      <button type="button" aria-label="Retour aux fichiers" title="Retour aux fichiers" onClick={() => (window as any).Common?.Gateway?.requestClose?.()}
        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl active:bg-vc-veil-strong"><img src={mark} alt="" className="h-8 w-8" /></button>
      <div className="min-w-0 flex-1">
        {reader ? <h1 className="truncate px-2 text-[15px] font-semibold text-vc-text">{d.title || "Document"}</h1> : <TitleField title={d.title || "Document sans titre"} compact />}
        <div className="truncate px-2 text-[11px] leading-tight text-vc-text/55" aria-live="polite">{sub}</div>
      </div>
      <button type="button" aria-label="Commentaires" title="Commentaires" onClick={onComments} className="relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl active:bg-vc-veil-strong">
        <IconMessage size={22} aria-hidden />
        {count > 0 && <span className="absolute right-1 top-1 min-w-4 rounded-full bg-vc-main px-1 text-center text-[10px] font-semibold leading-4 text-vc-on-main">{count}</span>}
      </button>
      <MoreMenu reader={reader} {...menu} />
    </header>
  );
}

// ── Barres d'outils du bas ────────────────────────────────────────────────────────────────────────
const ALIGN_ORDER = [1, 2, 0, 3] as const; // gauche, centre, droite, justifié (valeurs de put_PrAlign)
const ALIGN_ICON: Record<number, ReactNode> = { 1: <IconAlignLeft size={21} />, 2: <IconAlignCenter size={21} />, 0: <IconAlignRight size={21} />, 3: <IconAlignJustified size={21} /> };

function InsertSheet({ onClose }: { onClose: () => void }) {
  const [cols, setCols] = useState(3);
  const run = (fn: () => void) => () => { onClose(); fn(); };
  return (
    <div role="dialog" aria-label="Insérer" className="absolute inset-x-0 bottom-0 z-30 rounded-t-2xl border-t border-vc-line-strong bg-vc-accent p-4 pb-6 shadow-2xl">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold">Insérer</h2><TB label="Fermer" icon={<IconX size={20} />} onClick={onClose} /></div>
      <div className="mb-2 text-xs text-vc-text/60">Tableau</div>
      <div className="mb-4 flex items-center gap-1.5">
        {[2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => setCols(n)} aria-pressed={cols === n}
            className={cx("h-11 min-w-0 flex-1 cursor-pointer rounded-xl border text-sm", cols === n ? "border-vc-main bg-vc-main/15 text-vc-main" : "border-vc-line-strong")}>{n}×{n}</button>
        ))}
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={run(() => { try { api().put_Table(cols, cols); } catch { /* sans effet */ } })}
          className="flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-vc-main px-3 text-sm font-semibold text-vc-on-main"><IconTable size={18} aria-hidden />Insérer</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={run(() => { try { api().asc_addImage(); } catch { /* sans effet */ } })} className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-vc-line-strong text-sm"><IconPhoto size={20} aria-hidden />Image</button>
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={run(() => { bridgeIcon(["hyperlink"]); })} className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-vc-line-strong text-sm"><IconLink size={20} aria-hidden />Lien</button>
      </div>
    </div>
  );
}

function DocBar({ onInsert }: { onInsert: () => void }) {
  const s = useEngine();
  const pen = usePen();
  const styles = useStyles();
  const run = (fn: () => void) => () => { try { fn(); } catch { /* sans effet */ } };
  const nextAlign = () => { const i = ALIGN_ORDER.indexOf((s.align ?? 1) as 1); api().put_PrAlign(ALIGN_ORDER[(i + 1) % ALIGN_ORDER.length]); };
  return (
    <>
      <TB label="Annuler" icon={<IconArrowBackUp size={21} />} disabled={!s.undo} onClick={run(() => api().Undo())} />
      <TB label="Rétablir" icon={<IconArrowForwardUp size={21} />} disabled={!s.redo} onClick={run(() => api().Redo())} />
      <Div />
      <TB label="Gras" icon={<IconBold size={21} />} active={s.bold} onClick={run(() => api().put_TextPrBold(!s.bold))} />
      <TB label="Italique" icon={<IconItalic size={21} />} active={s.italic} onClick={run(() => api().put_TextPrItalic(!s.italic))} />
      <TB label="Souligné" icon={<IconUnderline size={21} />} active={s.underline} onClick={run(() => api().put_TextPrUnderline(!s.underline))} />
      <Div />
      <TB label="Réduire la police" icon={<IconTextDecrease size={21} />} onClick={run(() => api().FontSizeOut())} />
      <span className="flex h-11 min-w-8 shrink-0 items-center justify-center text-sm tabular-nums text-vc-text/70" aria-label="Taille de police">{s.size ?? ""}</span>
      <TB label="Agrandir la police" icon={<IconTextIncrease size={21} />} onClick={run(() => api().FontSizeIn())} />
      <Div />
      <TB label="Liste à puces" icon={<IconList size={21} />} onClick={run(() => api().put_ListTypeCustom({ Type: "bullet" }))} />
      <TB label="Liste numérotée" icon={<IconListNumbers size={21} />} onClick={run(() => api().put_ListTypeCustom({ Type: "number" }))} />
      <TB label="Alignement" icon={ALIGN_ICON[s.align ?? 1] ?? ALIGN_ICON[1]} onClick={run(nextAlign)} />
      <Div />
      <Popover up panelClassName="p-1.5" trigger={({ toggle }) => <TB label="Couleur du texte" icon={<span className="flex flex-col items-center"><IconTextColor size={20} /><span className="-mt-0.5 h-[3px] w-5 rounded-full" style={{ background: s.textColor ? `#${s.textColor}` : "var(--vc-text)" }} /></span>} onClick={toggle} />}>
        {(close) => <Swatches autoLabel="Automatique" onPick={(h) => { try { api().put_TextColor(h === "auto" ? autoColor() : rgb(h)); } catch { /* sans effet */ } close(); backToDocument(); }} />}
      </Popover>
      <Popover up panelClassName="w-52 p-1.5" trigger={({ toggle }) => <TB label="Style de paragraphe" icon={<IconLetterCase size={21} />} wide onClick={toggle} />}>
        {(close) => <div className="max-h-72 overflow-y-auto">{styles.map((st) => <div key={st.title} className="[&_button]:min-h-11"><MenuItem label={st.title} checked={s.style === st.title} onClick={() => { try { api().put_Style(st.title); } catch { /* sans effet */ } close(); }} /></div>)}</div>}
      </Popover>
      <Div />
      <TB label="Zoom −" icon={<IconZoomOut size={21} />} onClick={run(() => api().zoomOut())} />
      <TB label="Zoom +" icon={<IconZoomIn size={21} />} onClick={run(() => api().zoomIn())} />
      <Div />
      <TB label="Insérer" icon={<IconPlus size={22} />} onClick={onInsert} disabled={pen.active} />
    </>
  );
}

const SD = (l: string, i: ReactNode, s: string, menu?: boolean): Def => ({ l, i, s, menu });
function SheetBar() {
  const IS = 21;
  const autofit = () => { try { api().asc_autoFitColumnWidth(null); } catch { /* sans effet */ } backToDocument(); };
  return (
    <>
      <OB d={SD("Annuler", <IconArrowBackUp size={IS} />, "btn-undo")} />
      <OB d={SD("Rétablir", <IconArrowForwardUp size={IS} />, "btn-redo")} />
      <Div />
      <OB d={SD("Gras", <IconBold size={IS} />, "btn-bold")} />
      <OB d={SD("Italique", <IconItalic size={IS} />, "btn-italic")} />
      <OB d={SD("Souligné", <IconUnderline size={IS} />, "btn-underline")} />
      <Div />
      <OB d={SD("Pourcentage", <IconPercentage size={IS} />, "btn-percents")} />
      <OB d={SD("Monétaire", <IconCoin size={IS} />, "btn-currency", true)} />
      <OB d={SD("Format de nombre", <IconBorderAll size={IS} />, "btn-format", true)} />
      <Div />
      <OB d={SD("Couleur du texte", <IconTextColor size={IS} />, "btn-fontcolor", true)} />
      <OB d={SD("Couleur de remplissage", <IconBucket size={IS} />, "btn-fillparag", true)} />
      <TB label="Ajuster la largeur de colonne" icon={<IconColumnInsertRight size={IS} />} onClick={autofit} />
    </>
  );
}

function SlideBar() {
  const s = useEngine();
  const d = useDoc();
  const IS = 21;
  const go = (delta: number) => { try { api().goToPage(Math.max(0, Math.min((d.pages ?? 1) - 1, (d.page ?? 1) - 1 + delta))); } catch { /* sans effet */ } };
  return (
    <>
      <TB label="Diapositive précédente" icon={<IconChevronLeft size={IS} />} disabled={(d.page ?? 1) <= 1} onClick={() => go(-1)} />
      <span className="flex h-11 min-w-10 shrink-0 items-center justify-center text-sm tabular-nums text-vc-text/70">{d.page ?? "—"}/{d.pages ?? "—"}</span>
      <TB label="Diapositive suivante" icon={<IconChevronRight size={IS} />} disabled={(d.page ?? 1) >= (d.pages ?? 1)} onClick={() => go(1)} />
      <Div />
      <TB label="Annuler" icon={<IconArrowBackUp size={IS} />} disabled={!s.undo} onClick={() => { try { api().Undo(); } catch { /* sans effet */ } }} />
      <TB label="Rétablir" icon={<IconArrowForwardUp size={IS} />} disabled={!s.redo} onClick={() => { try { api().Redo(); } catch { /* sans effet */ } }} />
      <Div />
      <OB d={SD("Gras", <IconBold size={IS} />, "btn-bold")} />
      <OB d={SD("Italique", <IconItalic size={IS} />, "btn-italic")} />
      <OB d={SD("Réduire la police", <IconTextDecrease size={IS} />, "btn-decfont")} />
      <OB d={SD("Agrandir la police", <IconTextIncrease size={IS} />, "btn-incfont")} />
      <Div />
      <OB d={SD("Nouvelle diapositive", <IconPlus size={IS} />, "addslide")} />
    </>
  );
}

// ── Réglages propres au téléphone ─────────────────────────────────────────────────────────────────
/** Le moteur attend les dimensions du centre : à chaque changement de largeur (rotation), la page est réajustée. Texte : règle masquée, largeur de page ; diaporama : vignettes d'amont fermées. */
function useMobileDefaults(center: { current: HTMLDivElement | null }, ready: boolean): void {
  const KIND = kindOf();
  useEffect(() => {
    if (!ready) return undefined;
    // Le moteur de présentation construit ses séparateurs un peu après l'ouverture : on réessaie.
    const apply = () => { try { if (KIND === "doc") api().asc_SetViewRulers?.(false); if (KIND === "slide") { api().ShowThumbnails?.(false); api().asc_ShowNotes?.(false); } } catch { /* sans effet */ } };
    apply();
    const timers = [600, 1800, 4000].map((ms) => setTimeout(apply, ms));
    return () => {
      timers.forEach(clearTimeout);
      try { if (KIND === "doc") api().asc_SetViewRulers?.(true); if (KIND === "slide") { api().ShowThumbnails?.(true); api().asc_ShowNotes?.(true); } } catch { /* sans effet */ }
    };
  }, [KIND, ready]);
  useEffect(() => {
    const el = center.current;
    if (!el || !ready || KIND === "sheet") return undefined;
    let last = -1, timer: ReturnType<typeof setTimeout> | undefined;
    const fit = () => { try { if (KIND === "doc") api().zoomFitToWidth(); else api().zoomFitToPage(); } catch { /* sans effet */ } };
    // Premier ajustement (le moteur n'a parfois pas fini de se mettre en page quand la coque apparaît) : réessayé tant que la page n'est pas stable.
    const first = [300, 1500, 4000].map((ms) => setTimeout(fit, ms));
    const ro = new ResizeObserver(() => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w === last) return; // le clavier change la hauteur, pas la largeur : on ne touche pas au zoom
      last = w; clearTimeout(timer); timer = setTimeout(fit, 200);
    });
    ro.observe(el);
    return () => { ro.disconnect(); clearTimeout(timer); first.forEach(clearTimeout); };
  }, [center, KIND, ready]);
}

type Panel = null | "nav" | "comments" | "slides" | "insert";

function SlidesSheet({ onClose }: { onClose: () => void }) {
  const d = useDoc();
  return (
    <aside className="flex min-h-0 w-full flex-1 flex-col bg-vc-back p-4" aria-label="Diapositives">
      <div className="flex items-center justify-between"><h2 className="text-[17px] font-semibold">Diapositives</h2><TB label="Fermer" icon={<IconX size={20} />} onClick={onClose} /></div>
      <div className="mt-3 grid min-h-0 flex-1 grid-cols-3 content-start gap-2 overflow-y-auto">
        {Array.from({ length: d.pages ?? 0 }, (_, i) => (
          <button key={i} type="button" aria-label={`Diapositive ${i + 1}`} onClick={() => { try { api().goToPage(i); } catch { /* sans effet */ } onClose(); }}
            className={cx("flex aspect-video cursor-pointer items-end justify-start rounded-lg border bg-vc-veil p-1.5 text-xs", d.page === i + 1 ? "border-vc-main text-vc-main" : "border-vc-line-strong text-vc-text/70")}>{i + 1}</button>
        ))}
      </div>
    </aside>
  );
}

/** Coque téléphone : édition (`reader` faux) ou lecture seule. */
export default function MobileShell({ stage, reader = false }: { stage?: ReactNode; reader?: boolean }) {
  const d = useDoc();
  const KIND = kindOf();
  const [panel, setPanel] = useState<Panel>(null);
  const [searching, setSearching] = useState(false);
  const center = useRef<HTMLDivElement>(null);
  const pen = usePen();
  useStagePlacement(center);
  useEffect(() => { document.body.classList.add("vo-mobile"); return () => document.body.classList.remove("vo-mobile"); }, []);
  useMobileDefaults(center, true);
  useEffect(() => {
    const f = () => { setPanel("comments"); if (!reader) setTimeout(() => window.dispatchEvent(new Event("vo:compose")), 60); };
    window.addEventListener("vo:new-comment", f);
    return () => window.removeEventListener("vo:new-comment", f);
  }, [reader]);
  const bar = useMemo(() => (KIND === "doc" ? <DocBar onInsert={() => setPanel("insert")} /> : KIND === "sheet" ? <SheetBar /> : <SlideBar />), [KIND]);
  const close = () => setPanel(null);
  return (
    <div className="vo-root relative flex h-full flex-col text-vc-text">
      <MHeader reader={reader} count={d.comments.length} onComments={() => setPanel((p) => (p === "comments" ? null : "comments"))} onSearch={() => setSearching(true)} onNav={() => setPanel("nav")} onSlides={() => setPanel("slides")} />
      <div className="vo-row flex min-h-0 flex-1">
        <div ref={center} className="vo-hole relative min-w-0 flex-1 overflow-hidden">{stage}{KIND === "doc" && !reader && <InkLayer />}{KIND === "doc" && !reader && pen.active && <PenPalette />}</div>
      </div>
      {!reader && (
        <nav aria-label="Mise en forme" className="flex h-[52px] shrink-0 items-center gap-0.5 overflow-x-auto border-t border-vc-line bg-vc-back px-1.5 pb-[env(safe-area-inset-bottom)] [scrollbar-width:none]">
          {bar}
        </nav>
      )}
      {panel === "insert" && <InsertSheet onClose={close} />}
      {(panel === "nav" || panel === "comments" || panel === "slides") && (
        <div className="absolute inset-0 z-30 flex flex-col bg-vc-back">
          {panel === "nav" && <NavPanel sheet onClose={close} />}
          {panel === "comments" && <CommentsPanel sheet readOnly={reader} onClose={close} />}
          {panel === "slides" && <SlidesSheet onClose={close} />}
        </div>
      )}
      {searching && <div className="pointer-events-none absolute inset-x-0 top-14 z-40"><div className="relative"><SearchPanel onClose={() => setSearching(false)} /></div></div>}
    </div>
  );
}
