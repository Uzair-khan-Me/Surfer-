/**
 * Visible page content that is also referenced from structured data.
 *
 * Everything here is rendered by hand in `index.html` (so it exists without
 * JavaScript) and reused by `schema.ts` (FAQPage, HowTo, featureList).
 * `tests/seo.test.ts` asserts that both copies match, so the markup can never
 * claim something the structured data does not, or the other way round.
 */

export type FaqItem = { id: string; question: string; answer: string };
export type HowToStep = { name: string; text: string; anchor: string };
export type Feature = { id: string; title: string; text: string };

export const FEATURES: Feature[] = [
  {
    id: "feature-endless",
    title: "Endless and never twice the same",
    text: "City blocks, traffic, barriers and gates are generated as you run, so no two attempts follow the same line.",
  },
  {
    id: "feature-controls",
    title: "Three lanes, three moves",
    text: "Arrow keys or A and D on desktop, a swipe on touch screens. Left, right, jump, slide — that is the whole control scheme.",
  },
  {
    id: "feature-performance",
    title: "Smooth on real hardware",
    text: "An adaptive renderer watches frame time and scales resolution, shadows and draw distance to hold a steady frame rate.",
  },
  {
    id: "feature-instant",
    title: "Zero friction",
    text: "No sign-up, no install, no loading screen: the first frame arrives in under a second and restarting is one key press.",
  },
  {
    id: "feature-scoring",
    title: "Distance, coins and personal bests",
    text: "Every metre earns points and every coin adds ten. Your best run is saved on your own device.",
  },
  {
    id: "feature-offline",
    title: "Plays offline",
    text: "Install it once as an app and the whole city keeps running with no connection at all.",
  },
  {
    id: "feature-webgl",
    title: "Hand-built WebGL pipeline",
    text: "Procedural geometry, pooled objects and bundled fonts instead of downloaded 3D models, textures or CDN requests.",
  },
  {
    id: "feature-accessibility",
    title: "Keyboard first, accessible by default",
    text: "Every action has a key binding, controls are labelled for screen readers and reduced-motion preferences are respected.",
  },
];

export const HOW_TO_STEPS: HowToStep[] = [
  {
    name: "Open the game and start a run",
    text: "Load the page and press Let's Run, or press Enter. The run starts immediately — there is no tutorial level to sit through.",
    anchor: "#play",
  },
  {
    name: "Switch between the three lanes",
    text: "Press the left or right arrow key, or A and D, to move between lanes. On a phone, swipe left or right.",
    anchor: "#how-to-play",
  },
  {
    name: "Jump over the orange barriers",
    text: "Press Space, W or the up arrow to jump a barrier, or change lane and leave it behind. On a phone, swipe up.",
    anchor: "#how-to-play",
  },
  {
    name: "Slide under the blue gates",
    text: "Blue overhead gates need you low to the ground: press S or the down arrow to slide, or move into a clear lane.",
    anchor: "#how-to-play",
  },
  {
    name: "Change lane to dodge the trains",
    text: "Trains fill a whole lane and are far too tall to jump, so read the track ahead and switch lanes early.",
    anchor: "#tips",
  },
  {
    name: "Collect coins and score points",
    text: "Each coin adds ten points and the coin trails usually trace a safe route through the traffic.",
    anchor: "#scoring",
  },
  {
    name: "Beat your personal best",
    text: "Distance raises your score, the city keeps speeding up, and your best run is stored locally so the next attempt has a target.",
    anchor: "#scoring",
  },
];

