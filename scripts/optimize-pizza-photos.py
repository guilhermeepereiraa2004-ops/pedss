"""Optimize generated photos without altering their content; keep original PNGs and alpha."""
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
spec = json.loads((root / "design/pizzas/generation.json").read_text(encoding="utf-8"))
originals = root / "design/pizzas/originals"
output = root / "public/images/pizzas"
originals.mkdir(parents=True, exist_ok=True)
output.mkdir(parents=True, exist_ok=True)
manifest = {}
for item in spec["images"]:
    original = root / item["workspaceSource"] if item.get("workspaceSource") else originals / f"{item['key']}.png"
    if not original.exists():
        shutil.copy2(item["sourcePath"], original)
    image = Image.open(original).convert("RGBA")
    assert image.getchannel("A").getextrema() == (0, 255), "Expected transparent generated PNG"
    assert image.width == image.height, "Expected aligned square photos"
    image.thumbnail((768, 768), Image.Resampling.LANCZOS)
    temporary = output / f"{item['key']}-encoding.webp"
    image.save(temporary, "WEBP", quality=86, method=6, exact=True)
    content = temporary.read_bytes()
    digest = hashlib.sha256(content).hexdigest()[:12]
    target = output / f"{item['key']}-768-{digest}.webp"
    temporary.replace(target)
    decoded = Image.open(target).convert("RGBA")
    assert decoded.getchannel("A").tobytes() == image.getchannel("A").tobytes()
    manifest[item["key"]] = {"src": f"/images/pizzas/{target.name}", "width": image.width,
                             "height": image.height, "bytes": len(content)}
    print(f"{item['key']}: {image.size}, {len(content)} bytes, alpha preserved")
(root / "src/lib/pizzaPhotos.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
