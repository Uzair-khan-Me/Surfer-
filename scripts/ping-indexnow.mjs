/**
 * Instant URL submission to IndexNow (Bing, DuckDuckGo, Yandex, Seznam, Naver).
 * Run after deploying to https://surfer-pc.vercel.app:
 *   npm run seo:indexnow
 */
const HOST = "surfer-pc.vercel.app";
const KEY = "a8f4c2e9b1d74f63a0e5c8b2d4f6a9e1";
const URLS = [
  `https://${HOST}/`,
  `https://${HOST}/games-like-subway-surfers`,
  `https://${HOST}/surfer-runner-online`,
  `https://${HOST}/no-download-browser-games`,
  `https://${HOST}/chromebook-unblocked-runner`,
  `https://${HOST}/how-to-play-guide`,
];

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: URLS,
  }),
});

console.log(`IndexNow response: HTTP ${res.status} ${res.statusText}`);
if (res.ok || res.status === 202) {
  console.log("Submitted URLs:", URLS);
} else {
  console.error(await res.text());
  process.exitCode = 1;
}
