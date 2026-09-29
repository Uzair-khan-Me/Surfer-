/**
 * Regenerates the brand artwork that ships in `public/`:
 * app icons, the 1200x630 social card and the screenshots referenced by
 * structured data, the web app manifest and the sitemap.
 *
 *   npm run dev                 # in one terminal
 *   npm run art                 # in another
 *
 * Needs a Chromium binary. Set CHROMIUM_EXECUTABLE to override the default
 * path, and LD_LIBRARY_PATH if your build needs extra shared libraries.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = fileURLToPath(new URL("..", import.meta.url));
const publicDir = join(root, "public");
const shotsDir = join(publicDir, "screenshots");
mkdirSync(shotsDir, { recursive: true });

const executablePath = process.env.CHROMIUM_EXECUTABLE || "/tmp/chromium";
const siteUrl = process.env.SITE_URL || "http://localhost:5173";

const browser = await chromium.launch({
  executablePath,
  headless: true,
  timeout: 90_000,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});

const font = (path) =>
  `data:font/woff2;base64,${readFileSync(join(root, "node_modules", path)).toString("base64")}`;

const display = font(
  "@fontsource/barlow-condensed/files/barlow-condensed-latin-800-italic.woff2",
);
const displayUp = font(
  "@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff2",
);
const body = font("@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2");
const bodyBold = font(
  "@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff2",
);

/* ------------------------------------------------------------------- icons */

const iconSvg = readFileSync(join(publicDir, "favicon.svg"), "utf8");
const maskableSvg = iconSvg
  .replace(/rx="15"/, 'rx="0"')
  .replace(
    '<g\n    fill="none"',
    '<g transform="translate(32 32) scale(0.72) translate(-32 -32)" fill="none"',
  );

const renderIcon = async (svg, size, file) => {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
  });
  await page.setContent(
    `<!doctype html><html><body style="margin:0">${svg.replace(
      "<svg ",
      `<svg width="${size}" height="${size}" `,
    )}</body></html>`,
  );
  await page.screenshot({ path: file });
  await page.close();
  console.log(`icon      ${file.replace(root, ".")}`);
};

await renderIcon(iconSvg, 512, join(publicDir, "icon-512.png"));
await renderIcon(iconSvg, 192, join(publicDir, "icon-192.png"));
await renderIcon(iconSvg, 180, join(publicDir, "apple-touch-icon.png"));
await renderIcon(iconSvg, 32, join(publicDir, "favicon-32x32.png"));
await renderIcon(iconSvg, 16, join(publicDir, "favicon-16x16.png"));
await renderIcon(maskableSvg, 512, join(publicDir, "maskable-512.png"));

try {
  execFileSync("convert", [
    join(publicDir, "favicon-16x16.png"),
    join(publicDir, "favicon-32x32.png"),
    join(publicDir, "favicon.ico"),
  ]);
  console.log("icon      ./public/favicon.ico");
} catch (error) {
  console.warn("Could not build favicon.ico with ImageMagick:", error.message);
}

/* --------------------------------------------------------------- social card */

