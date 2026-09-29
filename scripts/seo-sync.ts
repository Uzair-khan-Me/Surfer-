/**
 * Regenerates every crawler-facing file from `src/seo/config.ts`.
 *
 *   npm run seo:sync
 *
 * Run this after changing the title, description, version, release dates or
 * creator details. `tests/seo.test.ts` fails when the checked-in files are out
 * of date, so this cannot be forgotten silently.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildBrowserConfig,
  buildFeed,
  buildManifest,
  buildRobots,
  buildSitemap,
  syncIndexHtml,
} from "../src/seo/files";

const root = fileURLToPath(new URL("..", import.meta.url));

const generated: Array<[string, string]> = [
  ["index.html", syncIndexHtml(readFileSync(join(root, "index.html"), "utf8"))],
  ["public/sitemap.xml", buildSitemap()],
  ["public/feed.xml", buildFeed()],
  ["public/manifest.webmanifest", buildManifest()],
  ["public/robots.txt", buildRobots()],
  ["public/browserconfig.xml", buildBrowserConfig()],
];

let changed = 0;
for (const [relative, contents] of generated) {
  const path = join(root, relative);
  let previous = "";
  try {
    previous = readFileSync(path, "utf8");
  } catch {
    previous = "";
  }
  if (previous === contents) {
    console.log(`unchanged  ${relative}`);
    continue;
  }
  writeFileSync(path, contents);
  changed += 1;
  console.log(`updated    ${relative}`);
}
console.log(`\n${changed} file(s) updated from src/seo/config.ts`);
