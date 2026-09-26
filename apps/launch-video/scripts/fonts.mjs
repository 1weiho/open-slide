import fs from 'node:fs';
import path from 'node:path';
import { FONT_CSS } from '../src/theme.js';

// Headless renders shouldn't depend on network access, so the Google Fonts
// stylesheet and its latin woff2 files are cached under out/fonts.
const root = path.resolve(import.meta.dirname, '..');
const dir = path.join(root, 'out/fonts');
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

export async function ensureFonts({ force = false } = {}) {
  const cssFile = path.join(dir, 'fonts.css');
  if (!force && fs.existsSync(cssFile)) return cssFile;
  fs.mkdirSync(dir, { recursive: true });
  const css = await (await fetch(FONT_CSS, { headers: { 'user-agent': UA } })).text();
  const blocks = css.split('/* ').filter((b) => /^latin(-ext)? \*\//.test(b));
  let out = '';
  let n = 0;
  for (const block of blocks) {
    const url = block.match(/url\((https:[^)]+)\)/)?.[1];
    if (!url) continue;
    const file = `f${String(n++).padStart(3, '0')}.woff2`;
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    fs.writeFileSync(path.join(dir, file), buf);
    out += `/* ${block.replace(url, `./${file}`)}`;
  }
  fs.writeFileSync(cssFile, out);
  console.log(`cached ${n} font files in ${path.relative(process.cwd(), dir)}`);
  return cssFile;
}

if (process.argv[1] === import.meta.filename) {
  await ensureFonts({ force: true });
}
