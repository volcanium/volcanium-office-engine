#!/usr/bin/env bash
# Construit (et pousse, avec --push) l'image du moteur d'edition : ONLYOFFICE Document Server 10.0.0 + notre interface (upstream/web-apps/deploy).
# L'interface (500+ Mo, clone d'amont) n'est PAS dans le depot : cette image se construit sur une machine qui a `upstream/` (donc PAS dans la CI de GitHub).
#   scripts/build-docserver-image.sh                 # construit ghcr.io/volcanium/office-docserver:<sha ou date> et :latest en local
#   scripts/build-docserver-image.sh --push          # + docker push, puis prevenir Internal (voir docs/05-deploiement.md §Moteur)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY="$ROOT/upstream/web-apps/deploy"
REPO="${REPO:-ghcr.io/volcanium/office-docserver}"
[ -d "$DEPLOY/web-apps/apps/common" ] || { echo "interface absente : lancer scripts/build-web-apps.sh d'abord" >&2; exit 1; }
[ -f "$DEPLOY/web-apps/apps/common/main/resources/volcanium-ui/vo-editor-ui.js" ] || { echo "coque React absente de $DEPLOY (relancer scripts/build-web-apps.sh)" >&2; exit 1; }
TAG="${TAG:-$(date +%Y%m%d-%H%M)}"
docker build -f "$ROOT/docker/docserver/Dockerfile" -t "$REPO:$TAG" -t "$REPO:latest" "$DEPLOY"
echo "OK : $REPO:$TAG"
if [ "${1:-}" = "--push" ]; then docker push "$REPO:$TAG" && docker push "$REPO:latest"; fi
