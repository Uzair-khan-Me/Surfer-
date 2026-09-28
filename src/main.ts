import "@fontsource/barlow-condensed/latin-800-italic.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-700.css";
import "./style.css";
import { Game } from "./game/Game";
export const game = new Game();
// Development-only inspection point for reproducible browser acceptance tests.
if (import.meta.env.DEV) Object.assign(window, { __afterlight: game });
