// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { createKeyplane } from "../../../src/index";

function dispatchKeyboardEvent(
  target: EventTarget,
  type: "keydown" | "keyup",
  init: KeyboardEventInit & { code: string; key: string },
): KeyboardEvent {
  const event = new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    ...init,
  });

  target.dispatchEvent(event);
  return event;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("sequence engine", () => {
  it("keeps incomplete sequences silent and fires only on completion", () => {
    const manager = createKeyplane();
    const handler = vi.fn();

    manager.bind("KeyG then KeyC", handler);

    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    expect(handler).toHaveBeenCalledTimes(0);

    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyC", key: "c" });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("supports shared non-terminal prefixes and repeated-step sequences", () => {
    const manager = createKeyplane();
    const seen: string[] = [];

    manager.bind("KeyG then KeyC", () => {
      seen.push("gc");
    });
    manager.bind("KeyG then KeyI", () => {
      seen.push("gi");
    });
    manager.bind("KeyG then KeyG", () => {
      seen.push("gg");
    });

    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyC", key: "c" });
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyI", key: "i" });
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });

    expect(seen).toEqual(["gc", "gi", "gg"]);
  });

  it("resets on the wrong continuation and lets the same event start a fresh attempt", () => {
    const manager = createKeyplane();
    const handler = vi.fn();

    manager.bind("KeyG then KeyC", handler);

    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyC", key: "c" });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("resets timed-out attempts and honors per-subscription timeout overrides", () => {
    vi.useFakeTimers();

    const manager = createKeyplane();
    const handler = vi.fn();

    manager.bind("KeyG then KeyC", handler, { sequenceTimeoutMs: 50 });

    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    vi.advanceTimersByTime(49);
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyC", key: "c" });

    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    vi.advanceTimersByTime(50);
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyC", key: "c" });

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
