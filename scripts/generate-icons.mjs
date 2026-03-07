import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const iconPath = path.join(root, "src", "app", "icon.svg");
const publicDir = path.join(root, "public");

const outputs = [
  { file: "favicon-16x16.png", size: 16 },
  { file: "favicon-32x32.png", size: 32 },
  { file: "apple-touch-icon.png", size: 180 },
  { file: "android-chrome-192x192.png", size: 192 },
  { file: "android-chrome-512x512.png", size: 512 },
];

await mkdir(publicDir, { recursive: true });

for (const output of outputs) {
  await sharp(iconPath)
    .resize(output.size, output.size)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, output.file));
}

const logoBuffer = await sharp(iconPath).resize(320, 320).png().toBuffer();
const ogWidth = 1200;
const ogHeight = 630;
const logoSize = 320;
const logoLeft = Math.round((ogWidth - logoSize) / 2);
const logoTop = Math.round((ogHeight - logoSize) / 2) - 40;

const ogImage = await sharp({
  create: {
    width: ogWidth,
    height: ogHeight,
    channels: 4,
    background: "#09090B",
  },
})
  .composite([
    {
      input: logoBuffer,
      left: logoLeft,
      top: logoTop,
    },
  ])
  .png({ quality: 100, compressionLevel: 9 })
  .toBuffer();

await writeFile(path.join(publicDir, "og-image.png"), ogImage);

console.log("Generated favicon + SEO PNG assets in /public");