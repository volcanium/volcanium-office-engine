#!/usr/bin/env python3
"""Génère colors-table-volcanium.less à partir des thèmes modernes d'ONLYOFFICE (theme-night / theme-white).

Principe : on garde la STRUCTURE d'amont (toutes ses variables) et on remplace seulement ses couleurs de base :
  @neutral-*  -> neutres Volcanium (tokens vc-*)
  @blue-*     -> accent de l'éditeur (@vo-*, défini avant l'import dans le app.less de chaque éditeur)
Ainsi une mise à jour d'amont qui ajoute une variable est reprise en relançant ce script.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LESS = ROOT / "upstream/web-apps/apps/common/main/resources/less"

NEUTRAL = {
    "night": {"white": "#ffffff", "50": "#f4f4f5", "100": "#e4e4e6", "150": "#d4d4d8", "200": "#c9c9cc", "300": "#a1a1a6",
              "400": "#8c8c93", "500": "#4a4a50", "550": "#3a3a3f", "600": "#242427", "700": "#161617", "800": "#131314", "900": "#0f0f10"},
    "white": {"white": "#ffffff", "50": "#f7f7f8", "100": "#f0f0f2", "150": "#e4e4e7", "200": "#d3d3d8", "300": "#b4b4ba",
              "400": "#8e8e95", "500": "#6e6e74", "550": "#5f5f65", "600": "#4f4f55", "700": "#3a3a3f", "800": "#2a2a2e", "900": "#1f1f22"},
}

HEAD = """// Volcanium Office : habillage aux couleurs de la suite Volcanium (tokens de @volcanium/volcanium-components).
// FICHIER GÉNÉRÉ par scripts/gen-volcanium-theme.py à partir de colors-table-night.less / colors-table-white.less : ne pas l'éditer à la main.
// Ajouté le 2026-11-06 par Volcanium (projet basé sur ONLYOFFICE, Ascensio System SIA, AGPL v3).
// Couleurs d'origine remplacées par : neutres Volcanium (@neutral-*) et accent de l'éditeur (@blue-* -> @vo-*, défini avant l'import dans app.less).
@import "color-tokens.less";

// Police de marque (SIL OFL 1.1), intégrée au CSS : aucun appel à un tiers.
@font-face { font-family: "DM Sans"; font-style: normal; font-weight: 100 1000; font-display: swap;
  src: data-uri("font/woff2", "../fonts/DMSans-normal-latin.woff2") format("woff2"); }
@font-face { font-family: "DM Sans"; font-style: italic; font-weight: 100 1000; font-display: swap;
  src: data-uri("font/woff2", "../fonts/DMSans-italic-latin.woff2") format("woff2"); }

"""

# Jetons EXACTS de @volcanium/volcanium-components (src/index.css) + surcharge des variables d'ONLYOFFICE qui en dépendent.
TOKENS = {
    "night": dict(main="#ff714d", on_main="#ffffff", back="#0f0f10", container="#161617", text="#f4f4f5", secondary="#e4e4e6",
                  line="rgba(255, 255, 255, 0.08)", line_strong="rgba(255, 255, 255, 0.14)", veil="rgba(255, 255, 255, 0.04)",
                  veil_strong="rgba(255, 255, 255, 0.08)", danger="#f87171", success="#4ade80", edit="@ed-400"),
    "white": dict(main="#d4400f", on_main="#ffffff", back="#f7f7f8", container="#ffffff", text="#1f1f22", secondary="#1f1f22",
                  line="rgba(28, 27, 26, 0.14)", line_strong="rgba(28, 27, 26, 0.28)", veil="rgba(28, 27, 26, 0.05)",
                  veil_strong="rgba(28, 27, 26, 0.09)", danger="#dc2626", success="#15803d", edit="@ed-600"),
}


# Barres de défilement du moteur (dessinées sur canevas) : discrètes, sans flèches ni motifs, comme la librairie (pastille fine, survol plus marqué).
# Le moteur ne lit que le canal ROUGE de ces couleurs (gris) : la flèche prend celle de son bouton (invisible), le motif celle de la pastille (invisible), le contour aussi.
SCROLL = {
    "night": {"bg": "#0f0f10", "thumb": "#3b3b3e", "hover": "#5e5e63", "press": "#76767c"},
    "white": {"bg": "#f7f7f8", "thumb": "#cdcdd2", "hover": "#a2a2a9", "press": "#85858c"},
}


def scroll(theme: str) -> str:
    c = SCROLL[theme]
    return f"""
        // ── Barres de défilement discrètes ──
        --canvas-scroll-thumb: {c['thumb']};
        --canvas-scroll-thumb-hover: {c['hover']};
        --canvas-scroll-thumb-pressed: {c['press']};
        --canvas-scroll-thumb-border: {c['thumb']};
        --canvas-scroll-thumb-border-hover: {c['hover']};
        --canvas-scroll-thumb-border-pressed: {c['press']};
        --canvas-scroll-arrow: {c['thumb']};
        --canvas-scroll-arrow-hover: {c['hover']};
        --canvas-scroll-arrow-pressed: {c['press']};
        --canvas-scroll-thumb-target: {c['thumb']};
        --canvas-scroll-thumb-target-hover: {c['hover']};
        --canvas-scroll-thumb-target-pressed: {c['press']};
