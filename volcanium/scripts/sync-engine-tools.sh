#!/usr/bin/env bash
# Copie dans le dépôt du MOTEUR (upstream/web-apps -> volcanium-office-engine, AGPL v3) tout ce qui sert à le CONSTRUIRE et à le régénérer (AGPL §6 : « scripts qui
# contrôlent la compilation ») : scripts de build et de génération des icônes/logos/thème, Dockerfile de l'image du moteur, coque React injectée dans l'éditeur, documents de licence.
# Source de vérité : CE dépôt (Office). Relancer après toute modification de ces fichiers, puis commiter/pousser le dépôt du moteur (voir docs/05-deploiement.md).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/upstream/web-apps/volcanium"
mkdir -p "$OUT/scripts" "$OUT/docker" "$OUT/docs"
R=(rsync -a --delete --exclude node_modules --exclude dist --exclude .DS_Store)
"${R[@]}" --exclude ui-shots "$ROOT/scripts/" "$OUT/scripts/"
"${R[@]}" "$ROOT/docker/docserver/" "$OUT/docker/docserver/"
"${R[@]}" "$ROOT/apps/web/editor-ui/" "$OUT/editor-ui/"
cp "$ROOT/docs/02-licence.md" "$ROOT/docs/03-upstream.md" "$ROOT/docs/04-interface-maison.md" "$ROOT/docs/volcanium-web-apps.patch" "$OUT/docs/"
echo "OK : $OUT"
