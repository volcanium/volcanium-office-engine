import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { IconMinus, IconPlus, IconPoint, IconArrowsMaximize, IconArrowsHorizontal } from "@tabler/icons-react";
import { ICONS } from "./icons.generated";
import { BigBtn, Btn, Group, Row, Stack } from "./kit";
import { clickSlot } from "./bridge";
import { backToDocument, getApi, getToolbarView, keyGuard, useEngine } from "./engine";

/* Miroir d'un onglet d'origine : chaque contrôle du ruban ONLYOFFICE (caché) devient un contrôle de notre ruban, regroupé comme avant.
   Rien ne disparaît : un clic déclenche le vrai contrôle ; les menus d'origine s'ouvrent sous notre bouton ;
   les champs numériques et cases à cocher sont lus et écrits sur l'objet d'origine. */

type Kind = "btn" | "spin" | "check";
interface MItem {
  key: string; kind: Kind; slot: HTMLElement; icon: string | null; caption: string; big: boolean; split: boolean; menu: boolean;
  disabled: boolean; active: boolean; field?: string; text?: string; checked?: boolean;
}
type Col = { big: MItem } | { rows: MItem[][] };
interface MGroup { columns: Col[] }

/** Champs numériques d'origine (identifiants de leurs emplacements) -> propriété de la vue + légende. */
const SPINS: Record<string, [string, string]> = {
  "slot-spin-ind-left": ["numIndentsLeft", "Retrait gauche"], "slot-spin-ind-right": ["numIndentsRight", "Retrait droit"],
  "slot-spin-space-before": ["numSpacingBefore", "Espacement avant"], "slot-spin-space-after": ["numSpacingAfter", "Espacement après"],
};

const iconClass = (slot: HTMLElement): string | null => {
  const i = slot.querySelector("i.toolbar__icon");
  return i ? ([...i.classList].find((c) => c.startsWith("btn-")) ?? null) : null;
};
const normalize = (n: string): string => (ICONS[n] ? n : ICONS[n.replace(/^btn-big-/, "btn-")] ? n.replace(/^btn-big-/, "btn-") : ICONS[n.replace(/-rtl$/, "")] ? n.replace(/-rtl$/, "") : n);
/** Légende d'un contrôle : le texte brut perd les sauts de ligne (<br>) et colle les mots. */
const captionOf = (slot: HTMLElement): string => (slot.querySelector(".caption")?.innerHTML ?? "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

function toItem(slot: HTMLElement, idx: string): MItem | null {
  if (SPINS[slot.id]) {
    const [field, label] = SPINS[slot.id]!;
    let value = ""; let disabled = false;
    try { const f = getToolbarView()[field]; value = String(f.getValue() ?? ""); disabled = !!f.isDisabled?.(); } catch { /* champ pas encore prêt */ }
    return { key: idx, kind: "spin", slot, icon: null, caption: label, big: false, split: false, menu: false, disabled, active: false, field, text: value };
  }
  const chk = slot.querySelector<HTMLInputElement>("input.checkbox__native");
  if (chk) {
    return { key: idx, kind: "check", slot, icon: null, caption: slot.textContent?.replace(/\s+/g, " ").trim() ?? "", big: false, split: false, menu: false, disabled: chk.disabled, active: false, checked: chk.checked };
  }
  const group = slot.querySelector(".btn-group");
  const btn = slot.querySelector<HTMLButtonElement>("button.btn");
  if (!btn && !group) return null; // libellé seul, combobox : repris à part (zoom) ou ignorés
  const caption = captionOf(slot);
  const icon = iconClass(slot);
  if (!icon && !caption) return null;
  return {
    key: idx, kind: "btn", slot, icon: icon ? normalize(icon) : null, caption,
    big: slot.classList.contains("x-huge") || slot.classList.contains("huge"),
    split: !!group?.classList.contains("split"), menu: !!slot.querySelector("button.dropdown-toggle"),
    disabled: !!(btn?.disabled || btn?.classList.contains("disabled") || group?.querySelector("button")?.hasAttribute("disabled") || slot.classList.contains("disabled")),
    active: !!btn?.classList.contains("active"),
  };
}

export function scanPanel(tab: string): MGroup[] {
  const panel = document.querySelector<HTMLElement>(`#toolbar .toolbar .panel[data-tab="${tab}"]`);
  if (!panel) return [];
  const out: MGroup[] = [];
  panel.querySelectorAll<HTMLElement>(":scope > .group").forEach((g, gi) => {
    const columns: Col[] = [];
    let rows: MItem[][] | null = null; // un « elset » est une RANGÉE ; des rangées consécutives s'empilent dans une colonne
    [...g.children].forEach((child, ci) => {
      const el = child as HTMLElement;
      if (el.classList.contains("elset")) {
        const row = [...el.querySelectorAll<HTMLElement>(":scope > .btn-slot")].map((sl, i) => toItem(sl, `${gi}.${ci}.${i}`)).filter((x): x is MItem => !!x);
        if (row.length) { if (!rows) { rows = []; columns.push({ rows }); } rows.push(row); }
      } else if (el.classList.contains("btn-slot")) {
        rows = null;
        const it = toItem(el, `${gi}.${ci}`);
        if (it) columns.push(it.big ? { big: it } : { rows: [[it]] });
      }
    });
    if (columns.length) out.push({ columns });
  });
  return out;
}

const Glyph = ({ name, size }: { name: string | null; size: number }) => {
  const C: ComponentType<{ size?: number }> = (name && ICONS[name]) || IconPoint;
  return <C size={size} />;
};

function SpinField({ it, onChanged }: { it: MItem; onChanged: () => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft != null) { try { getToolbarView()[it.field!].setValue(draft); } catch { /* sans effet */ } onChanged(); }
    setDraft(null); backToDocument();
  };
  return (
    <label className="flex items-center justify-between gap-2 text-[12px] text-vc-text/80">
      <span className="whitespace-nowrap">{it.caption}</span>
      <input
        aria-label={it.caption} disabled={it.disabled} value={draft ?? it.text ?? ""} onFocus={(e) => { keyGuard.on(); e.currentTarget.select(); }}
        onChange={(e) => setDraft(e.target.value)} onBlur={() => { commit(); keyGuard.off(); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { setDraft(null); e.currentTarget.blur(); } }}
        className="h-6 w-[72px] rounded-lg border border-vc-line-strong bg-transparent px-2 text-right text-[12px] tabular-nums outline-none focus:border-vc-main/60 disabled:opacity-40"
      />
    </label>
  );
}

