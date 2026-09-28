import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
// Default: npx playwright install chromium. A system Chromium path is optional.
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
  headless: true,
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
const gameEval = (fn) =>
  page.evaluate(async (source) => {
    return new Function("g", `return (${source})(g)`)(window.__afterlight);
  }, fn.toString());
fs.mkdirSync(".test-artifacts", { recursive: true });
await page.goto("http://localhost:5173");
await page.waitForTimeout(700);
assert.ok(await page.locator("#menu").isVisible());
await page.screenshot({ path: ".test-artifacts/menu.png" });
await page.click("#help-button");
assert.ok(await page.locator("#help").isVisible());
await page.click("#close-help");
await page.keyboard.press("Enter");
await gameEval((g) => {
  g.paused = true;
});
assert.equal(await gameEval((g) => g.state), "PLAYING");
// Input must work while gameplay is active; freeze frame timing using an explicit pause between checks.
await gameEval((g) => {
  g.paused = false;
});
await page.keyboard.press("ArrowLeft");
await gameEval((g) => {
  g.paused = true;
});
assert.equal(await gameEval((g) => g.player.lane), 0);
await gameEval((g) => {
  g.paused = false;
});
await page.keyboard.press("KeyD");
await gameEval((g) => {
  g.paused = true;
});
assert.equal(await gameEval((g) => g.player.lane), 1);
// Exact jump/slide clearance through the tutorial rows at production physics cadence.
const actions = await gameEval((g) => {
  g.player.reset();
  g.track.reset();
  g.encounters.reset();
  g.coins.reset();
  g.score.reset();
  g.difficulty.reset();
  let jumped = false,
    slid = false;
  for (let i = 0; i < 1200 && g.state === "PLAYING"; i++) {
    const z0 = g.encounters.rows[0].group.position.z,
      z1 = g.encounters.rows[1].group.position.z;
    if (!jumped && z0 > -4) {
      g.player.jump();
      jumped = true;
    }
    if (!slid && z1 > -3.6) {
      g.player.slide();
      slid = true;
    }
    g.step(1 / 120);
    if (z1 > 3) break;
  }
  return { jumped, slid, state: g.state, time: g.difficulty.time };
});
assert.ok(actions.jumped && actions.slid);
assert.equal(actions.state, "PLAYING");
console.log("Jump and slide clearance:", actions);
// Start a fresh run, then follow physically reachable clear lanes for >60s.
const survival = await gameEval((g) => {
  g.player.reset();
  g.track.reset();
  g.encounters.reset();
  g.coins.reset();
  g.score.reset();
  g.difficulty.reset();
  for (let i = 0; i < 120 * 65 && g.state === "PLAYING"; i++) {
    const ahead = g.encounters.rows
      .filter((r) => r.group.position.z < 4)
      .sort((a, b) => b.group.position.z - a.group.position.z)[0];
    if (ahead && ahead.group.position.z < -8) g.player.lane = ahead.safeLane;
    g.step(1 / 120);
  }
  g.ui.update(g.score, g.difficulty.speed, g.difficulty.time);
  return {
    state: g.state,
    time: g.difficulty.time,
    speed: g.difficulty.speed,
    coins: g.score.coins,
    score: g.score.score,
    calls: g.renderer.info.render.calls,
  };
});
assert.equal(survival.state, "PLAYING");
assert.ok(survival.time >= 64.9);
assert.ok(survival.speed > 16);
assert.ok(survival.coins > 5);
console.log("65-second run:", survival);
await page.screenshot({ path: ".test-artifacts/play.png" });
await gameEval((g) => {
  const row = g.encounters.rows[0];
  row.group.position.z = 0;
  row.obstacles[0].set("train", g.player.lane);
  g.player.group.position.x = (g.player.lane - 1) * 2.7;
  g.step(1 / 120);
});
assert.ok(await page.locator("#gameover").isVisible());
assert.ok(
  Number(await page.evaluate(() => localStorage.getItem("afterlight.best"))) >
    0,
);
await page.screenshot({ path: ".test-artifacts/gameover.png" });
await page.click("#retry");
await gameEval((g) => {
  g.paused = true;
});
const restart = await gameEval((g) => ({
  state: g.state,
  lane: g.player.lane,
  coins: g.score.coins,
  time: g.difficulty.time,
  speed: g.difficulty.speed,
  y: g.player.y,
}));
assert.equal(restart.state, "PLAYING");
assert.equal(restart.lane, 1);
assert.equal(restart.coins, 0);
assert.ok(restart.time < 0.3);
assert.equal(restart.y, 0);
await page.reload();
assert.ok(
  Number((await page.locator("#menu-best").textContent()).replaceAll(",", "")) >
    0,
);
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: ".test-artifacts/mobile-menu.png" });
await page.click("#play");
await gameEval((g) => {
  g.paused = true;
});
const client = await page.context().newCDPSession(page);
async function swipe(dx, dy) {
  await gameEval((g) => {
    g.paused = false;
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 195, y: 480 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 195 + dx, y: 480 + dy }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await gameEval((g) => {
    g.paused = true;
  });
}
await swipe(-80, 0);
assert.equal(await gameEval((g) => g.player.lane), 0);
await swipe(80, 0);
assert.equal(await gameEval((g) => g.player.lane), 1);
await swipe(0, -100);
assert.equal(await gameEval((g) => g.player.state), "JUMPING");
await gameEval((g) => {
  g.player.reset();
});
await swipe(0, 100);
assert.equal(await gameEval((g) => g.player.state), "SLIDING");
await gameEval((g) => {
  g.player.reset();
});
await swipe(10, 10);
assert.equal(await gameEval((g) => g.player.state), "RUNNING");
await page.screenshot({ path: ".test-artifacts/mobile-play.png" });
await page.setViewportSize({ width: 844, height: 390 });
await page.screenshot({ path: ".test-artifacts/landscape.png" });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
);
console.log(
  "PASS: menu, help, keyboard, jump, slide, coins, 65s survival, speed ramp, crash, persistence, retry, four touch gestures, portrait/landscape.",
);
assert.deepEqual(errors, []);
await browser.close();
