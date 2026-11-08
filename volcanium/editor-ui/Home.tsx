import { useMemo, useState, type ReactNode } from "react";
import {
  IconAlignCenter, IconAlignJustified, IconAlignLeft, IconAlignRight, IconArrowBackUp, IconArrowForwardUp, IconBold, IconBrush,
  IconBucket, IconChevronDown, IconClipboard, IconCopy, IconCut, IconEraser, IconHighlight, IconIndentDecrease, IconIndentIncrease,
  IconItalic, IconLetterCase, IconLineHeight, IconList, IconListNumbers, IconListTree, IconPilcrow, IconSearch, IconStrikethrough,
  IconPencil, IconBorderAll, IconSelectAll, IconSubscript, IconSuperscript, IconTextDirectionLtr, IconTextColor, IconTextDecrease, IconTextIncrease, IconUnderline,
} from "@tabler/icons-react";
import { autoColor, backToDocument, fontNames, getApi, keyGuard, rgb, useEngine, useStyles } from "./engine";
import { Btn, BigBtn, ColorGrid, Group, MenuItem, Popover, Row, Sep, Stack } from "./kit";
import { bridgeClick, bridgeSlot } from "./bridge";
import { Small } from "./Generic";
import { inkStore, useInkCanWrite, useStrokes } from "./ink/inkStore";
import { penStore, usePen } from "./ink/pen";

const api = () => getApi();
const w = window as unknown as { Asc: Record<string, any> };
// Alignement (put_PrAlign) : 1 gauche, 0 droite, 2 centre, 3 justifié
const ALIGN = { left: 1, right: 0, center: 2, justify: 3 } as const;
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

export function FontPicker({ current }: { current: string | null }) {
  const [q, setQ] = useState("");
  const names = useMemo(() => fontNames(), []);
  const list = names.filter((n) => n.toLowerCase().includes(q.toLowerCase()));
  return (
    <Popover
      panelClassName="w-64 p-1.5"
      trigger={({ toggle }) => (
        <button type="button" title="Police" onPointerDown={(e) => e.preventDefault()} onClick={toggle}
          className="flex h-7 w-36 cursor-pointer items-center justify-between gap-1 rounded-lg border border-vc-line-strong px-2.5 text-sm hover:border-vc-text/30">
          <span className="truncate">{current ?? "Police"}</span><IconChevronDown size={13} className="shrink-0 opacity-60" aria-hidden />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="mb-1.5 flex items-center gap-2 rounded-lg border border-vc-line-strong px-2">
            <IconSearch size={14} className="opacity-50" aria-hidden />
            <input autoFocus value={q} onFocus={keyGuard.on} onBlur={keyGuard.off} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une police" className="h-7 w-full bg-transparent text-sm outline-none placeholder:text-vc-secondary/40" />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {list.map((n) => <MenuItem key={n} label={n} checked={n === current} onClick={() => { api().put_TextPrFontName(n); close(); }} />)}
            {list.length === 0 && <div className="px-2 py-3 text-sm text-vc-text/50">Aucune police</div>}
          </div>
        </>
      )}
    </Popover>
  );
}

export function SizeBox({ size }: { size: number | null }) {
  const [draft, setDraft] = useState<string | null>(null);
  const apply = (v: number) => { if (v > 0 && v < 1639) api().put_TextPrFontSize(v); backToDocument(); };
  return (
    <Popover
      panelClassName="min-w-20 p-1.5"
      trigger={({ toggle }) => (
        <div className="flex h-7 w-16 items-center rounded-lg border border-vc-line-strong hover:border-vc-text/30">
          <input
            aria-label="Taille de police" inputMode="numeric" value={draft ?? (size ?? "")}
            onFocus={(e) => { keyGuard.on(); e.currentTarget.select(); }} onChange={(e) => setDraft(e.target.value.replace(/[^\d.]/g, ""))}
            onBlur={() => { if (draft) apply(parseFloat(draft)); setDraft(null); keyGuard.off(); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); } }}
            className="h-full w-9 bg-transparent pl-2.5 text-sm tabular-nums outline-none"
          />
          <button type="button" aria-label="Tailles" onPointerDown={(e) => e.preventDefault()} onClick={toggle} className="flex h-full flex-1 cursor-pointer items-center justify-center rounded-r-lg hover:bg-vc-veil-strong"><IconChevronDown size={13} className="opacity-60" aria-hidden /></button>
        </div>
      )}
    >
      {(close) => <div className="max-h-72 overflow-y-auto">{SIZES.map((s) => <MenuItem key={s} label={s} checked={s === size} onClick={() => { apply(s); close(); }} />)}</div>}
    </Popover>
  );
}

