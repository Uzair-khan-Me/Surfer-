import { chromium } from "@playwright/test";
import { createServer } from "vite";
import fs from "node:fs";
import path from "node:path";

const publicDir = path.resolve("public");
fs.mkdirSync(publicDir, { recursive: true });

// 1. Write crisp SVG favicon
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#11313b"/>
      <stop offset="100%" stop-color="#071b22"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#bg)"/>
  <rect x="4" y="4" width="120" height="120" rx="24" fill="none" stroke="#d5f884" stroke-opacity="0.28" stroke-width="2"/>
  <g transform="translate(64 64) rotate(-14) translate(-64 -64)" fill="none" stroke="#d5f884" stroke-width="9.5" stroke-linecap="round">
    <path d="M26 44 C40 30, 52 58, 64 44 C76 30, 88 58, 102 44"/>
    <path d="M26 64 C40 50, 52 78, 64 64 C76 50, 88 78, 102 64"/>
    <path d="M26 84 C40 70, 52 98, 64 84 C76 70, 88 98, 102 84"/>
  </g>
  <circle cx="99" cy="29" r="6" fill="#ffc45e"/>
</svg>
`;
fs.writeFileSync(path.join(publicDir, "favicon.svg"), faviconSvg);

const vite = await createServer({
  server: { port: 5199, strictPort: true },
  logLevel: "error",
});
await vite.listen();

const browser = await chromium.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});

try {
  // Capture 16:9 mid-action gameplay screenshot (1200x675)
  const gamePage = await browser.newPage({
    viewport: { width: 1200, height: 675 },
    deviceScaleFactor: 1,
  });
  await gamePage.goto("http://localhost:5199", { waitUntil: "networkidle" });
  await gamePage.waitForTimeout(600);
  await gamePage.click("#play");
  await gamePage.evaluate(() => {
    const g = window.__afterlight;
    g.paused = true;
    // Advance simulation so trains, barriers, overhead gates, and coins populate the 3 lanes nicely
    for (let i = 0; i < 210; i++) {
      const ahead = g.encounters.rows
        .filter((r) => r.group.position.z < 4)
        .sort((a, b) => b.group.position.z - a.group.position.z)[0];
      if (ahead && ahead.group.position.z < -8) g.player.lane = ahead.safeLane;
      g.step(1 / 120);
    }
    g.player.jump();
    for (let i = 0; i < 18; i++) g.player.update(1 / 120);
    g.setCamera(true);
    g.ui.update(g.score, 15.4, 12);
    document.getElementById("tutorial").hidden = true;
    g.renderer.render(g.scene, g.camera);
  });
  await gamePage.waitForTimeout(150);
  await gamePage.screenshot({
    path: path.join(publicDir, "gameplay-action.png"),
  });

  // Extract raw WebGL canvas frame for compositing a sharp 1200x630 OG card
  await gamePage.setViewportSize({ width: 1200, height: 630 });
  await gamePage.evaluate(() => {
    const g = window.__afterlight;
    g.resize();
    g.camera.setViewOffset(1200, 630, -250, 0, 1200, 630);
    g.camera.updateProjectionMatrix();
    g.renderer.render(g.scene, g.camera);
    document.getElementById("ui").style.display = "none";
  });
  await gamePage.waitForTimeout(100);
  const rawSceneBuf = await gamePage.screenshot();
  const sceneBase64 = rawSceneBuf.toString("base64");
  await gamePage.close();

  // Render 1200x630 Open Graph / Twitter Social Card
  const ogPage = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await ogPage.setContent(`<!doctype html>
  <html>
  <head>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 1200px; height: 630px; overflow: hidden;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background: #071b22; color: #f1f1dd; position: relative;
      }
      .bg {
        position: absolute; inset: 0;
        background: url("data:image/png;base64,${sceneBase64}") center/cover no-repeat;
      }
      .shade {
        position: absolute; inset: 0;
        background:
          linear-gradient(90deg, rgba(6,22,28,0.97) 0%, rgba(7,25,31,0.90) 44%, rgba(7,25,31,0.28) 76%, rgba(7,25,31,0.10) 100%),
          linear-gradient(0deg, rgba(6,22,28,0.88) 0%, transparent 34%);
      }
      .wrap {
        position: relative; z-index: 2;
        height: 100%; padding: 54px 64px;
        display: flex; flex-direction: column; justify-content: space-between;
      }
      .top {
        display: flex; align-items: center; gap: 14px;
        font-size: 16px; font-weight: 800; letter-spacing: 2.5px; color: #e8efda;
      }
      .badge {
        background: rgba(213, 248, 132, 0.14);
        border: 1px solid rgba(213, 248, 132, 0.45);
        color: #d5f884;
        padding: 7px 14px; border-radius: 999px;
        font-size: 13px; font-weight: 700; letter-spacing: 1.8px;
      }
      .title {
        font-size: 98px; font-weight: 900; font-style: italic;
        line-height: 0.86; letter-spacing: -2.5px; text-transform: uppercase;
        color: #f4f7e8; margin: 14px 0 20px;
      }
      .title span { color: #d5f884; }
      .sub {
        font-size: 23px; line-height: 1.45; color: #b8cbc5; max-width: 610px; font-weight: 500;
      }
      .bottom {
        display: flex; align-items: center; gap: 22px;
      }
      .cta {
        background: #d5f884; color: #0b2426;
        padding: 16px 28px; border-radius: 6px;
        font-size: 17px; font-weight: 900; letter-spacing: 1.6px;
      }
      .pills {
        display: flex; gap: 12px; flex-wrap: wrap;
      }
      .pill {
        border: 1px solid rgba(175, 205, 195, 0.3);
        background: rgba(12, 36, 44, 0.72);
        color: #d4e4dd; padding: 10px 16px; border-radius: 6px;
        font-size: 14px; font-weight: 600; letter-spacing: 1px;
      }
    </style>
  </head>
  <body>
    <div class="bg"></div>
    <div class="shade"></div>
    <div class="wrap">
      <div class="top">
        <span class="badge">● FREE 3D BROWSER GAME · NO DOWNLOAD</span>
      </div>
      <div>
        <div class="title">AFTERLIGHT<br><span>RUN</span> ✳</div>
        <p class="sub">Three-lane neon transit endless runner. Dodge trains, jump barriers, slide gates &amp; chase high scores instantly on PC, Chromebook &amp; mobile.</p>
      </div>
      <div class="bottom">
        <div class="cta">PLAY INSTANTLY ↗</div>
        <div class="pills">
          <span class="pill">NO INSTALL</span>
          <span class="pill">120 HZ PHYSICS</span>
          <span class="pill">KEYBOARD + TOUCH</span>
        </div>
      </div>
    </div>
  </body>
  </html>`);
  await ogPage.screenshot({ path: path.join(publicDir, "og-image.png") });
  await ogPage.close();

  // Render PNG icons required by Google Search favicon guidelines (48x48), Apple iOS (180x180), and Android PWA (192x192, 512x512)
  for (const [filename, size] of [
    ["favicon-48x48.png", 48],
    ["apple-touch-icon.png", 180],
    ["icon-192.png", 192],
    ["icon-512.png", 512],
  ]) {
    const iconPage = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await iconPage.setContent(
      `<!doctype html><style>*{margin:0;padding:0}body{width:${size}px;height:${size}px;overflow:hidden;background:transparent}svg{width:100%;height:100%;display:block}</style>${faviconSvg}`,
    );
    await iconPage.screenshot({
      path: path.join(publicDir, filename),
      omitBackground: filename !== "apple-touch-icon.png",
    });
    await iconPage.close();
  }
  console.log("Generated all SEO images & icons in public/");
} finally {
  await browser.close();
  await vite.close();
}
