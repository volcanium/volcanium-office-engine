import { useEffect, useState, type ReactNode } from "react";
import {
  IconAbc, IconArrowBarToDown, IconArrowsMaximize, IconArrowsHorizontal, IconAspectRatio, IconBookmark, IconBoxMultiple, IconBrandAppleArcade,
  IconCheck, IconColumns, IconCopyPlus, IconDeviceFloppy, IconDownload, IconFileDescription, IconFileInfo, IconFilePlus, IconFileTypography,
  IconFootsteps, IconForms, IconGitCompare, IconGitMerge, IconGridDots, IconHash, IconHistory, IconInfoCircle,
  IconLanguage, IconLayersSubtract, IconLayoutAlignCenter, IconLayoutNavbar, IconLayoutSidebar, IconLink, IconLinkPlus, IconList, IconListNumbers,
  IconMessage, IconMessageCheck, IconMessageOff, IconMath, IconMoon, IconNotes, IconPageBreak, IconPalette, IconPhoto, IconPointer, IconPrinter,
  IconRefresh, IconRotate2, IconSettings, IconShape, IconSitemap, IconSquareLetterT, IconSum, IconTable, IconTableOptions,
  IconTypography, IconUsers, IconWashDrycleanOff, IconX, IconZoomIn, IconBlockquote, IconChartBar, IconLetterA, IconChecks,
  IconTextCaption, IconOmega, IconPlayerPause, IconPlayerRecord, IconWriting, IconListDetails, IconLayoutBoard,
} from "@tabler/icons-react";
import { getToolbarView, keyGuard, backToDocument, getApi } from "./engine";
import { bridgeIcon, bridgeSlot, openFileMenu } from "./bridge";
import { BigBtn, Group, Stack } from "./kit";

/* Onglets du ruban hors « Accueil ». Chaque bouton reprend une fonction du ruban ONLYOFFICE d'origine :
   il déclenche le vrai contrôle (caché) ; les menus et fenêtres d'origine s'ouvrent, habillés aux couleurs Volcanium. */

const I = 20;
type Act = () => void;
const slot = (id: string, menu = false): Act => () => { bridgeSlot(id, { menu }); };
/** Un commentaire se rédige dans NOTRE panneau (la fenêtre flottante d'origine est hors écran). */
const newComment: Act = () => { window.dispatchEvent(new Event("vo:new-comment")); };
const icon = (tokens: string[], menu = false): Act => () => { bridgeIcon(tokens, { menu }); };

function T({ label, ic, act, caret, big = true }: { label: string; ic: ReactNode; act: Act; caret?: boolean; big?: boolean }) {
  void big;
  return <BigBtn label={label} icon={ic} caret={caret} onClick={act} onCaret={caret ? act : undefined} />;
}

/** Champ numérique d'origine (retraits, espacements) : lu et écrit sur le contrôle caché. */
function Spin({ label, field }: { label: string; field: string }) {
  const [v, setV] = useState("");
  const [focus, setFocus] = useState(false);
  useEffect(() => {
    if (focus) return;
    const read = () => { try { setV(String(getToolbarView()[field].getValue() ?? "")); } catch { /* pas prêt */ } };
    read();
    const t = setInterval(read, 700);
    return () => clearInterval(t);
  }, [field, focus]);
  return (
    <label className="flex items-center justify-between gap-2 text-xs text-vc-text/70">
      <span>{label}</span>
      <input
        value={v} onChange={(e) => setV(e.target.value)} aria-label={label}
        onFocus={(e) => { setFocus(true); keyGuard.on(); e.currentTarget.select(); }}
        onBlur={() => { try { getToolbarView()[field].setValue(v); } catch { /* sans effet */ } setFocus(false); keyGuard.off(); backToDocument(); }}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        className="h-7 w-20 rounded-lg border border-vc-line-strong bg-transparent px-2 text-sm tabular-nums text-vc-text outline-none focus:border-vc-main"
      />
    </label>
  );
}

