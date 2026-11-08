# Amont ONLYOFFICE : constats (2026-11-06, lus dans le code cloné)

Clones superficiels (`--depth 1`) dans `upstream/` : `web-apps` (f79972a4, 2026-10-15), `sdkjs` (9d21388, 2026-10-15), `DocumentServer` (c4ad98d, 2026-10-26). Tous sous AGPL v3 (fichier LICENSE présent). `DocumentServer` est un dépôt « méta » : `server`, `core`, `core-fonts`, `dictionaries`, `document-formats`, `sdkjs`, `web-apps` sont des sous-modules, **non récupérés** (dossiers vides pour `server` et `core`).

## Découpage
| Dépôt | Rôle | Taille |
|---|---|---|
| `web-apps` | interface des éditeurs (documenteditor, spreadsheeteditor, presentationeditor, pdfeditor, visioeditor, `common`, `api`) | 864 Mo |
| `sdkjs` | moteur JS (word, cell, slide, pdf, visio, common) : rendu canvas, mise en page, modèle | 177 Mo |
| `DocumentServer/server` | serveur Node (sauvegarde, collaboration, conversions) : à cloner | – |
| `DocumentServer/core` | convertisseur C++ (formats OOXML/ODF/anciens) : à cloner, gros build | – |

## Interface (web-apps)
- Bureau : Backbone + jQuery + RequireJS + Underscore + **Less** (build Grunt, `build/`). Pas de React.
- Mobile : **Framework7 React** (`vendor/framework7-react`), donc une UI mobile séparée de la version bureau.
- Thèmes : `apps/common/main/resources/less/colors-table-*.less` (classic, dark, dark-contrast, gray, night, white), `color-tokens.less`, et un mécanisme `themes/themes.json` + exemples `full-theme-*.json.example`. **Point d'entrée naturel pour appliquer la charte Volcanium sans toucher au cœur.**
- Branding en dur : titres HTML (`ONLYOFFICE Document Editor`), `about.less`, images `resources/img`, sprites. À inventorier avant le rebranding.
- Icônes : sprites (`build/sprites`, `resources/img`) : CC BY-SA 4.0, à remplacer ou à attribuer.

## Conséquence pour le projet
Deux voies pour l'UI des éditeurs (à trancher) : (A) re-thématiser via Less/thèmes en gardant Backbone ; (B) réécrire progressivement l'UI en s'inspirant de la librairie Volcanium (décision : s'en inspirer, pas l'utiliser telle quelle). A est bien moins risquée pour fusionner l'amont ; B demande de réécrire un énorme code d'interface.

## À vérifier
- Prérequis de build réels (Node, versions) : `web-apps/build/package.json` n'a rien d'autre que Grunt ; la chaîne complète est dans le dépôt `build_tools` (non cloné).
- Licences des dépendances `vendor/` : voir `3DPARTY.md` de chaque dépôt avant toute redistribution.

## Thème Volcanium (A) : fait le 2026-11-06
- Nouveau fichier `web-apps/apps/common/main/resources/less/colors-table-volcanium.less` : surcharge `.theme-night` (sombre) et `.theme-white` (clair), les deux thèmes par défaut. Surfaces, bordures, textes = tokens `vc-*` ; accent = variables Less `@vo-bg-*` (fond de bouton, texte blanc dessus) et `@vo-fg-*` (focus, lien, sélection).
- Accent par éditeur, défini juste avant l'import dans `apps/{documenteditor,spreadsheeteditor,presentationeditor}/main/resources/less/app.less` (4 lignes ajoutées chacun, fins de ligne CRLF conservées) : texte = bleu, tableur = vert, présentation = rouge (palette `color-tokens.less` d'ONLYOFFICE).
- `build/Gruntfile.js` : la tâche par défaut ne construit plus `pdfeditor` ni `visioeditor` (tâches conservées, lançables à la main). Conséquence : pas de lecteur PDF/formulaires ; à rouvrir si besoin.
- Vérifié : le fichier compile avec lessc (valeurs attendues). Pas vérifié : rendu réel (le build complet exige les sprites générés, `build_tools`) ; la couleur de l'en-tête (accent) est un choix à juger à l'écran.
- Pas encore fait : version mobile (Framework7, `apps/*/mobile`), écrans de chargement (`skeleton` dans `Themes.js`, couleurs en dur), polices DM Sans/Rammetto, icônes (CC BY-SA), retrait du branding ONLYOFFICE.

