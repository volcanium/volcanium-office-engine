import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  IconCheck, IconCopy, IconDeviceFloppy, IconDownload, IconFileInfo, IconHistory, IconInfoCircle, IconPrinter, IconSettings, IconUsers, IconChevronDown, IconChevronRight, IconChevronUp, IconCloudCheck, IconCloudUpload, IconDots, IconFileText, IconLayoutSidebar, IconMessage, IconMinus,
  IconPencil, IconPlus, IconSearch, IconStar, IconUserPlus, IconX, IconArrowsMaximize, IconBook, IconFile, IconChecks,
} from "@tabler/icons-react";
import { Avatar, AvatarStack, Button, Tabs } from "@volcanium/volcanium-components";
import mark from "../public/favicon.svg?inline";
import Home from "./Home";
import { DOC_TABS as DOC_RIBBON, Ribbon, SHEET_TABS, SLIDE_TABS } from "./Generic";
import InkLayer from "./ink/InkLayer";
import PenPalette from "./ink/PenPalette";
import { usePen } from "./ink/pen";
import { backToDocument, editorKind, getApi, keyGuard, useEngine } from "./engine";
import { canRenameFile, listenHostTitle, requestRename, readMe, createComment, endSearch, getSpell, setSpell, goToOutline, listLanguages, setLanguage, removeComment, replaceOne, replyToComment, resolveComment, searchNext, selectComment, setEditMode, useDoc, type CommentItem, type EditMode } from "./doc";
import { activateOriginalTab, bridgeIcon, bridgeSlot, openFileMenu } from "./bridge";
import { Btn, MenuItem, MenuSep, Popover } from "./kit";

const DOC_TABS = [{ id: "home", label: "Accueil" }, ...DOC_RIBBON.map(({ id, label }) => ({ id, label }))];
// L'éditeur (DE / SSE / PE) n'existe qu'une fois la page d'amont chargée : jamais lu au chargement du module.
const kindOf = () => editorKind();
const tabsFor = (k: ReturnType<typeof editorKind>) => (k === "doc" ? DOC_TABS : (k === "sheet" ? SHEET_TABS : SLIDE_TABS).map(({ id, label }) => ({ id, label }))).filter((t) => t.id !== "file");
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// ── En-tête ───────────────────────────────────────────────────────────────────────────────────────
/** « Partager » : la fenêtre de partage est celle de l'interface hôte (collègues, personnes extérieures, e-mail) ; sans hôte, le menu d'origine. */
export const shareFile = (): void => {
  const gw = (window as unknown as { Common?: { Gateway?: { requestSharingSettings?: () => void }; UI?: unknown } }).Common?.Gateway;
  const can = (window as unknown as { DE?: { getController(n: string): { appOptions?: { canRequestSharingSettings?: boolean } } }; SSE?: unknown; PE?: unknown });
  let hosted = false;
  try { hosted = !!((can.DE ?? (can.SSE as typeof can.DE) ?? (can.PE as typeof can.DE))?.getController("Main").appOptions?.canRequestSharingSettings); } catch { /* sans effet */ }
  if (hosted && gw?.requestSharingSettings) gw.requestSharingSettings(); else openFileMenu("rights");
};

/** Titre du fichier : un clic le rend modifiable (Entrée ou clic ailleurs = enregistrer, Échap = annuler). L'extension reste. Sans droit de renommer (invité), simple texte. */
export function TitleField({ title, compact = false }: { title: string; compact?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const [can, setCan] = useState(canRenameFile);
  useEffect(() => { const t = setInterval(() => setCan(canRenameFile()), 1500); const off = listenHostTitle(); return () => { clearInterval(t); off(); }; }, []);
  const m = /^(.*?)(\.[A-Za-z0-9]{2,5})?$/.exec(title);
  const base = m?.[1] ?? title, ext = m?.[2] ?? "";
  // Le moteur est mis en pause clavier AVANT de donner le focus au champ, sinon il le reprend et la frappe part dans le document.
  useEffect(() => { if (!editing) return; keyGuard.on(); const t = setTimeout(() => { input.current?.focus(); input.current?.select(); }, 30); return () => { clearTimeout(t); keyGuard.off(); }; }, [editing]);
  const done = (save: boolean) => {
    setEditing(false);
    const name = draft.replace(/\s+/g, " ").trim().slice(0, 120);
    if (save && name && name !== base) requestRename(name + ext);
  };
  const sz = compact ? "text-[15px]" : "text-[17px]";
  if (!can) return <h1 className={cx("truncate font-semibold text-vc-text", sz)}>{title}</h1>;
  if (editing) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <input ref={input} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={120} aria-label="Nom du fichier" onBlur={() => done(true)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); done(true); } else if (e.key === "Escape") { e.preventDefault(); done(false); } }}
          style={compact ? undefined : { width: `${Math.min(Math.max(draft.length + 2, 12), 48)}ch` }}
          className={cx("min-w-0 max-w-full rounded-lg border border-vc-main/60 bg-vc-container px-2 py-0.5 font-semibold text-vc-text outline-none", sz, compact && "flex-1")} />
        <span className={cx("shrink-0 font-semibold text-vc-text/50", sz)}>{ext}</span>
      </div>
    );
  }
  return (
    <button type="button" title="Renommer le fichier" aria-label={`Renommer le fichier : ${title}`} onClick={() => { setDraft(base); setEditing(true); }}
      className={cx("min-w-0 cursor-text truncate rounded-lg px-2 py-0.5 text-left font-semibold text-vc-text hover:bg-vc-veil-strong", sz)}>{title}</button>
  );
}

