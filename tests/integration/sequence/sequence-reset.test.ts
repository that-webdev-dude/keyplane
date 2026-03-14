// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import { createKeyplane } from "../../../src/index";

function dispatchKeyboardEvent(
  target: EventTarget,
  type: "keydown" | "keyup",
  init: KeyboardEventInit & { code: string; key: string },
): void {
  target.dispatchEvent(
    new KeyboardEvent(type, {
      bubbles: true,
      cancelable: true,
      ...init,
    }),
  );
}

describe("sequence reset integration", () => {
  it("clears active sequence state when the manager is disabled", () => {
    const manager = createKeyplane();
    const handler = vi.fn();

    manager.bind("KeyG then KeyC", handler);

    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    manager.disable();
    manager.enable();
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyC", key: "c" });
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyC", key: "c" });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("clears active sequence state when the active scope changes", () => {
    const manager = createKeyplane({ defaultScope: "editor" });
    const handler = vi.fn();

    manager.bind("KeyG then KeyC", handler, { scope: "editor" });

    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    manager.setScope("palette");
    manager.setScope("editor");
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyC", key: "c" });
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyC", key: "c" });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("clears per-subscription sequence state on subscription disable and dispose", () => {
    const manager = createKeyplane();
    const disabledHandler = vi.fn();
    const disposedHandler = vi.fn();

    const disabled = manager.bind("KeyG then KeyC", disabledHandler);
    const disposed = manager.bind("KeyG then KeyI", disposedHandler);

    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    disabled.disable();
    disposed.dispose();

    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyC", key: "c" });
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyI", key: "i" });

    disabled.enable();
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyC", key: "c" });

    expect(disabledHandler).toHaveBeenCalledTimes(1);
    expect(disposedHandler).toHaveBeenCalledTimes(0);
  });

  it("clears active sequence state on destroy and preserves lifecycle error families afterward", () => {
    const manager = createKeyplane();
    const handler = vi.fn();

    manager.bind("KeyG then KeyC", handler);

    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    manager.destroy();
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyC", key: "c" });

    expect(handler).toHaveBeenCalledTimes(0);
    expect(() => manager.bind("KeyG then KeyC", handler)).toThrowError(
      expect.objectContaining({
        code: "KP_LIFECYCLE_MANAGER_DESTROYED",
      }),
    );
  });
});
