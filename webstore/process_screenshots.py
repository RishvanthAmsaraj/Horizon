#!/usr/bin/env python3
"""Fit screenshots to exactly 1280x800 (Chrome Web Store size) by padding the
bottom with the page's edge color. Output as PNG."""
import os
from PIL import Image

SRC = "/Users/rishvanthamsaraj/.hermes/cache/images"
OUT = "/Users/rishvanthamsaraj/Downloads/Horizon/store/screenshots"
os.makedirs(OUT, exist_ok=True)

TW, TH = 1280, 800

# source -> output name (descriptive, grouped by extension)
files = {
    "img_5a42cc7280c6.jpg": "HorizonTab-1-home.png",
    "img_685dec500a30.jpg": "HorizonTab-2-search-drawer.png",
    "img_f66f2fdede73.jpg": "AISignal-1-search-results.png",
    "img_b4b84b7bae5d.jpg": "AISignal-2-page-detector.png",
    "img_334e596a8d21.jpg": "AISignal-3-settings.png",
    "img_adc7fcc301a4.jpg": "EXTRA-scbwa-no-overlay.png",
}

for src, name in files.items():
    im = Image.open(os.path.join(SRC, src)).convert("RGB")
    w, h = im.size

    # normalize width to 1280 (keep aspect)
    if w != TW:
        im = im.resize((TW, round(h * TW / w)), Image.LANCZOS)
        w, h = im.size

    if h >= TH:
        out = im.crop((0, 0, TW, TH))
    else:
        # pad bottom with the page's edge color (average of bottom row)
        bottom_row = im.crop((0, h - 1, TW, h)).resize((1, 1), Image.LANCZOS)
        edge = bottom_row.getpixel((0, 0))
        out = Image.new("RGB", (TW, TH), edge)
        out.paste(im, (0, 0))

    out.save(os.path.join(OUT, name), "PNG")
    print(f"{name}: {w}x{h} -> {out.size}")
