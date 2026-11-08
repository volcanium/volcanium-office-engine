# Interface maison (React + volcanium-components) sur le moteur ONLYOFFICE

> Décision à prendre (2026-11-06) : abandonner la « peau » CSS au profit d'une vraie interface Volcanium, en gardant le moteur.

## Essai de faisabilité : RÉUSSI (même jour)
- `apps/web/editor-ui/` : bundle React autonome (Vite, format IIFE) construit avec les vrais composants (`IconButton`, `Tabs`, `VolcaniumProvider`, `ToastProvider`), monté dans un **Shadow DOM** (le CSS Tailwind/préflight de la librairie n'abîme pas l'éditeur, et inversement).
- Le moteur est piloté par `DE.getController('Toolbar').api` (objet `asc_docs_api` de sdkjs) : `Undo/Redo`, `put_TextPrBold/Italic/Underline/Strikeout`, `put_PrAlign` (1 gauche, 0 droite, 2 centre, 3 justifié), `put_TextPrFontSize`. L'état revient par `asc_registerCallback('asc_onBold'…)`.
- Vérifié par script (`scripts/ui-shots/spike.mjs`) : clic sur Gras / Centrer / A+ dans NOTRE ruban → le texte du document change ; les boutons reflètent la sélection (état actif en orange/20 comme dans Notes). Captures : `docs/captures/essai-ruban-react-*.png`.
- Le ruban d'amont est masqué par `body.vo-custom #toolbar > .toolbar { visibility: hidden }`.
- Piège rencontré : l'éditeur fixe sa taille de base de page ; Tailwind compte en rem, donc tout rétrécit → `@theme` en pixels dans `ui.css`.

## Architecture visée (« hybride »)
1. **On garde** : `sdkjs` (rendu, mise en page, formats, calculs) et les contrôleurs de `web-apps` qui ouvrent le document et gèrent la co-édition (`Main.js`, `Common.Gateway`). Ce sont les parties difficiles et risquées à réécrire.
2. **On remplace** progressivement toute la couche visible : en-tête, ruban (onglets, groupes, boutons, menus), barres latérales (commentaires, navigation, paramètres de forme/tableau/image), barre d'état, fenêtres de réglages, menu Fichier. Chaque pièce devient un composant React lisant l'état du moteur (callbacks `asc_on…`) et lui envoyant des commandes (`put_…`, `asc_…`).
3. **Fusion avec l'amont** : nos changements se limitent à un point d'ancrage (balise `<script>` + CSS de masquage) ; tout notre code vit dans `apps/web/editor-ui/`. Le reste d'`web-apps` reste celui d'amont.
4. **Menus et fenêtres** : ils deviennent de vrais composants de la librairie (`Modal`, `ConfirmModal`, `Select`, `Popover`…), donc strictement identiques aux autres apps. Pour les portails de la librairie (rendus dans `document.body`), prévoir de les monter dans le Shadow DOM.

## Plan par jalons (ordre proposé)
| # | Jalon | Contenu | Risque |
|---|---|---|---|
| 1 | Ruban Texte, onglet Accueil complet | police, taille, couleurs, listes, interligne, styles ; état synchronisé | moyen : listes à vignettes (styles) |
| 2 | Ruban Texte, autres onglets | Insertion, Mise en page, Références, Affichage | moyen |
| 3 | En-tête + menu Fichier | titre du document, enregistrer/imprimer/partager, télécharger/convertir | faible |
| 4 | Fenêtres | Modal pour les réglages courants : paragraphe, police, tableau, image, lien | élevé : beaucoup de fenêtres, champs nombreux |
| 5 | Barres latérales | commentaires, navigation, paramètres contextuels | élevé |
| 6 | Tableur puis Présentation | mêmes composants, API `Asc.spreadsheet_api` / `Asc.asc_docs_api` (slides) | moyen, 2 éditeurs de plus |
| 7 | Mobile | l'UI mobile d'amont est déjà séparée (Framework7) ; à traiter à part | à étudier |

## Coûts et risques à connaître
- **Volume** : le ruban d'ONLYOFFICE expose plusieurs centaines de commandes ; il faut tout rebrancher à la main, commande par commande, et les tester dans les trois éditeurs.
- **Dépendance à l'API interne** : `put_*` / `asc_on*` ne sont pas une API publique stable ; une mise à jour d'amont peut les changer (on fige sur une version, comme maintenant sur 10.0.0.169, et on migre exprès).
- **Co-édition, verrous, mode révision, protection** : états secondaires à relire dans les contrôleurs d'amont.
- **Accessibilité et raccourcis clavier** : à re-vérifier (les composants de la librairie aident, mais les raccourcis passent par le moteur).
- **Juridique** : notre code React (`editor-ui`) pilote un moteur AGPL dans le même navigateur : considérer qu'il est un travail dérivé et le publier sous AGPL avec le reste (règle 8 : nos services Volcanium, eux, restent séparés par API). À faire valider.
- **Icônes** : les nôtres (Tabler) partout, ce qui règle aussi la question CC BY-SA des 398 icônes restantes.

