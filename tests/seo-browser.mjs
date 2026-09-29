/**
 * Browser-side SEO acceptance tests. Unlike `tests/seo.test.ts` (which is
 * static analysis of the shipped markup), this drives a real Chromium to prove
 * the discoverable content works with and without JavaScript.
 *
 *   npm run dev                # in one terminal
 *   npm run test:seo-browser   # in another
 *
 * Set CHROMIUM_EXECUTABLE to use an existing Chromium binary, and
 * LD_LIBRARY_PATH if that build needs extra shared libraries.
 */
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
  headless: true,
  timeout: 90_000,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
fs.mkdirSync(".test-artifacts", { recursive: true });
const base = process.env.SITE_URL || "http://localhost:5173";

/* ------------------------------------------------- content without JavaScript */

const noJs = await browser.newContext({ javaScriptEnabled: false });
const plain = await noJs.newPage({ viewport: { width: 1280, height: 900 } });
await plain.goto(base, { waitUntil: "load" });
const plainText = await plain.evaluate(() =>
  document.body.innerText.replace(/\s+/g, " "),
);
assert.ok(
  plainText.length > 4000,
  `crawlable text is too short: ${plainText.length} characters`,
);
for (const phrase of [
  "Afterlight Run is a free neon-city endless runner",
  "How to play Afterlight Run",
  "Is Afterlight Run free to play?",
  "Reach Out to Uzair Ali For Your Work",
  "Switch lane",
])
  assert.ok(
    plainText.includes(phrase),
    `missing without JavaScript: ${phrase}`,
  );
assert.equal(await plain.locator("h1").count(), 1);
assert.ok(
  await plain.locator("link[rel=canonical]").count(),
  "canonical link must render",
);
const plainSchema = JSON.parse(
  await plain
    .locator('script[type="application/ld+json"]')
    .first()
    .textContent(),
);
assert.equal(
  plainSchema["@graph"].length,
  7,
  "the whole JSON-LD graph must be server-shipped",
);
await plain.screenshot({ path: ".test-artifacts/seo-no-js.png" });
await noJs.close();

/* --------------------------------------------------------- with JavaScript */

const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
});
const page = await context.newPage();
page.setDefaultTimeout(60_000);
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
await page.goto(base, { waitUntil: "load" });
await page.waitForTimeout(2500);

// The game is a backdrop: one <main> landmark, exactly one <h1>.
assert.equal(await page.locator("main").count(), 1);
assert.equal(await page.locator("h1").count(), 1);
assert.ok((await page.locator("nav[aria-label]").count()) >= 2);

// The runtime guard must leave the shipped structured data untouched.
const schemaMatches = await page.evaluate(() => {
  const raw = document.querySelector("script[data-seo-graph]").textContent;
  const graph = JSON.parse(raw);
  const game = graph["@graph"].find((node) => node["@type"] === "VideoGame");
  return {
    // Structured data always points at the canonical production URL.
    url: game.url,
    canonical: document.querySelector("link[rel=canonical]").href,
    free: game.offers.price === 0,
    questions: graph["@graph"].find((node) => node["@type"] === "FAQPage")
      .mainEntity.length,
    ids:
      new Set(graph["@graph"].map((node) => node["@id"])).size ===
      graph["@graph"].length,
  };
});
assert.deepEqual(schemaMatches, {
  url: "https://surfer-pc.vercel.app/",
  canonical: "https://surfer-pc.vercel.app/",
  free: true,
  questions: 13,
  ids: true,
});

// Scrolling to the article hands the keyboard to the page, the game keeps running.
await page.evaluate(() => document.getElementById("about").scrollIntoView());
await page.waitForTimeout(700);
assert.ok(
  await page.evaluate(() =>
    document.documentElement.classList.contains("view-content"),
  ),
);
await page.evaluate(() => window.scrollTo({ top: 0 }));
await page.waitForTimeout(700);
assert.ok(
  !(await page.evaluate(() =>
    document.documentElement.classList.contains("view-content"),
  )),
  "the content flag must clear when the hero is back in view",
);

// On-page search: typing filters, status is announced, deep links work.
await page.evaluate(() => document.getElementById("search").scrollIntoView());
await page.fill("#site-search-input", "trains");
await page.waitForTimeout(400);
const hits = await page.locator(".search-hit").count();
assert.ok(
  hits > 0,
  "searching for 'trains' should return the FAQ and tip entries",
);
assert.ok((await page.textContent("#site-search-status")).includes("result"));
assert.ok(
  (await page.locator(".search-hit mark").count()) > 0,
  "matches must be highlighted",
);
await page.goto(`${base}/?q=offline`, { waitUntil: "load" });
await page.waitForTimeout(2200);
assert.equal(await page.inputValue("#site-search-input"), "offline");
assert.ok(
  (await page.locator(".search-hit").count()) > 0,
  "?q= deep links must search on load",
);

// Enter submits the search form instead of starting the game.
await page.goto(base, { waitUntil: "load" });
await page.waitForTimeout(1600);
await page.evaluate(() => document.getElementById("search").scrollIntoView());
await page.fill("#site-search-input", "coins");
await page.focus("#site-search-input");
await page.keyboard.press("Enter");
await page.waitForTimeout(500);
assert.ok(
  (await page.locator(".search-hit").count()) > 0,
  "Enter must submit the search form",
);
assert.equal(
  await page.evaluate(() => window.__afterlight?.state),
  "MENU",
  "Enter in a form field must not start a run",
);

// Space and Enter belong to a focused FAQ disclosure, not to the game.
await page.focus("#faq-offline summary");
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
assert.ok(await page.locator("#faq-offline").evaluate((node) => node.open));

// FAQ deep links open the matching details element.
await page.goto(`${base}/#faq-offline`, { waitUntil: "load" });
await page.waitForTimeout(1800);
assert.ok(
  await page.locator("#faq-offline").evaluate((node) => node.open),
  "#faq-offline must open",
);

// Keyboard use of the page: skip link lands on the content.
await page.goto(base, { waitUntil: "load" });
await page.waitForTimeout(1500);
await page.keyboard.press("Tab");
assert.equal(
  await page.evaluate(() => document.activeElement?.className),
  "skip-link",
);
await page.keyboard.press("Enter");
await page.waitForTimeout(400);
assert.equal(await page.evaluate(() => location.hash), "#main-content");

// Creator section: same button target as the InFinia Tools hub.
const cta = page.locator("#creator .creator-cta");
assert.equal(
  await cta.getAttribute("href"),
  "https://uzairali-18.github.io/Portfolio/",
);
assert.ok(
  (await cta.textContent()).includes("Reach Out to Uzair Ali For Your Work"),
);
assert.equal(await cta.getAttribute("rel"), "noopener");

// And the real game still runs underneath all of it.
await page.evaluate(() => window.scrollTo({ top: 0 }));
await page.waitForTimeout(400);
await page.click(".content-header .header-play");
await page.waitForTimeout(900);
assert.equal(await page.evaluate(() => window.__afterlight?.state), "PLAYING");
assert.deepEqual(errors, []);

await browser.close();
console.log(
  `PASS: crawlable without JavaScript (${plainText.length} characters), JSON-LD graph intact, content scroll, page search, ?q= deep link, FAQ deep link, skip link, creator CTA, game still runs.`,
);
