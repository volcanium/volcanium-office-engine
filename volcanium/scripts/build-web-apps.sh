#!/usr/bin/env bash
# Construit l'interface des éditeurs (upstream/web-apps) -> upstream/web-apps/deploy.
# PRODUCT_VERSION / BUILD_NUMBER DOIVENT correspondre au Document Server utilisé (sinon « L'éditeur est mis à jour » en boucle).
# Le build incrémente build/*.json : on les restaure ensuite (artefacts, pas des modifications).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WA="$ROOT/upstream/web-apps"
export PRODUCT_VERSION="${PRODUCT_VERSION:-10.0.0}" BUILD_NUMBER="${BUILD_NUMBER:-169}"
# Marque : variables lues par le Gruntfile d'amont. APP_COPYRIGHT n'est PAS défini : les notices d'Ascensio System SIA sont conservées (AGPL).
export COMPANY_NAME="Volcanium" APP_TITLE_TEXT="Volcanium" PUBLISHER_NAME="Volcanium Studio" PUBLISHER_URL="https://volcanium.eu" \
  SUPPORT_EMAIL="contact@volcanium.eu" SUPPORT_URL="https://volcanium.eu" SALES_EMAIL="contact@volcanium.eu" \
  HELP_URL="https://volcanium.eu" PUBLISHER_ADDRESS="46 route du Bergeron, 38290 Frontonas, France" PUBLISHER_PHONE="—" SOURCE_URL="${SOURCE_URL:-}" SUGGEST_URL="https://volcanium.eu" DEFAULT_LANG="fr" APP_CUSTOMER_NAME="Volcanium"
cd "$WA/build"
[ -d node_modules ] || npm install --no-audit --no-fund
[ -d sprites/node_modules ] || (cd sprites && npm install --no-audit --no-fund)
(cd sprites && npx grunt >/dev/null)
rm -rf "$WA/deploy"
npx grunt
# Licence : l'aide d'ONLYOFFICE (captures de SON interface, CC BY-SA 4.0), les éditeurs mobiles, intégrés (embed) et formulaires (forms) ne sont PAS livrés
# (nous ouvrons toujours le type « desktop » : voir docs/02-licence.md). Vérification : node scripts/icons/verify-no-ccbysa.mjs
D="$WA/deploy/web-apps/apps"
rm -rf "$D"/*/main/resources/help "$D"/common/main/resources/help "$D"/*/mobile "$D"/common/mobile "$D"/*/embed "$D"/common/embed "$D"/*/forms "$D"/common/forms
# Interface React Volcanium (apps/web/editor-ui) : bundle IIFE copié à côté des ressources communes, chargé par la page du traitement de texte.
(cd "$ROOT/apps/web" && npx vite build -c editor-ui/vite.config.ts >/dev/null)
for d in "$WA/apps/common/main/resources/volcanium-ui" "$WA/deploy/web-apps/apps/common/main/resources/volcanium-ui"; do
  mkdir -p "$d" && cp "$ROOT/apps/web/editor-ui/dist/vo-editor-ui.js" "$d/"
done
cd "$WA" && git checkout -q -- build/common.json build/documenteditor.json build/presentationeditor.json build/spreadsheeteditor.json build/sprites/package-lock.json 2>/dev/null || true
echo "OK : $WA/deploy (version $PRODUCT_VERSION build $BUILD_NUMBER)"
