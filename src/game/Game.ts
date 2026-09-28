import * as T from "three";
import { Player } from "./Player";
import { InputManager, type Action } from "./Input";
import { TrackManager } from "./Track";
import { EncounterManager } from "./Encounters";
import { CollisionSystem } from "./Collision";
import { CoinManager } from "./Coin";
import { ScoreManager } from "./Score";
import { DifficultyManager } from "./Difficulty";
import { GameState, PlayerState } from "./GameState";
import { QualityManager } from "../rendering/QualityManager";
import { CoinRenderer } from "../rendering/CoinRenderer";
import { ContactShadows } from "../rendering/ContactShadows";
import { Environment } from "../world/Environment";
import { Particles } from "../world/Particles";
import { AudioManager } from "../audio/AudioManager";
import { UIManager } from "../ui/UIManager";
export class Game {
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 260);
  renderer: T.WebGLRenderer;
  particles: Particles;
  shadows: ContactShadows;
  coinRenderer: CoinRenderer;
  quality: QualityManager;
  player = new Player();
  track: TrackManager;
  encounters: EncounterManager;
  coins: CoinManager;
  collision = new CollisionSystem();
  score = new ScoreManager();
  difficulty = new DifficultyManager();
  input: InputManager;
  ui: UIManager;
  state = GameState.MENU;
  paused = false;
  private last = 0;
  private accumulator = 0;
  private uiTimer = 0;
  audio = new AudioManager();
  private dpr = 0;
  private crashTime = 0;
  constructor() {
    this.renderer = new T.WebGLRenderer({
      canvas: document.querySelector("canvas")!,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.scene.background = new T.Color("#102937");
    this.scene.fog = new T.Fog("#1b3543", 48, 170);
    this.scene.add(new T.HemisphereLight(0xa9d8ed, 0x13202e, 1.65));
    const light = new T.DirectionalLight(0xffe1b2, 4.2);
    light.position.set(-18, 26, 16);
    this.scene.add(light);
    new Environment(this.scene);
    this.particles = new Particles(this.scene);
    this.track = new TrackManager(this.scene);
    this.encounters = new EncounterManager(this.scene);
    this.coins = new CoinManager(this.encounters);
    this.coinRenderer = new CoinRenderer(this.scene, this.coins);
    this.shadows = new ContactShadows(this.scene, this.player, this.encounters);
    this.scene.add(this.player.group);
    this.quality = new QualityManager(this.track.chunks);
    this.input = new InputManager((a) => this.act(a));
    this.ui = new UIManager(
      () => this.start(),
      () => this.audio.toggle(),
      () => this.togglePause(),
    );
    this.ui.show(this.state, this.score);
    this.encounters.rows[0].group.position.z = -20;
    this.encounters.rows[0].obstacles[0].set("train", 2);
    this.encounters.rows[1].group.position.z = -38;
    this.encounters.rows[1].obstacles[0].set("barrier", 0);
    this.coins.reset();
    addEventListener("resize", () => this.resize());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.state === GameState.PLAYING && !this.paused)
        this.togglePause();
      this.last = 0;
    });
    this.resize();
    this.setCamera(true);
    requestAnimationFrame(this.frame);
  }
  act(action: Action) {
    if (this.ui.helpOpen) return;
    if (action === "start") {
      if (this.state !== GameState.PLAYING) this.start();
      else if (this.paused) this.togglePause();
      return;
    }
    if (action === "pause") {
      this.togglePause();
      return;
    }
    if (this.state !== GameState.PLAYING || this.paused) return;
    if (action === "left") this.player.move(-1);
    if (action === "right") this.player.move(1);
    if (action === "jump" && this.player.jump()) this.audio.play("jump");
    if (action === "slide" && this.player.slide()) this.audio.play("slide");
  }
  start() {
    if (this.state === GameState.PLAYING || this.ui.helpOpen) return;
    this.audio.unlock();
    this.particles.reset();
    this.player.reset();
    this.track.reset();
    this.encounters.reset();
    this.coins.reset();
    this.score.reset();
    this.difficulty.reset();
    this.state = GameState.PLAYING;
    this.paused = false;
    this.accumulator = 0;
    this.crashTime = 0;
    this.last = 0;
    this.input.active = true;
    this.ui.pause(false);
    this.ui.show(this.state, this.score);
    this.ui.update(this.score, 12, 0);
    this.resize();
    this.setCamera(true);
    (document.activeElement as HTMLElement)?.blur();
  }
  togglePause() {
    if (this.state !== GameState.PLAYING) return;
    this.paused = !this.paused;
    this.ui.pause(this.paused);
    this.accumulator = 0;
    this.last = 0;
  }
  crash() {
    this.audio.play("crash");
    this.state = GameState.GAME_OVER;
    this.player.state = PlayerState.DEAD;
    this.score.save();
    this.input.active = false;
    this.crashTime = 0.4;
    this.ui.show(this.state, this.score);
    this.ui.update(this.score, this.difficulty.speed, this.difficulty.time);
  }
  resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.fov = innerWidth < 600 ? 65 : 55;
    this.camera.clearViewOffset();
    if (this.state === GameState.MENU)
      this.camera.setViewOffset(
        innerWidth,
        innerHeight,
        -innerWidth * (innerWidth < 760 ? 0.27 : 0.24),
        0,
        innerWidth,
        innerHeight,
      );
    this.camera.updateProjectionMatrix();
    this.dpr = this.quality.pixelRatio(
      innerWidth,
      innerHeight,
      devicePixelRatio,
    );
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(innerWidth, innerHeight);
  }
  setCamera(snap = false, dt = 0) {
    const menu = this.state === GameState.MENU;
    const x = menu ? 1.6 : this.player.group.position.x * 0.14;
    const y = menu ? 5.6 : 5.4 + this.player.y * 0.15;
    this.camera.position.x = snap
      ? x
      : T.MathUtils.damp(this.camera.position.x, x, 5, dt);
    this.camera.position.y = snap
      ? y
      : T.MathUtils.damp(this.camera.position.y, y, 5, dt);
    const forward = menu ? 11 : 9.8 - ((this.difficulty.speed - 12) / 8) * 0.22;
    this.camera.position.z = snap
      ? forward
      : T.MathUtils.damp(this.camera.position.z, forward, 3, dt);
    this.camera.lookAt(
      menu ? -0.5 : this.player.group.position.x * 0.08,
      1.4,
      -22,
    );
  }
  step(dt: number) {
    this.difficulty.update(dt);
    this.player.update(dt);
    this.track.update(dt, this.difficulty.speed);
    this.encounters.update(dt, this.difficulty.speed, this.difficulty.hardness);
    this.score.update(dt * this.difficulty.speed);
    if (this.collision.obstacleHit(this.player, this.encounters)) {
      this.crash();
      return;
    }
    this.coins.update(dt, this.player, () => {
      this.score.collect();
      this.audio.play("coin");
      this.particles.burst(this.player.group.position.x, this.player.y + 1);
    });
  }
  frame = (now: number) => {
    requestAnimationFrame(this.frame);
    const frameMs = this.last ? now - this.last : 0;
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.1) : 0;
    this.last = now;
    if (
      this.quality.pixelRatio(innerWidth, innerHeight, devicePixelRatio) !==
      this.dpr
    )
      this.resize();
    if (this.state === GameState.PLAYING && !this.paused) {
      this.accumulator += dt;
      while (this.accumulator >= 1 / 120 && this.state === GameState.PLAYING) {
        this.step(1 / 120);
        this.accumulator -= 1 / 120;
      }
      this.setCamera(false, dt);
      this.uiTimer += dt;
      if (this.uiTimer > 0.08) {
        this.ui.update(this.score, this.difficulty.speed, this.difficulty.time);
        this.uiTimer = 0;
      }
    } else if (this.state === GameState.MENU) {
      this.player.update(dt * 0.5);
      this.coins.update(dt, this.player, () => {}, false);
    }
    if (this.crashTime > 0) {
      this.crashTime = Math.max(0, this.crashTime - dt);
      this.camera.position.x += Math.sin(now * 0.07) * this.crashTime * 0.12;
      this.player.group.rotation.z = -0.15;
    }
    if (!this.paused) this.particles.update(dt);
    this.quality.apply();
    this.shadows.setObstacleShadows(this.quality.tier !== "LOW");
    this.coinRenderer.update();
    this.shadows.update();
    this.renderer.render(this.scene, this.camera);
    if (
      this.quality.observe(
        frameMs,
        this.renderer.info.render.calls,
        this.renderer.info.render.triangles,
        this.state === GameState.PLAYING && !this.paused && !document.hidden,
      )
    )
      this.resize();
  };
}
