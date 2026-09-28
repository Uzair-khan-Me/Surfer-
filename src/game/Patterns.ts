import type { ObstacleType } from "./Obstacle";
export interface Pattern {
  obstacles: { lane: number; type: ObstacleType }[];
  safeLane: number;
}
export function isPatternPlayable(p: Pattern) {
  const occupied = new Set(p.obstacles.map((o) => o.lane));
  return (
    p.obstacles.length <= 2 &&
    p.obstacles.every(
      (o) => Number.isInteger(o.lane) && o.lane >= 0 && o.lane <= 2,
    ) &&
    occupied.size === p.obstacles.length &&
    Number.isInteger(p.safeLane) &&
    p.safeLane >= 0 &&
    p.safeLane <= 2 &&
    !occupied.has(p.safeLane)
  );
}
export function makePattern(
  index: number,
  hardness: number,
  random = Math.random,
): Pattern {
  // Every row has a completely clear lane. Rows are >=24m apart (1.2s at max speed),
  // leaving >0.8s between train bodies to cross both lanes. Early rows teach actions.
  if (index === 0)
    return { obstacles: [{ lane: 1, type: "barrier" }], safeLane: 0 };
  if (index === 1)
    return { obstacles: [{ lane: 1, type: "overhead" }], safeLane: 2 };
  const safeLane = Math.floor(random() * 3);
  const lanes = [0, 1, 2].filter((l) => l !== safeLane);
  const count = random() < 0.3 + hardness * 0.45 ? 2 : 1;
  const types: ObstacleType[] = ["train", "barrier", "overhead"];
  const p = {
    safeLane,
    obstacles: lanes
      .slice(0, count)
      .map((lane) => ({ lane, type: types[Math.floor(random() * 3)] })),
  };
  if (!isPatternPlayable(p)) throw Error("Invalid obstacle pattern");
  return p;
}