## Premier build de web-apps seul (2026-11-06)
- Réalisé sur macOS, Node 24 : `cd upstream/web-apps/build && npm install`, puis `cd sprites && npm install && npx grunt` (sprites d'icônes), puis `npx grunt` dans `build/` : OK pour les 3 éditeurs (bureau) ; sortie dans `upstream/web-apps/deploy/` (ignoré par git, 553 Mo avec sdkjs). Les scripts d'installation de binaires (imagemin, phantomjs) sont bloqués par npm : sans effet sur le build.
- Le build **incrémente** `build/*.json` (numéro de build) et reformate des lignes : `git checkout build/*.json` après chaque build. Il génère aussi `apps/*/mobile/dist` et `mobile/index.html` (non suivis, construits par la même tâche).
- Le CSS produit contient bien notre thème (accents #306AD9 / #00703E / #D01C28 en sombre, #1B55C1 / #00703E / #D01C28 en clair), placé après les thèmes d'origine.
- **Rendu non jugeable pour l'instant** : sans Document Server (`server` + `core`), l'éditeur reste sur l'écran de chargement (squelette gris aux couleurs d'amont écrites en dur dans `Themes.js`, à re-thématiser). L'interface réelle n'apparaît qu'à l'ouverture d'un document. Capture faite en Chrome sans fenêtre : `scratchpad` seulement.

## Document Server de dev + rendu réel (2026-11-06)
- Docker Desktop (VM 8 Go) : `docker compose -f docker/compose.dev.yml up -d` lance l'image officielle `onlyoffice/documentserver` (10.0.0-169, arm64) sur http://localhost:8089 (8081 est pris par Volcanium Deploy), JWT désactivé (dev seulement). Notre `web-apps` construit est monté par-dessus celui de l'image (`apps/common` + les 3 éditeurs). **Après chaque rebuild, recréer le conteneur** (`up -d --force-recreate`) : `rm -rf deploy` casse les montages.
- Page de test : `docker/test/` (`python3 -m http.server 5270` dans ce dossier ; `index.html?t=docx|xlsx|pptx&theme=theme-night|theme-white`). Captures dans `docs/captures/`.
- **Version** : `master` d'ONLYOFFICE est une version de dev (99.99.99), incompatible avec l'image. Nos clones sont passés sur le tag **`v10.0.0.169`** (celui de l'image). Le build exige `PRODUCT_VERSION=10.0.0 BUILD_NUMBER=169` (sinon « L'éditeur est mis à jour » en boucle) : `scripts/build-web-apps.sh` s'en charge et restaure `build/*.json`. Nos modifications sont sauvegardées en patch : `docs/volcanium-web-apps.patch` (à réappliquer avec `git apply` lors d'un changement de version). Le clone `sdkjs` est encore sur master : à passer sur le même tag avant toute modification.
- Rendu constaté : en-tête bleu (texte), vert (tableur), rouge (présentation), surfaces Volcanium sombres et claires. Le logo « ONLYOFFICE » est encore là.
- Le build lit des variables d'environnement de rebranding (`COMPANY_NAME`, `APP_TITLE_TEXT`, `PUBLISHER_*`, `APP_COPYRIGHT`, `HELP_URL`, `OO_BRANDING`…) : c'est le mécanisme prévu pour le rebranding (à étudier ; les mentions d'origine obligatoires restent à conserver).

## Habillage Volcanium (2026-11-06) : ce qui est fait et comment le refaire
- **Reproduire** : `python3 scripts/gen-volcanium-theme.py` (thème, à relancer après une mise à jour d'amont), `scripts/gen-logos.py` (logos), `cd scripts/icons && npm install --ignore-scripts && rm -rf node_modules/svg-outline-stroke/node_modules/sharp && node gen-icons.mjs && node gen-galleries.mjs && node gen-misc-images.mjs` (icônes, galeries, autres images ; contrôle : `node verify-no-ccbysa.mjs`), puis `scripts/build-web-apps.sh`. Les modifications de texte (app.less, Gruntfile, index.html, About.js) sont dans `docs/volcanium-web-apps.patch` (`git apply` sur un clone propre de la même version).
- **Thème** : généré à partir des thèmes modernes d'amont (structure conservée) : `@neutral-*` -> neutres Volcanium, `@blue-*` -> accent de l'éditeur (bleu / vert / rouge). En-tête neutre ; l'accent n'apparaît que sur l'onglet actif (liseré), les boutons pleins (teinte 500), le focus, les liens, la sélection.
- **DA** : police DM Sans (UI), rayons 3/5/7 px comme la librairie, logos « Volcanium Doc / Table / Présentation », titres d'onglet idem, écran de chargement aux surfaces Volcanium.
- **Marque** : variables d'environnement du build (nom, éditeur, adresse du siège repris de `legal/`, contact `contact@volcanium.eu`). Téléphone : « — » (aucun numéro connu).
- **Pas fait** : disposition (la structure d'écran reste celle d'ONLYOFFICE : ruban, barres latérales ; la refaire à la manière de la Sidebar Volcanium = choix B, gros chantier) ; 398 icônes ; galeries de formes/graphiques ; langues autres que fr/en (fi, bg, ko, vi, lv, pl contiennent encore « ONLYOFFICE ») ; mobile ; `index_internal.html` du tableur.

## Refonte de l'interface, 2e passe (2026-11-06)
- **Icônes** : PNG rendus depuis le TRAIT d'origine de Tabler (net, 1,5 px), SVG convertis en formes pleines avec `fill-rule="evenodd"` (le CSS d'amont colorie par `fill`). La 1re version convertissait aussi les PNG en formes pleines : rendu « dessin ». Voir `scripts/icons/gen-icons.mjs`.
- **Onglets** : « Collaboration » et « Modules complémentaires » masqués par défaut (`common/main/lib/controller/LayoutManager.js`, liste `_vo_hidden`) ; ordre : Accueil, Insertion, Mise en page, Références, Affichage, Protection, Dessiner (index modifiés dans `app/controller/Toolbar.js` des 3 éditeurs). Les commentaires et le chat restent dans la barre latérale gauche.
- **Style** : `common/main/resources/less/volcanium-ui.less` (écrit à la main, importé en dernier) : onglets en pastilles (actif = teinte de l'accent), en-tête plate, titre du document en pastille, ruban en carte (rayon 12, liseré fin), boutons/champs/menus (rayons 5/7/9), fenêtres modales sur le modèle de `Modal` de la librairie (rayon 12, titre à gauche, croix ronde, trait, voile + flou). Les « popups » sont donc la recette visuelle de la librairie recréée en CSS : les fenêtres d'ONLYOFFICE (Backbone) ne peuvent pas utiliser les composants React.
- **Limite** : la structure reste celle d'ONLYOFFICE (en-tête, onglets, ruban à groupes, barres latérales). Aller plus loin (ruban plat sur une ligne comme Notes, barre latérale façon `Sidebar`, volets à la place des fenêtres) demande de modifier les gabarits (`Toolbar.js`, `Viewport.js`, etc.) : plus risqué pour les mises à jour d'amont.
- **Vérifié en capture** : onglets, ruban, barres, boîte « nom de collaboration » (fenêtre). **Non vérifié** : menus déroulants ouverts, les autres fenêtres de réglages (le navigateur sans fenêtre ne clique pas).

## Menus, listes et fenêtres, 3e passe (2026-11-06)
- **Constat** : vérifié en vrai (Chrome piloté par `scripts/ui-shots`, qui ouvre menus et fenêtres) ; la 2e passe laissait des menus serrés (lignes de 26 px), des fenêtres au titre centré avec boutons « OK / Annuler » à gauche, un menu « Fichier » sans pastille active.
- **Menus déroulants** (recette du `Popover` de Notes) : rayon 9 px, liseré fin, ombre `shadow-xl`, marge intérieure 6 px, lignes de 32 px en pastille (rayon 7 px), survol en voile, état coché en couleur d'accent, séparateurs inset. Le décalage horizontal d'amont (20 px) est conservé : il sert aux icônes et coches.
- **Fenêtres** (recette de `Modal`) : rayon 12, titre à gauche 17 px, croix ronde, trait de séparation, voile avec flou, boutons alignés à droite dans l'ordre Annuler puis OK (la hauteur d'en-tête passe à 52 px : le calcul de hauteur d'amont lit cette valeur en CSS, rien à modifier en JS).
- **Menu « Fichier »** : colonne de gauche façon `Sidebar` (lignes arrondies, élément actif teinté).
- **Pas encore** : la ligne sélectionnée de la liste des polices reste grise (autre composant) ; les nombreuses autres fenêtres de réglages (paragraphe, tableau, image…) n'ont pas toutes été vérifiées une par une ; les listes de formes/graphiques gardent leurs vignettes d'amont ; les curseurs, onglets internes des fenêtres et le sélecteur de couleurs n'ont pas été retouchés.

## 4e passe : recettes EXACTES de la librairie (2026-11-06)
- **Pourquoi** : les passes précédentes imitaient « l'esprit » ; comparaison avec la modale « Nouveau message » de Mail : titre de 24 px, marges de 28 px, champs sobres, anneau de focus orange, boutons « primary » neutres, onglets en soulignement. Les couleurs étaient fausses (accent bleu/vert/rouge partout, boutons pleins colorés).
- **Jetons** : `theme-night` / `theme-white` définissent maintenant les `--vc-*` EXACTS de `index.css` de la librairie (main #ff714d / #d4400f, line .08/.14 ou .14/.28, veil, container, back, text…), et les variables d'ONLYOFFICE (fonds, bordures, survol, focus, liens, boutons) pointent dessus (`scripts/gen-volcanium-theme.py`).
- **Couleurs** : l'orange de marque est l'accent interactif (focus, coches, liens, état actif des boutons et des barres latérales) comme dans les autres apps. La couleur d'éditeur (bleu / vert / rouge, `--vo-edit`) ne sert plus qu'au trait de l'onglet actif (réglable en une variable).
- **Recettes appliquées** (voir l'en-tête de `volcanium-ui.less`) : Button primary/secondaire/accent, Input, Checkbox, Tabs (soulignement), SegmentedControl (`.grouped-buttons`), Modal (76 px d'en-tête, titre 24 px, croix ronde, marges 28 px, boutons à droite : Annuler puis OK), Popover (menus), Tooltip, IconButton (actif = orange/20).
- **Limites honnêtes** : c'est une « peau » CSS sur l'interface d'ONLYOFFICE (Backbone), pas une interface réécrite de zéro. Les dialogues dont les positions sont codées en pixels gardent leur disposition ; les nombreux autres écrans (paramètres avancés à onglets, sélecteur de couleurs, curseurs, listes à vignettes) n'ont pas tous été revus. Une réécriture « de zéro » (composants React de la librairie à la place de l'UI Backbone) revient à reconstruire les 3 éditeurs autour du moteur `sdkjs` : possible, mais c'est un autre projet (plusieurs mois) et on perd la fusion facile avec l'amont.
