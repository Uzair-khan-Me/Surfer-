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
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (msg) => {
  if (msg.type() === "error" && msg.text().includes("THREE"))
    errors.push(msg.text());
});
await page.goto("http://localhost:5173");
await page.waitForFunction(() => window.__afterlight);
await page.evaluate(() => document.fonts.ready);
await page.click("#play");
await page.evaluate(() => {
  const g = window.__afterlight;
  g.paused = true;
  g.player.reset();
  g.track.reset();
  g.encounters.reset();
  // Keep the visual benchmark independent of random gameplay patterns.
  g.encounters.rows.forEach((row, index) => {
    row.safeLane = (index + 1) % 3;
    row.obstacles.forEach((obstacle, slot) => {
      obstacle.active = slot === 0;
      obstacle.group.visible = slot === 0;
      if (slot === 0)
        obstacle.set(["train", "barrier", "overhead"][index % 3], index % 3);
    });
  });
  g.score.reset();
  g.difficulty.reset();
  g.encounters.rows[0].group.position.z = -9;
  g.encounters.rows[0].obstacles[0].set("train", 2);
  g.encounters.rows[1].group.position.z = -23;
  g.encounters.rows[1].obstacles[0].set("barrier", 0);
  g.encounters.rows[2].group.position.z = -37;
  g.encounters.rows[2].obstacles[0].set("overhead", 1);
  g.coins.reset();
  g.setCamera(true);
});
const reports = {};
fs.mkdirSync(".test-artifacts", { recursive: true });
for (const tier of ["HIGH", "MEDIUM", "LOW"]) {
  await page.evaluate((tier) => {
    const g = window.__afterlight;
    g.quality.tier = tier;
    g.resize();
  }, tier);
  await page.waitForTimeout(150);
  reports[tier] = await page.evaluate(() => {
    const g = window.__afterlight;
    // Read a render of this tier, not a previous requestAnimationFrame snapshot.
    g.quality.apply();
    g.shadows.setObstacleShadows(g.quality.tier !== "LOW");
    g.shadows.update();
    g.coinRenderer.update();
    g.renderer.render(g.scene, g.camera);
    return {
      calls: g.renderer.info.render.calls,
      triangles: g.renderer.info.render.triangles,
      geometries: g.renderer.info.memory.geometries,
      textures: g.renderer.info.memory.textures,
      pixelRatio: g.renderer.getPixelRatio(),
      lights: g.scene.children.filter((o) => o.isLight).length,
    };
  });
  await page.screenshot({
    path: `.test-artifacts/3d-${tier.toLowerCase()}.png`,
  });
  assert.ok(reports[tier].calls < 200);
  assert.equal(reports[tier].lights, 2);
}
assert.ok(reports.MEDIUM.triangles < reports.HIGH.triangles);
assert.ok(reports.LOW.triangles < reports.MEDIUM.triangles);
assert.ok(reports.LOW.calls < reports.HIGH.calls);
// Pose presentation and the soft shadow must not alter logical height/position.
await page.evaluate(() => {
  const g = window.__afterlight;
  g.player.reset();
  g.player.slide();
  g.player.update(1 / 120);
});
await page.screenshot({ path: ".test-artifacts/3d-slide.png" });
assert.equal(
  await page.evaluate(() => window.__afterlight.player.height),
  0.68,
);
await page.evaluate(() => {
  const g = window.__afterlight;
  g.player.reset();
  g.player.jump();
  for (let i = 0; i < 55; i++) g.player.update(1 / 120);
});
await page.screenshot({ path: ".test-artifacts/3d-falling.png" });
await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => {
  const g = window.__afterlight;
  g.player.reset();
  g.quality.tier = "MEDIUM";
  g.resize();
});
await page.screenshot({ path: ".test-artifacts/3d-mobile.png" });
await page.setViewportSize({ width: 844, height: 390 });
await page.screenshot({ path: ".test-artifacts/3d-landscape.png" });
// After warming the reset view, restarting must not allocate fresh GPU resources.
const reset = () =>
  page.evaluate(() => {
    const g = window.__afterlight;
    g.state = "GAME_OVER";
    g.start();
    g.paused = true;
  });
await reset();
await page.waitForTimeout(100);
const first = await page.evaluate(() => ({
  ...window.__afterlight.renderer.info.memory,
}));
for (let i = 0; i < 5; i++) {
  await reset();
  await page.waitForTimeout(70);
}
const last = await page.evaluate(() => ({
  ...window.__afterlight.renderer.info.memory,
}));
assert.deepEqual(last, first);
assert.deepEqual(errors, []);
console.log(
  "Visual budgets, two lights, tiers, poses, responsive layouts, GPU resource reuse:",
  JSON.stringify(reports, null, 2),
);
console.log("GPU allocations stable through five restarts:", last);
fs.writeFileSync(
  ".test-artifacts/visual-metrics.json",
  JSON.stringify(reports, null, 2),
);
await browser.close();