export function InsertTab() {
  return (
    <>
      <Group label="Pages">
        <T label="Page vide" ic={<IconFilePlus size={I} />} act={slot("btn-blankpage")} />
        <T label="Saut de page" ic={<IconPageBreak size={I} />} act={icon(["pagebreak", "page-break", "break"], true)} caret />
      </Group>
      <Group label="Tableau"><T label="Tableau" ic={<IconTable size={I} />} act={slot("btn-instable", true)} caret /></Group>
      <Group label="Illustrations">
        <T label="Image" ic={<IconPhoto size={I} />} act={icon(["insertimage", "image"], true)} caret />
        <T label="Forme" ic={<IconShape size={I} />} act={slot("btn-insshape", true)} caret />
        <T label="SmartArt" ic={<IconSitemap size={I} />} act={slot("btn-inssmartart", true)} caret />
        <T label="Graphique" ic={<IconChartBar size={I} />} act={slot("btn-inschart", true)} caret />
      </Group>
      <Group label="Liens">
        <T label="Lien" ic={<IconLink size={I} />} act={icon(["hyperlink"])} />
        <T label="Commentaire" ic={<IconMessage size={I} />} act={newComment} />
      </Group>
      <Group label="En-tête et pied">
        <T label="En-tête / pied" ic={<IconLayoutNavbar size={I} />} act={icon(["editheader", "header"], true)} caret />
        <T label="Numéro de page" ic={<IconHash size={I} />} act={icon(["pagenum", "page-number"], true)} caret />
      </Group>
      <Group label="Texte">
        <T label="Zone de texte" ic={<IconSquareLetterT size={I} />} act={slot("btn-instext", true)} caret />
        <T label="Text Art" ic={<IconTypography size={I} />} act={slot("btn-instextart", true)} caret />
        <T label="Lettrine" ic={<IconLetterA size={I} />} act={slot("btn-dropcap", true)} caret />
        <T label="Texte du fichier" ic={<IconFileDescription size={I} />} act={slot("btn-text-from-file", true)} caret />
      </Group>
      <Group label="Symboles">
        <T label="Équation" ic={<IconMath size={I} />} act={slot("btn-insequation", true)} caret />
        <T label="Symbole" ic={<IconOmega size={I} />} act={slot("btn-inssymbol", true)} caret />
      </Group>
      <Group label="Contrôles"><T label="Contrôles" ic={<IconForms size={I} />} act={slot("btn-controls", true)} caret /></Group>
    </>
  );
}

export function LayoutTab() {
  return (
    <>
      <Group label="Page">
        <T label="Marges" ic={<IconLayoutBoard size={I} />} act={slot("btn-pagemargins", true)} caret />
        <T label="Orientation" ic={<IconRotate2 size={I} />} act={slot("btn-pageorient", true)} caret />
        <T label="Taille" ic={<IconAspectRatio size={I} />} act={slot("btn-pagesize", true)} caret />
        <T label="Colonnes" ic={<IconColumns size={I} />} act={slot("btn-columns", true)} caret />
        <T label="Numéros de ligne" ic={<IconListNumbers size={I} />} act={slot("btn-line-numbers", true)} caret />
        <T label="Coupure de mots" ic={<IconAbc size={I} />} act={slot("btn-hyphenation", true)} caret />
      </Group>
      <Group label="Retraits">
        <Stack><Spin label="Gauche" field="numIndentsLeft" /><Spin label="Droit" field="numIndentsRight" /></Stack>
      </Group>
      <Group label="Espacement">
        <Stack><Spin label="Avant" field="numSpacingBefore" /><Spin label="Après" field="numSpacingAfter" /></Stack>
      </Group>
      <Group label="Organiser">
        <T label="Avancer" ic={<IconLayersSubtract size={I} />} act={icon(["img-frwd"], true)} caret />
        <T label="Reculer" ic={<IconBoxMultiple size={I} />} act={icon(["img-bkwd"], true)} caret />
        <T label="Aligner" ic={<IconLayoutAlignCenter size={I} />} act={icon(["img-align"], true)} caret />
        <T label="Grouper" ic={<IconCopyPlus size={I} />} act={icon(["img-group"], true)} caret />
        <T label="Fusionner" ic={<IconGitMerge size={I} />} act={icon(["merge-shapes"], true)} caret />
      </Group>
      <Group label="Arrière-plan">
        <T label="Filigrane" ic={<IconWashDrycleanOff size={I} />} act={slot("btn-watermark", true)} caret />
        <T label="Couleur de page" ic={<IconPalette size={I} />} act={slot("btn-pagecolor", true)} caret />
      </Group>
      <Group label="Thème"><T label="Jeu de couleurs" ic={<IconBrandAppleArcade size={I} />} act={slot("btn-colorschemas", true)} caret /></Group>
    </>
  );
}

