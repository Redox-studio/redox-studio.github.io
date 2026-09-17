import sharp from "sharp";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";

// Keep all original PNGs. These committed derivatives need no runtime image service.
const source = new URL("../public/assets/qianli/", import.meta.url);
const output = new URL("web/", source);
const og = new URL("../public/assets/og/", import.meta.url);
await mkdir(output, { recursive: true });
await mkdir(og, { recursive: true });
for (const name of await readdir(source)) {
  if (!name.endsWith("-final.png")) continue;
  for (const width of [480, 840, 1206]) {
    await sharp(await readFile(new URL(name, source)))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 90, effort: 6, smartSubsample: true })
      .toFile(new URL(`${name.replace(".png", "")}-${width}.webp`, output).pathname);
  }
}
await sharp(await readFile(new URL("appicon-1024.png", source)))
  .resize(192, 192).webp({ quality: 95, effort: 6 })
  .toFile(new URL("appicon-192.webp", output).pathname);

const favicon = await readFile(new URL("../public/favicon.svg", import.meta.url));
await sharp(favicon).resize(180, 180).png()
  .toFile(new URL("../public/apple-touch-icon.png", import.meta.url).pathname);
const sizes = [16, 32, 48];
const icons = await Promise.all(sizes.map((size) => sharp(favicon).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * icons.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icons.length, 4);
let offset = header.length;
icons.forEach((icon, index) => {
  const entry = 6 + index * 16;
  header[entry] = header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(icon.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += icon.length;
});
await writeFile(new URL("../public/favicon.ico", import.meta.url), Buffer.concat([header, ...icons]));

// System fonts only; no downloaded font or invented product imagery.
const redox = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#f5f4ef"/>
  <path d="M72 70h1056M72 560h1056" stroke="#d1d2c8"/>
  <g font-family="Arial, Helvetica, sans-serif" fill="#22231f">
    <text x="72" y="237" font-size="112" font-weight="700" letter-spacing="-6">REDOX</text>
    <text x="72" y="340" font-size="112" font-weight="700" letter-spacing="-6">STUDIO<tspan fill="#797c68">.</tspan></text>
    <text x="75" y="431" font-family="PingFang SC, sans-serif" font-size="30">做我们自己想用的 App，</text>
    <text x="75" y="476" font-family="PingFang SC, sans-serif" font-size="30">也做我们自己想玩的游戏。</text>
    <text x="1128" y="529" text-anchor="end" fill="#66675f" font-size="20">redox.studio</text>
  </g>
</svg>`;
await sharp(Buffer.from(redox)).jpeg({ quality: 93, chromaSubsampling: "4:4:4" })
  .toFile(new URL("redox-og.jpg", og).pathname);
const qianli = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><linearGradient id="sea" x2="0" y2="1"><stop stop-color="#0b2027"/><stop offset="1" stop-color="#061216"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#sea)"/>
  <path d="M72 70h1056M72 560h1056" stroke="#294047"/>
  <g fill="#edf5f6" font-family="Songti SC, serif">
    <text x="75" y="223" font-size="84">潜历</text>
    <text x="75" y="337" font-size="52">什么时候，去哪潜水？</text>
  </g>
  <g font-family="Arial, PingFang SC, sans-serif" fill="#9aaeb3">
    <text x="78" y="400" font-size="23" letter-spacing="3">Qianli for iPhone</text>
    <text x="75" y="529" font-size="18" letter-spacing="2">REDOX STUDIO</text>
    <text x="1128" y="529" text-anchor="end" font-size="20">redox.studio/qianli</text>
  </g>
</svg>`;
const icon = await sharp(await readFile(new URL("appicon-1024.png", source))).resize(240, 240).png().toBuffer();
const mask = Buffer.from('<svg width="240" height="240"><rect width="240" height="240" rx="52" fill="white"/></svg>');
const roundedIcon = await sharp(icon).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
await sharp(Buffer.from(qianli)).composite([{ input: roundedIcon, left: 864, top: 180 }])
  .jpeg({ quality: 93, chromaSubsampling: "4:4:4" }).toFile(new URL("qianli-og.jpg", og).pathname);
console.log("Generated WebP derivatives, Redox icons and 1200×630 social cards.");
