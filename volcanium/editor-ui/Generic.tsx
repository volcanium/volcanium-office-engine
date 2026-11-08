import { useEffect, useState, type ReactNode } from "react";
import {
  IconAbc, IconAlignBoxBottomCenter, IconAlignBoxCenterMiddle, IconAlignBoxTopCenter, IconAlignCenter, IconAlignJustified, IconAlignLeft, IconAlignRight, IconArrowBackUp, IconArrowForwardUp, IconArrowsHorizontal, IconArrowsJoin, IconArrowsMaximize, IconAspectRatio, IconBlockquote, IconBold, IconBookmark, IconBorderAll, IconBoxMultiple, IconBrandAppleArcade, IconBrush, IconBucket, IconCalculator, IconCalendar, IconCell, IconChartBar, IconChartDots, IconChartHistogram, IconCheck, IconClipboard, IconClockHour4, IconCoin, IconColumns, IconCopy, IconCut, IconDatabaseImport, IconDecimal, IconDeviceFloppy, IconEraser, IconEye, IconEyeOff, IconFileDescription, IconFilePlus, IconFileText, IconFilter, IconFlask, IconFootsteps, IconForms, IconFunction, IconGitCompare, IconGitMerge, IconGridDots, IconHash, IconHighlight, IconHistory, IconItalic, IconLanguage, IconLayersLinked, IconLayersSubtract, IconLayoutAlignCenter, IconLayoutBoard, IconLayoutGrid, IconLayoutList, IconLayoutNavbar, IconLetterA, IconLetterCase, IconLink, IconLinkPlus, IconList, IconListDetails, IconListNumbers, IconListSearch, IconLock, IconMath, IconMessage, IconMessageCheck, IconMessageOff, IconMinus, IconMoon, IconMovie, IconMusic, IconNotes, IconNumber, IconOmega, IconPageBreak, IconPalette, IconPercentage, IconPhoto, IconPlayerPlay, IconPlayerTrackNext, IconPlaylistAdd, IconPlus, IconPrinter, IconRefresh, IconRotate, IconRotate2, IconRuler2, IconSearch, IconSelectAll, IconSettings, IconShape, IconSitemap, IconSlideshow, IconSortAscending, IconSquareLetterT, IconStack2, IconStrikethrough, IconSubscript, IconSum, IconSuperscript, IconTable, IconTableFilled, IconTableOptions, IconTarget, IconTextCaption, IconTextColor, IconTextDecrease, IconTextDirectionLtr, IconTextIncrease, IconTextWrap, IconTrash, IconTypography, IconUnderline, IconUsers, IconWand, IconWashDrycleanOff, IconWriting, IconX, IconZoomIn
} from "@tabler/icons-react";
import { backToDocument, getApi } from "./engine";
import { bridgeIcon, bridgeQuery, bridgeSlot, findOriginal, openFileMenu, readField, readOriginal, type OrigState } from "./bridge";
import { BigBtn, Btn, Group, Stack } from "./kit";
import { Spin } from "./Spins";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* Rubans du tableur et de la présentation : chaque bouton est NOTRE composant ; il déclenche le vrai contrôle d'origine (caché)
   et en relit l'état (actif / désactivé) deux fois par seconde. Menus et fenêtres d'origine s'ouvrent sous notre bouton. */

const S = 17, B = 20;
export interface Def { l: string; i: ReactNode; s?: string; t?: string[]; q?: string; menu?: boolean; file?: string; run?: () => void }
type Col = Def | Def[] | { node: ReactNode };
export interface GroupDef { label: string; cols: Col[] }

export const act = (d: Def) => () => {
  if (d.run) d.run();
  else if (d.file) openFileMenu(d.file);
  else if (d.q) bridgeQuery(d.q, { menu: d.menu });
  else if (d.s) bridgeSlot(d.s, { menu: d.menu });
  else bridgeIcon(d.t ?? [], { menu: d.menu });
  if (!d.menu) backToDocument();
};

