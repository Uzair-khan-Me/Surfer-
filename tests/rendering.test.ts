import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {
  QualityManager,
  initialQuality,
} from "../src/rendering/QualityManager";
import { obstacleModel } from "../src/rendering/ObstacleModels";
import { CoinRenderer } from "../src/rendering/CoinRenderer";
import { CoinManager } from "../src/game/Coin";
import { EncounterManager } from "../src/game/Encounters";
import { TrackManager } from "../src/game/Track";
import { Player } from "../src/game/Player";
import { PlayerState } from "../src/game/GameState";
test("capability selection and sustained-load downgrade are render-only and bounded", () => {
  assert.equal(initialQuality(false, 8, 8), "HIGH");
  assert.equal(initialQuality(true, 8, 8), "MEDIUM");
  assert.equal(initialQuality(false, 2, 2), "LOW");
  const q = new QualityManager([], "HIGH");
  assert.ok(q.pixelRatio(390, 844, 3) <= 1.75);
  assert.ok(q.pixelRatio(3840, 2160, 2) < 1);
  for (let i = 0; i < 500; i++) q.observe(40, 180, 80000, true);
  assert.equal(q.tier, "LOW");
  assert.equal(q.drawCalls, 180);
  for (let i = 0; i < 500; i++) q.observe(16, 140, 50000, true);
  assert.equal(q.tier, "LOW");
  const inactive = new QualityManager([], "HIGH");
  for (let i = 0; i < 1000; i++) inactive.observe(100, 10, 10, false);
  assert.equal(inactive.tier, "HIGH");
});
test("model templates share geometry/materials across pooled obstacles", () => {
  const a = obstacleModel("train"),
    b = obstacleModel("train");
  assert.ok(a.children.length < 12);
  assert.equal(
    (a.children[0] as T.Mesh).geometry,
    (b.children[0] as T.Mesh).geometry,
  );
  assert.equal(
    (a.children[0] as T.Mesh).material,
    (b.children[0] as T.Mesh).material,
  );
});
test("coin instancing mirrors collection and restart without mutating logical handles", () => {
  const scene = new T.Scene(),
    encounters = new EncounterManager(scene),
    coins = new CoinManager(encounters),
    renderer = new CoinRenderer(scene, coins);
  const coin = coins.groups[0].coins[0];
  const before = coin.mesh.position.clone();
  coin.collected = true;
  coin.mesh.visible = false;
  renderer.update();
  const matrix = new T.Matrix4();
  renderer.mesh.getMatrixAt(0, matrix);
  assert.equal(matrix.elements[0], 0);
  assert.deepEqual(coin.mesh.position, before);
  coins.reset();
  renderer.update();
  renderer.mesh.getMatrixAt(0, matrix);
  assert.notEqual(matrix.elements[0], 0);
  assert.equal(renderer.mesh.count, 72);
});
test("quality hides only decorative detail, never coins, rails or gameplay objects", () => {
  const scene = new T.Scene(),
    track = new TrackManager(scene);
  const q = new QualityManager(track.chunks, "LOW");
  const before = track.chunks.map((c) => c.group.position.z);
  q.apply();
  assert.deepEqual(
    track.chunks.map((c) => c.group.position.z),
    before,
  );
  for (const { group } of track.chunks) {
    assert.ok(group.visible);
    group.traverse((o) => {
      if (o.userData.detail === "high") assert.equal(o.visible, false);
    });
  }
});
test("slide visual fits underneath the unchanged overhead collider", () => {
  const p = new Player();
  p.slide();
  p.update(1 / 120);
  assert.equal(p.state, PlayerState.SLIDING);
  p.group.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(p.body);
  assert.ok(box.max.y < 0.8, `slide silhouette too tall: ${box.max.y}`);
  assert.equal(p.height, 0.68);
});