function Header({ onComments, commentsOpen, count }: { onComments: () => void; commentsOpen: boolean; count: number }) {
  const d = useDoc();
  const [me, setMe] = useState(readMe);
  useEffect(() => { const t = setInterval(() => setMe((p) => { const n = readMe(); return JSON.stringify(n) === JSON.stringify(p) ? p : n; }), 1500); return () => clearInterval(t); }, []);
  const [fav, setFav] = useState(false);
  const saved = d.modified === false || d.modified === null;
  // Les personnes présentes : MOI d'abord (le moteur ne liste pas toujours la personne courante, et jamais quand on est seul), puis les autres, sans doublon.
  const present = [...(me ? [{ id: me.id, name: me.name, image: me.image }] : []), ...d.users.map((u) => ({ id: u.id, name: u.name, color: u.color, image: u.image }))]
    .filter((u, i, all) => all.findIndex((x) => x.id === u.id) === i);
  return (
    <header className="flex h-16 shrink-0 bg-vc-back items-center gap-4 px-5">
      {/* Retour à la liste des fichiers : l'interface hôte écoute `onRequestClose` (EditorPage). Sans hôte, le bouton ne fait rien de visible. */}
      <button type="button" title="Retour aux fichiers" aria-label="Retour aux fichiers" onClick={() => (window as unknown as { Common?: { Gateway?: { requestClose?: () => void } } }).Common?.Gateway?.requestClose?.()}
        className="flex cursor-pointer items-center gap-3 rounded-lg pr-4 text-left hover:opacity-80">
        <img src={mark} alt="" className="h-9 w-9" />
        <div className="font-vc-main text-[13px] leading-tight tracking-[0.18em] text-vc-text/80"><div>VOLCANIUM</div><div className="text-vc-text/50">{{ doc: "DOCUMENTS", sheet: "TABLEUR", slide: "PRÉSENTATIONS" }[kindOf()]}</div></div>
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <TitleField title={d.title || "Document sans titre"} />
          <Popover trigger={({ toggle }) => <Btn label="Options du document" icon={<IconChevronDown size={16} />} onClick={toggle} />}>
            {(close) => (<>
              <MenuItem label="Enregistrer" onClick={() => { bridgeSlot("btn-save"); close(); }} />
              <MenuItem label="Imprimer" onClick={() => { bridgeSlot("btn-print"); close(); }} />
            </>)}
          </Popover>
          <Btn label={fav ? "Retirer des favoris" : "Ajouter aux favoris"} icon={<IconStar size={17} className={fav ? "fill-vc-main text-vc-main" : ""} />} active={fav} onClick={() => setFav((f) => !f)} />
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-vc-text/60" aria-live="polite">
          {saved ? <IconCloudCheck size={14} aria-hidden /> : <IconCloudUpload size={14} aria-hidden />}
          {saved ? "Toutes les modifications sont enregistrées" : "Enregistrement…"}
        </div>
      </div>
      {present.length > 0 && <AvatarStack people={present} size={32} max={4} label="Personnes présentes sur le document" />}
      <Button variant="secondary" icon={<IconMessage size={18} aria-hidden />} onClick={onComments} className={commentsOpen ? "!border-vc-main/60" : ""}>
        Commentaires{count > 0 && <span className="ml-1.5 rounded-full bg-vc-veil-strong px-1.5 text-xs">{count}</span>}
      </Button>
      {!me?.id.startsWith("ext:") && <Button variant="accent" icon={<IconUserPlus size={18} aria-hidden />} onClick={shareFile}>Partager</Button>}
    </header>
  );
}

// ── Barre d'onglets + mode ────────────────────────────────────────────────────────────────────────
/** Menu « Fichier » déroulant, comme dans Word : chaque entrée déclenche la fonction d'origine (enregistrer, panneaux du menu Fichier…). */
function FileMenu() {
  return (
    <Popover panelClassName="w-72" trigger={({ toggle, open }) => (
      <Button variant="discret" onClick={toggle} className={`!text-sm ${open ? "!bg-vc-veil-strong" : ""}`}>Fichier</Button>
    )}>
      {(close) => {
        const go = (fn: () => void) => () => { close(); fn(); };
        return (<>
          <MenuItem icon={<IconDeviceFloppy size={16} />} label="Enregistrer" hint="⌘S" onClick={go(() => bridgeSlot("btn-save"))} />
          <MenuItem icon={<IconDownload size={16} />} label="Télécharger comme…" onClick={go(() => openFileMenu("saveas"))} />
          <MenuItem icon={<IconCopy size={16} />} label="Enregistrer une copie" onClick={go(() => openFileMenu("save-copy"))} />
          <MenuItem icon={<IconPrinter size={16} />} label="Imprimer" hint="⌘P" onClick={go(() => bridgeSlot("btn-print"))} />
          <MenuSep />
          <MenuItem icon={<IconFileInfo size={16} />} label="Informations du document" onClick={go(() => openFileMenu("info"))} />
          <MenuItem icon={<IconHistory size={16} />} label="Historique des versions" onClick={go(() => openFileMenu("history"))} />
          <MenuItem icon={<IconUsers size={16} />} label="Droits d’accès" onClick={go(shareFile)} />
          <MenuSep />
          <MenuItem icon={<IconSettings size={16} />} label="Paramètres avancés" onClick={go(() => openFileMenu("opts"))} />
          <MenuItem icon={<IconInfoCircle size={16} />} label="À propos" onClick={go(() => openFileMenu("about"))} />
        </>);
      }}
    </Popover>
  );
}

