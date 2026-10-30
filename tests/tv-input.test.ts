import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeTVKey } from "../src/input/UniversalInputBridge";

const fakeKey = (
  overrides: Partial<{ code: string; key: string; keyCode: number }>,
) =>
  ({
    code: "",
    key: "Unidentified",
    keyCode: 0,
    ...overrides,
  }) as unknown as KeyboardEvent;

test("TCL Google TV / Android TV round ring and middle OK button normalize cleanly", () => {
  // Middle OK button on TCL Google TV (KEYCODE_DPAD_CENTER = 23, empty e.code)
  assert.equal(normalizeTVKey(fakeKey({ keyCode: 23 })), "select");
  assert.equal(normalizeTVKey(fakeKey({ key: "Select" })), "select");
  assert.equal(normalizeTVKey(fakeKey({ key: "OK" })), "select");
  assert.equal(
    normalizeTVKey(fakeKey({ code: "", key: "Enter", keyCode: 13 })),
    "select",
  );

  // Outer round 4-way directional ring (Android DPAD 19..22 & standard 37..40 with empty code)
  assert.equal(normalizeTVKey(fakeKey({ keyCode: 19 })), "up");
  assert.equal(normalizeTVKey(fakeKey({ keyCode: 20 })), "down");
  assert.equal(normalizeTVKey(fakeKey({ keyCode: 21 })), "left");
  assert.equal(normalizeTVKey(fakeKey({ keyCode: 22 })), "right");
  assert.equal(normalizeTVKey(fakeKey({ key: "Left", keyCode: 37 })), "left");
  assert.equal(normalizeTVKey(fakeKey({ key: "Right", keyCode: 39 })), "right");

  // Android TV, Samsung Tizen & LG webOS Back / PlayPause keys
  assert.equal(normalizeTVKey(fakeKey({ keyCode: 4 })), "back");
  assert.equal(normalizeTVKey(fakeKey({ keyCode: 10009 })), "back");
  assert.equal(normalizeTVKey(fakeKey({ keyCode: 461 })), "back");
  assert.equal(normalizeTVKey(fakeKey({ keyCode: 179 })), "playpause");
});
