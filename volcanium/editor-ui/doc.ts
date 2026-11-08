// État « document » lu depuis le moteur (pages, utilisateurs, commentaires, plan) : tout ce que la coque React affiche autour de la page.
// Aucune donnée inventée : si le moteur ne fournit pas une valeur, elle reste `null` et l'interface masque l'élément.
import { useSyncExternalStore } from "react";
import type { DocApi } from "./engine";

/* eslint-disable @typescript-eslint/no-explicit-any */
const w = window as any;

export interface Person { id: string; name: string; color?: string; image?: string }
export interface Reply { id: string; author: string; initials: string; time: string; text: string; userId: string; image?: string }
export interface CommentItem { id: string; uid: string; userId: string; image?: string; author: string; initials: string; time: string; text: string; quote: string; resolved: boolean; replies: Reply[] }
export interface OutlineItem { index: number; text: string; level: number }
export interface DocStats { pages: number; paragraphs: number; words: number; chars: number; charsNoSpaces: number }
export interface DocState {
  title: string; modified: boolean | null; page: number | null; pages: number | null; words: number | null; stats: DocStats | null; lang: string | null; langId: number | null;
  search: { cur: number; all: number } | null; users: Person[]; comments: CommentItem[]; outline: OutlineItem[]; outlineAt: number | null; canEdit: boolean;
}
const INITIAL: DocState = { title: "", modified: null, page: null, pages: null, words: null, stats: null, lang: null, langId: null, search: null, users: [], comments: [], outline: [], outlineAt: null, canEdit: true };

let state = INITIAL;
const listeners = new Set<() => void>();
export const setDoc = (patch: Partial<DocState>): void => {
  let changed = false;
  for (const k of Object.keys(patch) as (keyof DocState)[]) if (JSON.stringify(state[k]) !== JSON.stringify(patch[k])) { changed = true; break; }
  if (!changed) return;
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
export const useDoc = (): DocState => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state);

