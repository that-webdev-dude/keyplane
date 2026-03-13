// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import { createKeyplane } from "../../../src/index";

describe("manager-owned phase listener bookkeeping", () => {
  it("attaches and detaches listeners lazily by event phase", () => {
    const target = document.createElement("div");
    const addEventListener = vi.spyOn(target, "addEventListener");
    const removeEventListener = vi.spyOn(target, "removeEventListener");
    const manager = createKeyplane({ target });

    const keydownA = manager.bind("KeyA", () => {}, { eventType: "keydown" });
    const keydownB = manager.bind("KeyB", () => {}, { eventType: "keydown" });
    const keyup = manager.bind("KeyC", () => {}, { eventType: "keyup" });

    expect(addEventListener).toHaveBeenCalledTimes(2);
    expect(addEventListener).toHaveBeenNthCalledWith(
      1,
      "keydown",
      expect.any(Function),
      false,
    );
    expect(addEventListener).toHaveBeenNthCalledWith(
      2,
      "keyup",
      expect.any(Function),
      false,
    );

    keydownA.disable();
    expect(removeEventListener).not.toHaveBeenCalled();

    keydownA.dispose();
    expect(removeEventListener).not.toHaveBeenCalled();

    keydownB.dispose();
    expect(removeEventListener).toHaveBeenNthCalledWith(
      1,
      "keydown",
      expect.any(Function),
      false,
    );

    keyup.dispose();
    expect(removeEventListener).toHaveBeenNthCalledWith(
      2,
      "keyup",
      expect.any(Function),
      false,
    );
  });

  it("detaches all owned listeners on destroy", () => {
    const target = document.createElement("div");
    const removeEventListener = vi.spyOn(target, "removeEventListener");
    const manager = createKeyplane({ target });

    manager.bind("KeyA", () => {}, { eventType: "keydown" });
    manager.bind("KeyB", () => {}, { eventType: "keyup" });

    manager.destroy();
    manager.destroy();

    expect(removeEventListener).toHaveBeenCalledTimes(2);
    expect(removeEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
      false,
    );
    expect(removeEventListener).toHaveBeenCalledWith(
      "keyup",
      expect.any(Function),
      false,
    );
  });
});
