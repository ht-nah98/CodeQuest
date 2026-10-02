#!/usr/bin/env python3
"""Clean a 4x4 AI-generated pixel sprite sheet.

Slices the grid, removes the flat lavender background and drop shadow by
flood-filling from the cell borders (so light/dark fur inside the character
is never touched), crops every frame with one shared bounding box (so frames
keep their relative position; it does NOT put every pose's feet on one line,
pack.py computes the feet line per animation), and writes transparent PNGs
plus a clean sheet and a checkerboard preview.

Usage:
  python3 tools/sprites/clean.py assets/raw/panda-sheet.png assets/sprites/panda \
      --names idle_1,talk,happy,idle_2,walk_1,walk_2,walk_3,walk_4,run_1,run_2,run_3,run_4,crouch,jump,kick,cheer
"""
from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

DEFAULT_NAMES = [f"frame_{i:02d}" for i in range(16)]


def is_background(px: np.ndarray, min_blue_minus_red: int, red_range: tuple[int, int]) -> np.ndarray:
    # Lavender background and its darker shadow are both "blue-ish purple";
    # the character's black/cream/pink pixels are not.
    r, b = px[..., 0], px[..., 2]
    return (b - r > min_blue_minus_red) & (r > red_range[0]) & (r < red_range[1])


def flood_from_border(candidate: np.ndarray) -> np.ndarray:
    h, w = candidate.shape
    mask = np.zeros((h, w), dtype=bool)
    queue: deque[tuple[int, int]] = deque()
    for i in range(h):
        for j in (0, w - 1):
            if candidate[i, j] and not mask[i, j]:
                mask[i, j] = True
                queue.append((i, j))
    for j in range(w):
        for i in (0, h - 1):
            if candidate[i, j] and not mask[i, j]:
                mask[i, j] = True
                queue.append((i, j))
    while queue:
        i, j = queue.popleft()
        for y, x in ((i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)):
            if 0 <= y < h and 0 <= x < w and candidate[y, x] and not mask[y, x]:
                mask[y, x] = True
                queue.append((y, x))
    return mask


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src", type=Path)
    ap.add_argument("out_dir", type=Path)
    ap.add_argument("--names", default=",".join(DEFAULT_NAMES), help="16 comma-separated frame names, row by row")
    ap.add_argument("--grid", type=int, default=4)
    ap.add_argument("--pad", type=int, default=8, help="pixels trimmed inside each cell to drop grid lines")
    ap.add_argument("--min-blue-minus-red", type=int, default=22)
    args = ap.parse_args()

    names = [n.strip() for n in args.names.split(",")]
    if len(names) != args.grid * args.grid:
        raise SystemExit(f"--names needs {args.grid * args.grid} names, got {len(names)}")

    sheet = np.array(Image.open(args.src).convert("RGB")).astype(int)
    height, width, _ = sheet.shape
    ys = [round(i * height / args.grid) for i in range(args.grid + 1)]
    xs = [round(i * width / args.grid) for i in range(args.grid + 1)]

    frames: list[tuple[str, Image.Image, tuple[int, int, int, int]]] = []
    for r in range(args.grid):
        for c in range(args.grid):
            cell = sheet[ys[r] + args.pad : ys[r + 1] - args.pad, xs[c] + args.pad : xs[c + 1] - args.pad]
            bg = flood_from_border(is_background(cell, args.min_blue_minus_red, (55, 170)))
            rgba = np.dstack([cell.astype(np.uint8), np.where(bg, 0, 255).astype(np.uint8)])
            img = Image.fromarray(rgba, "RGBA")
            bbox = img.getbbox()
            if bbox is None:
                raise SystemExit(f"frame {names[r * args.grid + c]} is empty after background removal")
            frames.append((names[r * args.grid + c], img, bbox))

    x0 = min(b[0] for *_, b in frames)
    y0 = min(b[1] for *_, b in frames)
    x1 = max(b[2] for *_, b in frames)
    y1 = max(b[3] for *_, b in frames)
    size = max(x1 - x0, y1 - y0) + 8

    args.out_dir.mkdir(parents=True, exist_ok=True)
    clean = Image.new("RGBA", (size * args.grid, size * args.grid))
    for k, (name, img, _) in enumerate(frames):
        frame = Image.new("RGBA", (size, size))
        frame.paste(img.crop((x0, y0, x1, y1)), ((size - (x1 - x0)) // 2, size - (y1 - y0) - 4))
        frame.save(args.out_dir / f"{name}.png")
        clean.paste(frame, ((k % args.grid) * size, (k // args.grid) * size))
    stem = args.src.stem
    clean.save(args.out_dir / f"{stem}-clean.png")

    checker = (np.indices((clean.size[1], clean.size[0])).sum(0) // 16 % 2)[..., None]
    bg_img = np.where(checker == 0, [235, 240, 245, 255], [200, 215, 225, 255]).astype(np.uint8)
    Image.alpha_composite(Image.fromarray(bg_img, "RGBA"), clean).convert("RGB").save(args.out_dir / "preview.png")
    print(f"{len(frames)} frames, {size}x{size}px each -> {args.out_dir}")


if __name__ == "__main__":
    main()