export function ReferencesTab() {
  return (
    <>
      <Group label="Table des matières">
        <T label="Table des matières" ic={<IconList size={I} />} act={icon(["contents"], true)} caret />
        <T label="Ajouter du texte" ic={<IconListDetails size={I} />} act={slot("btn-add-text", true)} caret />
        <T label="Mettre à jour" ic={<IconRefresh size={I} />} act={slot("btn-contents-update", true)} caret />
      </Group>
      <Group label="Notes de bas de page">
        <T label="Note de bas de page" ic={<IconFootsteps size={I} />} act={icon(["notes", "footnote"], true)} caret />
      </Group>
      <Group label="Liens">
        <T label="Lien" ic={<IconLinkPlus size={I} />} act={icon(["hyperlink"])} />
        <T label="Signet" ic={<IconBookmark size={I} />} act={slot("btn-bookmarks")} />
      </Group>
      <Group label="Légendes">
        <T label="Légende" ic={<IconTextCaption size={I} />} act={slot("btn-caption")} />
        <T label="Renvoi" ic={<IconBlockquote size={I} />} act={slot("btn-crossref")} />
      </Group>
      <Group label="Table des illustrations">
        <T label="Table des illustrations" ic={<IconTableOptions size={I} />} act={slot("btn-tof")} />
        <T label="Mettre à jour" ic={<IconRefresh size={I} />} act={slot("btn-tof-update", true)} caret />
      </Group>
    </>
  );
}

export function ReviewTab() {
  return (
    <>
      <Group label="Commentaires">
        <T label="Commentaire" ic={<IconMessage size={I} />} act={newComment} />
        <T label="Supprimer" ic={<IconMessageOff size={I} />} act={icon(["rem-comment"], true)} caret />
        <T label="Résoudre" ic={<IconMessageCheck size={I} />} act={icon(["resolve-all"], true)} caret />
      </Group>
      <Group label="Suivi des modifications">
        <T label="Suivi" ic={<IconWriting size={I} />} act={icon(["big-ic-review", "ic-review"], true)} caret />
        <T label="Accepter" ic={<IconCheck size={I} />} act={icon(["review-save"], true)} caret />
        <T label="Refuser" ic={<IconX size={I} />} act={icon(["review-deny"], true)} caret />
        <T label="Affichage" ic={<IconNotes size={I} />} act={icon(["ic-reviewview"], true)} caret />
      </Group>
      <Group label="Comparer">
        <T label="Comparer" ic={<IconGitCompare size={I} />} act={icon(["compare"], true)} caret />
        <T label="Combiner" ic={<IconGitMerge size={I} />} act={icon(["combine"], true)} caret />
      </Group>
      <Group label="Langue">
        <T label="Orthographe" ic={<IconChecks size={I} />} act={icon(["docspell"])} />
        <T label="Langue" ic={<IconLanguage size={I} />} act={icon(["spellcheck-lang", "docspell"], true)} />
      </Group>
      <Group label="Collaboration">
        <T label="Mode de co-édition" ic={<IconUsers size={I} />} act={icon(["ic-coedit"], true)} caret />
        <T label="Partage" ic={<IconSettings size={I} />} act={() => openFileMenu("rights")} />
        <T label="Historique" ic={<IconHistory size={I} />} act={() => openFileMenu("history")} />
        <T label="Chat" ic={<IconMessage size={I} />} act={icon(["ic-chat"])} />
        <T label="Publipostage" ic={<IconSum size={I} />} act={icon(["mailmerge"])} />
      </Group>
    </>
  );
}

export function ViewTab() {
  const api = () => getApi();
  const zoom = (fn: () => void): Act => () => { try { fn(); } catch { /* sans effet */ } backToDocument(); };
  return (
    <>
      <Group label="Panneaux">
        <T label="Navigation" ic={<IconLayoutSidebar size={I} />} act={icon(["menu-navigation"])} />
        <T label="Thème" ic={<IconMoon size={I} />} act={icon(["theme"], true)} caret />
      </Group>
      <Group label="Zoom">
        <T label="Ajuster à la page" ic={<IconArrowsMaximize size={I} />} act={zoom(() => api().zoomFitToPage())} />
        <T label="Ajuster à la largeur" ic={<IconArrowsHorizontal size={I} />} act={zoom(() => api().zoomFitToWidth())} />
        <T label="100 %" ic={<IconZoomIn size={I} />} act={zoom(() => api().zoom100())} />
        <T label="Pages multiples" ic={<IconGridDots size={I} />} act={icon(["multiple-pages"])} />
      </Group>
      <Group label="Macros">
        <T label="Macros" ic={<IconFileTypography size={I} />} act={icon(["macros"])} />
        <T label="Enregistrer" ic={<IconPlayerRecord size={I} />} act={icon(["macros-record"])} />
        <T label="Pause" ic={<IconPlayerPause size={I} />} act={icon(["macros-pause"])} />
      </Group>
    </>
  );
}
