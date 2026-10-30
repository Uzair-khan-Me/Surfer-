# Afterlight Run — Maximum SEO & Search Ranking Playbook

**Target Live Site:** `https://surfer-pc.vercel.app`  
**Repository:** `https://github.com/Uzair-khan-Me/Surfer-`  
**Google Search Console Verification:** `vhmBuegfmtgbFpYmlXiKb1YDqlUFYXSmlBks3tYk6dg` (Embedded across all 6 pages)

---

## 1. Why This Architecture Ranks (and Avoids Google SpamBrain Penalties)

Single-page `<canvas>` games normally fail to rank on Google for two reasons:
1. **Zero Crawlable Copy:** An empty `<canvas>` + `<div id="ui"></div>` gives Googlebot almost zero words to index.
2. **Single-URL Intent Dilution:** Google ranks *one primary search intent per URL*. Trying to cram *"Subway Surfers"*, *"browser games no download"*, *"3D train surfer"*, and *"Chromebook games"* onto a single page dilutes relevance — while black-hat tricks (hidden text, `display:none` keyword dumps, cloaking, or trademark impersonation) get flagged and de-indexed within days by Google's **SpamBrain** classifier.

Instead, your project now uses the exact **Topical Hub-and-Spoke Architecture + Rich Schema.org Graph + Generative Engine Optimization (`llms.txt`)** used by top-ranking standalone browser games (`cuberunner.in`, `slowroads.io`, `slopegamefree.com`):

| URL Route | Primary & Secondary Keyword Targets | Search Intent | JSON-LD Rich Result Schemas |
| :--- | :--- | :--- | :--- |
| **`/`** (`index.html`) | `afterlight run`, `free 3d endless runner browser game`, `endless runner online no download`, `3d running game free`, `webgl2 runner` | Instant play in browser | `WebSite`, `VideoGame`, `WebApplication`, `HowTo`, `FAQPage` |
| **`/games-like-subway-surfers`** | `games like subway surfers`, `browser games like subway surfers no download`, `subway surfers style 3d runner online`, `subway surfers alternative pc` | Comparison & instant browser alternative | `BreadcrumbList`, `Article`, `FAQPage` |
| **`/surfer-runner-online`** | `train surfer online`, `3d surfer game browser`, `subway track runner free online`, `night transit runner 3d`, `train dodge game` | Genre / transit-track runner play | `BreadcrumbList`, `WebPage`, `FAQPage` |
| **`/no-download-browser-games`** | `browser games no download`, `no download games free`, `free 3d browser games no signup`, `instant play online games`, `ad-free browser games` | Zero-install / zero-friction gaming | `BreadcrumbList`, `CollectionPage`, `FAQPage` |
| **`/chromebook-unblocked-runner`** | `chromebook browser games`, `lightweight 3d runner game`, `endless runner for chromebook pc mobile`, `low end laptop 3d browser game` | Device & school/work laptop compatibility | `BreadcrumbList`, `TechArticle`, `FAQPage` |
| **`/how-to-play-guide`** | `how to get high score in endless runner`, `afterlight run controls`, `three lane runner tips and tricks`, `jump barrier slide gate guide` | Controls manual & high-score strategy | `BreadcrumbList`, `HowTo`, `FAQPage` |

---

## 2. Everything Implemented in the Codebase