export function ColorBtn({ label, icon, color, onPick, autoLabel, noneLabel }: { label: string; icon: ReactNode; color: string | null; onPick: (h: string | "auto" | "none") => void; autoLabel?: string; noneLabel?: string }) {
  return (
    <Popover
      trigger={({ toggle }) => (
        <button type="button" title={label} aria-label={label} onPointerDown={(e) => e.preventDefault()} onClick={toggle}
          className="relative inline-flex h-7 min-w-7 cursor-pointer items-center justify-center gap-0.5 rounded-lg px-1.5 hover:bg-vc-veil-strong">
          {icon}<IconChevronDown size={11} className="opacity-60" aria-hidden />
          <span className="absolute bottom-0.5 left-1.5 right-4 h-[3px] rounded-full" style={{ background: color ? `#${color}` : "var(--vc-text)" }} />
        </button>
      )}
    >
      {(close) => <ColorGrid autoLabel={autoLabel} noneLabel={noneLabel} onPick={(h) => { onPick(h); close(); backToDocument(); }} />}
    </Popover>
  );
}


/** Carte de style « Aa » : taille et graisse selon le niveau du titre (Normal, Titre 1, Titre 2…). */
function StyleCard({ title, active, onPick }: { title: string; active: boolean; onPick: () => void }) {
  const level = /(\d)\s*$/.exec(title)?.[1];
  const big = level ? Math.max(14, 26 - Number(level) * 3) : 17;
  return (
    <button type="button" role="option" aria-selected={active} title={title} onPointerDown={(e) => e.preventDefault()} onClick={onPick}
      className={`flex h-[44px] w-[80px] shrink-0 cursor-pointer flex-col items-center justify-center rounded-lg border transition-colors ${active ? "border-vc-main bg-vc-main/10" : "border-vc-line-strong bg-vc-veil hover:bg-vc-veil-strong"}`}>
      <span className="leading-none" style={{ fontSize: big, fontWeight: level ? 600 : 400, fontFamily: "'Arimo',sans-serif" }}>Aa</span>
      <span className="mt-1 max-w-[76px] truncate text-[10px] leading-none text-vc-text/70">{title}</span>
    </button>
  );
}

