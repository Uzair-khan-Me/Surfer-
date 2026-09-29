/**
 * The JSON-LD graph for the site: Website, WebPage, VideoGame (which is a
 * SoftwareApplication in schema.org), HowTo, FAQPage, Person and ImageObject.
 *
 * The exact same graph is embedded in `index.html` so crawlers that do not run
 * JavaScript still see it; `npm run seo:sync` writes it there and
 * `tests/seo.test.ts` fails when the two drift apart. At runtime the graph is
 * only replaced when it does not match this source of truth.
 */

import { SITE, CREATOR, NODE, absoluteUrl } from "./config";
import { FAQ, FEATURES, HOW_TO_STEPS } from "./content";

export type JsonLdNode = Record<string, unknown>;

const iso = (date: string) => `${date}T00:00:00+00:00`;

const imageObject = (
  path: string,
  width: number,
  height: number,
  caption: string,
) => ({
  "@type": "ImageObject",
  url: absoluteUrl(path),
  contentUrl: absoluteUrl(path),
  width,
  height,
  caption,
});

export function buildGraph(): JsonLdNode {
  const primaryImage = {
    "@type": "ImageObject",
    "@id": NODE.image,
    url: absoluteUrl(SITE.ogImage),
    contentUrl: absoluteUrl(SITE.ogImage),
    width: SITE.ogImageWidth,
    height: SITE.ogImageHeight,
    caption: SITE.ogImageAlt,
    representativeOfPage: true,
  };

  const person: JsonLdNode = {
    "@type": "Person",
    "@id": NODE.creator,
    name: CREATOR.name,
    jobTitle: CREATOR.jobTitle,
    description: CREATOR.blurb,
    url: CREATOR.portfolio,
    image: {
      "@type": "ImageObject",
      url: CREATOR.avatar,
      caption: CREATOR.avatarAlt,
    },
    sameAs: [CREATOR.github, CREATOR.portfolio, CREATOR.hub],
    knowsAbout: CREATOR.knowsAbout.map((name) => ({ "@type": "Thing", name })),
  };

  const website: JsonLdNode = {
    "@type": "WebSite",
    "@id": NODE.website,
    url: absoluteUrl("/"),
    name: SITE.name,
    alternateName: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    inLanguage: SITE.language,
    isFamilyFriendly: true,
    keywords: SITE.keywords.join(", "),
    creator: { "@id": NODE.creator },
    publisher: { "@id": NODE.creator },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/")}?q={search_term_string}`,
        inLanguage: SITE.language,
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform",
        ],
      },
      "query-input": "required name=search_term_string",
    },
  };

  const game: JsonLdNode = {
    "@type": "VideoGame",
    "@id": NODE.game,
    name: SITE.name,
    alternateName: `${SITE.name} — ${SITE.tagline}`,
    url: absoluteUrl("/"),
    description: SITE.longDescription,
    image: { "@id": NODE.image },
    screenshot: SITE.screenshots.map((shot) =>
      imageObject(shot.path, shot.width, shot.height, shot.caption),
    ),
    genre: ["Endless runner", "Arcade", "Action", "Casual"],
    gamePlatform: [
      "Web browser",
      "Windows",
      "macOS",
      "Linux",
      "Android",
      "iOS",
      "ChromeOS",
    ],
    applicationCategory: "GameApplication",
    applicationSubCategory: "Endless runner",
    operatingSystem: "Any device with a WebGL 2 capable browser",
    browserRequirements: "Requires JavaScript and WebGL 2",
    softwareVersion: SITE.version,
    installUrl: absoluteUrl("/"),
    playMode: "SinglePlayer",
    numberOfPlayers: {
      "@type": "QuantitativeValue",
      minValue: 1,
      maxValue: 1,
    },
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: 0,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      description: "Free to play in the browser, with no account and no ads.",
    },
    featureList: FEATURES.map((feature) => `${feature.title}: ${feature.text}`),
    keywords: SITE.keywords.join(", "),
    inLanguage: SITE.language,
    softwareHelp: { "@type": "CreativeWork", url: `${absoluteUrl("/")}#faq` },
    contentRating: "Everyone",
    author: { "@id": NODE.creator },
    creator: { "@id": NODE.creator },
    publisher: { "@id": NODE.creator },
    sameAs: [SITE.repo],
    dateModified: iso(SITE.updated),
  };

  const howTo: JsonLdNode = {
    "@type": "HowTo",
    "@id": NODE.howTo,
    name: `How to play ${SITE.name}`,
    description:
      "Learn the three-lane controls, the obstacles and the scoring rules of Afterlight Run in about a minute.",
    inLanguage: SITE.language,
    totalTime: "PT1M",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: 0,
    },
    image: { "@id": NODE.image },
    step: HOW_TO_STEPS.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      url: `${absoluteUrl("/")}${step.anchor}`,
    })),
  };

  const faqPage: JsonLdNode = {
    "@type": "FAQPage",
    "@id": NODE.faq,
    inLanguage: SITE.language,
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      "@id": `${absoluteUrl("/")}#${item.id}`,
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const webPage: JsonLdNode = {
    "@type": "WebPage",
    "@id": NODE.webpage,
    url: absoluteUrl("/"),
    name: SITE.title,
    description: SITE.description,
    isPartOf: { "@id": NODE.website },
    about: { "@id": NODE.game },
    mainEntity: { "@id": NODE.game },
    primaryImageOfPage: { "@id": NODE.image },
    inLanguage: SITE.language,
    isFamilyFriendly: true,
    isAccessibleForFree: true,
    datePublished: iso(SITE.published),
    dateModified: iso(SITE.updated),
    author: { "@id": NODE.creator },
    creator: { "@id": NODE.creator },
    publisher: { "@id": NODE.creator },
    copyrightHolder: { "@id": NODE.creator },
    significantLink: [CREATOR.portfolio, CREATOR.hub],
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["#about p", "#faq summary", "#faq .faq-answer p"],
    },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [website, webPage, game, howTo, faqPage, person, primaryImage],
  };
}

/** Pretty-printed JSON exactly as it should appear inside `index.html`. */
export const serializeGraph = () => JSON.stringify(buildGraph(), null, 2);

/**
 * Runtime guard: if the embedded graph is missing or stale (for example after a
 * version bump that forgot to run the sync script), replace it with the graph
 * built from the config. Runs once, does nothing when everything matches.
 */
export function syncStructuredData(doc: Document = document): void {
  const script = doc.querySelector<HTMLScriptElement>(
    'script[type="application/ld+json"][data-seo-graph]',
  );
  if (!script) return;
  const expected = serializeGraph();
  try {
    const current = script.textContent ?? "";
    if (
      JSON.stringify(JSON.parse(current)) !==
      JSON.stringify(JSON.parse(expected))
    )
      script.textContent = expected;
  } catch {
    script.textContent = expected;
  }
}
