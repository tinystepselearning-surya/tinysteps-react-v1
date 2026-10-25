#!/usr/bin/env python3
"""Generate the two responsive homepage hero images from the approved original.

Run intentionally only when preparing website image assets:
    python3 -m pip install Pillow==11.3.0
    python3 scripts/generate-homepage-hero-variants.py

The source image remains the SEO-safe, high-DPR fallback. No CSS, EXIF, or
editorial copy is changed by this asset-only utility.
"""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "public" / "blog" / "hero-families"
SOURCE = FOLDER / "Tiny_Steps_Speaking.webp"
WIDTHS = (480, 720, 960)

if not SOURCE.is_file():
    raise SystemExit(f"Missing approved hero image: {SOURCE}")

with Image.open(SOURCE) as source:
    source.load()
    if source.width < max(WIDTHS):
        raise SystemExit(f"Hero image too small: {source.width}px")
    original = source.convert("RGB")
    for width in WIDTHS:
        height = round(original.height * width / original.width)
        out = FOLDER / f"Tiny_Steps_Speaking_{width}.webp"
        resized = original.resize((width, height), Image.Resampling.LANCZOS)
        resized.save(out, format="WEBP", quality=77, method=6)
        print(f"{out.relative_to(ROOT)} {width}x{height} {out.stat().st_size} bytes")
