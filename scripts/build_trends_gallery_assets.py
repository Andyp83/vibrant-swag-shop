#!/usr/bin/env python3
import hashlib
import json
import os
import re
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path(
    os.environ.get(
        "TRENDS_IMAGE_DIR",
        "/Users/andyperry/Downloads/All Products - AUD - 2026-08-09 00_03_22",
    )
)
CATALOGUE_JSON = Path(
    os.environ.get(
        "TRENDS_CATALOGUE_JSON",
        "/Users/andyperry/Documents/Mini Merch store/outputs/trends-catalogue/trends_catalogue_full.json",
    )
)
ASSET_DIR = ROOT / "public" / "assets" / "products"
OUT_DIR = ROOT / "public" / "trends-catalogue"
MAX_IMAGE_EDGE = int(os.environ.get("TRENDS_GALLERY_MAX_EDGE", "700"))
WEBP_QUALITY = int(os.environ.get("TRENDS_GALLERY_WEBP_QUALITY", "55"))


def slugify(value):
    value = re.sub(r"[^a-z0-9]+", "-", str(value or "").lower())
    return value.strip("-") or "item"


def asset_name(source_path):
    path = Path(source_path)
    stem = slugify(path.stem)
    digest = hashlib.sha1(str(path).encode("utf-8")).hexdigest()[:8]
    return f"{stem}-{digest}.webp"


def parse_image_name(path):
    match = re.match(r"^(\d+)[_-](\d+)$", path.stem)
    if not match:
        return None
    return match.group(1), int(match.group(2))


def split_colours(value):
    value = re.sub(r"\s+", " ", str(value or "")).strip().strip(".")
    if not value or value.lower() in {"n/a", "na", "none"}:
        return []
    parts = []
    for raw in re.split(r",|;", value):
        colour = raw.strip().strip(".")
        if colour and colour not in parts:
            parts.append(colour)
    return parts


def convert_one(task):
    source, dest = map(Path, task)
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_mtime >= source.stat().st_mtime:
        return {"status": "cached", "source": str(source), "dest": str(dest)}
    try:
        with Image.open(source) as img:
            img = ImageOps.exif_transpose(img)
            if img.mode in ("RGBA", "LA") or "transparency" in img.info:
                background = Image.new("RGBA", img.size, (255, 255, 255, 255))
                background.alpha_composite(img.convert("RGBA"))
                img = background.convert("RGB")
            else:
                img = img.convert("RGB")
            img.thumbnail((MAX_IMAGE_EDGE, MAX_IMAGE_EDGE), Image.Resampling.LANCZOS)
            img.save(dest, "WEBP", quality=WEBP_QUALITY, method=6)
        return {"status": "ok", "source": str(source), "dest": str(dest)}
    except Exception as exc:
        return {"status": "error", "source": str(source), "dest": str(dest), "error": str(exc)}


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    products = json.loads(CATALOGUE_JSON.read_text())
    product_by_plu = {str(row.get("PLU Number", "")).strip(): row for row in products}
    files_by_plu = {}
    unmatched = []

    for path in SOURCE_DIR.iterdir():
        if not path.is_file() or path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue
        parsed = parse_image_name(path)
        if not parsed:
            unmatched.append({"source_filename": path.name, "reason": "filename_not_plu_sequence"})
            continue
        plu, seq = parsed
        if plu not in product_by_plu:
            unmatched.append({"source_filename": path.name, "plu": plu, "reason": "plu_not_in_catalogue"})
            continue
        files_by_plu.setdefault(plu, []).append((seq, path))

    tasks = []
    gallery_rows = []
    colour_rows = []

    for product_index, plu in enumerate(sorted(product_by_plu)):
        row = product_by_plu[plu]
        image_files = sorted(files_by_plu.get(plu, []), key=lambda item: item[0])
        colours = split_colours(row.get("Colours"))

        for colour_index, colour in enumerate(colours):
            colour_rows.append(
                {
                    "plu": plu,
                    "colour_code": f"{plu}-{slugify(colour)}",
                    "colour_name": colour,
                    "sort_order": colour_index,
                }
            )

        for image_index, (source_seq, source) in enumerate(image_files):
            dest = ASSET_DIR / plu / asset_name(source)
            tasks.append((source, dest))
            rel = "/" + dest.relative_to(ROOT / "public").as_posix()
            gallery_rows.append(
                {
                    "plu": plu,
                    "image_code": f"{plu}-{image_index + 1:02d}",
                    "image_url": rel,
                    "source_filename": source.name,
                    "colour_label": None,
                    "shot_type": "Primary" if image_index == 0 else "Gallery",
                    "sort_order": image_index,
                }
            )

    statuses = {"ok": 0, "cached": 0, "error": 0}
    errors = []
    with ProcessPoolExecutor() as pool:
        futures = [pool.submit(convert_one, task) for task in tasks]
        for future in as_completed(futures):
            result = future.result()
            statuses[result["status"]] = statuses.get(result["status"], 0) + 1
            if result["status"] == "error":
                errors.append(result)

    (OUT_DIR / "gallery-images.json").write_text(json.dumps(gallery_rows, ensure_ascii=False))
    (OUT_DIR / "product-colours.json").write_text(json.dumps(colour_rows, ensure_ascii=False))
    (OUT_DIR / "unmatched-images.json").write_text(json.dumps(unmatched, indent=2, ensure_ascii=False))
    (OUT_DIR / "gallery-build-summary.json").write_text(
        json.dumps(
            {
                "catalogue_products": len(product_by_plu),
                "gallery_images": len(gallery_rows),
                "colour_options": len(colour_rows),
                "unmatched_source_images": len(unmatched),
                "image_statuses": statuses,
                "errors": errors[:50],
                "max_image_edge": MAX_IMAGE_EDGE,
                "webp_quality": WEBP_QUALITY,
            },
            indent=2,
            ensure_ascii=False,
        )
    )
    print(json.dumps(json.loads((OUT_DIR / "gallery-build-summary.json").read_text()), indent=2))


if __name__ == "__main__":
    main()
