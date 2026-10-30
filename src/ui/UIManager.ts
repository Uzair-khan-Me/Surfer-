import { GameState } from "../game/GameState";
import { ScoreManager } from "../game/Score";
const speaker =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
export class UIManager {
  root = document.querySelector<HTMLDivElement>("#ui")!;
  constructor(onStart: () => void, onMute: () => boolean, onPause: () => void) {
    this.root.innerHTML = `
 <header class="topbar"><a class="brand" href="/" aria-label="Afterlight Run home"><span class="brand-symbol">≋</span><span>AFTERLIGHT<span class="brand-run"> / RUN</span></span></a><div class="top-actions"><span class="edition">FREE 3D BROWSER RUNNER <i></i> NO DOWNLOAD</span><button class="icon-button" id="sound" aria-label="Mute sound" title="Toggle sound">${speaker}</button><button class="text-button" id="about-button">GAME INFO <span>↗</span></button><button class="text-button" id="help-button">HOW TO PLAY <span>↗</span></button><button class="icon-button" id="pause" aria-label="Pause game" hidden>Ⅱ</button></div></header>
 <main id="menu" class="menu"><div class="eyebrow"><span class="live-dot"></span> THE CITY SLEEPS. YOU DON'T.</div><h1>AFTERLIGHT<br><span>RUN</span><span class="title-star">✳</span></h1><p class="intro">Chase the last light across a 3D three-lane transit district.<br>Play free in your browser — no download, PC &amp; mobile.</p><div class="play-row"><button class="primary" id="play">LET'S RUN <span>↗</span></button><span class="keyboard-hint">PRESS <kbd>ENTER</kbd><br>TO HIT THE TRACK</span></div><div class="personal-best"><span>♜</span> PERSONAL BEST <strong id="menu-best">000000</strong></div></main>
 <div id="world-label" class="world-label"><span class="live-dot"></span> LINE 04 <span class="muted">/</span> THE NIGHT SHIFT <small>3D ENDLESS RUNNER · INSTANT WEBGL2</small></div>
 <section id="controls" class="control-strip" aria-label="Controls"><div class="control-intro"><span class="eyebrow">A LITTLE HEAD START</span><strong>Find your flow.</strong></div><div class="control"><div class="key-pair"><kbd>←</kbd><kbd>→</kbd></div><div><strong>Switch lanes</strong><small>A / D or arrow keys</small></div></div><div class="control"><kbd class="wide-key">SPACE ↑</kbd><div><strong>Catch some air</strong><small>Space / W / ↑ to jump</small></div></div><div class="control"><kbd>↓</kbd><div><strong>Keep it low</strong><small>S / ↓ to slide</small></div></div><div class="control touch-tip"><span class="swipe-icon">↟</span><div><strong>On your phone?</strong><small>Swipe to make your move</small></div></div></section>
 <div id="hud" class="hud" hidden><div class="hud-score"><span>SCORE</span><strong id="score">000000</strong><div class="hud-best">BEST <b id="hud-best">0</b></div></div><div class="coin-counter"><span class="coin-icon">◈</span><strong id="coins">000</strong></div><div class="run-stats"><span id="distance">0 M</span><i></i><span id="speed">12.0 M/S</span></div><div id="tutorial" class="tutorial">FOLLOW THE LIGHT. FIND YOUR LANE.</div></div>
 <section id="gameover" class="overlay" hidden><div class="result-card"><span class="eyebrow">THE CITY WILL BE HERE.</span><div class="result-mark">↯</div><h2>END OF<br><em>THE LINE.</em></h2><p>Take a breath. Chase it again.</p><div class="result-numbers"><div><span>FINAL SCORE</span><strong id="final-score">0</strong></div><div><span>COINS</span><strong id="final-coins">0</strong></div></div><div class="result-best"><span id="record-label">PERSONAL BEST</span><b id="final-best">0</b></div><button id="retry" class="primary">RUN IT BACK <span>↗</span></button><small class="restart-hint">RETRY WITH ENTER OR SPACE</small></div></section>
 <section id="pause-screen" class="overlay" hidden><div class="result-card pause-card"><span class="eyebrow">NO RUSH.</span><h2>TAKE FIVE.</h2><p>Your run is right where you left it.</p><button class="primary" id="resume">KEEP RUNNING <span>→</span></button></div></section>
 <section id="help" class="overlay" hidden><div class="result-card help-card"><button class="close-button" id="close-help" aria-label="Close instructions">×</button><span class="eyebrow">YOUR NIGHT. YOUR RUN.</span><h2>FIND YOUR FLOW.</h2><p>Run automatically. Collect the light. Stay on your feet.</p><ul><li><b>← → / A D</b><span>Switch between three lanes</span></li><li><b>SPACE / W / ↑</b><span>Jump over orange barriers</span></li><li><b>S / ↓</b><span>Slide under blue gates</span></li><li><b>TRAINS</b><span>Switch lanes to avoid them</span></li><li><b>ON MOBILE</b><span>Swipe left, right, up or down</span></li><li><b>ESC / P</b><span>Pause and catch your breath</span></li></ul><p class="help-note">Distance earns points. Every coin adds 10.<br>The longer you run, the faster the city moves.</p></div></section>
 <section id="about" class="overlay" hidden aria-label="About Afterlight Run and FAQ"><article class="result-card about-card"><button class="close-button" id="close-about" aria-label="Close game info">×</button><span class="eyebrow">INDEPENDENT 3D WEBGL2 ENDLESS RUNNER</span><h2>ABOUT AFTERLIGHT RUN</h2><p class="about-lead">Afterlight Run is a free 3D three-lane endless runner browser game built with Three.js and a deterministic 120 Hz physics loop. Sprint down nocturnal transit tracks, dodge oncoming subway trains, leap orange barriers, slide beneath blue overhead gates, and collect gold coin lines — with zero downloads, zero accounts, and zero ads.</p><div class="about-guides"><span class="eyebrow">EXPLORE RUNNER GUIDES</span><nav class="guide-grid" aria-label="Runner topic guides"><a href="/games-like-subway-surfers">Games Like Subway Surfers <span>↗</span></a><a href="/surfer-runner-online">3D Train Surfer Online <span>↗</span></a><a href="/no-download-browser-games">No-Download 3D Games <span>↗</span></a><a href="/chromebook-unblocked-runner">Chromebook &amp; PC Runner <span>↗</span></a><a href="/how-to-play-guide">Controls &amp; Pro Strategy <span>↗</span></a></nav></div><div class="about-faq"><h3>Is Afterlight Run completely free with no download?</h3><p>Yes. Afterlight Run is 100% free to play directly in your web browser with no download, no installer, no account registration, and no ads or paywalls.</p><h3>Is Afterlight Run similar to Subway Surfers?</h3><p>Afterlight Run is an original indie 3D three-lane endless runner inspired by the classic arcade rhythm of transit-track runners like Subway Surfers. You switch across three railway lanes, dodge oncoming trains, jump low barriers, slide under overhead gates, and collect coin trails right in your browser without downloading a mobile app.</p><h3>What devices and browsers support Afterlight Run?</h3><p>Afterlight Run runs in any modern WebGL2 browser across Windows PCs, Macs, Chromebooks, Linux laptops, iPhones, iPads, and Android phones using adaptive quality scaling for smooth performance.</p><h3>What are the keyboard and mobile touch controls?</h3><p>On desktop and Chromebook, use A/D or Left/Right Arrows to switch lanes, Space/W/Up Arrow to jump, S/Down Arrow to slide, and P or Escape to pause. On phones and tablets, swipe left, right, up, or down anywhere on the screen.</p><h3>Are obstacle patterns always fair and solvable?</h3><p>Yes. Every procedural obstacle row is mathematically validated to contain at most two hazards and at least one guaranteed passable lane, with spacing calibrated so you always have time to cross lanes even at the 20 m/s maximum speed.</p></div></article></section>
 <footer id="footer"><span><i class="live-dot"></i> BUILT FOR THE LONG RUN</span><nav class="footer-links" aria-label="Game guides"><a href="/games-like-subway-surfers">SUBWAY-STYLE RUNNERS</a><a href="/surfer-runner-online">3D TRAIN SURFER</a><a href="/no-download-browser-games">NO-DOWNLOAD GAMES</a><a href="/chromebook-unblocked-runner">CHROMEBOOK &amp; PC</a><a href="/how-to-play-guide">STRATEGY GUIDE</a></nav><span>NO FINISH LINE. JUST YOU. <b>↗</b></span></footer>`;
    this.el("play").onclick = onStart;
    this.el("retry").onclick = onStart;
    this.el("sound").onclick = () => {
      const muted = onMute();
      this.el("sound").classList.toggle("is-muted", muted);
      this.el("sound").setAttribute(
        "aria-label",
        muted ? "Unmute sound" : "Mute sound",
      );
    };
    this.el("pause").onclick = onPause;
    this.el("resume").onclick = onPause;
    this.el("help-button").onclick = () => {
      this.el("about").hidden = true;
      this.el("help").hidden = false;
      this.el("close-help").focus();
    };
    this.el("close-help").onclick = () => {
      this.el("help").hidden = true;
      this.el("help-button").focus();
    };
    this.el("about-button").onclick = () => {
      this.el("help").hidden = true;
      this.el("about").hidden = false;
      this.el("close-about").focus();
    };
    this.el("close-about").onclick = () => {
      this.el("about").hidden = true;
      this.el("about-button").focus();
    };
    this.el("about").onclick = (e) => {
      if (e.target === this.el("about")) {
        this.el("about").hidden = true;
      }
    };
    addEventListener("keydown", (e) => {
      if (e.code === "Escape") {
        if (!this.el("about").hidden) this.el("about").hidden = true;
        else if (!this.el("help").hidden) this.el("help").hidden = true;
      }
    });
    this.root.querySelector<HTMLAnchorElement>("a.brand")!.onclick = (e) =>
      e.preventDefault();
  }
  el(id: string) {
    return document.getElementById(id)!;
  }
  get helpOpen() {
    return !this.el("help").hidden || !this.el("about").hidden;
  }
  show(state: GameState, score: ScoreManager) {
    const menu = state === GameState.MENU;
    for (const id of [
      "menu",
      "controls",
      "footer",
      "world-label",
      "help-button",
      "about-button",
    ])
      this.el(id).hidden = !menu;
    this.el("hud").hidden = menu;
    this.el("pause").hidden = state !== GameState.PLAYING;
    this.el("gameover").hidden = state !== GameState.GAME_OVER;
    this.el("menu-best").textContent = String(score.best).padStart(6, "0");
    this.root.dataset.state = state;
    if (state === GameState.GAME_OVER) {
      this.el("final-score").textContent = score.score.toLocaleString();
      this.el("final-coins").textContent = String(score.coins);
      this.el("final-best").textContent = score.best.toLocaleString();
      this.el("record-label").textContent =
        score.score >= score.best ? "A NEW PERSONAL BEST" : "PERSONAL BEST";
      this.el("retry").focus({ preventScroll: true });
    }
  }
  update(score: ScoreManager, speed: number, time: number) {
    this.el("score").textContent = String(score.score).padStart(6, "0");
    this.el("coins").textContent = String(score.coins).padStart(3, "0");
    this.el("hud-best").textContent = score.best.toLocaleString();
    this.el("distance").textContent = `${Math.floor(score.distance)} M`;
    this.el("speed").textContent = `${speed.toFixed(1)} M/S`;
    this.el("tutorial").hidden = time > 9;
    this.el("tutorial").textContent =
      time < 3
        ? "FOLLOW THE LIGHT. FIND YOUR LANE."
        : time < 6
          ? "ORANGE BARRIERS? JUMP OR CHANGE LANES."
          : "BLUE GATES? SLIDE OR CHANGE LANES.";
  }
  pause(paused: boolean) {
    this.el("pause-screen").hidden = !paused;
    if (paused) this.el("resume").focus();
  }
}
