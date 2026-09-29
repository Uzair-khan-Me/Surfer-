import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { auditHtml } from "../src/seo/audit";
import { SITE, CREATOR, absoluteUrl } from "../src/seo/config";
import {
  FAQ,
  FEATURES,
  HOW_TO_STEPS,
  RELEASES,
  TIPS,
} from "../src/seo/content";
import {
  buildBrowserConfig,
  buildFeed,
  buildManifest,
  buildRobots,
  buildSitemap,
  readJsonLd,
  readLink,
  readMeta,
  readTitle,
  syncIndexHtml,
} from "../src/seo/files";
import { serializeGraph } from "../src/seo/schema";
import {
  buildIndex,
  escapeHtml,
  highlight,
  normalize,
  readQueryParam,
  searchIndex,
  snippet,
  tokenize,
  type SearchEntry,
} from "../src/seo/search";

const html = readFileSync("index.html", "utf8");
const file = (path: string) => readFileSync(path, "utf8");
/** Collapse markup line wrapping so copy can be compared as plain text. */
const text = (value: string) => value.replace(/\s+/g, " ").trim();
const flatHtml = text(html);

/* --------------------------------------------------------- generated files */

test("generated crawler files match src/seo/config.ts", () => {
  assert.equal(
    syncIndexHtml(html),
    html,
    "index.html is stale — run npm run seo:sync",
  );
  assert.equal(file("public/sitemap.xml"), buildSitemap());
  assert.equal(file("public/feed.xml"), buildFeed());
  assert.equal(file("public/manifest.webmanifest"), buildManifest());
  assert.equal(file("public/robots.txt"), buildRobots());
  assert.equal(file("public/browserconfig.xml"), buildBrowserConfig());
});

test("every headline SEO signal is present and on-brand", () => {
  assert.equal(readTitle(html), SITE.title);
  assert.equal(readMeta(html, "name", "description"), SITE.description);
  assert.equal(readLink(html, "canonical"), absoluteUrl("/"));
  assert.equal(readLink(html, "manifest"), "/manifest.webmanifest");
  assert.equal(
    readMeta(html, "property", "og:image"),
    absoluteUrl(SITE.ogImage),
  );
  assert.equal(readMeta(html, "property", "og:url"), absoluteUrl("/"));
  assert.equal(readMeta(html, "name", "twitter:card"), "summary_large_image");
  assert.equal(readMeta(html, "name", "theme-color"), SITE.themeColor);
  assert.ok(readMeta(html, "name", "robots")?.includes("index"));
  assert.ok(html.includes('hreflang="x-default"'));
  assert.ok(
    /rel="alternate"[^>]*application\/rss\+xml/.test(html),
    "no RSS alternate link",
  );
  assert.ok(html.includes('rel="apple-touch-icon"'));
  assert.ok(html.includes('rel="mask-icon"'));
  assert.ok(readMeta(html, "name", "keywords")?.includes("endless runner"));
  const description = readMeta(html, "name", "description") ?? "";
  assert.ok(
    description.length >= 70 && description.length <= 165,
    `${description.length} chars`,
  );
  assert.ok((readTitle(html) ?? "").length <= 65);
});

test("the static audit passes with no errors", () => {
  const { errors, stats } = auditHtml(html);
  assert.deepEqual(errors, [], errors.join("\n"));
  assert.ok(
    Number(stats.words) > 800,
    `only ${stats.words} words of crawlable text`,
  );
  assert.equal(stats.h1, 1);
});

test("brand artwork exists at the declared dimensions", async () => {
  const png = (path: string) => {
    const buffer = readFileSync(path);
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  };
  assert.deepEqual(png("public/og-image.png"), {
    width: SITE.ogImageWidth,
    height: SITE.ogImageHeight,
  });
  for (const shot of SITE.screenshots) {
    const path = `public${shot.path}`;
    assert.ok(existsSync(path), `${path} is missing — run npm run art`);
    assert.deepEqual(
      png(path),
      { width: shot.width, height: shot.height },
      path,
    );
  }
  for (const icon of [
    "public/icon-192.png",
    "public/icon-512.png",
    "public/maskable-512.png",
    "public/apple-touch-icon.png",
    "public/favicon.ico",
    "public/favicon.svg",
  ])
    assert.ok(statSync(icon).size > 100, `${icon} looks empty`);
});