export default function Home() {
  const s = useEngine();
  const pen = usePen();
  useStrokes(); // se redessine quand le dessin change (annuler / rétablir) ; le droit d'écrire vient du serveur (lecture seule = pas de stylo)
  const canInk = useInkCanWrite();
  const run = (fn: () => void) => () => { fn(); backToDocument(); };
  const styles = useStyles();
  const [lastShade, setLastShade] = useState<string | null>(null);
  const setHighlight = (h: string) => {
    if (h === "none" || h === "auto") api().SetMarkerFormat(true, false);
    else api().SetMarkerFormat(true, true, parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16));
  };
  const setShade = (h: string) => {
    setLastShade(h === "none" ? null : h);
    if (h === "none") api().put_ParagraphShade(false); else api().put_ParagraphShade(true, rgb(h));
  };
  const caseOf = (k: string) => run(() => api().asc_ChangeTextCase(w.Asc.c_oAscChangeTextCaseType[k]));
  const spacing = [1, 1.15, 1.5, 2, 2.5, 3];

  return (
    <>
      <Group label="Historique">
        <Stack>
          <Row>
            <Btn label="Annuler" icon={<IconArrowBackUp size={17} />} disabled={pen.active ? !inkStore.canUndo() : !s.undo} onClick={run(() => (pen.active ? inkStore.undo() : api().Undo()))} />
            <Btn label="Rétablir" icon={<IconArrowForwardUp size={17} />} disabled={pen.active ? !inkStore.canRedo() : !s.redo} onClick={run(() => (pen.active ? inkStore.redo() : api().Redo()))} />
          </Row>
        </Stack>
      </Group>
      <Group label="Presse-papiers">
        <BigBtn label="Coller" icon={<IconClipboard size={20} />} onClick={run(() => api().Paste())} />
        <Stack>
          <Btn label="Couper" icon={<IconCut size={17} />} disabled={!s.canCopy} onClick={run(() => api().Cut())} />
          <Btn label="Copier" icon={<IconCopy size={17} />} disabled={!s.canCopy} onClick={run(() => api().Copy())} />
        </Stack>
        <Btn label="Reproduire la mise en forme" icon={<IconBrush size={17} />} active={s.paint} onClick={run(() => api().SetPaintFormat(s.paint ? 0 : 1))} />
      </Group>
      <Group label="Police">
        <Stack>
          <Row>
            <FontPicker current={s.fontName} />
            <SizeBox size={s.size} />
            <Btn label="Agrandir la police" icon={<IconTextIncrease size={17} />} onClick={run(() => api().FontSizeIn())} />
            <Btn label="Réduire la police" icon={<IconTextDecrease size={17} />} onClick={run(() => api().FontSizeOut())} />
            <Popover trigger={({ toggle }) => <Btn label="Modifier la casse" icon={<IconLetterCase size={17} />} caret onClick={toggle} />}>
              {(close) => (<>
                <MenuItem label="Majuscule en début de phrase" onClick={() => { caseOf("SentenceCase")(); close(); }} />
                <MenuItem label="minuscule" onClick={() => { caseOf("LowerCase")(); close(); }} />
                <MenuItem label="MAJUSCULES" onClick={() => { caseOf("UpperCase")(); close(); }} />
                <MenuItem label="Majuscule Au Début De Chaque Mot" onClick={() => { caseOf("CapitalizeWords")(); close(); }} />
                <MenuItem label="iNVERSER LA CASSE" onClick={() => { caseOf("ToggleCase")(); close(); }} />
              </>)}
            </Popover>
          </Row>
          <Row>
            <Btn label="Gras" icon={<IconBold size={17} />} active={s.bold} onClick={run(() => api().put_TextPrBold(!s.bold))} />
            <Btn label="Italique" icon={<IconItalic size={17} />} active={s.italic} onClick={run(() => api().put_TextPrItalic(!s.italic))} />
            <Btn label="Souligné" icon={<IconUnderline size={17} />} active={s.underline} onClick={run(() => api().put_TextPrUnderline(!s.underline))} />
            <Btn label="Barré" icon={<IconStrikethrough size={17} />} active={s.strike} onClick={run(() => api().put_TextPrStrikeout(!s.strike))} />
            <Btn label="Exposant" icon={<IconSuperscript size={17} />} active={s.sup} onClick={run(() => api().put_TextPrBaseline(s.sup ? 0 : 1))} />
            <Btn label="Indice" icon={<IconSubscript size={17} />} active={s.sub} onClick={run(() => api().put_TextPrBaseline(s.sub ? 0 : 2))} />
            <Sep />
            <ColorBtn label="Couleur de surlignage" icon={<IconHighlight size={17} />} color={s.highlight} noneLabel="Aucun surlignage" onPick={setHighlight} />
            <ColorBtn label="Couleur de police" icon={<IconTextColor size={17} />} color={s.textColor} autoLabel="Automatique"
              onPick={(h) => api().put_TextColor(h === "auto" || h === "none" ? autoColor() : rgb(h))} />
            <Btn label="Effacer la mise en forme" icon={<IconEraser size={17} />} onClick={run(() => api().ClearFormating())} />
          </Row>
        </Stack>
      </Group>
      <Group label="Paragraphe">
        <Stack>
          <Row>
            <Btn label="Liste à puces" icon={<IconList size={17} />} onClick={run(() => api().put_ListTypeCustom({ Type: "bullet" }))} />
            <Btn label="Liste numérotée" icon={<IconListNumbers size={17} />} onClick={run(() => api().put_ListTypeCustom({ Type: "number" }))} />
            <Small d={{ l: "Liste à plusieurs niveaux", i: <IconListTree size={17} />, s: "btn-multilevels", menu: true }} />
            <Btn label="Réduire le retrait" icon={<IconIndentDecrease size={17} />} onClick={run(() => api().DecreaseIndent())} />
            <Btn label="Augmenter le retrait" icon={<IconIndentIncrease size={17} />} onClick={run(() => api().IncreaseIndent())} />
            <Popover trigger={({ toggle }) => <Btn label="Interligne" icon={<IconLineHeight size={17} />} caret onClick={toggle} />}>
              {(close) => <>{spacing.map((v) => <MenuItem key={v} label={String(v).replace(".", ",")} checked={s.lineSpacing != null && Math.abs(s.lineSpacing - v) < 0.0001} onClick={() => { api().put_PrLineSpacing(1, v); close(); }} />)}</>}
            </Popover>
            <Small d={{ l: "Direction du texte", i: <IconTextDirectionLtr size={17} />, s: "btn-direction", menu: true }} />
            <Btn label="Afficher les caractères non imprimables" icon={<IconPilcrow size={17} />} active={s.marks} onClick={run(() => api().put_ShowParaMarks(!s.marks))} />
          </Row>
          <Row>
            <Btn label="Aligner à gauche" icon={<IconAlignLeft size={17} />} active={s.align === ALIGN.left} onClick={run(() => api().put_PrAlign(ALIGN.left))} />
            <Btn label="Centrer" icon={<IconAlignCenter size={17} />} active={s.align === ALIGN.center} onClick={run(() => api().put_PrAlign(ALIGN.center))} />
            <Btn label="Aligner à droite" icon={<IconAlignRight size={17} />} active={s.align === ALIGN.right} onClick={run(() => api().put_PrAlign(ALIGN.right))} />
            <Btn label="Justifier" icon={<IconAlignJustified size={17} />} active={s.align === ALIGN.justify} onClick={run(() => api().put_PrAlign(ALIGN.justify))} />
            <Sep />
            <ColorBtn label="Arrière-plan du paragraphe" icon={<IconBucket size={17} />} color={lastShade} noneLabel="Sans remplissage" onPick={setShade} />
            <Small d={{ l: "Bordures", i: <IconBorderAll size={17} />, t: ["border-out"], menu: true }} />
          </Row>
        </Stack>
      </Group>
      <Group label="Styles">
        <div className="flex items-stretch gap-1.5" role="listbox" aria-label="Styles">
          {styles.slice(0, 3).map((st) => <StyleCard key={st.title} title={st.title} active={s.style === st.title} onPick={run(() => api().put_Style(st.title))} />)}
        </div>
        <Popover align="right" panelClassName="w-[300px]" trigger={({ toggle }) => <Btn label="Tous les styles" icon={<IconChevronDown size={15} />} onClick={toggle} />}>
          {(close) => (
            <div className="grid max-h-80 grid-cols-3 gap-1.5 overflow-y-auto p-0.5">
              {styles.map((st) => <StyleCard key={st.title} title={st.title} active={s.style === st.title} onPick={() => { api().put_Style(st.title); backToDocument(); close(); }} />)}
            </div>
          )}
        </Popover>
      </Group>
      <Group label="Dessiner">
        <BigBtn label="Dessiner" icon={<IconPencil size={20} />} active={pen.active} disabled={!canInk} onClick={() => penStore.set({ active: !pen.active, tool: "pen" })} />
      </Group>
      <Group label="Sélection">
        <Stack>
          <Small d={{ l: "Tout sélectionner", i: <IconSelectAll size={17} />, s: "btn-select-all" }} />
        </Stack>
      </Group>
    </>
  );
}
