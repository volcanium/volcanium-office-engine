# Licence et conformité (non juridique : relecture par un avocat open source recommandée)

## Deux dépôts (décision 2026-11-08)
- **`volcanium-office-engine`** (github.com/volcanium/volcanium-office-engine) = le **MOTEUR** (interface des éditeurs texte/tableur/présentation, version modifiée d'ONLYOFFICE web-apps) : **doit rester libre, AGPL v3, même licence que l'original**. C'est l'adresse à mettre dans `SOURCE_URL` (build) et `VITE_SOURCE_URL`. Dépôt PRIVÉ pour l'instant : le **passer en public avant toute mise en ligne** (AGPL §13) après validation de la question `@volcanium/volcanium-components` ci-dessous. `upstream/web-apps` est son clone de travail (remote `origin` = ce dépôt, remote `onlyoffice` = amont).
- **`volcanium-office`** (ce dépôt) = la **page d'accueil et l'API** (liste des fichiers, partage, Drive, comptes) : ne contient aucun code du moteur (`upstream/` ignoré). Les fichiers qui construisent le moteur (scripts, Dockerfile, coque `editor-ui`) restent ICI (source de vérité) et sont copiés dans le moteur par `scripts/sync-engine-tools.sh` (à relancer après toute modification, puis commiter le dépôt du moteur).

- **Moteur d'édition** : AGPL v3 (dépôt `volcanium-office-engine`). **Accueil et API (ce dépôt)** : propriétaires, `license: UNLICENSED` (décision 2026-11-08 : programme séparé du moteur, joint par réseau, sans code d'ONLYOFFICE ; à faire confirmer par un avocat). La page À propos le dit. Lien « Code source » : page À propos, variable `VITE_SOURCE_URL` **à renseigner avant toute mise en ligne** (AGPL §13).
- Mentions d'origine (ONLYOFFICE / Ascensio System SIA, version modifiée, licence) : `pages/AboutPage.tsx`.
- Marques : aucun logo ni nom ONLYOFFICE dans l'UI hors mention d'origine. Voir https://www.onlyoffice.com/trademark-policy
- Icônes/images ONLYOFFICE (CC BY-SA 4.0) : remplacées (voir « Icônes, polices, logos ») sauf 5 planches matricielles listées là. Signaler toute reprise.
- Question ouverte (avocat) : articulation des termes additionnels §7 d'Ascensio avec un branding entièrement remplacé.

## Dépendances ajoutées (licences)
react, react-dom, react-router-dom, vite, tailwindcss, @tabler/icons-react : MIT. typescript : Apache-2.0. @volcanium/volcanium-components : propriété Volcanium (service/UI séparés, voir règle 8 : à faire valider côté AGPL).

- Tableaux blancs (fusion de Whiteboard, 2026-11-07) : `@excalidraw/excalidraw` (MIT ; polices copiées sur notre serveur, aucun CDN, IA texte-vers-diagramme désactivée), `qrcode` (MIT), `ws` (MIT), `@types/qrcode`, `@types/ws` (MIT). Compatibles AGPL v3.

## Icônes, polices, logos (2026-11-06)
- **Icônes et images des éditeurs (2026-11-08) : plus aucune image d'ONLYOFFICE (CC BY-SA 4.0) n'est livrée dans le build, sauf la liste « reste » ci-dessous.** Tout est re-dessiné par des scripts d'`scripts/icons/` (reproductibles) :
  - `gen-icons.mjs` + `icon-map.json` + `extra-icons.mjs` : icônes de barre d'outils (721 noms, toutes échelles 1x à 2,5x, tailles normale/big/huge, thèmes v1/v2). **Tabler Icons (MIT)** choisies par sens ; chemins de déplacement d'animation et deux diagonales de bordure : **tracés originaux** générés par programme (aucune source tierce).
  - `gen-galleries.mjs` : galeries de formes (172), de graphiques (45) et d'équations (12) : formes et graphiques **dessinés par programme** (géométrie propre, mêmes identifiants de symbole) ; équations : Tabler (MIT).
  - `gen-misc-images.mjs` : logos et favicons (chevron Volcanium), icônes de format de fichier, modèles, styles de trait / d'extrémité de ligne, motifs, dégradés, puces, symboles divers : tracés originaux (+ Tabler MIT pour les pictogrammes).
  - Bibliothèques sources effectivement utilisées : **Tabler Icons 3.50 (MIT)**. Aucune autre (pas de Lucide, Phosphor, Material, Font Awesome). Outils (non livrés) : `svg-outline-stroke` (MIT, vectorisation par potrace : GPL-2.0 **uniquement comme outil de développement**, son résultat est notre dessin), `sharp` (Apache-2.0).
  - **Aide d'ONLYOFFICE** (`resources/help`, captures de SON interface, ~390 Mo), **éditeurs mobiles, intégrés (embed) et formulaires (forms)** : retirés du build (`scripts/build-web-apps.sh`) ; l'API n'ouvre que le type « desktop ».
  - Contrôle : `node scripts/icons/verify-no-ccbysa.mjs` compare par hachage chaque image du build et chaque image source des éditeurs livrés aux images d'amont.
  - **Reste d'amont (CC BY-SA 4.0, attribution + même partage à respecter tant qu'ils ne sont pas redessinés)** : planches matricielles dont la grille de cellules est définie ailleurs dans le CSS d'amont : `common-controls*.png` (pictos de contrôles), `math*.png` (galerie d'équations), `contents*.png`, `text_styles.png`, `themes.png`. Non livrés mais présents dans l'arbre `upstream/` : `pdfeditor`, `visioeditor` (retirés du build), `vendor/`, `test/`.
  - Les mentions d'origine et la page À propos restent celles de la section suivante.
- **Polices** : DM Sans (SIL OFL 1.1), intégrée au CSS. Rammetto One (SIL OFL 1.1), uniquement pour tracer les logos.
- **Logos** : chevron Volcanium + nom, générés par `scripts/gen-logos.py`.
- **Outils de développement (non livrés)** : @tabler/icons (MIT), svg-outline-stroke (MIT), sharp (Apache-2.0), fonttools (MIT).
- **Mentions d'origine** : boîte « À propos » (`common/main/lib/view/About.js`) : ONLYOFFICE / Ascensio System SIA, version modifiée, licence AGPL v3, lien du code source (variable de build `SOURCE_URL`, **à renseigner avant toute mise en ligne**). Les en-têtes de copyright d'amont sont conservés (`APP_COPYRIGHT` non défini).
