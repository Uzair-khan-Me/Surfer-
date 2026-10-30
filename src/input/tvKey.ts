export type TVCommand =
  "left" | "right" | "up" | "down" | "select" | "back" | "playpause";

/**
 * Normalizes non-standard KeyboardEvent payloads emitted by Smart TV browsers:
 * - TCL Google TV / Sony Bravia / Hisense / Shield / Chromecast (Android TV):
 *   DPAD_UP=19, DPAD_DOWN=20, DPAD_LEFT=21, DPAD_RIGHT=22, DPAD_CENTER=23, BACK=4
 *   plus standard 37..40 / 13 when `e.code` is empty or `e.key` is "Select" / "Up" / etc.
 * - Samsung Tizen TV: Back=10009, Enter=13, MediaPlayPause=10252
 * - LG webOS TV: Back=461, Enter=13, Play=415, Pause=19
 * - Amazon Fire TV Silk: DPAD 19..23 / 37..40, Select=13/23, MediaPlayPause=179
 */
export function normalizeTVKey(e: KeyboardEvent): TVCommand | null {
  const code = e.code || "";
  const key = e.key || "";
  const kc = e.keyCode || 0;

  if (
    code === "ArrowLeft" ||
    key === "ArrowLeft" ||
    key === "Left" ||
    kc === 37 ||
    kc === 21
  ) {
    return "left";
  }
  if (
    code === "ArrowRight" ||
    key === "ArrowRight" ||
    key === "Right" ||
    kc === 39 ||
    kc === 22
  ) {
    return "right";
  }
  if (
    code === "ArrowUp" ||
    key === "ArrowUp" ||
    key === "Up" ||
    kc === 38 ||
    kc === 19
  ) {
    return "up";
  }
  if (
    code === "ArrowDown" ||
    key === "ArrowDown" ||
    key === "Down" ||
    kc === 40 ||
    kc === 20
  ) {
    return "down";
  }
  if (
    code === "Enter" ||
    code === "NumpadEnter" ||
    code === "Select" ||
    key === "Enter" ||
    key === "Select" ||
    key === "OK" ||
    key === "Accept" ||
    kc === 13 ||
    kc === 23 ||
    kc === 66
  ) {
    return "select";
  }
  if (
    code === "Escape" ||
    code === "BrowserBack" ||
    code === "GoBack" ||
    key === "Escape" ||
    key === "Back" ||
    key === "BrowserBack" ||
    key === "GoBack" ||
    kc === 27 ||
    kc === 4 ||
    kc === 461 ||
    kc === 10009 ||
    kc === 166
  ) {
    return "back";
  }
  if (
    code === "MediaPlayPause" ||
    key === "MediaPlayPause" ||
    key === "MediaPlay" ||
    key === "MediaPause" ||
    kc === 179 ||
    kc === 415 ||
    kc === 10252
  ) {
    return "playpause";
  }
  return null;
}

/** Detects Smart TV browsers where disabling WebGL MSAA preserves 60 FPS at 1080p/4K. */
export function isSmartTVBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /\b(GoogleTV|Android TV|BRAVIA|AFT[A-Z0-9]+|SmartTV|SMART-TV|Tizen|Web0S|webOS|VIDAA|HbbTV|NetCast|Viera|TCL)\b/i.test(
    navigator.userAgent || "",
  );
}