export function useOrig(d: Def): OrigState {
  const [st, setSt] = useState<OrigState>({ found: true, active: false, disabled: false });
  useEffect(() => {
    if (d.file || d.run) return;
    const read = () => { const n = readOriginal(findOriginal(d.s, d.t, d.q)); setSt((p) => (p.found === n.found && p.active === n.active && p.disabled === n.disabled ? p : n)); };
    read();
    const t = setInterval(read, 500);
    return () => clearInterval(t);
  }, [d.s, d.t, d.q, d.file]);
  return st;
}

function Big({ d }: { d: Def }) {
  const st = useOrig(d);
  return <BigBtn label={d.l} icon={d.i} active={st.active} disabled={st.disabled} caret={d.menu} onClick={act(d)} onCaret={d.menu ? act(d) : undefined} />;
}
export function Small({ d }: { d: Def }) {
  const st = useOrig(d);
  return <Btn label={d.l} icon={d.i} active={st.active} disabled={st.disabled} caret={d.menu} onClick={act(d)} />;
}
/** Champ d'origine (police, taille, format…) : affiche sa valeur, ouvre sa liste d'origine. */
function Field({ slot, label, w }: { slot: string; label: string; w: number }) {
  const [v, setV] = useState("");
  useEffect(() => { const r = () => setV(readField(slot)); r(); const t = setInterval(r, 600); return () => clearInterval(t); }, [slot]);
  return (
    <button type="button" title={label} aria-label={label} onPointerDown={(e) => e.preventDefault()} onClick={() => bridgeSlot(slot, { menu: true })}
      style={{ width: w }} className="flex h-7 cursor-pointer items-center justify-between gap-1 rounded-lg border border-vc-line-strong px-2.5 text-sm hover:border-vc-text/30">
      <span className="truncate">{v || label}</span><span className="text-[10px] opacity-60" aria-hidden>▾</span>
    </button>
  );
}

const D = (l: string, i: ReactNode, s?: string, menu?: boolean): Def => ({ l, i, s, menu });
const T = (l: string, i: ReactNode, t: string[], menu?: boolean): Def => ({ l, i, t, menu });
/** Zoom : fonctions de l'API du moteur (texte et présentation), comme la barre d'état. */
const zoomApi = (k: "zoomFitToPage" | "zoomFitToWidth" | "zoom100"): (() => void) => () => { try { (getApi() as any)[k](); } catch { /* sans effet */ } backToDocument(); };
const R = (l: string, i: ReactNode, run: () => void): Def => ({ l, i, run });
const NC = (): Def => ({ l: "Commentaire", i: <IconMessage size={B} />, run: () => { window.dispatchEvent(new Event("vo:new-comment")); } });
const Q = (l: string, i: ReactNode, q: string, menu?: boolean): Def => ({ l, i, q, menu });

export const FIELD_MARK = "field:"; // colonne spéciale : champ d'origine
export function Ribbon({ groups }: { groups: GroupDef[] }) {
  return (
    <>
      {groups.map((g) => (
        <Group key={g.label} label={g.label}>
          {g.cols.map((c, k) => {
            if ("node" in c) return <div key={k} className="flex flex-col justify-center">{c.node}</div>;
            if (!Array.isArray(c)) return <Big key={k} d={c} />;
            return <Stack key={k}>{chunk(c).map((row, r) => <div key={r} className="flex items-center gap-0.5">{row.map((d) => (d.s?.startsWith(FIELD_MARK) ? <Field key={d.l} slot={d.s.slice(FIELD_MARK.length)} label={d.l} w={d.menu ? 150 : 64} /> : <Small key={d.l} d={d} />))}</div>)}</Stack>;
          })}
        </Group>
      ))}
    </>
  );
}
/** Un tableau de Def est empilé en lignes ; on découpe en 2 lignes (le ruban est trop bas pour 3). */
const chunk = (c: Def[]): Def[][] => { const per = c.length <= 2 ? 1 : Math.ceil(c.length / 2); const out: Def[][] = []; for (let i = 0; i < c.length; i += per) out.push(c.slice(i, i + per)); return out; };
const F = (l: string, slot: string, wide = false): Def => ({ l, i: null, s: FIELD_MARK + slot, menu: wide });

