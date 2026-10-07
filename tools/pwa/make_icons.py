"""Builds the PWA icons (apps/web/public/icons/) from the packed panda sheet.

Usage: python3 tools/pwa/make_icons.py
Reads apps/web/public/sprites/panda.json + panda.png (frame `happy.png`), centres the frame on a
square tile in the brand colours and scales it with nearest-neighbour so the pixels stay crisp.
`maskable` icons keep the panda inside the 80 % safe zone (Android may crop to a circle).
"""

import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SHEET_JSON = ROOT / "apps/web/public/sprites/panda.json"
OUT_DIR = ROOT / "apps/web/public/icons"
FRAME = "happy.png"
# Colours from apps/web/src/ui/tokens.css.
BACKGROUND = (217, 213, 238, 255)  # --color-lavender-light #d9d5ee
INK = (30, 27, 46, 255)  # --color-ink #1e1b2e


def panda_frame() -> Image.Image:
    sheet = json.loads(SHEET_JSON.read_text(encoding="utf-8"))
    image = Image.open(SHEET_JSON.parent / sheet["meta"]["image"]).convert("RGBA")
    rect = sheet["frames"][FRAME]["frame"]
    return image.crop((rect["x"], rect["y"], rect["x"] + rect["w"], rect["y"] + rect["h"]))


def icon(frame: Image.Image, size: int, fill: float, border: bool) -> Image.Image:
    tile = Image.new("RGBA", (size, size), BACKGROUND)
    if border:
        width = max(2, size // 48)
        ImageDraw.Draw(tile).rectangle((0, 0, size - 1, size - 1), outline=INK, width=width)
    scale = fill * size / max(frame.size)
    panda = frame.resize(
        (round(frame.width * scale), round(frame.height * scale)), Image.Resampling.NEAREST
    )
    tile.alpha_composite(panda, ((size - panda.width) // 2, (size - panda.height) // 2))
    return tile


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    frame = panda_frame()
    outputs = {
        "icon-192.png": icon(frame, 192, 0.8, True),
        "icon-512.png": icon(frame, 512, 0.8, True),
        "icon-maskable-512.png": icon(frame, 512, 0.62, False),
        "apple-touch-icon.png": icon(frame, 180, 0.8, False),
        "favicon-32.png": icon(frame, 32, 0.95, False),
    }
    for name, image in outputs.items():
        image.save(OUT_DIR / name, optimize=True)
        print(f"{OUT_DIR / name} ({image.width}x{image.height})")


if __name__ == "__main__":
    main()
