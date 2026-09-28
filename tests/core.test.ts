import { test } from "node:test";
import assert from "node:assert/strict";
import { Scene } from "three";
import { Player } from "../src/game/Player";
import { PlayerState } from "../src/game/GameState";
import { TrackManager } from "../src/game/Track";
test("lane bounds, smooth movement, jump and slide state machine", () => {
  const p = new Player();
  p.move(-1);
  p.move(-1);
  assert.equal(p.lane, 0);
  p.update(1 / 60);
  assert.ok(p.group.position.x < 0 && p.group.position.x > -2.7);
  assert.ok(p.jump());
  assert.equal(p.jump(), false);
  for (let i = 0; i < 100; i++) p.update(1 / 120);
  assert.equal(p.state, PlayerState.RUNNING);
  assert.ok(p.slide());
  assert.equal(p.jump(), false);
  assert.ok(p.height < 1);
  p.update(0.71);
  assert.equal(p.state, PlayerState.RUNNING);
  p.reset();
  assert.equal(p.lane, 1);
});
test("track maintains bounded pool and seamless spacing after long run", () => {
  const track = new TrackManager(new Scene());
  for (let i = 0; i < 60000; i++) track.update(1 / 120, 20);
  assert.equal(track.chunks.length, 8);
  const zs = track.chunks.map((c) => c.group.position.z).sort((a, b) => a - b);
  for (let i = 1; i < zs.length; i++)
    assert.ok(Math.abs(zs[i] - zs[i - 1] - 30) < 0.001);
});
import { makePattern, isPatternPlayable } from "../src/game/Patterns";
import { EncounterManager } from "../src/game/Encounters";
import { CollisionSystem } from "../src/game/Collision";
test("10,000 generated patterns retain an unobstructed lane", () => {
  for (let i = 0; i < 10000; i++)
    assert.ok(isPatternPlayable(makePattern(i, Math.random())));
  assert.equal(
    isPatternPlayable({ safeLane: 1, obstacles: [{ lane: 1, type: "train" }] }),
    false,
  );
});
test("jump clears barrier, slide clears overhead, standing hits both", () => {
  const p = new Player();
  const rows = new EncounterManager(new Scene());
  const row = rows.rows[0];
  row.group.position.z = 0;
  const collision = new CollisionSystem();
  assert.ok(collision.obstacleHit(p, rows));
  p.y = 1.1;
  assert.equal(collision.obstacleHit(p, rows), false);
  p.y = 0;
  row.obstacles[0].set("overhead", 1);
  assert.ok(collision.obstacleHit(p, rows));
  p.slide();
  assert.equal(collision.obstacleHit(p, rows), false);
  row.obstacles[0].set("train", 1);
  assert.ok(collision.obstacleHit(p, rows));
});
import { DifficultyManager } from "../src/game/Difficulty";
import { ScoreManager } from "../src/game/Score";
import { CoinManager } from "../src/game/Coin";
test("speed increases gradually, caps and resets", () => {
  const d = new DifficultyManager();
  d.update(60);
  assert.equal(d.speed, 16);
  d.update(1000);
  assert.equal(d.speed, 20);
  d.reset();
  assert.equal(d.speed, 12);
});
test("coins collect only once, award ten points, and reset", () => {
  const p = new Player();
  const rows = new EncounterManager(new Scene());
  const coins = new CoinManager(rows);
  const score = new ScoreManager();
  const c = coins.groups[0].coins[0];
  c.reset(0, 48, 1);
  coins.update(0.01, p, () => score.collect());
  coins.update(0.01, p, () => score.collect());
  assert.equal(score.coins, 1);
  assert.equal(score.score, 10);
  score.update(100);
  assert.equal(score.score, 310);
  coins.reset();
  score.reset();
  assert.equal(score.score, 0);
  assert.equal(c.collected, false);
});
import { swipeAction } from "../src/game/Input";
test("four swipe directions and rejection of tiny gestures", () => {
  assert.equal(swipeAction(-70, 5), "left");
  assert.equal(swipeAction(70, 5), "right");
  assert.equal(swipeAction(0, -70), "jump");
  assert.equal(swipeAction(4, 70), "slide");
  assert.equal(swipeAction(20, 20), null);
});
test("ten-minute simulation remains bounded, collectible and fair at maximum difficulty", () => {
  const scene = new Scene(),
    p = new Player(),
    rows = new EncounterManager(scene),
    coins = new CoinManager(rows),
    difficulty = new DifficultyManager(),
    collision = new CollisionSystem();
  let collected = 0;
  for (let i = 0; i < 120 * 600; i++) {
    const next = rows.rows
      .filter((r) => r.group.position.z < 4)
      .sort((a, b) => b.group.position.z - a.group.position.z)[0];
    if (next && next.group.position.z < -8) p.lane = next.safeLane;
    difficulty.update(1 / 120);
    p.update(1 / 120);
    rows.update(1 / 120, difficulty.speed, difficulty.hardness);
    coins.update(1 / 120, p, () => collected++);
    assert.equal(
      collision.obstacleHit(p, rows),
      false,
      `Unexpected collision at ${difficulty.time}s`,
    );
  }
  assert.equal(rows.rows.length, 8);
  assert.equal(
    coins.groups.reduce((sum, g) => sum + g.coins.length, 0),
    72,
  );
  assert.ok(collected > 500);
  assert.equal(difficulty.speed, 20);
});