const clip = (): GroupDef[] => [
  { label: "Historique", cols: [[D("Annuler", <IconArrowBackUp size={S} />, "btn-undo"), D("Rétablir", <IconArrowForwardUp size={S} />, "btn-redo")]] },
  { label: "Presse-papiers", cols: [D("Coller", <IconClipboard size={B} />, "btn-paste", true), [D("Couper", <IconCut size={S} />, "btn-cut"), D("Copier", <IconCopy size={S} />, "btn-copy"), D("Reproduire la mise en forme", <IconBrush size={S} />, "btn-copystyle")]] },
];
const find = (): GroupDef => ({ label: "Sélection", cols: [[D("Tout sélectionner", <IconSelectAll size={S} />, "btn-select-all")]] });
// ── Texte (l'onglet « Accueil » est natif : Home.tsx) ─────────────────────────────────────────────
export const DOC_TABS: { id: string; label: string; groups: () => GroupDef[] }[] = [
  { id: "insert", label: "Insertion", groups: () => [
    { label: "Pages", cols: [D("Page vide", <IconFilePlus size={B} />, "btn-blankpage"), T("Saut de page", <IconPageBreak size={B} />, ["pagebreak", "page-break"], true)] },
    { label: "Tableau", cols: [D("Tableau", <IconTable size={B} />, "btn-instable", true)] },
    { label: "Illustrations", cols: [T("Image", <IconPhoto size={B} />, ["insertimage"], true), D("Forme", <IconShape size={B} />, "btn-insshape", true), D("SmartArt", <IconSitemap size={B} />, "btn-inssmartart", true), D("Graphique", <IconChartBar size={B} />, "btn-inschart", true)] },
    { label: "Liens", cols: [T("Lien", <IconLink size={B} />, ["hyperlink"]), NC()] },
    { label: "En-tête et pied", cols: [T("En-tête / pied", <IconLayoutNavbar size={B} />, ["editheader"], true), T("Numéro de page", <IconHash size={B} />, ["pagenum"], true)] },
    { label: "Texte", cols: [D("Zone de texte", <IconSquareLetterT size={B} />, "btn-instext", true), D("Text Art", <IconTypography size={B} />, "btn-instextart", true), D("Lettrine", <IconLetterA size={B} />, "btn-dropcap", true), D("Texte du fichier", <IconFileDescription size={B} />, "btn-text-from-file", true)] },
    { label: "Symboles", cols: [D("Équation", <IconMath size={B} />, "btn-insequation", true), D("Symbole", <IconOmega size={B} />, "btn-inssymbol")] },
    { label: "Contrôles", cols: [D("Contrôles", <IconForms size={B} />, "btn-controls", true)] },
  ] },
  { id: "layout", label: "Mise en page", groups: () => [
    { label: "Page", cols: [D("Marges", <IconLayoutBoard size={B} />, "btn-pagemargins", true), D("Orientation", <IconRotate2 size={B} />, "btn-pageorient", true), D("Taille", <IconAspectRatio size={B} />, "btn-pagesize", true), D("Colonnes", <IconColumns size={B} />, "btn-columns", true), D("Numéros de ligne", <IconListNumbers size={B} />, "btn-line-numbers", true), D("Coupure de mots", <IconAbc size={B} />, "btn-hyphenation", true)] },
    { label: "Retraits", cols: [{ node: <div className="flex flex-col gap-1"><Spin label="Gauche" field="numIndentsLeft" /><Spin label="Droit" field="numIndentsRight" /></div> }] },
    { label: "Espacement", cols: [{ node: <div className="flex flex-col gap-1"><Spin label="Avant" field="numSpacingBefore" /><Spin label="Après" field="numSpacingAfter" /></div> }] },
    { label: "Organiser", cols: [T("Avancer", <IconLayersSubtract size={B} />, ["img-frwd"], true), T("Reculer", <IconBoxMultiple size={B} />, ["img-bkwd"], true), T("Aligner", <IconLayoutAlignCenter size={B} />, ["img-align"], true), T("Grouper", <IconStack2 size={B} />, ["img-group"], true), T("Fusionner", <IconGitMerge size={B} />, ["merge-shapes"], true)] },
    { label: "Arrière-plan", cols: [D("Filigrane", <IconWashDrycleanOff size={B} />, "btn-watermark", true), D("Couleur de page", <IconPalette size={B} />, "btn-pagecolor", true)] },
    { label: "Thème", cols: [D("Jeu de couleurs", <IconBrandAppleArcade size={B} />, "btn-colorschemas", true)] },
  ] },
  { id: "refs", label: "Références", groups: () => [
    { label: "Table des matières", cols: [T("Table des matières", <IconList size={B} />, ["contents"], true), D("Ajouter du texte", <IconListDetails size={B} />, "btn-add-text", true), D("Mettre à jour", <IconRefresh size={B} />, "btn-contents-update")] },
    { label: "Notes", cols: [T("Note de bas de page", <IconFootsteps size={B} />, ["notes"], true)] },
    { label: "Liens", cols: [T("Lien", <IconLinkPlus size={B} />, ["hyperlink"]), D("Signet", <IconBookmark size={B} />, "btn-bookmarks")] },
    { label: "Légendes", cols: [D("Légende", <IconTextCaption size={B} />, "btn-caption"), D("Renvoi", <IconBlockquote size={B} />, "btn-crossref")] },
    { label: "Table des illustrations", cols: [D("Table des illustrations", <IconTableOptions size={B} />, "btn-tof"), D("Mettre à jour", <IconRefresh size={B} />, "btn-tof-update")] },
  ] },
  { id: "review", label: "Révision", groups: () => [
    { label: "Commentaires", cols: [NC(), T("Supprimer", <IconMessageOff size={B} />, ["rem-comment"], true), T("Résoudre", <IconMessageCheck size={B} />, ["resolve-all"], true)] },
    { label: "Suivi des modifications", cols: [T("Suivi", <IconWriting size={B} />, ["big-ic-review"], true), T("Accepter", <IconCheck size={B} />, ["review-save"], true), T("Refuser", <IconX size={B} />, ["review-deny"], true), T("Affichage", <IconNotes size={B} />, ["ic-reviewview"], true)] },
    { label: "Comparer", cols: [T("Comparer", <IconGitCompare size={B} />, ["compare"], true), T("Combiner", <IconGitMerge size={B} />, ["combine"], true)] },
    { label: "Publipostage", cols: [T("Publipostage", <IconSum size={B} />, ["mailmerge"])] },
  ] },
  { id: "view", label: "Affichage", groups: () => [
    { label: "Zoom", cols: [R("Ajuster à la page", <IconArrowsMaximize size={B} />, zoomApi("zoomFitToPage")), R("Ajuster à la largeur", <IconArrowsHorizontal size={B} />, zoomApi("zoomFitToWidth")), R("100 %", <IconZoomIn size={B} />, zoomApi("zoom100"))] },
    { label: "Thème", cols: [T("Thème", <IconMoon size={B} />, ["theme"], true)] },
    { label: "Macros", cols: [T("Macros", <IconFileText size={B} />, ["macros"])] },
  ] },
];