/* -------------------------------------------------------- structured data */

test("the JSON-LD graph is valid, unique and complete", () => {
  const raw =
    html
      .split("<!-- seo:jsonld:start -->")[1]
      ?.split("<!-- seo:jsonld:end -->")[0] ?? "";
  const embedded = raw.match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? "";
  assert.deepEqual(
    JSON.parse(embedded),
    JSON.parse(serializeGraph()),
    "embedded JSON-LD is stale — run npm run seo:sync",
  );

  const graph = readJsonLd(html) as { "@graph": Array<Record<string, never>> };
  const nodes = graph["@graph"] as Array<Record<string, unknown>>;
  const byType = (type: string) =>
    nodes.find((node) => node["@type"] === type)!;
  for (const type of [
    "WebSite",
    "WebPage",
    "VideoGame",
    "HowTo",
    "FAQPage",
    "Person",
    "ImageObject",
  ])
    assert.ok(byType(type), `no ${type} node`);

  const ids = nodes.map((node) => node["@id"] as string);
  assert.equal(new Set(ids).size, ids.length, "duplicate @id values");

  const game = byType("VideoGame");
  assert.equal((game.offers as { price: number }).price, 0);
  assert.equal(game.isAccessibleForFree, true);
  assert.equal(game.playMode, "SinglePlayer");
  assert.ok(
    Array.isArray(game.featureList) &&
      (game.featureList as unknown[]).length >= 8,
  );
  assert.equal(game.applicationCategory as string, "GameApplication");

  const faq = byType("FAQPage");
  assert.equal((faq.mainEntity as unknown[]).length, FAQ.length);
  const howTo = byType("HowTo");
  assert.equal((howTo.step as unknown[]).length, HOW_TO_STEPS.length);
  const person = byType("Person");
  assert.equal(
    person.url,
    CREATOR.portfolio,
    "the creator button target must be the portfolio",
  );
  assert.equal(person.name, CREATOR.name);
});

test("structured data never claims anything the page does not show", () => {
  const shown = (value: string, where: string) =>
    assert.ok(
      flatHtml.includes(text(value)),
      `${where} missing from the markup: ${value.slice(0, 50)}`,
    );
  for (const item of FAQ) {
    shown(item.question, "FAQ question");
    shown(item.answer, "FAQ answer");
  }
  for (const step of HOW_TO_STEPS) {
    shown(step.name, "HowTo step");
    shown(step.text, "HowTo step text");
  }
  for (const feature of FEATURES) {
    shown(feature.title, "Feature title");
    shown(feature.text, "Feature copy");
  }
  for (const tip of TIPS) shown(tip, "Tip");
  for (const release of RELEASES)
    for (const item of release.items) shown(item, "Release note");
  shown(CREATOR.ctaLabel, "Creator call to action");
});

test("the creator section links to the same portfolio button as the tools hub", () => {
  const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].map(
    (match) => match[1],
  );
  const portfolio = links.filter((href) => href === CREATOR.portfolio);
  assert.ok(
    portfolio.length >= 2,
    "the portfolio link should appear in the creator card and footer",
  );
  const creatorBlock = html.split('id="creator"')[1] ?? "";
  assert.ok(creatorBlock.includes(`href="${CREATOR.portfolio}"`));
  assert.ok(creatorBlock.includes(CREATOR.ctaLabel));
  assert.ok(
    creatorBlock.includes(CREATOR.hub),
    "the hub link is part of the reference design",
  );
  assert.ok(
    /target="_blank"[^>]*rel="noopener"/.test(creatorBlock),
    "external links need rel=noopener",
  );
});

