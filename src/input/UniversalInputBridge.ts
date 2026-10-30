import { swipeAction, type Action } from "../game/Input";
import { GameState } from "../game/GameState";

/** Exact e.code strings already handled by locked src/game/Input.ts */
const NATIVE_CODES = new Set([
  "ArrowLeft",
  "KeyA",
  "ArrowRight",
  "KeyD",
  "ArrowUp",
  "KeyW",
  "Space",
  "ArrowDown",
  "KeyS",
  "Escape",
  "KeyP",
  "Enter",
]);

import { normalizeTVKey, isSmartTVBrowser, type TVCommand } from "./tvKey";
export { normalizeTVKey, isSmartTVBrowser, type TVCommand };

interface BridgeHost {
  getState: () => GameState;
  isPaused: () => boolean;
  isModalOpen: () => boolean;
  closeModals: () => void;
  act: (action: Action) => void;
}

const MENU_NAV_IDS = ["play", "sound", "about-button", "help-button"] as const;

export class UniversalInputBridge {
  private navIndex = 0;
  private tvNavActive = false;
  private prevButtons = new Uint8Array(16);
  private stickXDir = 0;
  private stickYDir = 0;
  private pointerId: number | null = null;
  private pointerStartX = 0;
  private pointerStartY = 0;

  constructor(private host: BridgeHost) {
    // Capture-phase listener lets us handle TV D-pad menu focus & non-standard remote keys cleanly.
    addEventListener("keydown", this.onKeyDown, { capture: true });
    addEventListener(
      "pointerdown",
      () => {
        if (this.tvNavActive) this.clearMenuFocus();
      },
      { passive: true },
    );
    this.bindPointerSwipe();
  }

  destroy() {
    removeEventListener("keydown", this.onKeyDown, { capture: true });
  }

