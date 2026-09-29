/**
 * Single source of truth for everything a crawler, social scraper or screen
 * reader can read about the site. `index.html` is generated from these values by
 * `npm run seo:sync`, and `tests/seo.test.ts` fails if the two ever drift apart.
 */

export const SITE_URL = "https://surfer-pc.vercel.app";

export const SITE = {
  /** Canonical origin. Every absolute URL in the markup is built from this. */
  url: SITE_URL,
  name: "Afterlight Run",
  shortName: "Afterlight",
  tagline: "Chase the last light",
  /** <title> — brand first, primary keyword phrase, under 60 characters. */
  title: "Afterlight Run — Free Neon City Endless Runner Game",
  /** <meta name="description"> — 150-160 characters, written as ad copy. */
  description:
    "Play Afterlight Run free in your browser: a neon city 3D endless runner. Dodge trains, jump barriers, slide gates and chase your best score. No download.",
  /** Longer form copy for structured data and social cards. */
  longDescription:
    "Afterlight Run is a free three-lane endless runner you play instantly in any modern browser. Sprint through a procedurally generated neon transit district, switch lanes, jump orange barriers, slide under blue gates and dodge the trains that never stop. Distance earns points, every coin adds ten, and the city speeds up the longer you survive.",
  version: "1.1.0",
  /** ISO date of the last content change. Also used by the sitemap. */
  updated: "2026-09-29",
  published: "2026-09-29",
  locale: "en",
  language: "en",
  themeColor: "#071b22",
  accentColor: "#d5f884",
  /** 1200x630 social card. */
  ogImage: "/og-image.png",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt:
    "Afterlight Run menu screen: a neon transit district at night with the title AFTERLIGHT RUN over three railway lanes",
  screenshots: [
    {
      path: "/screenshots/menu-desktop.png",
      width: 1440,
      height: 900,
      caption: "Afterlight Run start screen on desktop",
    },
    {
      path: "/screenshots/gameplay-desktop.png",
      width: 1440,
      height: 900,
      caption:
        "Three-lane gameplay: traffic, coins and an orange barrier ahead",
    },
    {
      path: "/screenshots/menu-mobile.png",
      width: 390,
      height: 844,
      caption: "Afterlight Run on a phone with swipe controls",
    },
  ],
  repo: "https://github.com/Uzair-khan-Me/Surfer-",
  keywords: [
    "afterlight run",
    "endless runner",
    "free online games",
    "3d browser game",
    "neon runner game",
    "subway style runner",
    "play in browser no download",
    "html5 webgl game",
    "arcade game online free",
    "mobile browser game",
  ],
} as const;

export const CREATOR = {
  name: "Uzair Ali",
  jobTitle: "SEO Specialist & Web Developer",
  /** The button target, exactly as referenced on the InFinia Tools hub. */
  portfolio: "https://uzairali-18.github.io/Portfolio/",
  hub: "https://uzairali-18.github.io/InFinia-Tools/",
  github: "https://github.com/uzairali-18",
  /** Same portrait asset used by the InFinia Tools hub. */
  avatar: "https://uzairali-18.github.io/InFinia-Tools/uzair-ali.jpg",
  avatarAlt: "Portrait of Uzair Ali, SEO specialist and web developer",
  ctaLabel: "Reach Out to Uzair Ali For Your Work",
  blurb:
    "Afterlight Run is designed, built and maintained by Uzair Ali. If you want the same treatment for your own site — technical SEO, structured data, Core Web Vitals and front-end builds that actually ship — reach out.",
  knowsAbout: [
    "Search engine optimization",
    "Technical SEO",
    "Web development",
    "TypeScript",
    "Three.js",
    "Web performance",
  ],
} as const;

/** Absolute URL helper used by every generated tag and JSON-LD node. */
export const absoluteUrl = (path = "/") => new URL(path, SITE.url).href;

/** Stable @id fragments, referenced across the JSON-LD graph. */
export const NODE = {
  website: `${SITE.url}/#website`,
  webpage: `${SITE.url}/#webpage`,
  game: `${SITE.url}/#videogame`,
  app: `${SITE.url}/#software`,
  howTo: `${SITE.url}/#howto`,
  faq: `${SITE.url}/#faq`,
  creator: `${SITE.url}/#creator`,
  image: `${SITE.url}/#primaryimage`,
} as const;