const initials = (name: string): string => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
/** Photo de profil d'une personne : l'interface hôte la fournit par identifiant (`onRequestUsers`) ; la première demande la déclenche, la réponse arrive ensuite. */
export const imageOf = (id: string | undefined): string | undefined => {
  if (!id) return undefined;
  try { const v = w.Common?.UI?.ExternalUsers?.getImage?.(id, true); return typeof v === "string" && /^https?:\/\//.test(v) ? v.replace(/&amp;/g, "&") : undefined; } catch { return undefined; }
};
const fmtTime = (d: unknown): string => {
  const date = d instanceof Date ? d : d ? new Date(d as string) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  const hm = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return date.toDateString() === new Date().toDateString() ? `Aujourd’hui, ${hm}` : `${date.toLocaleDateString("fr-FR")} ${hm}`;
};

const commentsController = (): any => (w.DE ?? w.SSE ?? w.PE)?.getController("Common.Controllers.Comments");
const readComments = (): CommentItem[] => {
  try {
    const col = (w.DE ?? w.SSE ?? w.PE).getCollection("Common.Collections.Comments");
    return col.models.map((m: any) => {
      const a = m.attributes, rep = a.replys?.models ?? a.replys ?? [];
      return {
        id: String(a.id ?? a.uid), uid: String(a.uid ?? a.id), userId: String(a.userid ?? ""), image: imageOf(a.userid), author: a.parsedName ?? a.username ?? "", initials: a.initials ?? initials(a.username ?? ""),
        time: fmtTime(a.time), text: a.comment ?? "", quote: a.quote ?? "", resolved: !!a.resolved,
        replies: rep.map((r: any) => { const b = r.attributes ?? r; return { id: String(b.id ?? b.time), userId: String(b.userid ?? ""), image: imageOf(b.userid), author: b.parsedName ?? b.username ?? "", initials: b.initials ?? initials(b.username ?? ""), time: fmtTime(b.time), text: b.comment ?? "" }; }),
      } satisfies CommentItem;
    });
  } catch { return []; }
};
/** Les photos arrivent après la liste des personnes : on les rattache dès qu'elles sont connues. */
const refreshImages = (): void => {
  const next = state.users.map((u) => ({ ...u, image: imageOf(u.id) ?? u.image }));
  if (next.some((u, i) => u.image !== state.users[i]?.image)) setDoc({ users: next });
};
/** Le moteur permet-il de renommer ? Vrai seulement si l'interface hôte écoute `onRequestRename` (membres avec droit de modification ; jamais un invité). */
export const canRenameFile = (): boolean => { try { return !!(w.DE ?? w.SSE ?? w.PE).getController("Main").appOptions.canRename; } catch { return false; } };
/** Demande le renommage à l'hôte (qui appelle l'API). Le titre affiché passe tout de suite au nouveau nom ; l'hôte renvoie le nom accepté (ou l'ancien en cas d'échec). */
export const requestRename = (fullTitle: string): void => {
  setTitleLocally(fullTitle);
  try { w.Common.Gateway.requestRename(fullTitle); } catch { /* sans hôte : sans effet */ }
};
export const setTitleLocally = (title: string): void => {
  titleOverride = title;
  try { (w.DE ?? w.SSE ?? w.PE).getController("Main").document.title = title; } catch { /* sans effet */ }
  setDoc({ title });
};
/** Réponse de l'hôte au renommage : `{ vo: "title", title }` (message objet, ignoré par la passerelle d'amont qui n'écoute que des chaînes JSON). */
export const listenHostTitle = (): (() => void) => {
  const on = (e: MessageEvent) => { const d = e.data as { vo?: string; title?: unknown } | null; if (d && typeof d === "object" && d.vo === "title" && typeof d.title === "string" && e.source === window.parent) setTitleLocally(d.title); };
  window.addEventListener("message", on);
  return () => window.removeEventListener("message", on);
};
/** Moi : l'identifiant, le nom et la photo donnés par l'interface hôte dans la configuration. */
export const readMe = (): { id: string; name: string; image?: string } | null => {
  try { const u = (w.DE ?? w.SSE ?? w.PE).getController("Main").appOptions.user; return u ? { id: String(u.id), name: String(u.fullname ?? u.name ?? ""), image: typeof u.image === "string" && /^https?:\/\//.test(u.image) ? u.image : imageOf(String(u.id)) } : null; } catch { return null; }
};
const readOutline = (api: DocApi): OutlineItem[] => {
  try {
    const mgr = api.asc_GetDocumentOutlineManager?.();
    if (!mgr) return [];
    const out: OutlineItem[] = [];
    for (let i = 0, n = mgr.get_ElementsCount(); i < n; i++) out.push({ index: i, text: mgr.get_Text(i), level: mgr.get_Level(i) });
    return out;
  } catch { return []; }
};
/** Titre imposé par un renommage (le moteur garde l'ancien nom dans ses informations de document tant que la page n'est pas rechargée). */
let titleOverride: string | null = null;
const readTitle = (api?: DocApi): string => {
  if (titleOverride) return titleOverride;
  try { const n = api?.asc_getDocumentName?.(); if (typeof n === "string" && n) return n; } catch { /* repli ci-dessous */ }
  try { return (w.DE ?? w.SSE ?? w.PE).getController("Main").document?.title ?? (w.DE ?? w.SSE ?? w.PE).getController("Main").appOptions?.docTitle ?? ""; } catch { return ""; }
};

let wired = false;
export function wireDoc(api: DocApi): void {
  if (wired) return;
  wired = true;
  const reg = (name: string, fn: (...a: any[]) => void) => { try { api.asc_registerCallback(name, fn); } catch { /* callback absent dans cette version */ } };
  reg("asc_onSetSearchCurrent", (cur, all) => setDoc({ search: { cur: typeof cur === "number" ? cur : 0, all: typeof all === "number" ? all : 0 } }));
  reg("asc_onSearchEnd", () => setDoc({ search: null }));
  reg("asc_onCountPages", (n) => setDoc({ pages: typeof n === "number" ? n : null }));
  reg("asc_onCurrentPage", (i) => setDoc({ page: typeof i === "number" ? i + 1 : null }));
  reg("asc_onDocumentModifiedChanged", (m) => { setDoc({ modified: m === true }); scheduleStats(api); });
  wireStats(api);
  reg("asc_onTextLanguage", (id) => { try { const n = w.Common.util.LanguageInfo.getLocalLanguageDisplayName(id); setDoc({ langId: id, lang: n?.native || w.Common.util.LanguageInfo.getLocalLanguageName(id)?.[1] || null }); } catch { /* langue inconnue */ } });
  const people = (users: any[]) => setDoc({ users: (Array.isArray(users) ? users : Object.values(users ?? {}) as any[]).filter((u) => !u.asc_getView?.()).map((u) => { const id = String(u.asc_getIdOriginal?.() ?? u.asc_getId?.() ?? u.asc_getUserName()); return { id, name: u.asc_getUserName?.() ?? "", image: imageOf(id) }; }).filter((u, i, all) => all.findIndex((x) => x.id === u.id) === i) });
  reg("asc_onAuthParticipantsChanged", people);
  reg("asc_onParticipantsChanged", people);
  const outline = () => setDoc({ outline: readOutline(api) });
  ["asc_onDocumentOutlineUpdate", "asc_onDocumentOutlineUpdateAdd", "asc_onDocumentOutlineUpdateChange", "asc_onDocumentOutlineUpdateRemove"].forEach((n) => reg(n, outline));
  reg("asc_onDocumentOutlineCurrentPosition", (i) => setDoc({ outlineAt: typeof i === "number" && i >= 0 ? i : null }));
  try { api.asc_ShowDocumentOutline?.(); } catch { /* sans effet */ }
  // Les commentaires vivent dans une collection d'amont sans événement public : relecture légère.
  setInterval(() => { setDoc({ comments: readComments(), title: readTitle(api) || state.title }); refreshImages(); if (!state.outline.length) outline(); }, 1000);
  outline();
}

// ── Actions ───────────────────────────────────────────────────────────────────────────────────────
export const goToOutline = (api: DocApi, index: number): void => { try { api.asc_GetDocumentOutlineManager().goto(index); } catch { /* sans effet */ } };
export const resolveComment = (uid: string): void => { try { commentsController().onResolveComment(uid); } catch { /* sans effet */ } };
export const replyToComment = (id: string, text: string): void => { try { commentsController().onAddReplyComment(id, text); } catch { /* sans effet */ } };
export const removeComment = (id: string): void => { try { commentsController().onRemoveComment(id); } catch { /* sans effet */ } };
export const selectComment = (id: string): void => { try { commentsController().onSelectComment?.(id); } catch { /* sans effet */ } };

// ── Recherche (API commune texte / présentation ; le tableur a sa propre classe d'options) ───────
export interface SearchOpts { text: string; matchCase: boolean; whole: boolean }
const apiOf = (): DocApi => (w.DE ?? w.SSE ?? w.PE).getController("Toolbar").api;
const settings = (o: SearchOpts) => {
  if (w.AscCommon?.CSearchSettings) {
    const s = new w.AscCommon.CSearchSettings(); s.put_Text(o.text); s.put_MatchCase(o.matchCase); s.put_WholeWords(o.whole); return s;
  }
  const s = new w.Asc.asc_CFindOptions(); s.asc_setFindWhat(o.text); s.asc_setIsMatchCase(o.matchCase); s.asc_setIsWholeCell(o.whole); return s;
};
export const searchNext = (o: SearchOpts, forward = true): boolean => {
  try {
    if (!o.text) return false;
    const s = settings(o);
    if (w.AscCommon?.CSearchSettings) return !!apiOf().asc_findText(s, forward);
    s.asc_setScanForward?.(forward); apiOf().asc_findText(s, () => undefined); return true;
  } catch { return false; }
};
export const replaceOne = (o: SearchOpts, by: string, all: boolean): void => {
  try {
    const s = settings(o);
    if (w.AscCommon?.CSearchSettings) apiOf().asc_replaceText(s, by, all);
    else { s.asc_setReplaceWith?.(by); s.asc_setIsReplaceAll?.(all); apiOf().asc_replaceText(s); }
  } catch { /* sans effet */ }
};
export const endSearch = (): void => { try { apiOf().asc_endFindText(); } catch { /* sans effet */ } setDoc({ search: null }); };

/** Crée un commentaire sur la sélection (même construction que le contrôleur d'amont, sans passer par sa vue). */
export const createComment = (text: string): boolean => {
  try {
    const ctrl = commentsController(), c = w.Asc.asc_CCommentDataWord ? new w.Asc.asc_CCommentDataWord(null) : new w.Asc.asc_CCommentData(null);
    c.asc_putText(text); c.asc_putTime(ctrl.utcDateToString(new Date())); c.asc_putOnlyOfficeTime(ctrl.ooDateToString(new Date()));
    c.asc_putUserId(ctrl.currentUserId); c.asc_putUserName(w.AscCommon.UserInfoParser.getCurrentName()); c.asc_putSolved(false);
    c.asc_putDocumentFlag?.(false);
    apiOf().asc_addComment(c);
    return true;
  } catch { return false; }
};

/** Modes d'édition : modification, révision (suivi des modifications) ou lecture seule. */
export type EditMode = "edit" | "review" | "view";
export const setEditMode = (m: EditMode): void => {
  try {
    const api = apiOf(), R = w.Asc.c_oAscRestrictionType;
    if (m === "view") { api.asc_setRestriction(R.View); return; }
    api.asc_setRestriction(R.None);
    api.asc_SetLocalTrackRevisions?.(null); api.asc_SetGlobalTrackRevisions?.(m === "review");
  } catch { /* sans effet */ }
};

// ── Langue du texte ───────────────────────────────────────────────────────────────────────────────
export interface Lang { id: number; name: string; english: string; spell: boolean }
/** Langues du moteur (liste de la barre d'état d'amont : code numérique, nom natif et anglais, correcteur disponible ou non). */
export const listLanguages = (): Lang[] => {
  try {
    const langs = (w.DE ?? w.SSE ?? w.PE).getController("Statusbar")?.langs as { code: number; displayValue: string; displayValueEn: string; spellcheck: boolean }[] | undefined;
    return (langs ?? []).map((l) => ({ id: l.code, name: l.displayValue, english: l.displayValueEn, spell: !!l.spellcheck }))
      .sort((x, y) => Number(y.spell) - Number(x.spell) || x.name.localeCompare(y.name, "fr"));
  } catch { return []; }
};
export const setLanguage = (id: number): void => { try { apiOf().put_TextPrLang(id); setDoc({ langId: id }); } catch { /* sans effet */ } };

// ── Statistiques (texte : pages, paragraphes, mots, caractères) ─────────────────────────────────
let statsTimer: ReturnType<typeof setTimeout> | undefined;
let statsWired = false;
let acc: DocStats = { pages: 0, paragraphs: 0, words: 0, chars: 0, charsNoSpaces: 0 };
function wireStats(api: DocApi): void {
  if (statsWired || !(api as any).startGetDocInfo) return;
  statsWired = true;
  const reg = (n: string, fn: (...a: any[]) => void) => { try { api.asc_registerCallback(n, fn); } catch { /* absent */ } };
  const push = () => setDoc({ stats: { ...acc }, words: acc.words });
  reg("asc_onGetDocInfoStart", () => { acc = { pages: 0, paragraphs: 0, words: 0, chars: 0, charsNoSpaces: 0 }; });
  reg("asc_onDocInfo", (o: any) => {
    const set = (v: number, k: keyof DocStats) => { if (v > -1) acc[k] = v; };
    try { set(o.get_PageCount(), "pages"); set(o.get_ParagraphCount(), "paragraphs"); set(o.get_WordsCount(), "words"); set(o.get_SymbolsCount(), "chars"); set(o.get_SymbolsWSCount(), "charsNoSpaces"); } catch { /* objet inattendu */ }
    push();
  });
  reg("asc_onGetDocInfoEnd", push);
  setTimeout(() => { try { (api as any).startGetDocInfo(); } catch { /* sans effet */ } }, 3000);
}
/** Recalcul groupé : au plus un toutes les 4 s après une modification (le calcul parcourt tout le document). */
function scheduleStats(api: DocApi): void {
  if (!statsWired) return;
  clearTimeout(statsTimer);
  statsTimer = setTimeout(() => { try { (api as any).startGetDocInfo(); } catch { /* sans effet */ } }, 4000);
}

// ── Correcteur orthographique (réglage mémorisé par l'éditeur d'amont) ─────────────────────────
const spellKey = (): string => `${w.DE ? "de" : w.SSE ? "sse" : "pe"}-settings-spellcheck`;
export const getSpell = (): boolean => { try { return w.Common.localStorage.getBool(spellKey(), true); } catch { return true; } };
export const setSpell = (on: boolean): void => {
  try { apiOf().asc_setSpellCheck(on); w.Common.localStorage.setBool(spellKey(), on); w.Common.Utils.InternalSettings.set(spellKey(), on); } catch { /* sans effet */ }
};
