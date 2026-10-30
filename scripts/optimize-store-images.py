"""Rebuild bundled responsive photos with Pillow; originals remain available for legacy URLs."""

import hashlib
import json
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent.parent
images = root / "public/images"
output = images / "optimized"
output.mkdir(exist_ok=True)
sources = {
    "hero-burger-crisp.png": [640, 1254],
    "hero-pizza.png": [640, 1254],
    "hero-pizza-v2.png": [640, 1254],
    "hero-pizza-v3.png": [640, 1254],
    "hero-acai.png": [640, 1219],
    "hero-icecream.png": [640, 1254],
    "hero-snacks.png": [640, 1254],
    "hero-pastel.png": [640, 1254],
    "brasa-burger.png": [640, 1254],
    "menu-brasa-only.png": [480, 800, 1200],
    "menu-fries-cutout.png": [480, 800, 1200],
    "menu-drink-cutout.png": [480, 800, 1200],
    "menu-dessert-cutout.png": [480, 800, 1200],
}
manifest = {}
for source, widths in sources.items():
    original = Image.open(images / source).convert("RGBA")
    variants = []
    for width in widths:
        width = min(width, original.width)
        height = round(original.height * width / original.width)
        resized = original.resize((width, height), Image.Resampling.LANCZOS)
        temporary = output / "encoding.webp"
        resized.save(temporary, "WEBP", quality=88, method=6, exact=True)
        encoded = temporary.read_bytes()
        digest = hashlib.sha256(encoded).hexdigest()[:12]
        target = output / f"{Path(source).stem}-{width}-{digest}.webp"
        temporary.replace(target)
        decoded = Image.open(target).convert("RGBA")
        assert decoded.size == (width, height)
        assert decoded.getchannel("A").tobytes() == resized.getchannel("A").tobytes()
        variants.append({"src": f"/images/optimized/{target.name}", "width": width})
    manifest[f"/images/{source}"] = variants
    if source.startswith("menu-"):
        manifest[f"/images/{Path(source).stem}.webp"] = variants
    print(f"{source}: {original.size}, {len(encoded):,} bytes (largest)")
(root / "src/lib/storeImageVariants.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