// ── Tableur ───────────────────────────────────────────────────────────────────────────────────────
export const SHEET_TABS: { id: string; label: string; groups: () => GroupDef[] }[] = [
  { id: "home", label: "Accueil", groups: () => [
    ...clip(),
    { label: "Police", cols: [[F("Police", "field-fontname", true), F("Taille", "field-fontsize"), D("Agrandir la police", <IconTextIncrease size={S} />, "btn-incfont"), D("Réduire la police", <IconTextDecrease size={S} />, "btn-decfont"), D("Modifier la casse", <IconLetterCase size={S} />, "btn-changecase", true),
      D("Gras", <IconBold size={S} />, "btn-bold"), D("Italique", <IconItalic size={S} />, "btn-italic"), D("Souligné", <IconUnderline size={S} />, "btn-underline"), D("Barré", <IconStrikethrough size={S} />, "btn-strikeout"), D("Indice / exposant", <IconSubscript size={S} />, "btn-subscript", true),
      D("Couleur de police", <IconTextColor size={S} />, "btn-fontcolor", true), D("Couleur de remplissage", <IconBucket size={S} />, "btn-fillparag", true), D("Bordures", <IconBorderAll size={S} />, "btn-borders", true)]] },
    { label: "Alignement", cols: [[D("Aligner en haut", <IconAlignBoxTopCenter size={S} />, "btn-top"), D("Aligner au milieu", <IconAlignBoxCenterMiddle size={S} />, "btn-middle"), D("Aligner en bas", <IconAlignBoxBottomCenter size={S} />, "btn-bottom"),
      D("Renvoyer à la ligne", <IconTextWrap size={S} />, "btn-wrap"), D("Orientation du texte", <IconRotate size={S} />, "btn-text-orient", true), D("Centrer", <IconAlignCenter size={S} />, "btn-align-center"), D("Justifier", <IconAlignJustified size={S} />, "btn-align-just"),
      D("Fusionner", <IconArrowsJoin size={S} />, "btn-merge", true), D("Direction du texte", <IconTextDirectionLtr size={S} />, "btn-direction", true)]] },
    { label: "Formules", cols: [[D("Somme automatique", <IconFunction size={S} />, "btn-formula", true), D("Remplir", <IconPlaylistAdd size={S} />, "btn-fill-num", true), D("Plages nommées", <IconTarget size={S} />, "btn-named-range", true), D("Effacer", <IconEraser size={S} />, "btn-clear", true)]] },
    { label: "Nombres", cols: [[F("Format de nombre", "btn-format", true), D("Monétaire", <IconCoin size={S} />, "btn-currency", true), D("Pourcentage", <IconPercentage size={S} />, "btn-percents"), D("Séparateur de milliers", <IconHash size={S} />, "btn-comma"), D("Ajouter une décimale", <IconDecimal size={S} />, "btn-digit-inc"), D("Retirer une décimale", <IconNumber size={S} />, "btn-digit-dec")]] },
    { label: "Cellules", cols: [[D("Insérer des cellules", <IconPlus size={S} />, "btn-cell-ins", true), D("Supprimer des cellules", <IconMinus size={S} />, "btn-cell-del", true), D("Format de cellule", <IconCell size={S} />, "btn-cell-format", true)]] },
    { label: "Styles", cols: [D("Mise en forme conditionnelle", <IconTableOptions size={B} />, "btn-condformat", true), D("Mettre sous forme de tableau", <IconTable size={B} />, "btn-table-tpl", true), D("Styles de cellule", <IconLayoutGrid size={B} />, "field-styles", true)] },
    find(),
  ] },
  { id: "insert", label: "Insertion", groups: () => [
    { label: "Tableaux", cols: [D("Tableau", <IconTable size={B} />, "btn-instable"), T("Tableau croisé", <IconTableFilled size={B} />, ["pivot-sum"], true)] },
    { label: "Illustrations", cols: [D("Image", <IconPhoto size={B} />, "btn-insimage", true), D("Forme", <IconShape size={B} />, "btn-insshape", true), D("SmartArt", <IconSitemap size={B} />, "btn-inssmartart", true), D("Graphique recommandé", <IconChartHistogram size={B} />, "btn-insrecommend"), D("Graphique", <IconChartBar size={B} />, "btn-inschart", true), D("Graphique sparkline", <IconChartDots size={B} />, "btn-inssparkline", true)] },
    { label: "Liens", cols: [D("Lien", <IconLink size={B} />, "btn-inshyperlink")] },
    { label: "Filtres", cols: [D("Segment", <IconFilter size={B} />, "btn-insslicer")] },
    { label: "Texte", cols: [D("Zone de texte", <IconSquareLetterT size={B} />, "btn-instext", true), D("Text Art", <IconTypography size={B} />, "btn-instextart", true)] },
    { label: "Symboles", cols: [D("Équation", <IconMath size={B} />, "btn-insequation", true), D("Symbole", <IconOmega size={B} />, "btn-inssymbol")] },
  ] },
  { id: "layout", label: "Mise en page", groups: () => [
    { label: "Page", cols: [D("Marges", <IconLayoutBoard size={B} />, "btn-pagemargins", true), D("Orientation", <IconRotate2 size={B} />, "btn-pageorient", true), D("Taille", <IconAspectRatio size={B} />, "btn-pagesize", true), D("Zone d'impression", <IconPrinter size={B} />, "btn-printarea", true), D("Sauts de page", <IconLayersSubtract size={B} />, "btn-pagebreak", true), D("Mise à l'échelle", <IconArrowsMaximize size={B} />, "btn-scale", true), D("Titres à imprimer", <IconListNumbers size={B} />, "btn-printtitles")] },
    { label: "Feuille", cols: [D("De droite à gauche", <IconAlignRight size={B} />, "btn-rtl-sheet")] },
    { label: "Organiser", cols: [D("Avancer", <IconLayersSubtract size={B} />, "img-movefrwd", true), D("Reculer", <IconBoxMultiple size={B} />, "img-movebkwd", true), D("Aligner", <IconLayoutAlignCenter size={B} />, "img-align", true), D("Grouper", <IconStack2 size={B} />, "img-group", true), D("Fusionner", <IconGitMerge size={B} />, "shapes-merge", true)] },
    { label: "Thème", cols: [D("Jeu de couleurs", <IconPalette size={B} />, "btn-colorschemas", true)] },
  ] },
  { id: "formula", label: "Formule", groups: () => [
    { label: "Fonctions", cols: [D("Insérer une fonction", <IconFunction size={B} />, "btn-additional-formula"), D("Somme automatique", <IconCalculator size={B} />, "btn-autosum", true), D("Récentes", <IconClockHour4 size={B} />, "btn-recent", true), D("Financier", <IconCoin size={B} />, "btn-financial", true), D("Logique", <IconGitCompare size={B} />, "btn-logical", true), D("Texte", <IconTypography size={B} />, "btn-text", true), D("Date et heure", <IconCalendar size={B} />, "btn-datetime", true), D("Recherche", <IconListSearch size={B} />, "btn-lookup", true), D("Maths", <IconMath size={B} />, "btn-math", true), D("Plus", <IconGridDots size={B} />, "btn-more", true)] },
    { label: "Noms", cols: [D("Gestionnaire de noms", <IconTarget size={B} />, "btn-named-range-huge", true)] },
    { label: "Audit", cols: [[D("Repérer les antécédents", <IconArrowBackUp size={S} />, "btn-trace-prec"), D("Repérer les dépendants", <IconArrowForwardUp size={S} />, "btn-trace-dep"), D("Supprimer les flèches", <IconEraser size={S} />, "btn-remove-arrows", true), D("Afficher les formules", <IconFunction size={S} />, "btn-show-formulas"), D("Fenêtre espion", <IconEye size={S} />, "btn-watch-window")]] },
    { label: "Calcul", cols: [D("Calculer", <IconRefresh size={B} />, "btn-calculate", true)] },
  ] },
  { id: "data", label: "Données", groups: () => [
    { label: "Importer", cols: [D("Depuis un texte", <IconDatabaseImport size={B} />, "btn-data-from-text", true), D("Liaisons externes", <IconLink size={B} />, "btn-data-external-links")] },
    { label: "Trier et filtrer", cols: [T("Tri croissant", <IconSortAscending size={B} />, ["sort-down"]), T("Tri décroissant", <IconSortAscending size={B} />, ["sort-up"]), D("Tri personnalisé", <IconSortAscending size={B} />, "btn-custom-sort"), T("Filtre automatique", <IconFilter size={B} />, ["autofilter"]), T("Effacer le filtre", <IconX size={B} />, ["clear-filter"])] },
    { label: "Outils de données", cols: [D("Texte en colonnes", <IconColumns size={B} />, "btn-text-column"), D("Supprimer les doublons", <IconTrash size={B} />, "btn-rem-duplicates"), D("Validation des données", <IconCheck size={B} />, "btn-data-validation", true)] },
    { label: "Analyse", cols: [D("Valeur cible", <IconTarget size={B} />, "btn-goal-seek"), D("Solveur", <IconFlask size={B} />, "btn-solver")] },
    { label: "Plan", cols: [D("Grouper", <IconStack2 size={B} />, "btn-group", true), D("Dissocier", <IconLayersLinked size={B} />, "btn-ungroup", true)] },
  ] },
  { id: "review", label: "Révision", groups: () => [
    { label: "Commentaires", cols: [NC(), T("Supprimer", <IconMessageOff size={B} />, ["rem-comment"], true), T("Résoudre", <IconMessageCheck size={B} />, ["resolve-all"], true)] },
    { label: "Protection", cols: [T("Protéger le classeur", <IconLock size={B} />, ["protect-workbook"]), T("Protéger la feuille", <IconLock size={B} />, ["protect-sheet"]), T("Protéger une plage", <IconLock size={B} />, ["protect-range"])] },
  ] },
  { id: "view", label: "Affichage", groups: () => [
    { label: "Zoom", cols: [R("100 %", <IconZoomIn size={B} />, () => { try { (getApi() as any).asc_setZoom(1); } catch { /* sans effet */ } backToDocument(); })] },
    { label: "Thème", cols: [T("Thème", <IconMoon size={B} />, ["theme"], true)] },
    { label: "Macros", cols: [T("Macros", <IconFileText size={B} />, ["macros"])] },
  ] },
];