function TabBar({ tab, onTab, onSearch }: { tab: string; onTab: (t: string) => void; onSearch: () => void }) {
  const [mode, setMode] = useState<EditMode>("edit");
  const modes: { id: EditMode; label: string; icon: ReactNode }[] = [
    { id: "edit", label: "Modification", icon: <IconPencil size={17} aria-hidden /> },
    ...(kindOf() === "doc" ? [{ id: "review" as const, label: "Révision", icon: <IconPencil size={17} aria-hidden /> }] : []),
    { id: "view", label: "Lecture", icon: <IconBook size={17} aria-hidden /> },
  ];
  const cur = modes.find((m) => m.id === mode)!;
  return (
    <div className="flex h-10 shrink-0 items-center justify-between bg-vc-back px-3">
      <div className="flex items-center gap-1"><FileMenu /><Tabs tabs={tabsFor(kindOf())} value={tab} onChange={onTab} className="!gap-1" /></div>
      <div className="flex items-center gap-1">
        <Popover align="right" trigger={({ toggle }) => (
          <Button variant="discret" icon={cur.icon} onClick={toggle}>{cur.label} <IconChevronDown size={14} aria-hidden /></Button>
        )}>
          {(close) => (<>{modes.map((m) => <MenuItem key={m.id} label={m.label} checked={m.id === mode} onClick={() => { setMode(m.id); setEditMode(m.id); close(); }} />)}</>)}
        </Popover>
        <Btn label="Rechercher" icon={<IconSearch size={19} />} onClick={onSearch} />
      </div>
    </div>
  );
}