- **Fixed Stray Backticks Bug:** Removed the accidental trailing ```` ``` ```` fence that was sitting at the bottom of `index.html` in commit `7dd05b0`.
- **6-Page Multi-Entry Vite Build (`vite.config.ts`) + Clean Extensionless URLs (`vercel.json`):**
  - The 5 static SEO pillar pages ship **zero Three.js JS bundle** (~4–5 KB gzipped HTML + ~2 KB CSS) for **100/100 Core Web Vitals** (`0.00 CLS`, sub-500ms `LCP`), funneling high-intent searchers straight into `/` via prominent **Play Free Now ↗** CTAs and live preview cards.
  - `vercel.json` sets `"cleanUrls": true` and `"trailingSlash": false` so duplicate `.html` / trailing-slash URLs automatically 308-redirect to canonical URLs, plus immutable 1-year `Cache-Control` headers on `/assets/*`.
- **In-Game Crawlable `GAME INFO ↗` Drawer & Footer Silo Links (`src/ui/UIManager.ts`, `src/style.css`):**
  - Adds a sleek glassmorphic **Game Info & FAQ** modal + subtle desktop footer links on `/` so Google's headless Chromium renderer sees visible FAQ parity (matching `FAQPage` JSON-LD 1:1) and passes direct internal PageRank from `/` to all 5 spoke URLs — with **zero** gameplay changes (`16/16` unit/physics/SHA-lock tests + full Playwright 65s survival & mobile touch tests pass).
- **Real 3D Social & Image-Search Assets (`public/`):**
  - `public/og-image.png` (`1200×630` Open Graph / X-Twitter / Discord / Google Discover banner rendered from the real 3D scene).
  - `public/gameplay-action.png` (`1200×675` 16:9 mid-run screenshot indexed via Google Image Sitemap extensions).
  - `public/favicon.svg`, `public/favicon-48x48.png` (meets Google Search's ≥48×48px SERP icon rule), `public/apple-touch-icon.png` (`180×180`), `public/icon-192.png`, `public/icon-512.png`, and `public/site.webmanifest` (installable fullscreen PWA).
- **Search + AI Crawler Discovery (`robots.txt`, `sitemap.xml`, `llms.txt`, IndexNow):**
  - `public/robots.txt` explicitly welcomes `Googlebot`, `Googlebot-Image`, `Bingbot`, `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, and `ClaudeBot`.
  - `public/sitemap.xml` includes `<image:image>` metadata for Google Images.
  - `public/llms.txt` provides structured GEO (Generative Engine Optimization) facts so AI assistants recommend Afterlight Run for browser endless runner prompts.
  - `public/a8f4c2e9b1d74f63a0e5c8b2d4f6a9e1.txt` + `npm run seo:indexnow` pings Bing, DuckDuckGo, Yandex, and Naver immediately after deployment.

---

## 3. Post-Deploy Action Checklist (Do These 5 Steps Right After Pushing to GitHub)

### Step 1 — Push Updated Files to `Uzair-khan-Me/Surfer-`
Upload/commit the updated repository files (from `/home/user/Surfer-` or `/home/user/afterlight-run-seo-max.zip`) to `main`. Vercel (`vercel[bot]`) will build and deploy automatically to `https://surfer-pc.vercel.app`.

### Step 2 — Submit Sitemap & Request Indexing in Google Search Console
1. Open [Google Search Console](https://search.google.com/search-console) for `https://surfer-pc.vercel.app/` and click **Verify**.
2. Go to **Sitemaps** (left sidebar) → enter `sitemap.xml` → click **Submit**.
3. Use the top **URL Inspection** bar on each of your 6 URLs and click **Request Indexing**:
   - `https://surfer-pc.vercel.app/`
   - `https://surfer-pc.vercel.app/games-like-subway-surfers`
   - `https://surfer-pc.vercel.app/surfer-runner-online`
   - `https://surfer-pc.vercel.app/no-download-browser-games`
   - `https://surfer-pc.vercel.app/chromebook-unblocked-runner`
   - `https://surfer-pc.vercel.app/how-to-play-guide`

### Step 3 — Ping IndexNow (Instant Bing / DuckDuckGo / Yandex Indexing)
Once Vercel finishes deploying, run:
```bash
npm run seo:indexnow
```
This submits all 6 URLs directly to `api.indexnow.org`.

### Step 4 — Build High-Authority Gaming Backlinks (Crucial for Competitive Head Keywords)
On-page SEO gets you indexed and ranking fast for long-tail & mid-tail searches (`"free 3d browser games like subway surfers no download"`, `"lightweight 3d runner chromebook"`). To climb onto Page 1 for ultra-competitive head terms (`"browser games"`, `"no download games"`, `"train surfer"`), acquire **real gaming domain backlinks** (never buy Fiverr spam links — those trigger link penalties):
1. **GitHub Repo SEO (DR 96 signal):** On `github.com/Uzair-khan-Me/Surfer-`, edit the **About** box description to *"Afterlight Run — Free 3D Three-Lane Endless Runner Browser Game (Three.js / WebGL2, No Download)"*, keep `https://surfer-pc.vercel.app` as the Website link, and add GitHub Topics: `browser-game`, `endless-runner`, `threejs`, `webgl2`, `html5-game`, `typescript`, `arcade-game`.
2. **itch.io HTML5 Page (DR 91):** Create a free HTML5 browser-playable listing on itch.io linking back to your canonical site `https://surfer-pc.vercel.app`.
3. **Indie Web Game Portals & Showcases:** Submit to **CrazyGames Developer Portal**, **Poki for Developers**, **Newgrounds**, **GameJolt**, **iDev.Games**, and **PlayBrain**.
4. **Community Launch Posts:** Post a playable showcase on **Reddit** (`r/WebGames`, `r/threejs`, `r/IndieGaming`) and **Hacker News** (`Show HN: Afterlight Run – 150KB procedural 3D endless runner in Three.js with 120Hz physics`). Technical posts highlighting the `<150 KB` procedural WebGL2 engine naturally earn organic developer blog & newsletter backlinks.

### Step 5 — Optional Multiplier: Custom Domain (`~$10/yr`)
Whenever you are ready, connecting a keyword-rich custom domain (e.g. `afterlightrun.com` or `afterlightrunner.gg`) in **Vercel → Settings → Domains** (with automatic 308 redirect from `surfer-pc.vercel.app` and updating the base URL) removes shared-subdomain throttling and unlocks full Google sitelinks & brand authority.
