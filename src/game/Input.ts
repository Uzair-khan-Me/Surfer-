export type Action = "left" | "right" | "jump" | "slide" | "start" | "pause";
export function swipeAction(dx: number, dy: number): Action | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 35) return null;
  return Math.abs(dx) > Math.abs(dy)
    ? dx > 0
      ? "right"
      : "left"
    : dy > 0
      ? "slide"
      : "jump";
}
export class InputManager {
  active = false;
  private startX = 0;
  private startY = 0;
  private touchId: number | null = null;
  constructor(private action: (action: Action) => void) {
    addEventListener("keydown", (e) => {
      const key = e.code;
      const map: Record<string, Action> = {
        ArrowLeft: "left",
        KeyA: "left",
        ArrowRight: "right",
        KeyD: "right",
        ArrowUp: "jump",
        KeyW: "jump",
        Space: "jump",
        ArrowDown: "slide",
        KeyS: "slide",
        Escape: "pause",
        KeyP: "pause",
        Enter: "start",
      };
      if (!map[key]) return;
      if (this.active || key === "Space" || key === "Enter") e.preventDefault();
      if (e.repeat) return;
      this.action(
        !this.active && (key === "Space" || key === "Enter")
          ? "start"
          : map[key],
      );
    });
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    canvas.addEventListener(
      "touchstart",
      (e) => {
        if (!this.active || this.touchId !== null) return;
        const t = e.changedTouches[0];
        this.touchId = t.identifier;
        this.startX = t.clientX;
        this.startY = t.clientY;
        e.preventDefault();
      },
      { passive: false },
    );
    canvas.addEventListener(
      "touchmove",
      (e) => {
        if (this.active) e.preventDefault();
      },
      { passive: false },
    );
    canvas.addEventListener(
      "touchend",
      (e) => {
        if (this.touchId === null) return;
        const t = Array.from(e.changedTouches).find(
          (t) => t.identifier === this.touchId,
        );
        if (!t) return;
        this.touchId = null;
        if (!this.active) return;
        e.preventDefault();
        const action = swipeAction(
          t.clientX - this.startX,
          t.clientY - this.startY,
        );
        if (action) this.action(action);
      },
      { passive: false },
    );
    canvas.addEventListener("touchcancel", () => (this.touchId = null));
  }
}
