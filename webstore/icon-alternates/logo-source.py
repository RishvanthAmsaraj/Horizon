#!/usr/bin/env python3
"""Horizon Tab icon renderer.

Everything is described in a 0..1 unit square and rasterized with 8x
supersampling, so the same description renders crisply at 16, 48, 128
or 512 px. No hand-tuned per-size artwork.
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SS = 8  # supersample factor


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def linear_gradient(size, stops, angle="diag"):
    """RGB gradient image. stops = [(pos0..1, '#rrggbb'), ...]."""
    w = h = size
    if angle == "diag":
        gx, gy = np.meshgrid(np.linspace(0, 1, w), np.linspace(0, 1, h))
        t = (gx + gy) / 2.0
    elif angle == "vert":
        t = np.repeat(np.linspace(0, 1, h)[:, None], w, axis=1)
    else:  # horizontal
        t = np.repeat(np.linspace(0, 1, w)[None, :], h, axis=0)

    pos = np.array([s[0] for s in stops], dtype=float)
    cols = np.array([hex2rgb(s[1]) for s in stops], dtype=float)
    out = np.zeros((h, w, 3), dtype=float)
    for c in range(3):
        out[:, :, c] = np.interp(t, pos, cols[:, c])
    return Image.fromarray(out.astype(np.uint8), "RGB")


def squircle_mask(size, radius_frac=0.225):
    """Rounded-square mask in the modern app-icon proportion."""
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    r = int(size * radius_frac)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=255)
    return m


def render(concept, px):
    """Render one concept at px, via an SS-times larger buffer."""
    S = px * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))

    # ── Tile background ────────────────────────────────────────────
    bg = linear_gradient(S, concept["bg"], concept.get("bg_angle", "diag"))
    img.paste(bg, (0, 0))

    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    def U(v):  # unit -> pixels
        return v * S

    # ── Sun glow (soft radial bloom behind the disc) ───────────────
    if concept.get("glow"):
        g = Image.new("L", (S, S), 0)
        gd = ImageDraw.Draw(g)
        cx, cy, rr = concept["sun"]
        gd.ellipse([U(cx - rr * 1.9), U(cy - rr * 1.9),
                    U(cx + rr * 1.9), U(cy + rr * 1.9)], fill=110)
        g = g.filter(ImageFilter.GaussianBlur(S * 0.055))
        glow_col = Image.new("RGBA", (S, S), hex2rgb(concept["glow"]) + (255,))
        layer = Image.alpha_composite(layer, Image.composite(
            glow_col, Image.new("RGBA", (S, S), (0, 0, 0, 0)), g))
        d = ImageDraw.Draw(layer)

    # ── Sun disc, filled with its own gradient ─────────────────────
    cx, cy, rr = concept["sun"]
    sun_mask = Image.new("L", (S, S), 0)
    sd = ImageDraw.Draw(sun_mask)
    sd.ellipse([U(cx - rr), U(cy - rr), U(cx + rr), U(cy + rr)], fill=255)
    if concept.get("clip_below"):  # hide the part under the horizon
        sd.rectangle([0, U(concept["clip_below"]), S, S], fill=0)
    sun_grad = linear_gradient(S, concept["sun_colors"], "vert")
    layer.paste(sun_grad, (0, 0), sun_mask)
    d = ImageDraw.Draw(layer)

    # ── Arcs (rays) ────────────────────────────────────────────────
    for arc in concept.get("arcs", []):
        ar, wdt, col, a0, a1 = arc
        bb = [U(cx - ar), U(cy - ar), U(cx + ar), U(cy + ar)]
        d.arc(bb, a0, a1, fill=hex2rgb(col) + (255,), width=int(U(wdt)))

    # ── Horizon line ───────────────────────────────────────────────
    if concept.get("horizon"):
        hy, hx0, hx1, hw, hcol = concept["horizon"]
        d.rounded_rectangle(
            [U(hx0), U(hy - hw / 2), U(hx1), U(hy + hw / 2)],
            radius=U(hw / 2), fill=hex2rgb(hcol) + (255,))
        if concept.get("horizon2"):
            hy2, hx0b, hx1b, hw2, hcol2 = concept["horizon2"]
            d.rounded_rectangle(
                [U(hx0b), U(hy2 - hw2 / 2), U(hx1b), U(hy2 + hw2 / 2)],
                radius=U(hw2 / 2), fill=hex2rgb(hcol2) + (255,))

    img = Image.alpha_composite(img.convert("RGBA"), layer)

    # ── Inner top highlight for a glassy, premium edge ─────────────
    if concept.get("sheen", True):
        sh = Image.new("L", (S, S), 0)
        shd = ImageDraw.Draw(sh)
        shd.ellipse([-S * 0.35, -S * 0.95, S * 1.35, S * 0.42], fill=26)
        sh = sh.filter(ImageFilter.GaussianBlur(S * 0.02))
        white = Image.new("RGBA", (S, S), (255, 255, 255, 255))
        img = Image.alpha_composite(img, Image.composite(
            white, Image.new("RGBA", (S, S), (0, 0, 0, 0)), sh))

    # ── Clip to the squircle, downsample ───────────────────────────
    img.putalpha(squircle_mask(S))
    return img.resize((px, px), Image.LANCZOS)


CONCEPTS = {
    # A — vivid gradient tile, white mark. Maximum color.
    "a": {
        "bg": [(0.0, "#4C1D95"), (0.45, "#C026A3"), (1.0, "#FB923C")],
        "bg_angle": "diag",
        "sun": (0.5, 0.60, 0.185),
        "sun_colors": [(0.0, "#FFFFFF"), (1.0, "#FFFFFF")],
        "clip_below": 0.60,
        "horizon": (0.615, 0.20, 0.80, 0.045, "#FFFFFF"),
        "horizon2": (0.735, 0.315, 0.685, 0.035, "#FFFFFF"),
        "glow": None,
    },
    # B — deep night tile, glowing gradient sun. Color pops off dark.
    "b": {
        "bg": [(0.0, "#1B1740"), (0.55, "#141229"), (1.0, "#0B0A14")],
        "bg_angle": "vert",
        "sun": (0.5, 0.585, 0.20),
        "sun_colors": [(0.36, "#FFD166"), (0.52, "#FF7A59"), (0.68, "#E0409B")],
        "clip_below": 0.585,
        "horizon": (0.60, 0.165, 0.835, 0.042, "#F5E9FF"),
        "horizon2": (0.725, 0.30, 0.70, 0.032, "#8B7BD8"),
        "glow": "#FF7A59",
    },
    # C — dark tile, nested sunrise arcs.
    "c": {
        "bg": [(0.0, "#122236"), (0.5, "#0E1A2B"), (1.0, "#080F1A")],
        "bg_angle": "vert",
        "sun": (0.5, 0.615, 0.105),
        "sun_colors": [(0.40, "#FFE08A"), (0.62, "#FFAA4D")],
        "clip_below": 0.615,
        "arcs": [
            (0.215, 0.045, "#FF8A5B", 180, 360),
            (0.315, 0.042, "#D9539E", 180, 360),
        ],
        "horizon": (0.63, 0.15, 0.85, 0.040, "#EAF2FF"),
        "glow": "#FFAA4D",
    },
}

if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "/tmp/logo"
    import os
    os.makedirs(out, exist_ok=True)
    for k, c in CONCEPTS.items():
        for px in (16, 48, 128, 512):
            render(c, px).save(f"{out}/{k}-{px}.png")
    print("rendered", ", ".join(CONCEPTS))
