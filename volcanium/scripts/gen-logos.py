#!/usr/bin/env python3
"""Génère les logos d'en-tête des éditeurs (chevron Volcanium + nom en Rammetto One converti en tracés : aucune police requise à l'affichage).
Usage : python3 scripts/gen-logos.py  (nécessite fonttools + brotli)"""
import io, re, sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / "apps/web/public/fonts/RammettoOne-normal-latin.woff2"
OUT = ROOT / "upstream/web-apps/apps/common/main/resources/img/header"
# Chevron de la marque (landing pages/*/logo.svg, 69x120, orange de marque)
MARK = ["M0 89.9378L20.8498 79.613L0 69.9931V45.6945L66.3782 78.2446C67.0163 78.5764 67.5157 79.1016 67.8764 79.8203C68.237 80.5114 68.4174 81.2301 68.4174 81.9765C68.4174 82.7505 68.2509 83.4831 67.918 84.1742C67.585 84.8376 67.0718 85.349 66.3782 85.7084L0 120V89.9378Z",
        "M69 30.0622L48.1502 40.387L69 50.0069V74.3055L2.62183 41.7554C1.98372 41.4236 1.48432 40.8984 1.12364 40.1797C0.762967 39.4886 0.58263 38.7699 0.58263 38.0235C0.58263 37.2495 0.749095 36.5169 1.08203 35.8258C1.41497 35.1624 1.92817 34.651 2.62183 34.2916L69 0V30.0622Z"]
NAMES = {"doc": "Volcanium Doc", "table": "Volcanium Table", "slides": "Volcanium Présentation"}
VARIANTS = {"": ("#ff714d", "#f4f4f5"), "-dark": ("#d4400f", "#1f1f22")}  # "" = sur fond sombre ; "-dark" = sur fond clair

font = TTFont(FONT)
gs, cmap, upm = font.getGlyphSet(), font.getBestCmap(), font["head"].unitsPerEm
H, TEXT_H = 20, 11.5  # hauteur du logo, hauteur des capitales
scale = TEXT_H / (font["OS/2"].sCapHeight or 0.7 * upm)

def text_path(text, x0, baseline):
    x, parts = x0, []
    for ch in text:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (scale, 0, 0, -scale, x, baseline)))
        d = pen.getCommands()
        if d: parts.append(d)
        x += gs[g].width * scale
    return " ".join(parts), x

for key, name in NAMES.items():
    for suffix, (brand, ink) in VARIANTS.items():
        d, end = text_path(name, 18, 15.2)
        w = round(end + 4)
        mark = f'<g transform="translate(2 4) scale(0.1)">' + "".join(f'<path d="{p}" fill="{brand}"/>' for p in MARK) + "</g>"
        # chevron : 69x120 -> 6.9x12 ; centré verticalement
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{H}" viewBox="0 0 {w} {H}" fill="none">{mark}<path d="{d}" fill="{ink}"/></svg>\n'
        (OUT / f"vo-logo-{key}{suffix}.svg").write_text(svg)
        print(key, suffix or "light-on-dark", w)
