import fs from "node:fs";
import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import variants from "../src/lib/storeImageVariants.json";
import { storeImage } from "../src/lib/storeImages";

it("PHOTO-ASSETS-01 responsive assets exist, keep content hashes and reduce original transfer size", () => {
  for (const [source, images] of Object.entries(variants)) {
    const original = fs.statSync(`public${source}`).size;
    for (const image of images) {
      const file = fs.readFileSync(`public${image.src}`);
      expect(file.subarray(0, 4).toString()).toBe("RIFF");
      expect(file.subarray(8, 12).toString()).toBe("WEBP");
      expect(image.src).toMatch(/-\d+-[a-f0-9]{12}\.webp$/);
      expect(image.src).toContain(createHash("sha256").update(file).digest("hex").slice(0, 12));
      expect(file.length).toBeLessThan(original);
    }
  }
});

it("PHOTO-ASSETS-02 remote and uploaded photos are not rewritten as illustrations", () => {
  for (const src of ["https://example.com/product.png", "data:image/webp;base64,abc", "/own.png"]) {
    expect(storeImage(src)).toEqual({ src });
  }
});
