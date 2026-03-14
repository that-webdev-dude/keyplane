// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import { createKeyplane } from "../../../src/index";

describe("single-step matching integration", () => {
  it("applies preventDefault, stopPropagation, and handler context on matched events", () => {
    const host = document.createElement("div");
    const button = document.createElement("button");
    host.append(button);
    document.body.append(host);

    const manager = createKeyplane({ target: host, defaultScope: "editor" });
    const handler = vi.fn();
    const stopSpy = vi.spyOn(KeyboardEvent.prototype, "stopPropagation");

    manager.bind("Control+KeyK", handler, {
      preventDefault: true,
      stopPropagation: true,
      scope: "editor",
    });

    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      code: "KeyK",
      key: "k",
      ctrlKey: true,
    });

    button.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      event,
      binding: {
        mode: "physical",
        steps: [{ key: "KeyK", modifiers: ["Control"] }],
      },
      scope: "editor",
      manager: expect.objectContaining({
        bind: expect.any(Function),
        getScope: expect.any(Function),
      }),
    });
  });

  it("lets handler exceptions follow normal host propagation semantics", () => {
    const manager = createKeyplane();
    const after = vi.fn();
    const onError = vi.fn((event: ErrorEvent) => {
      event.preventDefault();
    });

    window.addEventListener("error", onError);

    try {
      manager.bind("KeyT", () => {
        throw new Error("boom");
      });
      manager.bind("KeyT", after);

      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          code: "KeyT",
          key: "t",
        }),
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0]?.[0].error).toMatchObject({
        message: "boom",
      });
      expect(after).toHaveBeenCalledTimes(0);
    } finally {
      window.removeEventListener("error", onError);
    }
  });

  it("suppresses composition-adjacent and dead-key events in DOM integration", () => {
    const manager = createKeyplane();
    const handler = vi.fn();

    manager.bind("key:Space", handler);

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "Space",
        key: " ",
        isComposing: true,
      }),
    );

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "Quote",
        key: "Dead",
      }),
    );

    expect(handler).toHaveBeenCalledTimes(0);
  });
});
