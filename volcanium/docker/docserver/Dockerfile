# syntax=docker/dockerfile:1
# Moteur d'edition de PRODUCTION d'Office : l'image officielle ONLYOFFICE Document Server (AGPL v3, version EPINGLEE : 10.0.0 = build 169, la meme que le dev et que
# `scripts/build-web-apps.sh`, sinon « L'editeur est mis a jour » en boucle) + NOTRE interface (web-apps construit : theme Volcanium, coque React, icones).
# Pas de build dans cette image : l'interface se construit avant (`scripts/build-web-apps.sh` -> upstream/web-apps/deploy, 500+ Mo, hors depot) puis :
#   scripts/build-docserver-image.sh            (contexte = upstream/web-apps/deploy)
# Le code source correspondant (AGPL §13) : SOURCE_URL de docs/05-deploiement.md ; amont : github.com/ONLYOFFICE/DocumentServer.
ARG DS_VERSION=10.0.0
FROM onlyoffice/documentserver:${DS_VERSION}

# Notre interface par-dessus celle de l'image (memes dossiers que docker/compose.dev.yml).
COPY web-apps/apps/common /var/www/onlyoffice/documentserver/web-apps/apps/common
COPY web-apps/apps/documenteditor /var/www/onlyoffice/documentserver/web-apps/apps/documenteditor
COPY web-apps/apps/spreadsheeteditor /var/www/onlyoffice/documentserver/web-apps/apps/spreadsheeteditor
COPY web-apps/apps/presentationeditor /var/www/onlyoffice/documentserver/web-apps/apps/presentationeditor

# Production : JWT OBLIGATOIRE (JWT_ENABLED + JWT_SECRET fournis par la pile, jamais ici) ; l'application de demonstration (ds:example) est arretee par defaut
# dans l'image et ne doit jamais etre demarree ; la pile bloque en plus /example, /info, /admin et /welcome au niveau de Traefik.
ENV JWT_ENABLED=true \
    JWT_HEADER=Authorization \
    JWT_IN_BODY=false \
    USE_UNAUTHORIZED_STORAGE=false \
    WOPI_ENABLED=false \
    GENERATE_FONTS=false
# Les appels vers notre API passent par le reseau Docker (adresses privees) : autorises, car la configuration des documents est SIGNEE (JWT) par notre serveur.
ENV ALLOW_PRIVATE_IP_ADDRESS=true \
    ALLOW_META_IP_ADDRESS=false
LABEL org.opencontainers.image.title="Volcanium Office Document Server" \
      org.opencontainers.image.description="ONLYOFFICE Document Server (AGPL v3) avec l'interface Volcanium" \
      org.opencontainers.image.licenses="AGPL-3.0-or-later"
