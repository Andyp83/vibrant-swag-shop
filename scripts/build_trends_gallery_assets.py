#!/usr/bin/env python3
import hashlib
import json
import os
import re
from collections import Counter
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
MAX_IMAGE_EDGE = int(os.environ.get("TRENDS_GALLERY_MAX_EDGE", "640"))
WEBP_QUALITY = int(os.environ.get("TRENDS_GALLERY_WEBP_QUALITY", "50"))
FORCE_REBUILD = os.environ.get("TRENDS_GALLERY_FORCE", "").strip().lower() in {"1", "true", "yes"}
REUSE_EXISTING_ASSETS = os.environ.get("TRENDS_GALLERY_REUSE_EXISTING", "1").strip().lower() in {
    "1",
    "true",
    "yes",
}
ENABLE_VISUAL_COLOUR = os.environ.get("TRENDS_GALLERY_ENABLE_VISUAL_COLOUR", "").strip().lower() in {
    "1",
    "true",
    "yes",
}

CANONICAL_COLOURS = [
    "Natural",
    "Pink",
    "Green",
    "Yellow",
    "Teal",
    "Light Blue",
    "Black",
    "Silver",
    "Brown",
    "White",
    "Gray",
    "Gold",
    "Clear",
    "Navy",
    "Gunmetal",
    "Orange",
    "Blue",
    "Purple",
    "Bright Green",
    "Red",
]

COLOUR_PALETTE = {
    "Black": (28, 28, 28),
    "White": (240, 240, 236),
    "Gray": (145, 148, 150),
    "Silver": (198, 202, 207),
    "Gunmetal": (58, 63, 68),
    "Natural": (190, 170, 130),
    "Brown": (120, 78, 48),
    "Gold": (212, 166, 56),
    "Clear": (218, 235, 242),
    "Yellow": (242, 197, 38),
    "Orange": (237, 116, 38),
    "Red": (205, 46, 50),
    "Pink": (226, 112, 160),
    "Purple": (122, 78, 168),
    "Navy": (30, 43, 90),
    "Blue": (45, 105, 198),
    "Light Blue": (125, 200, 230),
    "Teal": (28, 140, 145),
    "Green": (52, 135, 86),
    "Bright Green": (92, 202, 58),
}

COLOUR_ALIASES = {
    "grey": "Gray",
    "gray": "Gray",
    "dark grey": "Gunmetal",
    "dark gray": "Gunmetal",
    "charcoal": "Gunmetal",
    "gun metal": "Gunmetal",
    "gunmetal": "Gunmetal",
    "silver": "Silver",
    "chrome": "Silver",
    "stainless": "Silver",
    "natural": "Natural",
    "beige": "Natural",
    "tan": "Natural",
    "cream": "Natural",
    "khaki": "Natural",
    "stone": "Natural",
    "sand": "Natural",
    "kraft": "Natural",
    "brown": "Brown",
    "chocolate": "Brown",
    "coffee": "Brown",
    "gold": "Gold",
    "clear": "Clear",
    "transparent": "Clear",
    "translucent": "Clear",
    "yellow": "Yellow",
    "orange": "Orange",
    "red": "Red",
    "maroon": "Red",
    "burgundy": "Red",
    "pink": "Pink",
    "rose": "Pink",
    "purple": "Purple",
    "violet": "Purple",
    "navy": "Navy",
    "navy blue": "Navy",
    "royal": "Blue",
    "royal blue": "Blue",
    "cobalt": "Blue",
    "blue": "Blue",
    "light blue": "Light Blue",
    "sky": "Light Blue",
    "sky blue": "Light Blue",
    "pale blue": "Light Blue",
    "aqua": "Light Blue",
    "teal": "Teal",
    "cyan": "Teal",
    "green": "Green",
    "lime": "Bright Green",
    "lime green": "Bright Green",
    "bright green": "Bright Green",
    "black": "Black",
    "matte black": "Black",
    "white": "White",
    "off white": "White",
    "off-white": "White",
}


def slugify(value):
    value = re.sub(r"[^a-z0-9]+", "-", str(value or "").lower())
    return value.strip("-") or "item"


def asset_name(source_path):
    path = Path(source_path)
    stem = slugify(path.stem)
    digest = hashlib.sha1(path.name.encode("utf-8")).hexdigest()[:8]
    return f"{stem}-{digest}.webp"


def parse_image_name(path):
    match = re.match(r"^\s*(\d+)\s*[-_]+\s*(\d+)", path.stem)
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


def canonical_colour(label):
    if not label:
        return None
    value = re.sub(r"\s+", " ", str(label).strip().lower())
    value = value.replace("/", " ")
    for canonical in CANONICAL_COLOURS:
        if value == canonical.lower():
            return canonical
    if value in COLOUR_ALIASES:
        return COLOUR_ALIASES[value]
    for alias, canonical in sorted(COLOUR_ALIASES.items(), key=lambda item: len(item[0]), reverse=True):
        if re.search(rf"\b{re.escape(alias)}\b", value):
            return canonical
    return None


def load_existing_asset_map():
    path = OUT_DIR / "gallery-images.json"
    if not path.exists():
        return {}
    try:
        rows = json.loads(path.read_text())
    except json.JSONDecodeError:
        return {}
    by_source = {}
    for row in rows:
        plu = str(row.get("plu") or "").strip()
        source = str(row.get("source_filename") or "").strip()
        image_url = str(row.get("image_url") or "").strip()
        if plu and source and image_url.startswith("/"):
            by_source.setdefault((plu, source), image_url)
    return by_source