function CheckField({ it, onChanged }: { it: MItem; onChanged: () => void }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 text-[12px] ${it.disabled ? "opacity-40" : ""}`}>
      <input type="checkbox" checked={!!it.checked} disabled={it.disabled} className="h-3.5 w-3.5 cursor-pointer accent-[var(--vc-main)]"
        onChange={() => { it.slot.querySelector<HTMLInputElement>("input.checkbox__native")?.click(); onChanged(); }} />
      {it.caption}
    </label>
  );
}

function Item({ it, onChanged }: { it: MItem; onChanged: () => void }) {
  const open = (menu: boolean) => clickSlot(it.slot, menu);
  if (it.kind === "spin") return <SpinField it={it} onChanged={onChanged} />;
  if (it.kind === "check") return <CheckField it={it} onChanged={onChanged} />;
  if (it.big) {
    return <BigBtn label={it.caption || it.icon || "…"} icon={<Glyph name={it.icon} size={22} />} disabled={it.disabled} active={it.active}
      caret={it.menu} onClick={() => open(it.menu && !it.split)} onCaret={() => open(true)} />;
  }
  if (!it.icon || !ICONS[it.icon]) {
    return <Btn label={it.caption} icon={<span className="px-0.5 text-xs">{it.caption}</span>} disabled={it.disabled} active={it.active} caret={it.menu} onClick={() => open(it.menu && !it.split)} />;
  }
  return <Btn label={it.caption || it.icon} icon={<Glyph name={it.icon} size={17} />} disabled={it.disabled} active={it.active} caret={it.menu} onClick={() => open(it.menu && !it.split)} />;
}

/** Zoom natif (remplace la liste déroulante d'origine de l'onglet Affichage). */
function ZoomGroup() {
  const s = useEngine();
  const api = getApi();
  const z = s.zoom ?? 100;
  return (
    <Group label="Zoom">
      <Stack>
        <Row>
          <Btn label="Zoom arrière" icon={<IconMinus size={16} />} onClick={() => { api.zoomOut(); backToDocument(); }} />
          <button type="button" title="Zoom à 100 %" onPointerDown={(e) => e.preventDefault()} onClick={() => { api.zoom100(); backToDocument(); }}
            className="h-7 min-w-14 cursor-pointer rounded-lg px-2 text-center text-sm tabular-nums hover:bg-vc-veil-strong">{z} %</button>
          <Btn label="Zoom avant" icon={<IconPlus size={16} />} onClick={() => { api.zoomIn(); backToDocument(); }} />
        </Row>
        <Row>
          <Btn label="Ajuster à la page" icon={<IconArrowsMaximize size={16} />} onClick={() => { api.zoomFitToPage(); backToDocument(); }} />
          <Btn label="Ajuster à la largeur" icon={<IconArrowsHorizontal size={16} />} onClick={() => { api.zoomFitToWidth(); backToDocument(); }} />
        </Row>
      </Stack>
    </Group>
  );
}

export default function Mirror({ tab }: { tab: string }) {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    // l'onglet d'origine doit être actif pour que ses contrôles soient à jour
    (document.querySelector(`#toolbar .tabs a#${tab}`) as HTMLElement | null)?.click();
    const host = document.querySelector("#toolbar .toolbar .box-panels");
    if (!host) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(bump, 120); });
    mo.observe(host, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "disabled"] });
    const first = setTimeout(bump, 200);
    const poll = setInterval(bump, 800); // les valeurs des champs numériques ne produisent pas de mutation du DOM
    return () => { mo.disconnect(); clearTimeout(t); clearTimeout(first); clearInterval(poll); };
  }, [tab, bump]);
  const groups = useMemo(() => scanPanel(tab), [tab, version]); // eslint-disable-line react-hooks/exhaustive-deps
  if (groups.length === 0) return <div className="px-3 py-4 text-sm text-vc-text/50">Chargement…</div>;
  return (
    <>
      {tab === "view" && <ZoomGroup />}
      {groups.map((g, gi) => (
        <Group key={gi}>
          {g.columns.map((col, ci) => ("big" in col ? <Item key={col.big.key} it={col.big} onChanged={bump} /> : (
            <Stack key={ci}>{col.rows.map((row, ri) => <Row key={ri}>{row.map((it) => <Item key={it.key} it={it} onChanged={bump} />)}</Row>)}</Stack>
          )))}
        </Group>
      ))}
    </>
  );
}