// ── Recherche / remplacement ──────────────────────────────────────────────────────────────────────
export function SearchPanel({ onClose }: { onClose: () => void }) {
  const d = useDoc();
  const [q, setQ] = useState(""), [by, setBy] = useState(""), [mc, setMc] = useState(false), [ww, setWw] = useState(false), [rep, setRep] = useState(false);
  const o = { text: q, matchCase: mc, whole: ww };
  const close = () => { endSearch(); onClose(); };
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    keyGuard.on();
    const t = setTimeout(() => first.current?.focus(), 60);
    return () => { clearTimeout(t); keyGuard.off(); };
  }, []);
  const field = "h-8 min-w-0 flex-1 rounded-lg border border-vc-line-strong bg-transparent px-2.5 text-sm outline-none placeholder:text-vc-text/40 focus:border-vc-main";
  return (
    <div role="dialog" aria-label="Rechercher et remplacer" className="absolute right-4 top-1 z-40 w-[min(360px,calc(100%-32px))] rounded-xl border border-vc-line-strong bg-vc-accent p-3 shadow-2xl">
      <div className="flex items-center gap-2">
        <input ref={first} value={q} placeholder="Rechercher" aria-label="Rechercher" className={field}
          onChange={(e) => { setQ(e.target.value); searchNext({ ...o, text: e.target.value }); }} onKeyDown={(e) => { if (e.key === "Enter") searchNext(o, !e.shiftKey); if (e.key === "Escape") close(); }} />
        <Btn label="Précédent" icon={<IconChevronUp size={16} />} onClick={() => searchNext(o, false)} />
        <Btn label="Suivant" icon={<IconChevronDown size={16} />} onClick={() => searchNext(o, true)} />
        <Btn label="Fermer" icon={<IconX size={16} />} onClick={close} />
      </div>
      {rep && (
        <div className="mt-2 flex items-center gap-2">
          <input value={by} placeholder="Remplacer par" aria-label="Remplacer par" className={field} onChange={(e) => setBy(e.target.value)} />
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-vc-text/70">
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" checked={mc} onChange={(e) => setMc(e.target.checked)} className="accent-[var(--vc-main)]" />Casse</label>
          <label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" checked={ww} onChange={(e) => setWw(e.target.checked)} className="accent-[var(--vc-main)]" />Mot entier</label>
        </div>
        <span aria-live="polite">{d.search ? `${d.search.all ? d.search.cur + 1 : 0} / ${d.search.all}` : ""}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Button variant="discret" onClick={() => setRep((r) => !r)}>{rep ? "Masquer" : "Remplacer…"}</Button>
        {rep && <><Button variant="secondary" onClick={() => replaceOne(o, by, false)}>Remplacer</Button><Button variant="secondary" onClick={() => replaceOne(o, by, true)}>Tout remplacer</Button></>}
      </div>
    </div>
  );
}

// ── Navigation (gauche) ───────────────────────────────────────────────────────────────────────────
export function NavPanel({ onClose, sheet = false }: { onClose: () => void; sheet?: boolean }) {
  const d = useDoc();
  const [view, setView] = useState<"plan" | "pages">("plan");
  const [q, setQ] = useState("");
  const [folded, setFolded] = useState<Set<number>>(new Set());
  const hasKids = (i: number) => d.outline[i + 1] != null && d.outline[i + 1]!.level > d.outline[i]!.level;
  // Un titre est masqué si l'un de ses parents est replié.
  const visible = d.outline.filter((o, idx) => {
    for (let j = idx - 1, lvl = o.level; j >= 0; j--) { const p = d.outline[j]!; if (p.level < lvl) { lvl = p.level; if (folded.has(p.index)) return false; } }
    return true;
  });
  const opts = { text: q, matchCase: false, whole: false };
  const onQuery = (v: string) => { setQ(v); if (v) searchNext({ ...opts, text: v }); else endSearch(); };
  const total = d.search?.all ?? 0;
  return (
    <aside className={sheet ? "flex min-h-0 w-full flex-1 flex-col bg-vc-back p-4" : "flex w-[260px] shrink-0 flex-col border-r border-vc-line bg-vc-back p-4"} aria-label="Navigation">
      <div className="flex items-center justify-between"><h2 className="text-[17px] font-semibold">Navigation</h2>
        <Btn label="Masquer la navigation" icon={<IconLayoutSidebar size={18} />} onClick={onClose} /></div>
      <label className="mt-4 flex h-9 items-center gap-2 rounded-lg border border-vc-line-strong bg-vc-container px-2.5 text-sm focus-within:border-vc-main">
        <IconSearch size={16} className="shrink-0 opacity-60" aria-hidden />
        <input value={q} onChange={(e) => onQuery(e.target.value)} onFocus={keyGuard.on} onBlur={keyGuard.off} placeholder="Rechercher dans le document" aria-label="Rechercher dans le document"
          onKeyDown={(e) => { if (e.key === "Enter") searchNext(opts, !e.shiftKey); if (e.key === "Escape") onQuery(""); }} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-vc-text/40" />
        {q && <span className="shrink-0 text-xs tabular-nums text-vc-text/60">{total ? `${d.search!.cur + 1}/${total}` : "0"}</span>}
        {q && <button type="button" aria-label="Résultat suivant" onClick={() => searchNext(opts, true)} className="cursor-pointer opacity-60 hover:opacity-100"><IconChevronDown size={15} /></button>}
      </label>
      <div className="mt-4 flex gap-5 border-b border-vc-line text-sm" role="tablist">
        {(["plan", "pages"] as const).map((v) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
            className={cx("-mb-px cursor-pointer border-b-2 pb-2", view === v ? "border-vc-main text-vc-main" : "border-transparent text-vc-text/70 hover:text-vc-text")}>
            {v === "plan" ? "Plan du document" : "Pages"}
          </button>
        ))}
      </div>
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
        {view === "plan" ? (
          d.outline.length === 0 ? (
            <div className="px-1 py-3 text-sm text-vc-text/55">
              <p>Le plan se construit à partir des titres.</p>
              <p className="mt-1">Sélectionnez une ligne, puis choisissez « Titre 1 » dans les styles.</p>
            </div>
          ) : (
            <ul>{visible.map((o) => {
              const kids = hasKids(o.index), closed = folded.has(o.index), active = d.outlineAt === o.index;
              return (
                <li key={o.index} className="flex items-center" style={{ paddingLeft: o.level * 14 }}>
                  <button type="button" aria-label={closed ? "Déplier" : "Replier"} disabled={!kids} onClick={() => setFolded((f) => { const n = new Set(f); if (n.has(o.index)) n.delete(o.index); else n.add(o.index); return n; })}
                    className={cx("flex h-7 w-5 shrink-0 items-center justify-center rounded text-vc-text/60", kids ? "cursor-pointer hover:text-vc-text" : "invisible")}>
                    {closed ? <IconChevronRight size={14} /> : <IconChevronDown size={14} />}
                  </button>
                  <button type="button" onClick={() => { goToOutline(getApi(), o.index); backToDocument(); }} title={o.text.trim()}
                    className={cx("flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm", o.level === 0 ? "font-medium" : "text-vc-text/80", active ? "bg-vc-veil-strong" : "hover:bg-vc-veil")}>
                    <span className={cx("h-4 w-0.5 shrink-0 rounded-full", active ? "bg-vc-main" : "bg-transparent")} />
                    <span className="truncate">{o.text.trim() || "(titre vide)"}</span>
                  </button>
                </li>);
            })}</ul>)
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: d.pages ?? 0 }, (_, i) => (
              <button key={i} onClick={() => { try { getApi().goToPage(i); } catch { /* sans effet */ } backToDocument(); }} aria-label={`Page ${i + 1}`}
                className={cx("flex aspect-[3/4] cursor-pointer flex-col items-center justify-end rounded-lg border bg-vc-container pb-1.5 text-xs", d.page === i + 1 ? "border-vc-main text-vc-main" : "border-vc-line-strong text-vc-text/70 hover:border-vc-text/40")}>
                <span className="mb-auto mt-2 h-1 w-8 rounded bg-vc-line-strong" /><span className="mb-auto h-1 w-6 rounded bg-vc-line" />{i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

// ── Commentaires (droite) ─────────────────────────────────────────────────────────────────────────
function Card({ c, selected, onSelect, readOnly }: { c: CommentItem; selected: boolean; onSelect: () => void; readOnly?: boolean }) {
  const [reply, setReply] = useState("");
  const send = () => { if (reply.trim()) { replyToComment(c.id, reply.trim()); setReply(""); } };
  const Msg = ({ name, image, time, text, menu }: { name: string; image?: string; time: string; text: string; menu?: boolean }) => (
    <div className="py-2">
      <div className="flex items-center gap-2.5">
        <Avatar name={name} src={image} size={36} />
        <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{name}</div><div className="text-xs text-vc-text/60">{time}</div></div>
        {menu && <Popover align="right" trigger={({ toggle }) => <Btn label="Plus d’actions" icon={<IconDots size={18} />} onClick={toggle} />}>
          {(close) => <MenuItem label="Supprimer" danger onClick={() => { removeComment(c.id); close(); }} />}
        </Popover>}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-vc-text/90">{text}</p>
    </div>
  );
  return (
    <article onClick={onSelect} className={cx("rounded-xl border p-3 transition-colors", selected ? "border-vc-main bg-vc-container" : "border-vc-line bg-vc-container/60", c.resolved && "opacity-60")}>
      {c.quote && <div className="mb-1 flex gap-2 text-xs text-vc-text/70"><span className="w-0.5 shrink-0 rounded-full bg-vc-main" /><span className="line-clamp-2">« {c.quote} »</span></div>}
      <Msg name={c.author} image={c.image} time={c.time} text={c.text} menu={!readOnly} />
      {c.replies.map((r) => <div key={r.id} className="border-t border-vc-line"><Msg name={r.author} image={r.image} time={r.time} text={r.text} /></div>)}
      {!readOnly && (
      <div className="mt-1 flex items-center gap-2 text-sm">
          <input value={reply} onChange={(e) => setReply(e.target.value)} onFocus={keyGuard.on} onBlur={keyGuard.off} onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="Répondre ou @mentionner" aria-label="Répondre" className="min-w-0 flex-1 bg-transparent py-1 text-vc-text outline-none placeholder:text-vc-text/45" />
          <Btn label={c.resolved ? "Rouvrir" : "Résoudre"} icon={<IconCheck size={18} />} active={c.resolved} onClick={() => resolveComment(c.uid)} />
        </div>
      )}
    </article>
  );
}

export function CommentsPanel({ onClose, readOnly, sheet = false }: { onClose: () => void; readOnly?: boolean; sheet?: boolean }) {
  const d = useDoc();
  const [sel, setSel] = useState<string | null>(null);
  const [show, setShow] = useState<"all" | "open" | "resolved">("all");
  const [composing, setComposing] = useState(false), [draft, setDraft] = useState("");
  useEffect(() => { if (!composing) return; keyGuard.on(); return () => keyGuard.off(); }, [composing]);
  useEffect(() => { const f = () => setComposing(true); window.addEventListener("vo:compose", f); return () => window.removeEventListener("vo:compose", f); }, []);
  const list = d.comments.filter((c) => show === "all" || (show === "resolved") === c.resolved);
  return (
    <aside className={sheet ? "flex min-h-0 w-full flex-1 flex-col bg-vc-back p-4" : "flex w-[360px] shrink-0 flex-col border-l border-vc-line bg-vc-back p-4"} aria-label="Commentaires">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[17px] font-semibold">Commentaires <span className="rounded-full bg-vc-veil-strong px-2 text-xs font-normal">{d.comments.length}</span></h2>
        <Btn label="Fermer" icon={<IconX size={18} />} onClick={onClose} />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-vc-text/70">
        {{ all: "Tous les commentaires", open: "Commentaires ouverts", resolved: "Commentaires résolus" }[show]}
        <Popover align="right" trigger={({ toggle }) => <Btn label="Filtrer" icon={<IconDots size={18} />} onClick={toggle} />}>
          {(close) => (<>
            <MenuItem label="Tous les commentaires" checked={show === "all"} onClick={() => { setShow("all"); close(); }} />
            <MenuItem label="Ouverts" checked={show === "open"} onClick={() => { setShow("open"); close(); }} />
            <MenuItem label="Résolus" checked={show === "resolved"} onClick={() => { setShow("resolved"); close(); }} />
          </>)}
        </Popover>
      </div>
      <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto">
        {list.length === 0 && <p className="px-1 py-4 text-sm text-vc-text/50">Aucun commentaire pour l’instant.</p>}
        {list.map((c) => <Card key={c.id} c={c} readOnly={readOnly} selected={sel === c.id} onSelect={() => { setSel(c.id); selectComment(c.id); }} />)}
      </div>
      {readOnly ? null : composing ? (
        <div className="mt-3 rounded-xl border border-vc-main/60 bg-vc-container p-3">
          <textarea ref={(el) => { if (el) setTimeout(() => el.focus(), 60); }} value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} placeholder="Écrire un commentaire sur la sélection…" aria-label="Nouveau commentaire"
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-vc-text/45" />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="discret" onClick={() => { setComposing(false); setDraft(""); }}>Annuler</Button>
            <Button variant="accent" onClick={() => { if (draft.trim() && createComment(draft.trim())) { setComposing(false); setDraft(""); } }}>Ajouter</Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setComposing(true)} className="mt-3 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-vc-line text-sm text-vc-text/80 hover:bg-vc-veil">
          <IconPlus size={17} aria-hidden /> Nouveau commentaire
        </button>
      )}
    </aside>
  );
}

function LangMenu({ current, close }: { current: number | null; close: () => void }) {
  const [q, setQ] = useState("");
  const langs = useMemo(() => listLanguages(), []);
  const input = useRef<HTMLInputElement>(null);
  // Le moteur est mis en pause clavier AVANT de donner le focus au champ, sinon il le reprend et la frappe part dans le document.
  useEffect(() => { keyGuard.on(); const t = setTimeout(() => input.current?.focus(), 60); return () => { clearTimeout(t); keyGuard.off(); }; }, []);
  const list = langs.filter((l) => (l.name + " " + l.english).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="mb-1.5 flex items-center gap-2 rounded-lg border border-vc-line-strong px-2 focus-within:border-vc-main">
        <IconSearch size={14} className="opacity-50" aria-hidden />
        <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une langue" aria-label="Rechercher une langue" className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-vc-text/40" />
      </div>
      <p className="px-2 pb-1 text-[11px] text-vc-text/50">S’applique au texte sélectionné (ou au mot sous le curseur).</p>
      <div className="max-h-72 overflow-y-auto">
        {list.map((l) => <MenuItem key={l.id} label={l.spell ? `${l.name}  ·  orthographe` : l.name} checked={l.id === current} onClick={() => { setLanguage(l.id); close(); }} />)}
        {list.length === 0 && <div className="px-2 py-3 text-sm text-vc-text/50">Aucune langue</div>}
      </div>
    </>
  );
}
function LangPicker({ current, label }: { current: number | null; label: string }) {
  return (
    <Popover up panelClassName="w-72" trigger={({ toggle }) => (
      <button type="button" title="Langue du texte" onPointerDown={(e) => e.preventDefault()} onClick={toggle} className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 hover:bg-vc-veil-strong hover:text-vc-text">
        {label}<IconChevronUp size={12} aria-hidden />
      </button>
    )}>
      {(close) => <LangMenu current={current} close={close} />}
    </Popover>
  );
}

// ── Barre d'état ──────────────────────────────────────────────────────────────────────────────────
function StatsMenu() {
  const d = useDoc();
  const st = d.stats;
  const rows: [string, number | undefined][] = [["Pages", st?.pages], ["Paragraphes", st?.paragraphs], ["Mots", st?.words], ["Caractères sans espaces", st?.chars], ["Caractères avec espaces", st?.charsNoSpaces]];
  return (
    <Popover up panelClassName="w-64" trigger={({ toggle }) => (
      <button type="button" title="Statistiques du document" onPointerDown={(e) => e.preventDefault()} onClick={toggle} className="cursor-pointer rounded-lg px-2 py-1 tabular-nums hover:bg-vc-veil-strong hover:text-vc-text">
        {st ? `${st.words} mot${st.words > 1 ? "s" : ""}` : "Statistiques"}
      </button>
    )}>
      {() => (
        <dl className="px-2 py-1 text-sm">
          {rows.map(([k, v]) => <div key={k} className="flex justify-between py-1"><dt className="text-vc-text/70">{k}</dt><dd className="tabular-nums">{v ?? "—"}</dd></div>)}
        </dl>
      )}
    </Popover>
  );
}
function SpellToggle() {
  const [on, setOn] = useState(getSpell);
  return (
    <button type="button" aria-pressed={on} title={on ? "Désactiver le correcteur orthographique" : "Activer le correcteur orthographique"} onPointerDown={(e) => e.preventDefault()}
      onClick={() => { setSpell(!on); setOn(!on); }} className={cx("flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-vc-veil-strong", on ? "text-vc-text" : "text-vc-text/45 line-through")}>
      <IconChecks size={15} aria-hidden />Orthographe
    </button>
  );
}

function StatusBar() {
  const d = useDoc(), s = useEngine();
  const KIND = kindOf();
  const zoom = s.zoom ?? 100;
  const setZoom = (v: number) => { try { getApi().zoom(Math.max(10, Math.min(500, Math.round(v)))); } catch { /* sans effet */ } };
  return (
    <footer className="flex h-10 shrink-0 bg-vc-back items-center justify-between border-t border-vc-line px-4 text-xs text-vc-text/70">
      <div className="flex items-center gap-6">
        {KIND === "doc" && d.page != null && <span>Page {d.page} sur {d.pages ?? "—"}</span>}
                {d.lang && KIND !== "sheet" && <LangPicker current={d.langId} label={d.lang} />}
        {KIND === "doc" && <StatsMenu />}
        <SpellToggle />
      </div>
      <div className="flex items-center gap-2">
        <Btn label="Page entière" icon={<IconFile size={16} />} onClick={() => { try { getApi().zoomFitToPage(); } catch { /* sans effet */ } }} />
        <Btn label="Largeur de page" icon={<IconBook size={16} />} onClick={() => { try { getApi().zoomFitToWidth(); } catch { /* sans effet */ } }} />
        <span className="mx-1" />
        <Btn label="Réduire le zoom" icon={<IconMinus size={15} />} onClick={() => setZoom(zoom - 10)} />
        <input type="range" min={25} max={300} value={zoom} onChange={(e) => setZoom(+e.target.value)} aria-label="Zoom" className="h-1 w-32 cursor-pointer accent-[var(--vc-main)]" />
        <Btn label="Augmenter le zoom" icon={<IconPlus size={15} />} onClick={() => setZoom(zoom + 10)} />
        <span className="w-12 text-right tabular-nums">{zoom} %</span>
        <Btn label="Plein écran" icon={<IconArrowsMaximize size={16} />} onClick={() => { void document.documentElement.requestFullscreen?.().catch(() => undefined); }} />
      </div>
    </footer>
  );
}

// ── Coque ─────────────────────────────────────────────────────────────────────────────────────────
/** Le moteur (canevas du document) reste dans la page d'amont : on lui donne exactement la place du centre. */
export function useStagePlacement(center: { current: HTMLDivElement | null }): void {
  useLayoutEffect(() => {
    const el = center.current;
    if (!el) return;
    const place = () => {
      const r = el.getBoundingClientRect();
      // Variables lues par une règle !important (main.tsx) : la mise en page d'amont réécrit sans cesse les styles en ligne du conteneur.
      const root = document.documentElement.style;
      root.setProperty("--vo-l", `${r.left}px`); root.setProperty("--vo-t", `${r.top}px`); root.setProperty("--vo-w", `${r.width}px`); root.setProperty("--vo-h", `${r.height}px`);
      window.dispatchEvent(new Event("resize"));
    };
    const ro = new ResizeObserver(place);
    ro.observe(el); place();
    return () => ro.disconnect();
  }, [center]);
}

export default function Shell({ stage }: { stage?: ReactNode }) {
  const d = useDoc();
  const [tab, setTab] = useState("home");
  const [ribbonOpen, setRibbonOpen] = useState(true);
  const [nav, setNav] = useState(true);
  const KIND = kindOf();
  const [comments, setComments] = useState(false);
  const center = useRef<HTMLDivElement>(null);
  const [searching, setSearching] = useState(false);
  const pen = usePen();

  useStagePlacement(center);

  useEffect(() => {
    const f = () => { setComments(true); setTimeout(() => window.dispatchEvent(new Event("vo:compose")), 60); };
    window.addEventListener("vo:new-comment", f);
    return () => window.removeEventListener("vo:new-comment", f);
  }, []);
  const onTab = (t: string) => { setTab(t); setRibbonOpen(true); activateOriginalTab(t); };
  return (
    <div className="vo-root relative flex h-full flex-col text-vc-text">
      <Header onComments={() => setComments((c) => !c)} commentsOpen={comments} count={d.comments.length} />
      <TabBar tab={tab} onTab={onTab} onSearch={() => setSearching(true)} />
      <div className={cx("relative flex shrink-0 items-stretch overflow-x-auto border-y border-vc-line bg-vc-container px-3 transition-[height]", ribbonOpen ? "h-[78px]" : "h-0 border-0 overflow-hidden")}>
        {KIND === "doc" && tab === "home" ? <Home /> : <Ribbon groups={(KIND === "doc" ? DOC_RIBBON : KIND === "sheet" ? SHEET_TABS : SLIDE_TABS).find((t) => t.id === tab)?.groups() ?? []} />}
        <div className="sticky right-0 ml-auto flex items-start bg-vc-container pl-2 pt-2">
          <Btn label={ribbonOpen ? "Réduire le ruban" : "Développer le ruban"} icon={<IconChevronUp size={18} />} onClick={() => setRibbonOpen(false)} />
        </div>
      </div>
      {!ribbonOpen && <div className="flex justify-end bg-vc-back px-3"><Btn label="Développer le ruban" icon={<IconChevronDown size={18} />} onClick={() => setRibbonOpen(true)} /></div>}
      <div className="vo-row flex min-h-0 flex-1">
        {KIND === "doc" && (nav ? <NavPanel onClose={() => setNav(false)} /> : <div className="p-2"><Btn label="Afficher la navigation" icon={<IconLayoutSidebar size={18} />} onClick={() => setNav(true)} /></div>)}
        <div ref={center} className="vo-hole relative min-w-0 flex-1 overflow-hidden">{stage}{KIND === "doc" && <InkLayer />}{KIND === "doc" && pen.active && <PenPalette />}</div>
        {comments && <CommentsPanel onClose={() => setComments(false)} />}
      </div>
      <StatusBar />
      {searching && <div className="pointer-events-none absolute inset-x-0 top-[104px] z-40"><div className="relative"><SearchPanel onClose={() => setSearching(false)} /></div></div>}
    </div>
  );
}

// ── Lecture seule ─────────────────────────────────────────────────────────────────────────────────
// Le moteur ne construit pas sa barre d'outils quand le document est ouvert sans droit de modification (lien en lecture, partage « lecture ») :
// cette coque React lui est dédiée. On y lit, on cherche, on navigue, on zoome, on lit les commentaires, on imprime, on télécharge.
const readerApi = (): any => getApi();
const asc = (): any => (window as unknown as { Asc?: unknown }).Asc;
export const printDoc = (): void => { try { const A = asc(); readerApi().asc_Print(new A.asc_CDownloadOptions(null, true)); } catch { /* impression indisponible */ } };
export const downloadCopy = (): void => {
  try { const A = asc(); const ext = { doc: "DOCX", sheet: "XLSX", slide: "PPTX" }[kindOf()]; readerApi().asc_DownloadAs(new A.asc_CDownloadOptions(A.c_oAscFileType[ext])); } catch { /* téléchargement indisponible */ }
};

function ReaderHeader({ onComments, commentsOpen, count, onSearch }: { onComments: () => void; commentsOpen: boolean; count: number; onSearch: () => void }) {
  const d = useDoc();
  const [me, setMe] = useState(readMe);
  useEffect(() => { const t = setInterval(() => setMe((p) => { const n = readMe(); return JSON.stringify(n) === JSON.stringify(p) ? p : n; }), 1500); return () => clearInterval(t); }, []);
  const present = [...(me ? [{ id: me.id, name: me.name, image: me.image }] : []), ...d.users.map((u) => ({ id: u.id, name: u.name, color: u.color, image: u.image }))]
    .filter((u, i, all) => all.findIndex((x) => x.id === u.id) === i);
  return (
    <header className="flex h-16 shrink-0 bg-vc-back items-center gap-4 px-5">
      <button type="button" title="Retour aux fichiers" aria-label="Retour aux fichiers" onClick={() => (window as unknown as { Common?: { Gateway?: { requestClose?: () => void } } }).Common?.Gateway?.requestClose?.()}
        className="flex cursor-pointer items-center gap-3 rounded-lg pr-4 text-left hover:opacity-80">
        <img src={mark} alt="" className="h-9 w-9" />
        <div className="font-vc-main text-[13px] leading-tight tracking-[0.18em] text-vc-text/80"><div>VOLCANIUM</div><div className="text-vc-text/50">{{ doc: "DOCUMENTS", sheet: "TABLEUR", slide: "PRÉSENTATIONS" }[kindOf()]}</div></div>
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-[17px] font-semibold text-vc-text">{d.title || "Document"}</h1>
          <span className="shrink-0 rounded-full border border-vc-line-strong px-2 py-0.5 text-xs text-vc-text/70">Lecture seule</span>
        </div>
      </div>
      {present.length > 0 && <AvatarStack people={present} size={32} max={4} label="Personnes présentes sur le document" />}
      <Btn label="Rechercher dans le document" icon={<IconSearch size={18} />} onClick={onSearch} />
      <Btn label="Imprimer" icon={<IconPrinter size={18} />} onClick={printDoc} />
      <Btn label="Télécharger une copie" icon={<IconDownload size={18} />} onClick={downloadCopy} />
      <Button variant="secondary" icon={<IconMessage size={18} aria-hidden />} onClick={onComments} className={commentsOpen ? "!border-vc-main/60" : ""}>
        Commentaires{count > 0 && <span className="ml-1.5 rounded-full bg-vc-veil-strong px-1.5 text-xs">{count}</span>}
      </Button>
    </header>
  );
}

function ReaderStatus() {
  const d = useDoc(), s = useEngine();
  const KIND = kindOf();
  const zoom = s.zoom ?? 100;
  const setZoom = (v: number) => { try { getApi().zoom(Math.max(10, Math.min(500, Math.round(v)))); } catch { /* sans effet */ } };
  return (
    <footer className="flex h-10 shrink-0 bg-vc-back items-center justify-between border-t border-vc-line px-4 text-xs text-vc-text/70">
      <div className="flex items-center gap-6">{KIND === "doc" && d.page != null && <span>Page {d.page} sur {d.pages ?? "—"}</span>}{KIND === "doc" && <StatsMenu />}</div>
      <div className="flex items-center gap-2">
        <Btn label="Page entière" icon={<IconFile size={16} />} onClick={() => { try { getApi().zoomFitToPage(); } catch { /* sans effet */ } }} />
        <Btn label="Largeur de page" icon={<IconBook size={16} />} onClick={() => { try { getApi().zoomFitToWidth(); } catch { /* sans effet */ } }} />
        <span className="mx-1" />
        <Btn label="Réduire le zoom" icon={<IconMinus size={15} />} onClick={() => setZoom(zoom - 10)} />
        <input type="range" min={25} max={300} value={zoom} onChange={(e) => setZoom(+e.target.value)} aria-label="Zoom" className="h-1 w-32 cursor-pointer accent-[var(--vc-main)]" />
        <Btn label="Augmenter le zoom" icon={<IconPlus size={15} />} onClick={() => setZoom(zoom + 10)} />
        <span className="w-12 text-right tabular-nums">{zoom} %</span>
        <Btn label="Plein écran" icon={<IconArrowsMaximize size={16} />} onClick={() => { void document.documentElement.requestFullscreen?.().catch(() => undefined); }} />
      </div>
    </footer>
  );
}

export function ReaderShell({ stage }: { stage?: ReactNode }) {
  const d = useDoc();
  const KIND = kindOf();
  const [nav, setNav] = useState(true);
  const [comments, setComments] = useState(false);
  const [searching, setSearching] = useState(false);
  const center = useRef<HTMLDivElement>(null);
  useStagePlacement(center);
  return (
    <div className="vo-root relative flex h-full flex-col text-vc-text">
      <ReaderHeader onComments={() => setComments((c) => !c)} commentsOpen={comments} count={d.comments.length} onSearch={() => setSearching(true)} />
      <div className="vo-row flex min-h-0 flex-1 border-t border-vc-line">
        {KIND === "doc" && (nav ? <NavPanel onClose={() => setNav(false)} /> : <div className="p-2"><Btn label="Afficher la navigation" icon={<IconLayoutSidebar size={18} />} onClick={() => setNav(true)} /></div>)}
        <div ref={center} className="vo-hole relative min-w-0 flex-1 overflow-hidden">{stage}</div>
        {comments && <CommentsPanel readOnly onClose={() => setComments(false)} />}
      </div>
      <ReaderStatus />
      {searching && <div className="pointer-events-none absolute inset-x-0 top-[64px] z-40"><div className="relative"><SearchPanel onClose={() => setSearching(false)} /></div></div>}
    </div>
  );
}
