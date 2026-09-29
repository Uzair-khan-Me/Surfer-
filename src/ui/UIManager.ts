import { GameState } from "../game/GameState";
import { ScoreManager } from "../game/Score";
const speaker =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
export class UIManager {
  root = document.querySelector<HTMLDivElement>("#ui")!;
  constructor(onStart: () => void, onMute: () => boolean, onPause: () => void) {
    this.root.innerHTML = `
 <header class="topbar"><a class="brand" href="#top" aria-label="Afterlight Run — back to the start"><span class="brand-symbol">≋</span><span>AFTERLIGHT<span class="brand-run"> / RUN</span></span></a><div class="top-actions"><span class="edition">INDEPENDENT ARCADE <i></i> VOL. 01</span><a class="text-button hero-guide" href="#main-content">GUIDE <span>↘</span></a><button class="icon-button" id="sound" aria-label="Mute sound" title="Toggle sound">${speaker}</button><button class="text-button" id="help-button">HOW TO PLAY <span>↗</span></button><button class="icon-button" id="pause" aria-label="Pause game" hidden>Ⅱ</button></div></header>
 <section id="menu" class="menu"><div class="eyebrow"><span class="live-dot"></span> THE CITY SLEEPS. YOU DON'T.</div><div class="hero-title">AFTERLIGHT<br><span>RUN</span><span class="title-star">✳</span></div><p class="intro">Chase the last light.<br>Three lanes. One way forward. No looking back.</p><div class="play-row"><button class="primary" id="play">LET'S RUN <span>↗</span></button><span class="keyboard-hint">PRESS <kbd>ENTER</kbd><br>TO HIT THE TRACK</span></div><p class="hero-credit">MAINTAINED BY <a href="https://uzairali-18.github.io/Portfolio/" target="_blank" rel="noopener">UZAIR ALI <span aria-hidden="true">↗</span></a><br><small>SEO SPECIALIST &amp; WEB DEVELOPER</small></p><div class="personal-best"><span>♜</span> PERSONAL BEST <strong id="menu-best">000000</strong></div></section>
 <div id="world-label" class="world-label"><span class="live-dot"></span> LINE 04 <span class="muted">/</span> THE NIGHT SHIFT <small>ENDLESS POSSIBILITIES. ONE MORE RUN.</small></div>
 <section id="controls" class="control-strip" aria-label="Controls"><div class="control-intro"><span class="eyebrow">A LITTLE HEAD START</span><strong>Find your flow.</strong></div><div class="control"><div class="key-pair"><kbd>←</kbd><kbd>→</kbd></div><div><strong>Switch lanes</strong><small>A / D or arrow keys</small></div></div><div class="control"><kbd class="wide-key">SPACE ↑</kbd><div><strong>Catch some air</strong><small>Space / W / ↑ to jump</small></div></div><div class="control"><kbd>↓</kbd><div><strong>Keep it low</strong><small>S / ↓ to slide</small></div></div><div class="control touch-tip"><span class="swipe-icon">↟</span><div><strong>On your phone?</strong><small>Swipe to make your move</small></div></div></section>
 <div id="hud" class="hud" hidden><div class="hud-score"><span>SCORE</span><strong id="score">000000</strong><div class="hud-best">BEST <b id="hud-best">0</b></div></div><div class="coin-counter"><span class="coin-icon">◈</span><strong id="coins">000</strong></div><div class="run-stats"><span id="distance">0 M</span><i></i><span id="speed">12.0 M/S</span></div><div id="tutorial" class="tutorial">FOLLOW THE LIGHT. FIND YOUR LANE.</div></div>
 <section id="gameover" class="overlay" hidden><div class="result-card"><span class="eyebrow">THE CITY WILL BE HERE.</span><div class="result-mark">↯</div><h2>END OF<br><em>THE LINE.</em></h2><p>Take a breath. Chase it again.</p><div class="result-numbers"><div><span>FINAL SCORE</span><strong id="final-score">0</strong></div><div><span>COINS</span><strong id="final-coins">0</strong></div></div><div class="result-best"><span id="record-label">PERSONAL BEST</span><b id="final-best">0</b></div><button id="retry" class="primary">RUN IT BACK <span>↗</span></button><small class="restart-hint">RETRY WITH ENTER OR SPACE</small></div></section>
 <section id="pause-screen" class="overlay" hidden><div class="result-card pause-card"><span class="eyebrow">NO RUSH.</span><h2>TAKE FIVE.</h2><p>Your run is right where you left it.</p><button class="primary" id="resume">KEEP RUNNING <span>→</span></button></div></section>
 <section id="help" class="overlay" hidden><div class="result-card help-card"><button class="close-button" id="close-help" aria-label="Close instructions">×</button><span class="eyebrow">YOUR NIGHT. YOUR RUN.</span><h2>FIND YOUR FLOW.</h2><p>Run automatically. Collect the light. Stay on your feet.</p><ul><li><b>← → / A D</b><span>Switch between three lanes</span></li><li><b>SPACE / W / ↑</b><span>Jump over orange barriers</span></li><li><b>S / ↓</b><span>Slide under blue gates</span></li><li><b>TRAINS</b><span>Switch lanes to avoid them</span></li><li><b>ON MOBILE</b><span>Swipe left, right, up or down</span></li><li><b>ESC / P</b><span>Pause and catch your breath</span></li></ul><p class="help-note">Distance earns points. Every coin adds 10.<br>The longer you run, the faster the city moves.</p></div></section>
 <div id="footer" role="presentation"><span><i class="live-dot"></i> BUILT FOR THE LONG RUN</span><span>NO FINISH LINE. JUST YOU. <b>↗</b></span></div>`;
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
      this.el("help").hidden = false;
      this.el("close-help").focus();
    };
    this.el("close-help").onclick = () => {
      this.el("help").hidden = true;
      this.el("help-button").focus();
    };
  }
  el(id: string) {
    return document.getElementById(id)!;
  }
  get helpOpen() {
    return !this.el("help").hidden;
  }
  show(state: GameState, score: ScoreManager) {
    const menu = state === GameState.MENU;
    for (const id of [
      "menu",
      "controls",
      "footer",
      "world-label",
      "help-button",
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