/* ------------------------------------------------------------- page health */

test("internal links resolve and ids stay unique", () => {
  const ids = (html.match(/\bid="([^"]+)"/g) ?? []).map((match) =>
    match.slice(4, -1),
  );
  assert.equal(new Set(ids).size, ids.length, "duplicate ids in index.html");
  const anchors = [...html.matchAll(/href="#([^"]*)"/g)].map(
    (match) => match[1],
  );
  for (const anchor of new Set(anchors))
    assert.ok(
      !anchor || ids.includes(anchor) || anchor === "top",
      `#${anchor} has no target`,
    );
});

test("crawlable content sits in normal flow, not behind JavaScript", () => {
  assert.ok(
    !/<main[^>]*\bhidden\b/.test(html),
    "main content must not be hidden",
  );
  assert.ok(
    html.includes("<noscript>"),
    "a no-JavaScript fallback note is part of the design",
  );
  assert.ok(
    html.includes('class="skip-link"'),
    "a skip link is required for keyboard users",
  );
  assert.equal((html.match(/<h1\b/gi) ?? []).length, 1);
  assert.ok(
    html.indexOf("<h1") < html.indexOf("<h2"),
    "headings must start with h1",
  );
});

/* ------------------------------------------------------------ page search */

const entries: SearchEntry[] = [
  {
    id: "faq-train",
    title: "What should I do when a train blocks my lane?",
    text: "Change lane. Trains are too tall to jump and too long to slide under.",
    section: "Frequently asked questions",
    anchor: "#faq-train",
  },
  {
    id: "tip-middle",
    title: "Hold the middle lane when you can.",
    text: "It keeps both escape routes open when a train appears without warning.",
    section: "Pro tips",
    anchor: "#tip-middle",
  },
  {
    id: "feature-offline",
    title: "Plays offline",
    text: "Install it once as an app and the whole city keeps running.",
    section: "Features",
    anchor: "#feature-offline",
  },
];

test("search normalises, tokenises and refuses noise", () => {
  assert.equal(normalize("  Trains?!  sliding  "), "trains sliding");
  assert.deepEqual(tokenize("A train!"), ["train"]);
  assert.deepEqual(tokenize(""), []);
  assert.equal(searchIndex(entries, "").length, 0);
  assert.equal(searchIndex(entries, "zzzz").length, 0);
});

test("search ranks title matches above body matches", () => {
  const hits = searchIndex(entries, "train");
  assert.equal(hits.length, 2);
  assert.equal(hits[0].entry.id, "faq-train");
  assert.ok(hits[0].score > hits[1].score);
  const offline = searchIndex(entries, "offline");
  assert.equal(offline.length, 1);
  assert.equal(offline[0].entry.anchor, "#feature-offline");
});

test("search output is escaped and highlighted safely", () => {
  const hits = searchIndex(
    [{ ...entries[0], title: "Train <script>alert(1)</script>", text: "body" }],
    "train",
  );
  assert.ok(hits[0].titleHtml.includes("<mark>Train</mark>"));
  assert.ok(!hits[0].titleHtml.includes("<script>"));
  assert.equal(escapeHtml("<b>&\"'"), "&lt;b&gt;&amp;&quot;&#39;");
  assert.equal(highlight("Mid lane", ["lane"]), "Mid <mark>lane</mark>");
});

test("snippets stay readable and read the q parameter defensively", () => {
  const long = "x".repeat(200) + " trains " + "y".repeat(200);
  const cut = snippet(long, ["trains"]);
  assert.ok(cut.length < 260);
  assert.ok(cut.includes("trains"));
  assert.equal(readQueryParam("?q=coins"), "coins");
  assert.equal(readQueryParam(""), "");
  assert.equal(readQueryParam(`?q=${"a".repeat(200)}`)?.length, 80);
});

test("buildIndex is exported for the browser and stays side-effect free in Node", () => {
  assert.equal(typeof buildIndex, "function");
});