export const FAQ: FaqItem[] = [
  {
    id: "faq-free",
    question: "Is Afterlight Run free to play?",
    answer:
      "Yes. Afterlight Run is completely free, with no account, no in-app purchases, no ads and no paywall. Open the page and press Let's Run.",
  },
  {
    id: "faq-install",
    question: "Do I have to download or install anything?",
    answer:
      "No. The game is a web page: it loads a few hundred kilobytes of HTML, CSS and JavaScript and starts in the browser. You can optionally install it to your home screen as a Progressive Web App, but nothing is required.",
  },
  {
    id: "faq-devices",
    question: "Which devices and browsers are supported?",
    answer:
      "Any modern browser with WebGL — Chrome, Edge, Firefox, Safari and their mobile versions on desktop, laptop, tablet or phone. Desktop players use the keyboard, touch devices use swipe gestures.",
  },
  {
    id: "faq-controls",
    question: "How do I control the runner?",
    answer:
      "You are always moving forward. Press the left or right arrow key (or A and D) to switch lanes, Space, W or the up arrow to jump, and S or the down arrow to slide. On a touch screen, swipe left, right, up or down. Escape or P pauses the run.",
  },
  {
    id: "faq-score",
    question: "How is the score calculated?",
    answer:
      "Every metre you survive adds points, every coin adds ten, and the city moves faster the longer you last — so later distance is worth more. Your personal best is stored locally in your browser.",
  },
  {
    id: "faq-save",
    question: "Where is my high score saved?",
    answer:
      "On your own device, in browser local storage. Nothing is uploaded anywhere, and clearing site data resets the record.",
  },
  {
    id: "faq-offline",
    question: "Does Afterlight Run work offline?",
    answer:
      "Yes. After your first visit a service worker caches the game, so you can install it to your home screen and keep playing with no connection.",
  },
  {
    id: "faq-ads",
    question: "Are there ads, cookies or trackers?",
    answer:
      "None. There are no ad SDKs, no third-party analytics and no tracking cookies. Fonts, icons and artwork are bundled with the game instead of being fetched from a CDN.",
  },
  {
    id: "faq-train",
    question: "What should I do when a train blocks my lane?",
    answer:
      "Change lane. Trains are too tall to jump and too long to slide under, so read the track ahead and move early — the middle lane usually keeps both escape routes open.",
  },
  {
    id: "faq-difficulty",
    question: "Is there a difficulty setting?",
    answer:
      "There is no menu setting to change: every run starts slow and gets harder by itself as speed and obstacle density ramp up. An adaptive renderer also adjusts resolution, shadows and draw distance to keep the frame rate smooth on your hardware.",
  },
  {
    id: "faq-tech",
    question: "What is Afterlight Run built with?",
    answer:
      "TypeScript, Three.js and Vite, rendered through WebGL 2. The city, the runner and every prop are generated procedurally in code, so there are no downloaded 3D models or texture files.",
  },
  {
    id: "faq-accessibility",
    question: "Can it be played with a keyboard only?",
    answer:
      "Yes. Every action has a keyboard binding, menus are reachable with Tab, buttons carry accessible labels and the interface honours the prefers-reduced-motion setting. Touch controls are a parallel input path, not a replacement.",
  },
  {
    id: "faq-school",
    question: "Is it safe to run on school or shared computers?",
    answer:
      "Afterlight Run is single-player, with no chat, no accounts, no external requests and no data collection. The only thing it stores is your own high score, which stays in your browser.",
  },
];

export const TIPS: string[] = [
  "Read two obstacles ahead instead of one — the pattern repeats, so react to the gap you are about to reach.",
  "Jump early rather than late. Landing on top of a train ends the run, and a mistimed jump has no second chance.",
  "Sliding keeps your hitbox low and your speed high, which makes it the safer read whenever a gate and a barrier share a lane.",
  "Coin trails are a map: they are laid out along lines that are actually safe to run, so following them is rarely the wrong decision.",
  "Hold the middle lane when you can. It keeps both escape routes open when a train appears without warning.",
  "Play full screen on a desktop monitor — a taller viewport shows you the barriers earlier and buys you reaction time.",
];

/** Scenarios used for the "Who is it for" list. */
export const AUDIENCES: string[] = [
  "Players who grew up on three-lane endless runners and want a sharper, faster, better looking version in the browser.",
  "Anyone on a work or study break who wants ninety seconds of focus without installing an app or creating an account.",
  "Web developers and students who want to poke at a real WebGL 2 game: the source is public and every asset is generated in code.",
];

export type Release = { version: string; date?: string; items: string[] };

/**
 * Release notes. Rendered in `index.html` under "What's new" and reused for the
 * RSS feed, so the page and the feed can never disagree. Keep entries in the
 * same wording that appears on the page.
 */
export const RELEASES: Release[] = [
  {
    version: "1.1.0",
    date: "2026-09-29",
    items: [
      "A full discoverability pass: structured data for the game, a written guide, the FAQ on this page and a social card for links.",
      "Installable app support so the whole game is cached and playable offline.",
      "A creator section with a direct line to the developer.",
    ],
  },
  {
    version: "1.0.0",
    items: [
      "Three-lane neon runner with a procedurally generated transit district.",
      "Adaptive quality tiers, contact shadows and pooled obstacle models.",
      "Coins, distance scoring, local personal bests and synthesised Web Audio sound effects — no downloaded audio files.",
    ],
  },
];
