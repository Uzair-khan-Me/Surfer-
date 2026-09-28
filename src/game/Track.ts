import * as T from "three";
import { TrackChunk } from "../world/TrackChunk";
import { CHUNK_COUNT, CHUNK_LENGTH } from "../config/constants";
export class TrackManager {
  chunks: TrackChunk[] = [];
  constructor(scene: T.Scene) {
    for (let i = 0; i < CHUNK_COUNT; i++) {
      const chunk = new TrackChunk(i);
      this.chunks.push(chunk);
      scene.add(chunk.group);
    }
    this.reset();
  }
  reset() {
    this.chunks.forEach((chunk, i) => {
      chunk.group.position.z = 15 - i * CHUNK_LENGTH;
    });
  }
  update(dt: number, speed: number) {
    for (const chunk of this.chunks) {
      chunk.group.position.z += speed * dt;
      if (chunk.group.position.z > 45)
        chunk.group.position.z -= CHUNK_LENGTH * CHUNK_COUNT;
    }
  }
}
