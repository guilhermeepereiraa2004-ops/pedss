"""Encode the approved transparent brand masters for web delivery (requires Pillow)."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
output = root / "public/brand"
output.mkdir(exist_ok=True)
logo = Image.open(root / "design/brand/peds-logo-green-master.png").convert("RGBA")
logo.resize((900, 300), Image.Resampling.LANCZOS).save(
    output / "peds-logo-green-v1.webp", "WEBP", quality=93, method=6, exact=True
)
mascot = Image.open(root / "design/brand/peds-mascot-green-master.png").convert("RGBA")
for size in (640, 960):
    mascot.resize((size, size), Image.Resampling.LANCZOS).save(
        output / f"peds-mascot-hero-{size}-v1.webp", "WEBP", quality=90, method=6, exact=True
    )
for size in (32, 64, 180):
    mascot.resize((size, size), Image.Resampling.LANCZOS).save(
        output / f"peds-icon-{size}-v1.png", optimize=True
    )
mascot.save(output / "peds-favicon-v1.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
for asset in output.iterdir():
    print(f"{asset.name}: {asset.stat().st_size:,} bytes")
