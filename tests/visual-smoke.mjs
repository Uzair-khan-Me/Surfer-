import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://localhost:5173");
await page.waitForTimeout(500);
await page.click("#play");
await page.waitForTimeout(300);
await page.keyboard.press("ArrowLeft");
await page.evaluate(() => {
  const g = window.__afterlight;
  g.paused = true;
  g.player.jump();
  g.player.update(1 / 120);
});
const result = await page.evaluate(() => {
  const g = window.__afterlight;
  g.paused = true;
  return {
    state: g.state,
    lane: g.player.lane,
    height: g.player.y,
    calls: g.renderer.info.render.calls,
    triangles: g.renderer.info.render.triangles,
    geometries: g.renderer.info.memory.geometries,
    textures: g.renderer.info.memory.textures,
    quality: g.quality?.tier,
  };
});
assert.equal(result.state, "PLAYING");
assert.equal(result.lane, 0);
assert.ok(result.height > 0);
assert.deepEqual(errors, []);
fs.mkdirSync(".test-artifacts", { recursive: true });
await page.screenshot({
  path: `.test-artifacts/${process.env.STAGE || "visual"}-desktop.png`,
});
console.log(result);
await browser.close();
