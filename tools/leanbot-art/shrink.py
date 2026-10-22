"""Shrink the lesson pictures render.mjs writes: 256-colour palette, no dithering.

Flat drawings and block screenshots have few colours, so this keeps them identical to the eye
and cuts the files by about 60 % (3.8 MB -> 1.6 MB for Bài 0-4, 22/10/2026).
Needs Pillow (tools/sprites/requirements.txt).
"""

import sys

from PIL import Image

for path in sys.argv[1:]:
    image = Image.open(path).convert("RGB")
    image.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(
        path, optimize=True
    )
