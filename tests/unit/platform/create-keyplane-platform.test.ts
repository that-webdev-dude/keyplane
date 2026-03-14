// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { createKeyplane } from "../../../src/index";

function expectKeyplaneError(action: () => unknown, code: string): void {
  try {
    action();
  } catch (error) {
    expect(error).toMatchObject({ code, name: "KeyplaneError" });
    return;
  }

  throw new Error(`Expected KeyplaneError ${code}.`);
}

describe("createKeyplane platform validation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fails deterministically when the runtime has no default document target", () => {
    vi.stubGlobal("document", undefined);
    vi.stubGlobal("KeyboardEvent", undefined);

    expectKeyplaneError(
      () => createKeyplane(),
      "KP_PLATFORM_UNSUPPORTED_RUNTIME",
    );
  });

  it("rejects unsupported target categories", () => {
    class FakeKeyboardEvent {}

    Object.defineProperties(FakeKeyboardEvent.prototype, {
      code: { get: () => "" },
      key: { get: () => "" },
      repeat: { get: () => false },
      getModifierState: { value: () => false },
    });

    vi.stubGlobal("KeyboardEvent", FakeKeyboardEvent);

    expectKeyplaneError(
      () =>
        createKeyplane({
          target: {
            addEventListener() {},
            removeEventListener() {},
          } as unknown as Document,
        }),
      "KP_PLATFORM_UNSUPPORTED_TARGET",
    );
  });

  it("rejects non-HTMLElement element targets", () => {
    expectKeyplaneError(
      () =>
        createKeyplane({
          target: document.createElementNS("http://www.w3.org/2000/svg", "svg") as never,
        }),
      "KP_PLATFORM_UNSUPPORTED_TARGET",
    );
  });

  it("rejects runtimes missing keyboard event capability", () => {
    vi.stubGlobal("document", {
      nodeType: 9,
      addEventListener() {},
      removeEventListener() {},
    });
    vi.stubGlobal("KeyboardEvent", class FakeKeyboardEvent {});

    expectKeyplaneError(
      () => createKeyplane(),
      "KP_PLATFORM_MISSING_KEYBOARD_CAPABILITY",
    );
  });
});
