#!/usr/bin/env python3
import json
import os
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "public" / "assets" / "products"
MAX_IMAGE_EDGE = int(os.environ.get("PRODUCT_ASSET_MAX_EDGE", "640"))
WEBP_QUALITY = int(os.environ.get("PRODUCT_ASSET_WEBP_QUALITY", "50"))


def optimise_one(path_value):
    path = Path(path_value)
    original_size = path.stat().st_size
    tmp = path.with_suffix(".tmp.webp")
    try:
        with Image.open(path) as img:
            img = ImageOps.exif_transpose(img).convert("RGB")
            original_dimensions = img.size
            img.thumbnail((MAX_IMAGE_EDGE, MAX_IMAGE_EDGE), Image.Resampling.LANCZOS)
            img.save(tmp, "WEBP", quality=WEBP_QUALITY, method=6)

        optimised_size = tmp.stat().st_size
        if optimised_size < original_size:
            tmp.replace(path)
            return {
                "status": "optimised",
                "path": str(path),
                "before": original_size,
                "after": optimised_size,
                "dimensions_before": original_dimensions,
            }

        tmp.unlink(missing_ok=True)
        return {"status": "kept", "path": str(path), "before": original_size, "after": original_size}
    except Exception as exc:
        tmp.unlink(missing_ok=True)
        return {"status": "error", "path": str(path), "before": original_size, "after": original_size, "error": str(exc)}


def main():
    paths = sorted(str(path) for path in ASSET_DIR.rglob("*.webp"))
    summary = {
        "files": len(paths),
        "optimised": 0,
        "kept": 0,
        "errors": 0,
        "bytes_before": 0,
        "bytes_after": 0,
        "max_image_edge": MAX_IMAGE_EDGE,
        "webp_quality": WEBP_QUALITY,
        "sample_errors": [],
    }

    with ProcessPoolExecutor() as pool:
        futures = [pool.submit(optimise_one, path) for path in paths]
        for future in as_completed(futures):
            result = future.result()
            summary[result["status"]] = summary.get(result["status"], 0) + 1
            summary["bytes_before"] += result.get("before", 0)
            summary["bytes_after"] += result.get("after", 0)
            if result["status"] == "error" and len(summary["sample_errors"]) < 20:
                summary["sample_errors"].append(result)

    summary["bytes_saved"] = summary["bytes_before"] - summary["bytes_after"]
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
