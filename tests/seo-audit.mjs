import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const PAGES = [
  { path: "/", canonical: "https://surfer-pc.vercel.app/" },
  {
    path: "/games-like-subway-surfers",
    canonical: "https://surfer-pc.vercel.app/games-like-subway-surfers",
  },
  {
    path: "/surfer-runner-online",
    canonical: "https://surfer-pc.vercel.app/surfer-runner-online",
  },
  {
    path: "/no-download-browser-games",
    canonical: "https://surfer-pc.vercel.app/no-download-browser-games",
  },
  {
    path: "/chromebook-unblocked-runner",
    canonical: "https://surfer-pc.vercel.app/chromebook-unblocked-runner",
  },
  {
    path: "/how-to-play-guide",
    canonical: "https://surfer-pc.vercel.app/how-to-play-guide",
  },
];

const STATIC_ASSETS = [
  "/robots.txt",
  "/sitemap.xml",
  "/site.webmanifest",
  "/llms.txt",
  "/a8f4c2e9b1d74f63a0e5c8b2d4f6a9e1.txt",
  "/og-image.png",
  "/gameplay-action.png",
  "/favicon.svg",
  "/favicon-48x48.png",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
];

const browser = await chromium.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});

const titles = new Set();
const descriptions = new Set();

try {
  // 1. Verify all static SEO files return HTTP 200
  for (const asset of STATIC_ASSETS) {
    const res = await fetch(`${BASE}${asset}`);
    assert.equal(
      res.status,
      200,
      `Expected 200 for ${asset}, got ${res.status}`,
    );
  }

  // 2. Audit every page in rendered Chromium DOM
  for (const { path: route, canonical } of PAGES) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    const res = await page.goto(`${BASE}${route}`, {
      waitUntil: "networkidle",
    });
    assert.equal(
      res?.status(),
      200,
      `Route ${route} returned ${res?.status()}`,
    );
    await page.waitForTimeout(250);

    const seo = await page.evaluate(() => {
      const meta = (sel) =>
        document.querySelector(sel)?.getAttribute("content") || "";
      const link = (sel) =>
        document.querySelector(sel)?.getAttribute("href") || "";
      const ldScripts = Array.from(
        document.querySelectorAll('script[type="application/ld+json"]'),
      ).map((s) => JSON.parse(s.textContent || "{}"));
      const h1s = Array.from(document.querySelectorAll("h1")).map((h) =>
        h.textContent?.trim(),
      );
      const internalLinks = Array.from(
        document.querySelectorAll("a[href^='/']"),
      )
        .map((a) => a.getAttribute("href"))
        .filter(Boolean);
      return {
        title: document.title,
        description: meta('meta[name="description"]'),
        robots: meta('meta[name="robots"]'),
        gsc: meta('meta[name="google-site-verification"]'),
        canonical: link('link[rel="canonical"]'),
        ogTitle: meta('meta[property="og:title"]'),
        ogImage: meta('meta[property="og:image"]'),
        twitterCard: meta('meta[name="twitter:card"]'),
        ldCount: ldScripts.length,
        ldGraphTypes: ldScripts.flatMap((obj) =>
          (obj["@graph"] || [obj]).flatMap((n) => n["@type"] || []),
        ),
        h1s,
        internalLinks,
        overflowX: document.documentElement.scrollWidth > innerWidth,
      };
    });

    assert.ok(
      seo.title.length >= 45 && seo.title.length <= 72,
      `${route} title length out of range (${seo.title.length}): ${seo.title}`,
    );
    assert.ok(
      !titles.has(seo.title),
      `Duplicate <title> across pages: ${seo.title}`,
    );
    titles.add(seo.title);

    assert.ok(
      seo.description.length >= 120 && seo.description.length <= 210,
      `${route} description length out of range (${seo.description.length})`,
    );
    assert.ok(
      !descriptions.has(seo.description),
      `Duplicate meta description on ${route}`,
    );
    descriptions.add(seo.description);

    assert.equal(
      seo.gsc,
      "vhmBuegfmtgbFpYmlXiKb1YDqlUFYXSmlBks3tYk6dg",
      `Missing GSC verification tag on ${route}`,
    );
    assert.equal(seo.canonical, canonical, `Canonical mismatch on ${route}`);
    assert.ok(seo.robots.includes("index, follow"), `Robots tag on ${route}`);
    assert.ok(seo.ogTitle.length > 20, `Missing og:title on ${route}`);
    assert.equal(
      seo.ogImage,
      "https://surfer-pc.vercel.app/og-image.png",
      `og:image mismatch on ${route}`,
    );
    assert.equal(
      seo.twitterCard,
      "summary_large_image",
      `twitter:card on ${route}`,
    );
    assert.ok(seo.ldCount >= 1, `Missing JSON-LD on ${route}`);
    assert.ok(
      seo.ldGraphTypes.includes("FAQPage"),
      `Expected FAQPage schema on ${route}`,
    );
    assert.equal(seo.h1s.length, 1, `Expected exactly 1 H1 on ${route}`);
    assert.ok(
      seo.internalLinks.length >= 5,
      `Expected >=5 internal links on ${route}, got ${seo.internalLinks.length}`,
    );
    assert.equal(
      seo.overflowX,
      false,
      `Horizontal scroll overflow on ${route}`,
    );
    assert.deepEqual(
      errors,
      [],
      `Page errors on ${route}: ${errors.join("; ")}`,
    );

    console.log(
      `✓ ${route.padEnd(30)} | Title (${seo.title.length}c) | Schemas: [${seo.ldGraphTypes.join(", ")}] | Links: ${seo.internalLinks.length}`,
    );
    await page.close();
  }

  // 3. Test #about-button modal open/close on "/"
  const homePage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await homePage.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await homePage.waitForTimeout(300);
  await homePage.click("#about-button");
  assert.equal(await homePage.locator("#about").isVisible(), true);
  await homePage.click("#close-about");
  assert.equal(await homePage.locator("#about").isVisible(), false);
  await homePage.close();

  console.log(
    "\nALL SEO AUDIT CHECKS PASSED (6/6 pages + 12 static crawl/icon assets).",
  );
} finally {
  await browser.close();
}
