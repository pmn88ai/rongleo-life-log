import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const anySvg = join(__dirname, 'icon-source-any.svg');
const maskableSvg = join(__dirname, 'icon-source-maskable.svg');

async function render(srcSvg, size, outFile) {
  await sharp(srcSvg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(join(outDir, outFile));
  console.log('wrote', outFile, `${size}x${size}`);
}

async function main() {
  await render(anySvg, 192, 'icon-192.png');
  await render(anySvg, 512, 'icon-512.png');
  await render(maskableSvg, 192, 'icon-maskable-192.png');
  await render(maskableSvg, 512, 'icon-maskable-512.png');
  // iOS applies its own corner rounding, so apple-touch-icon uses the
  // full-bleed (maskable-style) source, not the pre-rounded "any" one.
  await render(maskableSvg, 180, 'apple-touch-icon.png');
  await render(anySvg, 32, 'favicon-32.png');
  await render(anySvg, 16, 'favicon-16.png');
}

main().catch(err => { console.error(err); process.exit(1); });