// ── Présentation ──────────────────────────────────────────────────────────────────────────────────
export const SLIDE_TABS: { id: string; label: string; groups: () => GroupDef[] }[] = [
  { id: "home", label: "Accueil", groups: () => [
    { label: "Diapositives", cols: [D("Nouvelle diapositive", <IconPlus size={B} />, "addslide", true), D("Disposition", <IconLayoutBoard size={B} />, "changeslide", true), D("Aperçu", <IconSlideshow size={B} />, "preview", true)] },
    ...clip(),
    { label: "Police", cols: [[F("Police", "field-fontname", true), F("Taille", "field-fontsize"), D("Agrandir la police", <IconTextIncrease size={S} />, "btn-incfont"), D("Réduire la police", <IconTextDecrease size={S} />, "btn-decfont"), D("Modifier la casse", <IconLetterCase size={S} />, "btn-changecase", true),
      D("Gras", <IconBold size={S} />, "btn-bold"), D("Italique", <IconItalic size={S} />, "btn-italic"), D("Souligné", <IconUnderline size={S} />, "btn-underline"), D("Barré", <IconStrikethrough size={S} />, "btn-strikeout"), D("Exposant", <IconSuperscript size={S} />, "btn-superscript"), D("Indice", <IconSubscript size={S} />, "btn-subscript"),
      D("Surlignage", <IconHighlight size={S} />, "btn-highlight", true), D("Couleur de police", <IconTextColor size={S} />, "btn-fontcolor", true), D("Effacer la mise en forme", <IconEraser size={S} />, "btn-clearstyle")]] },
    { label: "Paragraphe", cols: [[D("Liste à puces", <IconList size={S} />, "btn-markers", true), D("Liste numérotée", <IconListNumbers size={S} />, "btn-numbering", true), D("Réduire le retrait", <IconAlignLeft size={S} />, "btn-decoffset"), D("Augmenter le retrait", <IconAlignRight size={S} />, "btn-incoffset"),
      D("Alignement horizontal", <IconAlignCenter size={S} />, "btn-halign", true), D("Alignement vertical", <IconAlignBoxCenterMiddle size={S} />, "btn-valign", true), D("Interligne", <IconAbc size={S} />, "btn-linespace", true), D("Colonnes", <IconColumns size={S} />, "btn-columns", true), D("Direction du texte", <IconTextDirectionLtr size={S} />, "btn-direction", true)]] },
    { label: "Formes", cols: [[D("Organiser", <IconLayersSubtract size={S} />, "btn-arrange-shape", true), D("Fusionner les formes", <IconGitMerge size={S} />, "btn-shapes-merge", true), D("Aligner", <IconLayoutAlignCenter size={S} />, "btn-align-shape", true)]] },
    find(),
  ] },
  { id: "insert", label: "Insertion", groups: () => [
    { label: "Tableau", cols: [D("Tableau", <IconTable size={B} />, "btn-inserttable", true)] },
    { label: "Illustrations", cols: [T("Image", <IconPhoto size={B} />, ["insertimage", "image"], true), Q("Forme", <IconShape size={B} />, "#tlbtn-insertshape-0", true), D("SmartArt", <IconSitemap size={B} />, "btn-inssmartart", true), D("Graphique", <IconChartHistogram size={B} />, "btn-insertchart", true)] },
    { label: "Liens", cols: [D("Lien", <IconLink size={B} />, "btn-insertlink"), NC()] },
    { label: "Texte", cols: [T("Zone de texte", <IconSquareLetterT size={B} />, ["big-text", "inserttext"], true), D("Text Art", <IconTypography size={B} />, "btn-instextart", true), D("En-tête / pied", <IconForms size={B} />, "btn-editheader"), D("Date et heure", <IconCalendar size={B} />, "btn-datetime"), D("Numéro de diapositive", <IconHash size={B} />, "btn-slidenum")] },
    { label: "Symboles", cols: [D("Équation", <IconMath size={B} />, "btn-insertequation", true), D("Symbole", <IconOmega size={B} />, "btn-inssymbol")] },
    { label: "Média", cols: [D("Audio", <IconMusic size={B} />, "btn-insaudio"), D("Vidéo", <IconMovie size={B} />, "btn-insvideo")] },
  ] },
  { id: "design", label: "Création", groups: () => [
    { label: "Thème", cols: [D("Styles de diapositive", <IconWand size={B} />, "field-styles", true), D("Jeu de couleurs", <IconPalette size={B} />, "btn-colorschemas", true), D("Taille de diapositive", <IconAspectRatio size={B} />, "btn-slidesize", true)] },
  ] },
  { id: "transit", label: "Transitions", groups: () => [
    { label: "Transition", cols: [T("Transition", <IconPlayerTrackNext size={B} />, ["transition"], true), T("Aperçu", <IconPlayerPlay size={B} />, ["preview", "transit"]), T("Appliquer à tout", <IconWashDrycleanOff size={B} />, ["transition-apply-all"])] },
  ] },
  { id: "animate", label: "Animations", groups: () => [
    { label: "Animation", cols: [T("Animation", <IconPlayerPlay size={B} />, ["animation"], true), T("Ajouter une animation", <IconPlus size={B} />, ["add-animation", "addanimation"], true), T("Volet d'animation", <IconLayoutList size={B} />, ["animation-pane", "animationpane"])] },
  ] },
  { id: "review", label: "Révision", groups: () => [
    { label: "Commentaires", cols: [NC(), T("Supprimer", <IconMessageOff size={B} />, ["rem-comment"], true), T("Résoudre", <IconMessageCheck size={B} />, ["resolve-all"], true)] },
  ] },
  { id: "view", label: "Affichage", groups: () => [
    { label: "Zoom", cols: [R("Ajuster à la page", <IconArrowsMaximize size={B} />, zoomApi("zoomFitToPage")), R("Ajuster à la largeur", <IconArrowsHorizontal size={B} />, zoomApi("zoomFitToWidth")), R("100 %", <IconZoomIn size={B} />, zoomApi("zoom100"))] },
    { label: "Thème", cols: [T("Thème", <IconMoon size={B} />, ["theme"], true)] },
    { label: "Macros", cols: [T("Macros", <IconFileText size={B} />, ["macros"])] },
  ] },
];