  private setMenuFocus(index: number) {
    const items = MENU_NAV_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el && !el.hidden),
    );
    if (!items.length) return;
    this.navIndex = ((index % items.length) + items.length) % items.length;
    this.tvNavActive = true;
    for (const el of items) el.classList.remove("tv-focus");
    const target = items[this.navIndex];
    target.classList.add("tv-focus");
    target.focus({ preventScroll: true });
  }

  clearMenuFocus() {
    this.tvNavActive = false;
    this.navIndex = 0;
    for (const id of MENU_NAV_IDS) {
      document.getElementById(id)?.classList.remove("tv-focus");
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const cmd = normalizeTVKey(e);
    if (!cmd) return;
    if (e.repeat && cmd !== "up" && cmd !== "down") return;

    const state = this.host.getState();
    const paused = this.host.isPaused();
    const modalOpen = this.host.isModalOpen();
    const handledByNative = NATIVE_CODES.has(e.code);

    // 1. Modal open (#help or #about): Up/Down scrolls #about, Select/Back closes modal.
    if (modalOpen) {
      if (cmd === "up" || cmd === "down") {
        const card = document.querySelector<HTMLElement>(".about-card");
        const about = document.getElementById("about");
        if (about && !about.hidden && card) {
          card.scrollBy({ top: cmd === "down" ? 90 : -90, behavior: "smooth" });
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        return;
      }
      if (cmd === "select" || cmd === "back") {
        this.host.closeModals();
        this.clearMenuFocus();
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      return;
    }

    // 2. Menu screen D-Pad Ring navigation & Center OK button
    if (state === GameState.MENU) {
      if (cmd === "up" || cmd === "down" || cmd === "left" || cmd === "right") {
        e.preventDefault();
        if (!this.tvNavActive) {
          // Pressing Up from default Let's Run jumps up to top action buttons
          this.setMenuFocus(cmd === "up" ? 1 : 0);
        } else {
          const delta = cmd === "right" || cmd === "up" ? 1 : -1;
          this.setMenuFocus(this.navIndex + delta);
        }
        return;
      }
      if (cmd === "select") {
        if (this.tvNavActive) {
          const items = MENU_NAV_IDS.map((id) =>
            document.getElementById(id),
          ).filter((el): el is HTMLElement => Boolean(el && !el.hidden));
          const active = items[this.navIndex];
          if (active && active.id !== "play") {
            e.preventDefault();
            e.stopImmediatePropagation();
            active.click();
            return;
          }
        }
        this.clearMenuFocus();
        if (!handledByNative) {
          e.preventDefault();
          this.host.act("start");
        }
        return;
      }
      if (cmd === "playpause" && !handledByNative) {
        e.preventDefault();
        this.clearMenuFocus();
        this.host.act("start");
      }
      return;
    }

    // 3. Game Over screen: Center OK / PlayPause retries immediately
    if (state === GameState.GAME_OVER) {
      if ((cmd === "select" || cmd === "playpause") && !handledByNative) {
        e.preventDefault();
        this.host.act("start");
      }
      return;
    }

    // 4. Active Gameplay or Pause screen
    if (state === GameState.PLAYING) {
      if (cmd === "back" || cmd === "playpause") {
        if (!handledByNative) {
          e.preventDefault();
          this.host.act("pause");
        }
        return;
      }
      if (paused) {
        if (cmd === "select" && !handledByNative) {
          e.preventDefault();
          this.host.act("start");
        }
        return;
      }
      // Active unpaused run:
      // Center OK / Enter button on TV remote also triggers Jump mid-run!
      if (cmd === "select") {
        e.preventDefault();
        this.host.act("jump");
        return;
      }
      if (!handledByNative) {
        e.preventDefault();
        if (cmd === "left") this.host.act("left");
        else if (cmd === "right") this.host.act("right");
        else if (cmd === "up") this.host.act("jump");
        else if (cmd === "down") this.host.act("slide");
      }
    }
  };

  /** Pointer-drag swipe support for TV Air-Mouse / Magic Remotes, styluses & mouse flicks */
  private bindPointerSwipe() {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    canvas.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") return; // Touch is handled natively by Input.ts
      if (this.host.getState() !== GameState.PLAYING || this.host.isPaused())
        return;
      this.pointerId = e.pointerId;
      this.pointerStartX = e.clientX;
      this.pointerStartY = e.clientY;
    });
    canvas.addEventListener("pointerup", (e) => {
      if (e.pointerType === "touch" || e.pointerId !== this.pointerId) return;
      this.pointerId = null;
      if (this.host.getState() !== GameState.PLAYING || this.host.isPaused())
        return;
      const action = swipeAction(
        e.clientX - this.pointerStartX,
        e.clientY - this.pointerStartY,
      );
      if (action) this.host.act(action);
    });
    canvas.addEventListener("pointercancel", (e) => {
      if (e.pointerId === this.pointerId) this.pointerId = null;
    });
  }

  /** Zero-allocation 60 Hz Gamepad polling (Xbox, PlayStation, 8BitDo & Android TV controllers) */
  poll() {
    if (typeof navigator === "undefined" || !navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    let pad: Gamepad | null = null;
    for (let i = 0; i < pads.length; i++) {
      if (pads[i] && pads[i]!.connected) {
        pad = pads[i];
        break;
      }
    }
    if (!pad) return;

    const pressed = (idx: number) => {
      const down = Boolean(pad!.buttons[idx]?.pressed);
      const wasDown = this.prevButtons[idx] === 1;
      this.prevButtons[idx] = down ? 1 : 0;
      return down && !wasDown;
    };

    const btnA = pressed(0); // South (A / Cross / TV Gamepad OK)
    const btnB = pressed(1); // East (B / Circle)
    const btnStart = pressed(9); // Start / Options
    const dpadUp = pressed(12);
    const dpadDown = pressed(13);
    const dpadLeft = pressed(14);
    const dpadRight = pressed(15);

    // Left analog stick edge-trigger with hysteresis
    const axX = pad.axes[0] ?? 0;
    const axY = pad.axes[1] ?? 0;
    let stickLeft = false,
      stickRight = false,
      stickUp = false,
      stickDown = false;

    if (axX < -0.5) {
      if (this.stickXDir !== -1) stickLeft = true;
      this.stickXDir = -1;
    } else if (axX > 0.5) {
      if (this.stickXDir !== 1) stickRight = true;
      this.stickXDir = 1;
    } else if (Math.abs(axX) < 0.25) {
      this.stickXDir = 0;
    }

    if (axY < -0.55) {
      if (this.stickYDir !== -1) stickUp = true;
      this.stickYDir = -1;
    } else if (axY > 0.55) {
      if (this.stickYDir !== 1) stickDown = true;
      this.stickYDir = 1;
    } else if (Math.abs(axY) < 0.25) {
      this.stickYDir = 0;
    }

    const state = this.host.getState();
    const paused = this.host.isPaused();

    if (this.host.isModalOpen()) {
      if (btnA || btnB || btnStart) {
        this.host.closeModals();
        this.clearMenuFocus();
      }
      return;
    }

    if (state !== GameState.PLAYING) {
      if (btnA || btnStart) {
        this.clearMenuFocus();
        this.host.act("start");
      }
      return;
    }

    if (btnStart) {
      this.host.act("pause");
      return;
    }

    if (paused) {
      if (btnA) this.host.act("start");
      return;
    }

    if (dpadLeft || stickLeft) this.host.act("left");
    if (dpadRight || stickRight) this.host.act("right");
    if (dpadUp || stickUp || btnA) this.host.act("jump");
    if (dpadDown || stickDown || btnB) this.host.act("slide");
  }
}
