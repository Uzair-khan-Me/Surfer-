import "@fontsource/barlow-condensed/latin-800-italic.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-700.css";
import "./style.css";
import "./content.css";
import { Game } from "./game/Game";
import { initExperience } from "./seo/experience";
import { registerServiceWorker } from "./seo/pwa";
export const game = new Game();
// Progressive enhancement for the crawlable content that ships with the canvas.
initExperience(game);
// Development-only inspection point for reproducible browser acceptance tests.
if (import.meta.env.DEV) Object.assign(window, { __afterlight: game });
// Installable, offline-capable build (production only).
registerServiceWorker();
