import type * as T from "three";
import type { TrackChunk } from "../world/TrackChunk";
export type QualityTier = "HIGH" | "MEDIUM" | "LOW";
const settings = {
  HIGH: { dpr: 1.75, pixels: 2400000, details: 65, ties: 120, windows: 170 },
  MEDIUM: { dpr: 1.35, pixels: 1200000, details: 38, ties: 85, windows: 130 },
  LOW: { dpr: 1, pixels: 650000, details: 0, ties: 55, windows: 90 },
};
export function initialQuality(
  coarse: boolean,
  cores = 8,
  memory = 8,
): QualityTier {
  return cores <= 2 || memory <= 2
    ? "LOW"
    : coarse || cores <= 4 || memory <= 4
      ? "MEDIUM"
      : "HIGH";
}
/** Render-only quality protection. Never feeds timing or settings into simulation. */
export class QualityManager {
  tier: QualityTier;
  frameMs = 16.7;
  drawCalls = 0;
  triangles = 0;
  private slowTime = 0;
  private samples = 0;
  private warmup = 2;
  private chunks: { chunk: TrackChunk; objects: T.Object3D[] }[] = [];
  constructor(chunks: TrackChunk[], tier?: QualityTier) {
    const nav =
      typeof navigator !== "undefined"
        ? (navigator as Navigator & { deviceMemory?: number })
        : undefined;
    this.tier =
      tier ??
      initialQuality(
        typeof matchMedia !== "undefined" &&
          matchMedia("(pointer: coarse)").matches,
        nav?.hardwareConcurrency ?? 8,
        nav?.deviceMemory ?? 8,
      );
    for (const chunk of chunks) {
      const objects: T.Object3D[] = [];
      chunk.group.traverse((o) => {
        if (o.userData.detail) objects.push(o);
      });
      this.chunks.push({ chunk, objects });
    }
  }
  pixelRatio(width: number, height: number, dpr: number) {
    const s = settings[this.tier];
    return Math.max(
      0.25,
      Math.min(dpr, s.dpr, Math.sqrt(s.pixels / Math.max(1, width * height))),
    );
  }
  observe(ms: number, calls: number, triangles: number, active: boolean) {
    this.drawCalls = calls;
    this.triangles = triangles;
    if (!active || ms <= 0 || ms > 250) {
      this.slowTime = 0;
      this.samples = 0;
      return false;
    }
    if (this.warmup > 0) {
      this.warmup -= ms / 1000;
      return false;
    }
    this.frameMs += (ms - this.frameMs) * 0.04;
    const threshold = this.tier === "HIGH" ? 24 : 30;
    if (this.frameMs > threshold) {
      this.slowTime += ms / 1000;
      this.samples++;
    } else {
      this.slowTime = Math.max(0, this.slowTime - ms / 500);
      this.samples = 0;
    }
    if (this.slowTime > 4 && this.samples > 60 && this.tier !== "LOW") {
      this.tier = this.tier === "HIGH" ? "MEDIUM" : "LOW";
      this.slowTime = 0;
      this.samples = 0;
      this.warmup = 2;
      this.frameMs = 16.7;
      return true;
    }
    return false;
  }
  apply() {
    const s = settings[this.tier];
    for (const { chunk, objects } of this.chunks) {
      const distance = Math.max(0, -chunk.group.position.z);
      for (const object of objects) {
        const kind = object.userData.detail;
        object.visible =
          kind === "high"
            ? s.details > 0 && distance < s.details
            : kind === "ties"
              ? distance < s.ties
              : kind === "windows"
                ? distance < s.windows
                : true;
      }
    }
  }
}
