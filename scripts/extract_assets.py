#!/usr/bin/env python3
"""
Official Asset Extraction Script for Muses Board Game.
Extracts 9 musas, 4 actions, 9 inspirations, and 2 astros from docs/Reglas originales/Reglas.pdf.
Output directories:
- muses/public/assets/musas/
- muses/public/assets/cards/
- muses/public/assets/astros/
"""

import os
import shutil
import subprocess
from pathlib import Path
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = REPO_ROOT / "docs" / "Reglas originales" / "Reglas.pdf"
PUBLIC_ASSETS = REPO_ROOT / "muses" / "public" / "assets"
TMP_DIR = Path("/tmp/muses_extract")

MUSAS_DIR = PUBLIC_ASSETS / "musas"
CARDS_DIR = PUBLIC_ASSETS / "cards"
ASTROS_DIR = PUBLIC_ASSETS / "astros"

SCALE = 25.0 / 9.0  # Exact scale factor for 300 DPI (2550 / 918)

MUSAS = {
    "urania": (9, 338, 635, 540, 540),
    "caliope": (10, 338, 14, 540, 540),
    "clio": (10, 338, 527, 540, 540),
    "erato": (11, 338, 14, 540, 540),
    "euterpe": (11, 338, 527, 540, 540),
    "melpomene": (12, 338, 14, 540, 540),
    "polimnia": (12, 338, 527, 540, 540),
    "terpsicore": (13, 338, 14, 540, 540),
    "talia": (13, 338, 527, 540, 540),
}

ACTIONS = {
    "devocion_sol": (7, 41, 13, 297, 405),
    "revolucion_sol": (7, 581, 392, 297, 405),
    "revolucion_luna": (8, 311, 13, 297, 405),
    "devocion_luna": (8, 41, 770, 297, 405),
}

INSPIRATIONS = {
    "inspiracion_urania": (9, 581, 13, 297, 405),
    "inspiracion_caliope": (10, 41, 13, 297, 405),
    "inspiracion_clio": (10, 41, 392, 297, 405),
    "inspiracion_erato": (11, 41, 13, 297, 405),
    "inspiracion_euterpe": (11, 41, 392, 297, 405),
    "inspiracion_melpomene": (12, 41, 13, 297, 405),
    "inspiracion_polimnia": (12, 41, 392, 297, 405),
    "inspiracion_terpsicore": (13, 41, 13, 297, 405),
    "inspiracion_talia": (13, 41, 392, 297, 405),
}


def ensure_dirs():
    MUSAS_DIR.mkdir(parents=True, exist_ok=True)
    CARDS_DIR.mkdir(parents=True, exist_ok=True)
    ASTROS_DIR.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)


def render_pages():
    for page_num in range(7, 14):
        page_file = TMP_DIR / f"page-{page_num:02d}.png"
        if not page_file.exists():
            print(f"Rendering page {page_num}...")
            subprocess.run(
                ["pdftoppm", "-png", "-r", "300", "-f", str(page_num), "-l", str(page_num), str(PDF_PATH), str(TMP_DIR / "page")],
                check=True
            )


def extract_musas():
    print("Extracting 9 musas...")
    for name, (pg, x, y, w, h) in MUSAS.items():
        page_img = Image.open(TMP_DIR / f"page-{pg:02d}.png")
        box = (
            int(round(x * SCALE)),
            int(round(y * SCALE)),
            int(round((x + w) * SCALE)),
            int(round((y + h) * SCALE)),
        )
        crop = page_img.crop(box)
        target_path = MUSAS_DIR / f"{name}.png"
        crop.save(target_path, "PNG", optimize=True)
        print(f"  Saved {target_path} {crop.size}")
        if name == "caliope":
            calliope_path = MUSAS_DIR / "calliope.png"
            crop.save(calliope_path, "PNG", optimize=True)


def extract_actions():
    print("Extracting 4 action cards...")
    for name, (pg, x, y, w, h) in ACTIONS.items():
        page_img = Image.open(TMP_DIR / f"page-{pg:02d}.png")
        box = (
            int(round(x * SCALE)),
            int(round(y * SCALE)),
            int(round((x + w) * SCALE)),
            int(round((y + h) * SCALE)),
        )
        crop = page_img.crop(box)
        target_path = CARDS_DIR / f"{name}.png"
        crop.save(target_path, "PNG", optimize=True)
        print(f"  Saved {target_path} {crop.size}")


def extract_inspirations():
    print("Extracting 9 inspiration cards...")
    for name, (pg, x, y, w, h) in INSPIRATIONS.items():
        page_img = Image.open(TMP_DIR / f"page-{pg:02d}.png")
        box = (
            int(round(x * SCALE)),
            int(round(y * SCALE)),
            int(round((x + w) * SCALE)),
            int(round((y + h) * SCALE)),
        )
        crop = page_img.crop(box)
        target_path = CARDS_DIR / f"{name}.png"
        crop.save(target_path, "PNG", optimize=True)
        print(f"  Saved {target_path} {crop.size}")
        if name == "inspiracion_caliope":
            calliope_path = CARDS_DIR / "inspiracion_calliope.png"
            crop.save(calliope_path, "PNG", optimize=True)


def extract_astros():
    print("Extracting astros (Sol and Luna)...")
    # Raw images from page 9
    raw_prefix = TMP_DIR / "raw_p9"
    subprocess.run(
        ["pdfimages", "-png", "-f", "9", "-l", "9", str(PDF_PATH), str(raw_prefix)],
        check=True
    )
    # Sun: 046 RGB + 047 Mask
    rgb_sun = Image.open(f"{raw_prefix}-046.png").convert("RGB")
    mask_sun = Image.open(f"{raw_prefix}-047.png").convert("L")
    rgba_sun = rgb_sun.copy()
    rgba_sun.putalpha(mask_sun)
    sun_path = ASTROS_DIR / "sol.png"
    rgba_sun.save(sun_path, "PNG", optimize=True)
    print(f"  Saved {sun_path} {rgba_sun.size}")

    # Moon: 048 RGB + 049 Mask
    rgb_moon = Image.open(f"{raw_prefix}-048.png").convert("RGB")
    mask_moon = Image.open(f"{raw_prefix}-049.png").convert("L")
    rgba_moon = rgb_moon.copy()
    rgba_moon.putalpha(mask_moon)
    moon_path = ASTROS_DIR / "luna.png"
    rgba_moon.save(moon_path, "PNG", optimize=True)
    print(f"  Saved {moon_path} {rgba_moon.size}")


if __name__ == "__main__":
    ensure_dirs()
    render_pages()
    extract_musas()
    extract_actions()
    extract_inspirations()
    extract_astros()
    print("All assets extracted successfully.")