const rand = (seed) => () =>
  (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

const skyline = () => {
  const random = rand(42);
  const parts = [];
  let x = 232;
  while (x < 1210) {
    const width = 34 + Math.round(random() * 46);
    const height = 60 + Math.round(random() * 190);
    const tone = 26 + Math.round(random() * 22);
    parts.push(
      `<rect x="${x}" y="${630 - height}" width="${width}" height="${height}" fill="rgb(${tone - 12},${tone},${tone + 8})"/>`,
    );
    const columns = Math.max(1, Math.floor(width / 16));
    const rows = Math.max(1, Math.floor(height / 26));
    for (let column = 0; column < columns; column += 1)
      for (let row = 0; row < rows; row += 1) {
        if (random() < 0.42) continue;
        const lit = random() < 0.55;
        parts.push(
          `<rect x="${x + 6 + column * 16}" y="${630 - height + 10 + row * 26}" width="6" height="8" fill="${
            lit ? "#ffd08a" : "#2f6070"
          }" opacity="${lit ? 0.85 : 0.5}"/>`,
        );
      }
    x += width + 6;
  }
  return parts.join("");
};

const rails = () => {
  const lines = [];
  for (const offset of [-1, 0, 1]) {
    const near = 660 + offset * 300;
    const far = 745 + offset * 34;
    lines.push(
      `<line x1="${near}" y1="630" x2="${far}" y2="392" stroke="#7fd4c1" stroke-width="3" opacity="0.55"/>`,
    );
  }
  for (let step = 0; step < 16; step += 1) {
    const t = step / 16;
    const y = 630 - t * t * 238;
    const spread = 300 - t * t * 266;
    lines.push(
      `<line x1="${660 - spread}" y1="${y}" x2="${660 + spread}" y2="${y}" stroke="#6aa79a" stroke-width="${
        2.4 - t * 1.6
      }" opacity="0.5"/>`,
    );
  }
  return lines.join("");
};

const card = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><style>
  @font-face { font-family: "BC"; font-weight: 800; font-style: italic; src: url(${display}) format("woff2"); }
  @font-face { font-family: "BC"; font-weight: 800; font-style: normal; src: url(${displayUp}) format("woff2"); }
  @font-face { font-family: "DM"; font-weight: 400; src: url(${body}) format("woff2"); }
  @font-face { font-family: "DM"; font-weight: 700; src: url(${bodyBold}) format("woff2"); }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
  body {
    font-family: "DM", Arial, sans-serif;
    color: #f1f1dd;
    background: radial-gradient(115% 130% at 78% 8%, #1d4553 0%, #102c37 42%, #071b22 100%);
    position: relative;
  }
  .moon { position: absolute; right: 118px; top: 58px; width: 168px; height: 168px; border-radius: 50%;
    background: radial-gradient(circle at 38% 34%, #fff5d6, #f0dca9 62%, #d9c58e 100%);
    box-shadow: 0 0 120px 40px rgba(246, 231, 189, 0.22); }
  .city { position: absolute; inset: auto 0 0 0; }
  .rails { position: absolute; inset: 0; }
  .vignette { position: absolute; inset: 0; background:
    linear-gradient(90deg, rgba(7, 27, 34, 0.96) 0%, rgba(7, 27, 34, 0.86) 34%, rgba(7, 27, 34, 0.28) 62%, rgba(7, 27, 34, 0) 82%),
    linear-gradient(0deg, rgba(6, 22, 28, 0.9) 0%, rgba(6, 22, 28, 0) 46%); }
  .content { position: absolute; left: 74px; top: 74px; width: 640px; }
  .eyebrow { display: flex; align-items: center; gap: 12px; font-size: 15px; font-weight: 700;
    letter-spacing: 3px; color: #d5f884; text-transform: uppercase; margin: 0 0 26px; }
  .dot { width: 9px; height: 9px; border-radius: 50%; background: #d5f884; box-shadow: 0 0 16px rgba(213,248,132,.6); }
  h1 { font-family: "BC"; font-style: italic; font-weight: 800; font-size: 118px; line-height: 0.82;
    letter-spacing: -3px; margin: 0; text-transform: uppercase; text-shadow: 0 12px 40px rgba(0,0,0,.45); }
  h1 em { display: block; font-style: italic; color: #d5f884; }
  .star { font-size: 54px; color: #d5f884; font-style: normal; line-height: 0.8; padding-top: 8px; }
  .tag { font-size: 23px; line-height: 1.55; color: #c3d6d0; margin: 26px 0 0; max-width: 520px; }
  .headline { display: flex; align-items: flex-start; gap: 22px; }
  .chips { display: flex; gap: 12px; margin: 34px 0 0; }
  .chip { font-size: 14px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    color: #e7f3e2; border: 1px solid rgba(133, 172, 136, 0.55); border-radius: 999px; padding: 9px 18px; }
  .url { position: absolute; left: 74px; bottom: 40px; margin: 0; font-size: 17px; letter-spacing: 2px;
    color: #9fb6b0; text-transform: uppercase; }
  .rule { position: absolute; left: 74px; right: 74px; bottom: 92px; height: 1px;
    background: linear-gradient(90deg, rgba(213,248,132,.5), rgba(213,248,132,0)); }
  .url b { color: #d5f884; font-weight: 700; }
</style></head>
<body>
  <div class="moon"></div>
  <svg class="city" width="1200" height="630" viewBox="0 0 1200 630">${skyline()}</svg>
  <svg class="rails" width="1200" height="630" viewBox="0 0 1200 630">${rails()}</svg>
  <div class="vignette"></div>
  <div class="content">
    <p class="eyebrow"><span class="dot"></span> Free browser game — no download</p>
    <div class="headline">
      <h1>Afterlight <em>Run</em></h1>
      <span class="star">✳</span>
    </div>
    <p class="tag">Chase the last light through a neon transit district that never ends.</p>
    <div class="chips">
      <span class="chip">3 lanes</span>
      <span class="chip">No ads</span>
      <span class="chip">Plays offline</span>
    </div>
  </div>
  <div class="rule"></div>
  <p class="url"><b>surfer-pc.vercel.app</b> — free endless runner</p>
</body></html>`;

const cardPage = await browser.newPage({
  viewport: { width: 1200, height: 630 },
});
await cardPage.setContent(card);
await cardPage.evaluate(() => document.fonts.ready);
await cardPage.waitForTimeout(300);
await cardPage.screenshot({ path: join(publicDir, "og-image.png") });
await cardPage.close();
console.log("card      ./public/og-image.png");

/* ------------------------------------------------------------- screenshots */

const shoot = async (name, width, height, act) => {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await page.goto(`${siteUrl}/`, { waitUntil: "load", timeout: 60_000 });
  await page.waitForTimeout(3200);
  if (act) await act(page);
  await page.screenshot({ path: join(shotsDir, `${name}.png`) });
  console.log(`shot      ./public/screenshots/${name}.png`);
  await page.close();
};

await shoot("menu-desktop", 1440, 900);
await shoot("gameplay-desktop", 1440, 900, async (page) => {
  await page.click("#play");
  await page.waitForTimeout(4200);
});
await shoot("menu-mobile", 390, 844);

/* ------------------------------------- social card built from a real frame */

const buildSocialCard = async () => {
  const page = await browser.newPage({
    viewport: { width: 1366, height: 700 },
  });
  await page.goto(`${siteUrl}/`, { waitUntil: "load", timeout: 60_000 });
  await page.waitForTimeout(3600);
  const shot = (await page.screenshot()).toString("base64");
  await page.close();

  const cardPage = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  });
  await cardPage.setContent(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><style>
  @font-face { font-family: "BC"; font-weight: 800; font-style: italic; src: url(${display}) format("woff2"); }
  @font-face { font-family: "BC"; font-weight: 800; font-style: normal; src: url(${displayUp}) format("woff2"); }
  @font-face { font-family: "DM"; font-weight: 400; src: url(${body}) format("woff2"); }
  @font-face { font-family: "DM"; font-weight: 700; src: url(${bodyBold}) format("woff2"); }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; font-family: "DM", Arial, sans-serif; }
  body { display: grid; grid-template-columns: 580px 1fr; background: #071b22; }
  .copy { padding: 64px 0 58px 64px; display: flex; flex-direction: column; color: #f1f1dd;
    background: radial-gradient(120% 100% at 0% 0%, #16323c 0%, #0c2731 55%, #071b22 100%); }
  .eyebrow { display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 700;
    letter-spacing: 3px; color: #d5f884; text-transform: uppercase; margin: 0; }
  .dot { width: 9px; height: 9px; border-radius: 50%; background: #d5f884; box-shadow: 0 0 16px rgba(213,248,132,.6); }
  .headline { display: flex; align-items: flex-start; gap: 20px; margin: 34px 0 0; }
  h1 { font-family: "BC"; font-style: italic; font-weight: 800; font-size: 96px; line-height: 0.84;
    letter-spacing: -3px; margin: 0; text-transform: uppercase; }
  h1 em { display: block; font-style: italic; color: #d5f884; }
  .star { font-size: 46px; color: #d5f884; padding-top: 6px; }
  .tag { font-size: 21px; line-height: 1.5; color: #c3d6d0; margin: 26px 0 0; max-width: 430px; }
  .chips { display: flex; flex-wrap: wrap; gap: 10px; margin: 28px 0 0; }
  .chip { font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    color: #e7f3e2; border: 1px solid rgba(133, 172, 136, 0.55); border-radius: 999px; padding: 8px 16px; }
  .foot { margin-top: auto; padding-top: 26px; }
  .rule { height: 1px; background: linear-gradient(90deg, rgba(213,248,132,.55), rgba(213,248,132,0)); margin-bottom: 16px; }
  .url { margin: 0; font-size: 16px; letter-spacing: 2px; color: #9fb6b0; text-transform: uppercase; }
  .url b { color: #d5f884; }
  .frame { position: relative; background: #071b22; border-left: 1px solid rgba(133,172,136,.35); }
  .frame .bar { display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 16px;
    background: #0d2a32; border-bottom: 1px solid rgba(133,172,136,.28); }
  .frame .bar i { width: 9px; height: 9px; border-radius: 50%; background: #2c5a60; }
  .frame .bar i:first-child { background: #d5f884; }
  .frame .bar span { margin-left: 10px; font-size: 12px; letter-spacing: 1.6px; color: #8fa79f; text-transform: uppercase; }
  .frame img { display: block; width: 620px; height: 592px; object-fit: cover; object-position: right top; }
  .badge { position: absolute; right: 18px; bottom: 18px; background: #d5f884; color: #10231f;
    font-weight: 700; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;
    padding: 11px 18px; border-radius: 3px; }
</style></head>
<body>
  <div class="copy">
    <p class="eyebrow"><span class="dot"></span> Free browser game</p>
    <div class="headline">
      <h1>Afterlight <em>Run</em></h1>
      <span class="star">✳</span>
    </div>
    <p class="tag">Chase the last light through a neon transit district that never ends.</p>
    <div class="chips">
      <span class="chip">3 lanes</span>
      <span class="chip">No download</span>
      <span class="chip">No ads</span>
      <span class="chip">Plays offline</span>
    </div>
    <div class="foot">
      <div class="rule"></div>
      <p class="url"><b>surfer-pc.vercel.app</b> — free endless runner</p>
    </div>
  </div>
  <div class="frame">
    <div class="bar"><i></i><i></i><i></i><span>Afterlight Run — play free</span></div>
    <img src="data:image/png;base64,${shot}" alt="" />
    <span class="badge">Play free ↗</span>
  </div>
</body></html>`);
  await cardPage.evaluate(() => document.fonts.ready);
  await cardPage.waitForTimeout(250);
  await cardPage.screenshot({ path: join(publicDir, "og-image.png") });
  await cardPage.close();
  console.log("card      ./public/og-image.png (from a live frame)");
};

await buildSocialCard();

await browser.close();
if (!existsSync(join(shotsDir, "menu-mobile.png"))) process.exitCode = 1;
