// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { createKeyplane, formatBinding, normalizeBinding } from "../../../src/index";

describe("quiet-by-default behavior", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not write to console during normal lifecycle and formatting flows", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const manager = createKeyplane({ defaultScope: "editor" });
    const subscription = manager.bind("KeyG then KeyC", () => {}, {
      allowInEditable: true,
    });

    expect(normalizeBinding("KeyG")).toEqual({
      mode: "physical",
      steps: [{ key: "KeyG", modifiers: [] }],
    });
    expect(formatBinding("KeyG")).toBe("G");

    subscription.disable();
    subscription.enable();
    subscription.dispose();
    subscription.dispose();
    manager.disable();
    manager.enable();
    manager.destroy();
    manager.destroy();

    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleInfo).not.toHaveBeenCalled();
    expect(consoleLog).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
  });
});
