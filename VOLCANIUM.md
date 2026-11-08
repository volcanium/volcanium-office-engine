# Volcanium Office : moteur d'édition (version modifiée d'ONLYOFFICE web-apps)

Ce dépôt est le **moteur** de Volcanium Office : l'interface des éditeurs de **documents texte, tableurs et présentations**, dérivée de [ONLYOFFICE web-apps](https://github.com/ONLYOFFICE/web-apps)
(© Ascensio System SIA), **modifiée par Volcanium Studio**. Il reste **libre, sous la même licence que l'original : GNU AGPL v3** (fichier `LICENSE.txt`, termes additionnels de l'article 7 d'Ascensio inclus).
La page d'accueil et l'API de Volcanium Office (liste des fichiers, partage, Drive, comptes) sont un dépôt **séparé** (`volcanium-office`), qui ne contient aucun code du moteur.

## D'où vient le code
| Composant | Origine | État |
|---|---|---|
| `web-apps` (ce dépôt, racine) | ONLYOFFICE/web-apps `493e500c` (2026-10-15) | **modifié** : premier commit = import fidèle, second commit = nos modifications |
| `sdkjs` | ONLYOFFICE/sdkjs `9d21388` | **non modifié** (cloné tel quel pour la construction) |
| Document Server (`server`, `core`) | ONLYOFFICE/DocumentServer `c4ad98d` (image `onlyoffice/documentserver` 10.0.0) | **non modifié** |

## Ce que Volcanium a modifié (voir `git log`, `volcanium/docs/`)
- thème Volcanium (`apps/common/main/resources/less/colors-table-volcanium.less`, accents par éditeur) ;
- icônes, galeries, logos et images **redessinés** (aucune image ONLYOFFICE CC BY-SA 4.0 livrée hors liste documentée dans `volcanium/docs/02-licence.md`) ;
- marque : variables de build, boîte « À propos » (mentions d'origine conservées), pas de nom ni de logo ONLYOFFICE hors mentions d'origine ;
- retrait de l'aide, des éditeurs mobiles, intégrés et formulaires du build livré ; `pdfeditor` et `visioeditor` non construits par défaut.

## Construire (AGPL §6 : scripts de compilation)
Tout est dans `volcanium/` (copie synchronisée depuis le dépôt `volcanium-office`, qui reste la source de vérité de ces fichiers) :
- `volcanium/scripts/build-web-apps.sh` : construit l'interface (Grunt) dans `deploy/` ; `PRODUCT_VERSION`/`BUILD_NUMBER` doivent correspondre au Document Server ;
- `volcanium/scripts/icons/` et `gen-*.{mjs,py}` : régénèrent icônes, galeries, logos et thème ; `verify-no-ccbysa.mjs` contrôle l'absence d'images d'amont ;
- `volcanium/docker/docserver/` : image du moteur (Document Server + notre interface) ;
- `volcanium/editor-ui/` : coque React injectée dans la page du traitement de texte (dépend de `@volcanium/volcanium-components`, voir `volcanium/docs/02-licence.md` : point en cours de validation juridique).

## Code source (AGPL §13)
Les utilisateurs d'une instance publique de Volcanium Office doivent pouvoir obtenir ce code source : l'adresse de ce dépôt est la valeur de `SOURCE_URL` du build (lien « Code source » de la boîte « À propos »).

Marques : ONLYOFFICE est une marque d'Ascensio System SIA ; Volcanium Office n'est ni affilié ni approuvé par Ascensio System SIA.
