import * as T from "three";
import { batchStatic } from "./batch";
import { addSign } from "./Environment";
import { box } from "./primitives";
import { addCityModel } from "../rendering/CityModel";
import { bevel } from "../rendering/geometry";
import { addTrackModel } from "../rendering/TrackModel";
export class TrackChunk {
  group = new T.Group();
  constructor(index: number) {
    addTrackModel(this.group);
    const details = addCityModel(this.group, index);
    if (index % 3 === 1) {
      for (const side of [-1, 1])
        bevel(this.group, 0.3, 7, 0.35, side * 4.9, 3.5, -10, 0x32545c);
      bevel(this.group, 10.1, 0.4, 0.5, 0, 7, -10, 0x42636a);
      box(this.group, 8, 0.055, 0.56, 0, 6.75, -10, 0x92d8bd, true);
    }
    if (typeof document !== "undefined" && index % 2 === 0)
      addSign(
        this.group,
        index % 4 === 0 ? "AFTER / 04" : "KEEP GOING",
        index % 4 === 0 ? 5.8 : -5.8,
        4.2,
        -7,
        index % 4 === 0 ? "#d5f884" : "#f4ad76",
      );
    batchStatic(this.group);
    this.group.add(details);
  }
}