def destination_for(plu, source, existing_asset_map):
    existing_url = existing_asset_map.get((plu, source.name))
    if existing_url:
        return ROOT / "public" / existing_url.lstrip("/")
    return ASSET_DIR / plu / asset_name(source)


def pixel_distance(a, b):
    return sum((a[i] - b[i]) ** 2 for i in range(3)) ** 0.5


def visual_colour_label(source, candidates):
    candidates = [c for c in candidates if c in COLOUR_PALETTE]
    if not candidates:
        return None
    try:
        with Image.open(source) as img:
            img = ImageOps.exif_transpose(img)
            if img.mode in ("RGBA", "LA") or "transparency" in img.info:
                background = Image.new("RGBA", img.size, (255, 255, 255, 255))
                background.alpha_composite(img.convert("RGBA"))
                img = background.convert("RGB")
            else:
                img = img.convert("RGB")
            img.thumbnail((120, 120), Image.Resampling.BILINEAR)
            pixels = list(img.getdata())
    except Exception:
        return None

    votes = Counter()
    considered = 0
    neutral_candidates = {"Black", "White", "Gray", "Silver", "Gunmetal", "Clear", "Natural"}
    for red, green, blue in pixels:
        high = max(red, green, blue)
        low = min(red, green, blue)
        saturation = 0 if high == 0 else (high - low) / high
        brightness = high / 255

        # Most Trends images are photographed on a white background. Dropping
        # that background prevents white page space from winning over the item.
        if brightness > 0.92 and saturation < 0.12:
            continue

        if brightness < 0.06:
            continue

        if saturation < 0.10 and brightness > 0.75 and not any(c in neutral_candidates for c in candidates):
            continue

        nearest = min(candidates, key=lambda c: pixel_distance((red, green, blue), COLOUR_PALETTE[c]))
        if pixel_distance((red, green, blue), COLOUR_PALETTE[nearest]) <= 150:
            votes[nearest] += 1
            considered += 1

    if considered < 140:
        return None

    [(winner, count), *rest] = votes.most_common(2)
    ratio = count / considered
    runner_up = rest[0][1] / considered if rest else 0
    if ratio >= 0.34 and ratio - runner_up >= 0.10:
        return winner
    return None


def assign_colour_labels(image_files, colours):
    canonical_options = [canonical_colour(colour) for colour in colours]
    canonical_options = [colour for colour in canonical_options if colour]
    labels = [None] * len(image_files)
    methods = Counter()
    skip_visual_indices = set()

    if not image_files or not canonical_options:
        methods["unassigned"] += len(image_files)
        return labels, methods

    if len(set(canonical_options)) == 1:
        labels = [canonical_options[0]] * len(image_files)
        methods["single_colour"] += len(image_files)
        return labels, methods

    if len(image_files) > len(canonical_options):
        for index, label in enumerate(canonical_options, start=1):
            labels[index] = label
            methods["sequence_colour"] += 1
        skip_visual_indices = set(range(len(image_files))) - set(range(1, len(canonical_options) + 1))
    elif len(image_files) == len(canonical_options):
        for index, label in enumerate(canonical_options):
            labels[index] = label
            methods["sequence_colour"] += 1

    for index, (_, source) in enumerate(image_files):
        if labels[index]:
            continue
        if index in skip_visual_indices:
            methods["unassigned"] += 1
            continue
        if not ENABLE_VISUAL_COLOUR:
            methods["unassigned"] += 1
            continue
        label = visual_colour_label(source, sorted(set(canonical_options)))
        if label:
            labels[index] = label
            methods["visual_colour"] += 1
        else:
            methods["unassigned"] += 1

    return labels, methods


def convert_one(task):
    source, dest = map(Path, task)
    dest.parent.mkdir(parents=True, exist_ok=True)
    if REUSE_EXISTING_ASSETS and not FORCE_REBUILD and dest.exists():
        return {"status": "cached", "source": str(source), "dest": str(dest)}
    if not FORCE_REBUILD and dest.exists() and dest.stat().st_mtime >= source.stat().st_mtime:
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
    existing_asset_map = load_existing_asset_map()

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
    assignment_methods = Counter()

    for product_index, plu in enumerate(sorted(product_by_plu)):
        row = product_by_plu[plu]
        image_files = sorted(files_by_plu.get(plu, []), key=lambda item: (item[0], item[1].name))
        colours = split_colours(row.get("Colours"))
        colour_labels, label_methods = assign_colour_labels(image_files, colours)
        assignment_methods.update(label_methods)

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
            dest = destination_for(plu, source, existing_asset_map)
            tasks.append((source, dest))
            rel = "/" + dest.relative_to(ROOT / "public").as_posix()
            gallery_rows.append(
                {
                    "plu": plu,
                    "image_code": f"{plu}-{image_index + 1:02d}",
                    "image_url": rel,
                    "source_filename": source.name,
                    "colour_label": colour_labels[image_index],
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
                "colour_labelled_images": sum(1 for row in gallery_rows if row.get("colour_label")),
                "colour_assignment_methods": dict(sorted(assignment_methods.items())),
                "visual_colour_enabled": ENABLE_VISUAL_COLOUR,
                "force_rebuild": FORCE_REBUILD,
                "reuse_existing_assets": REUSE_EXISTING_ASSETS,
            },
            indent=2,
            ensure_ascii=False,
        )
    )
    print(json.dumps(json.loads((OUT_DIR / "gallery-build-summary.json").read_text()), indent=2))


if __name__ == "__main__":
    main()