"""


def foot(theme: str) -> str:
    t = TOKENS[theme]
    return scroll(theme) + f"""
        // ── Jetons Volcanium (librairie) ──
        --vc-main: {t['main']};
        --vc-on-main: {t['on_main']};
        --vc-back: {t['back']};
        --vc-container: {t['container']};
        --vc-text: {t['text']};
        --vc-secondary: {t['secondary']};
        --vc-line: {t['line']};
        --vc-line-strong: {t['line_strong']};
        --vc-veil: {t['veil']};
        --vc-veil-strong: {t['veil_strong']};
        --vc-danger: {t['danger']};
        --vc-success: {t['success']};
        // Couleur de l'éditeur (bleu / vert / rouge) : réservée au petit trait de l'onglet actif et au repère d'en-tête
        --vo-edit: {t['edit']};
        --vo-accent: var(--vc-main);
        --vo-accent-soft: color-mix(in srgb, var(--vc-main) 20%, transparent);
        // ── Variables d'ONLYOFFICE branchées sur les jetons ──
        --background-normal: var(--vc-container);
        --background-toolbar: var(--vc-container);
        --background-toolbar-tab: var(--vc-container);
        --background-statusbar: var(--vc-container);
        --background-toolbar-additional: var(--vc-container);
        --background-pane: var(--vc-back);
        --background-contrast-popover: var(--vc-container);
        --border-divider: var(--vc-line);
        --border-toolbar: var(--vc-line);
        --border-regular-control: var(--vc-line-strong);
        --border-contrast-popover: var(--vc-line-strong);
        --border-control-focus: color-mix(in srgb, var(--vc-main) 60%, transparent);
        --border-preview-hover: var(--vc-line-strong);
        --border-preview-select: var(--vc-main);
        --border-button-pressed-focus: var(--vc-main);
        --highlight-button-hover: var(--vc-veil-strong);
        --highlight-button-pressed: var(--vc-line-strong);
        --highlight-button-pressed-hover: var(--vc-line-strong);
        --highlight-text-select: color-mix(in srgb, var(--vc-main) 35%, transparent);
        --text-normal: var(--vc-text);
        --text-normal-pressed: var(--vc-text);
        --text-link: var(--vc-main);
        --text-link-hover: var(--vc-main);
        --text-link-active: var(--vc-main);
        --text-link-visited: var(--vc-main);
        --background-accent-button: var(--vc-main);
        --background-primary-dialog-button: var(--vc-veil-strong);
        --highlight-primary-dialog-button-hover: var(--vc-line-strong);
        --highlight-primary-dialog-button-pressed: var(--vc-line-strong);
        --highlight-header-tab-underline-document: var(--vo-edit);
        --highlight-header-tab-underline-spreadsheet: var(--vo-edit);
        --highlight-header-tab-underline-presentation: var(--vo-edit);
        --highlight-toolbar-tab-underline-document: var(--vo-edit);
        --highlight-toolbar-tab-underline-spreadsheet: var(--vo-edit);
        --highlight-toolbar-tab-underline-presentation: var(--vo-edit);
"""


FOOT = {"night": foot("night"), "white": foot("white")}


def block(theme: str) -> str:
    src = (LESS / f"colors-table-{'night' if theme == 'night' else 'white'}.less").read_text(encoding="utf-8")
    m = re.search(r"\.theme-%s\s*\{(.*?)\n    \}" % theme, src, re.S)
    assert m, theme
    body = m.group(1)
    body = re.sub(r"@neutral-(\w+)", lambda k: NEUTRAL[theme][k.group(1)], body)
    body = re.sub(r"@blue-(\d+)", lambda k: f"@vo-{k.group(1)}", body)
    return f"    .theme-{theme} {{{body}{FOOT[theme]}    }}\n"


out = HEAD + ":root {\n" + block("night") + "\n" + block("white") + "}\n"
(LESS / "colors-table-volcanium.less").write_text(out, encoding="utf-8")
left = len(re.findall(r"@neutral-|@blue-", out))
print("écrit", len(out), "octets;", out.count("@vo-"), "références d'accent;", left, "couleurs d'amont restantes")