## ÉTAT (2026-11-06, fin de journée) : ruban React DÉSACTIVÉ, retour à la peau CSS
- **Décision de Julien** : le résultat de l'essai étendu (ruban React complet + miroir des autres onglets) a été jugé « catastrophique » ; on revient à la version CSS (interface d'ONLYOFFICE habillée aux recettes de la librairie, voir `03-upstream.md`).
- **Désactivé, pas supprimé** : le code reste dans `apps/web/editor-ui/` (non chargé). Pour le réactiver : remettre la balise `<script src="../../common/main/resources/volcanium-ui/vo-editor-ui.js" defer>` dans `documenteditor/main/index.html(.deploy)`, la règle `body.vo-custom #toolbar > .toolbar { visibility: hidden }` (+ menus visibles) dans `volcanium-ui.less`, `--toolbar-height-controls: 100px` dans le générateur de thème, et rebâtir/copier le bundle dans `scripts/build-web-apps.sh`.
- **Ce que l'essai a montré** (utile si on y revient) : le moteur se pilote bien (`DE.getController('Toolbar').api`), un pont vers les vrais boutons (menus d'origine repositionnés) donne accès à toutes les fonctions (insertion d'un tableau vérifiée), mais le rendu et le comportement (champs numériques, focus clavier, doublons de contrôles, hauteur du ruban, connexion qui saute en test) demandent un vrai travail de conception et de finition par écran, pas un miroir automatique.
- Les nouvelles correspondances d'icônes (`icon-map.json`) et le module `scripts/gen-icon-module.mjs` restent valables.

## Mobile (2026-11-07) : « lire et écrire » comme Word mobile
- **Détection** (`editor-ui/Mobile.tsx`, `useMobile`) : largeur < 640 px, OU pointeur tactile jusqu'à 1024 px ; réactive (rotation, redimensionnement). Au-dessus, la coque de bureau est strictement inchangée. `main.tsx` choisit la coque (`Root`).
- **Coque téléphone** : en-tête de 56 px (retour, titre qui se renomme au toucher, état « Enregistré · Page x/y », Commentaires, « ⋯ »), canevas du moteur pleine largeur, barre de mise en forme EN BAS (une rangée qui défile, cibles de 44 px, jamais de vol de focus : le clavier reste ouvert). Ni onglets, ni ruban, ni règle, ni barre d'état, ni panneau Navigation (tiroir plein écran depuis « ⋯ »).
  - **Texte** : annuler, rétablir, gras, italique, souligné, taille −/+, listes, alignement (cycle), couleur du texte, style de paragraphe, zoom −/+, « + » (tableau 2×2 à 5×5 via `put_Table`, image via `asc_addImage`, lien via la fenêtre d'origine). Page à la largeur de l'écran.
  - **Tableur** : annuler, rétablir, gras, italique, souligné, %, monétaire, format, couleur du texte, remplissage, ajuster la colonne (`asc_autoFitColumnWidth`). Barre des feuilles d'origine gardée (messages d'amont masqués : `body.vo-mobile`).
  - **Présentation** : diapositive pleine largeur (vignettes et notes d'amont fermées), précédente / suivante, annuler, rétablir, gras, italique, taille, nouvelle diapositive ; tiroir « Diapositives » (numéros) et « Présenter » dans « ⋯ ».
  - **Lecture seule** : même coque sans barre d'outils ; « ⋯ » = rechercher, plan, zoom, télécharger, imprimer.
- **Clavier virtuel** : `EditorHost` fait suivre au cadre du moteur la zone VISIBLE (`visualViewport`) : la barre du bas reste au-dessus du clavier. Le moteur reçoit la saisie et le défilement tactiles (gestionnaire tactile d'origine en mode bureau, pincement compris) : vérifié par émulation.
- **App** : liste (icônes Exporter / Importer, « Nouveau », filtres sur une ligne qui défile, tuiles de création masquées, cartes plus basses), tableaux blancs (barre d'en-tête qui ne déborde plus), partage (champ sur toute la largeur), page invité, export. Les fenêtres de la librairie passent déjà en plein écran sous 640 px.
- **Limites** : le moteur n'a pas de mode « reflux » : à la largeur d'un téléphone le texte d'une page A4 est petit (zoom −/+ et pincement). Non vérifié sans vrai appareil : clavier virtuel iOS / Android, pincement, sélecteur de fichier de « Image », tablette tactile (l'émulation ne fournit pas `pointer: coarse`).
- **Outils** : `scripts/ui-shots/office-mobile.mjs` (écrans, `VW`/`VH`/`VTOUCH`/`VTHEME`), `office-mobile2.mjs` (interactions), `office-touch-probe.mjs` (saisie et défilement tactiles). Après un build complet : `docker restart vo-docserver` (ou `./dev.sh engine` s'il est arrêté).
