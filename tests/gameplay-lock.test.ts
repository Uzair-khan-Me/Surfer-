import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import ts from "typescript";
import { Player } from "../src/game/Player";
const baseline = JSON.parse(
  fs.readFileSync("tests/fixtures/gameplay-baseline.json", "utf8"),
);
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
test("visual upgrade leaves protected gameplay modules byte-for-byte unchanged", () => {
  for (const [file, expected] of Object.entries(baseline.files))
    assert.equal(hash(fs.readFileSync("src/" + file, "utf8")), expected, file);
});
test("game lifecycle, simulation and collision dimensions are unchanged", () => {
  for (const [file, methods] of Object.entries(baseline.methods)) {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync("src/" + file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const found: Record<string, string> = {};
    source.forEachChild((node) => {
      if (ts.isClassDeclaration(node))
        for (const m of node.members) {
          const name = m.name?.getText(source);
          if (name && Object.hasOwn(methods as object, name))
            found[name] = hash(m.getText(source).replace(/\s/g, ""));
        }
    });
    assert.deepEqual(found, methods, file);
  }
});
test("720-step player physics trace matches the pre-upgrade game exactly", () => {
  const p = new Player();
  const trace = [];
  for (let frame = 0; frame < 720; frame++) {
    if (frame % 43 === 0) p.move(frame % 86 === 0 ? -1 : 1);
    if (frame % 113 === 0) p.jump();
    if (frame % 149 === 0) p.slide();
    if (frame === 410) p.reset();
    p.update(1 / 120);
    trace.push([
      p.lane,
      p.y,
      p.velocityY,
      p.slideTime,
      p.state,
      p.group.position.x,
      p.height,
    ]);
  }
  assert.deepEqual(trace, baseline.trace);
});
