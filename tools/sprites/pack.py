#!/usr/bin/env python3
"""Pack cleaned character frames into a PixiJS spritesheet (atlas PNG + JSON).

Input is a folder written by clean.py (one transparent PNG per frame, all the
same size, cropped with one shared bounding box). Output is `<out>/<character>.png` and
`<out>/<character>.json` in the TexturePacker "hash" format that
`PIXI.Assets.load` understands, with an `animations` map.

Animation names come from the frame names (stage-rendering.md §3):
  `walk_1 … walk_4` -> animation `walk` (ordered by the number)
  `jump`            -> animation `jump` (a single frame)

Packing rules:
  - Frames are trimmed to their opaque pixels and copied 1:1 (no resampling).
    `trimmed`, `spriteSourceSize` and `sourceSize` keep the original frame box,
    so every texture still measures e.g. 280x280.
  - Every frame gets a 1 px extruded border plus transparent padding so linear
    filtering never samples a neighbour.
  - Fully transparent pixels are written as (0, 0, 0, 0) so no background colour
    (the lavender from the raw sheet) survives in the RGB channels.
  - Each frame carries `anchor` = (0.5, feet line / frame height). Frames do NOT
    share one feet line (crouch, kick, run sit higher in the box), so the feet
    line is computed per animation: the lowest opaque row over that animation's
    frames. Grounded frames then stand exactly on `sprite.position`.
    Airborne animations (AIRBORNE below, e.g. `jump`) borrow the feet line of a
    grounded reference animation; the stage code draws the arc.
  - Output is deterministic: same input -> pixel-identical PNG and identical
    JSON (byte-identical with the pinned Pillow/NumPy in requirements.txt).

Usage:
  python3 tools/sprites/pack.py assets/sprites/panda [--out apps/web/public/sprites]
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image

# Files clean.py writes next to the frames that are not frames themselves.
SKIP_SUFFIXES = ("-clean.png",)
SKIP_NAMES = {"preview.png"}
FRAME_NAME = re.compile(r"^[a-z][a-z0-9_]*$")
NUMBERED = re.compile(r"^(?P<anim>[a-z][a-z0-9_]*?)_(?P<index>\d+)$")

# Animation names the game knows (stage-rendering.md §3); others trigger a warning.
KNOWN_ANIMATIONS = {
    "idle", "talk", "happy", "walk", "run", "crouch", "jump", "kick", "cheer",
    "walk_front", "walk_back", "bump", "oops", "think", "point",
}
# Animations drawn in mid-air -> grounded animation whose feet line they use.
AIRBORNE = {"jump": "idle"}

EXTRUDE = 1
PADDING = 2  # transparent gap between extruded frames
COLUMNS = 4


def load_frames(src: Path) -> list[tuple[str, np.ndarray]]:
    frames: list[tuple[str, np.ndarray]] = []
    for path in sorted(src.glob("*.png")):
        if path.name in SKIP_NAMES or path.name.endswith(SKIP_SUFFIXES):
            continue
        name = path.stem
        if not FRAME_NAME.match(name):
            raise SystemExit(f"bad frame name {path.name!r}: use lowercase snake_case")
        rgba = np.array(Image.open(path).convert("RGBA"))
        rgba[rgba[..., 3] == 0] = 0
        frames.append((name, rgba))
    if not frames:
        raise SystemExit(f"no frames found in {src}")
    sizes = {f.shape[:2] for _, f in frames}
    if len(sizes) != 1:
        raise SystemExit(f"all frames must share one size, got {sorted(sizes)}")
    return frames


def build_animations(names: list[str]) -> dict[str, list[str]]:
    groups: dict[str, list[tuple[int, str]]] = {}
    for name in names:
        m = NUMBERED.match(name)
        anim, index = (m["anim"], int(m["index"])) if m else (name, 0)
        groups.setdefault(anim, []).append((index, name))
    return {anim: [n for _, n in sorted(items)] for anim, items in sorted(groups.items())}


def feet_lines(frames: list[tuple[str, np.ndarray]], animations: dict[str, list[str]]) -> dict[str, int]:
    """Feet line (lowest opaque row + 1) per animation; airborne ones borrow a reference."""
    bottom = {name: int(np.nonzero(f[..., 3].any(axis=1))[0].max()) + 1 for name, f in frames}
    feet = {anim: max(bottom[n] for n in names) for anim, names in animations.items()}
    for anim, ref in AIRBORNE.items():
        if anim in feet:
            if ref not in feet:
                raise SystemExit(f"airborne animation {anim!r} needs reference animation {ref!r}")
            feet[anim] = feet[ref]
    return feet


def trim(rgba: np.ndarray) -> tuple[int, int, int, int]:
    alpha = rgba[..., 3] > 0
    rows = np.nonzero(alpha.any(axis=1))[0]
    cols = np.nonzero(alpha.any(axis=0))[0]
    if rows.size == 0:
        raise SystemExit("empty frame")
    return int(cols.min()), int(rows.min()), int(cols.max()) + 1, int(rows.max()) + 1


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src", type=Path, help="folder of cleaned frames, e.g. assets/sprites/panda")
    ap.add_argument("--out", type=Path, default=Path("apps/web/public/sprites"))
    ap.add_argument("--name", help="character name (default: the folder name)")
    args = ap.parse_args()

    character = args.name or args.src.resolve().name
    frames = load_frames(args.src)
    src_h, src_w = frames[0][1].shape[:2]
    animation_frames = build_animations([n for n, _ in frames])
    for anim in animation_frames:
        if anim not in KNOWN_ANIMATIONS:
            print(f"warning: animation {anim!r} is not in stage-rendering.md §3 (KNOWN_ANIMATIONS)")
    feet = feet_lines(frames, animation_frames)
    frame_anim = {n: anim for anim, names in animation_frames.items() for n in names}

    boxes = [trim(f) for _, f in frames]
    cell_w = max(x1 - x0 for x0, _, x1, _ in boxes) + 2 * EXTRUDE + PADDING
    cell_h = max(y1 - y0 for _, y0, _, y1 in boxes) + 2 * EXTRUDE + PADDING
    rows = -(-len(frames) // COLUMNS)
    atlas = np.zeros((rows * cell_h + PADDING, COLUMNS * cell_w + PADDING, 4), dtype=np.uint8)

    frame_data: dict[str, dict[str, object]] = {}
    for k, ((name, rgba), (x0, y0, x1, y1)) in enumerate(zip(frames, boxes)):
        piece = rgba[y0:y1, x0:x1]
        # Extrude: repeat the edge pixels outward by EXTRUDE px.
        piece = np.pad(piece, ((EXTRUDE, EXTRUDE), (EXTRUDE, EXTRUDE), (0, 0)), mode="edge")
        ox = PADDING + (k % COLUMNS) * cell_w
        oy = PADDING + (k // COLUMNS) * cell_h
        atlas[oy : oy + piece.shape[0], ox : ox + piece.shape[1]] = piece
        w, h = x1 - x0, y1 - y0
        frame_data[f"{name}.png"] = {
            "frame": {"x": ox + EXTRUDE, "y": oy + EXTRUDE, "w": w, "h": h},
            "rotated": False,
            "trimmed": True,
            "spriteSourceSize": {"x": x0, "y": y0, "w": w, "h": h},
            "sourceSize": {"w": src_w, "h": src_h},
            "anchor": {"x": 0.5, "y": round(feet[frame_anim[name]] / src_h, 6)},
        }

    animations = {anim: [f"{n}.png" for n in names] for anim, names in animation_frames.items()}
    data = {
        "frames": frame_data,
        "animations": animations,
        "meta": {
            "app": "codequest tools/sprites/pack.py",
            "version": "1",
            "image": f"{character}.png",
            "format": "RGBA8888",
            "size": {"w": int(atlas.shape[1]), "h": int(atlas.shape[0])},
            "scale": 1,
        },
    }

    args.out.mkdir(parents=True, exist_ok=True)
    # No metadata chunks and fixed compression -> byte-identical output.
    Image.fromarray(atlas, "RGBA").save(args.out / f"{character}.png", optimize=True)
    (args.out / f"{character}.json").write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(
        f"{len(frames)} frames, {len(animations)} animations ({', '.join(animations)}), "
        f"atlas {atlas.shape[1]}x{atlas.shape[0]} -> {args.out / character}.{{png,json}}"
    )


if __name__ == "__main__":
    main()
