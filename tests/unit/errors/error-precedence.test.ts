// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import { createKeyplane, formatBinding } from "../../../src/index";

function expectKeyplaneError(action: () => unknown, code: string): void {
  try {
    action();
  } catch (error) {
    expect(error).toMatchObject({ code, name: "KeyplaneError" });
    return;
  }

  throw new Error(`Expected KeyplaneError ${code}.`);
}

describe("error precedence", () => {
  it("prefers lifecycle errors over binding parse failures for destroyed-manager bind calls", () => {
    const manager = createKeyplane();

    manager.destroy();

    expectKeyplaneError(
      () => manager.bind("-" as never, () => {}),
      "KP_LIFECYCLE_MANAGER_DESTROYED",
    );
  });

  it("prefers unsupported-runtime errors over later platform capability checks", () => {
    vi.stubGlobal("document", undefined);
    vi.stubGlobal("KeyboardEvent", undefined);

    expectKeyplaneError(
      () => createKeyplane(),
      "KP_PLATFORM_UNSUPPORTED_RUNTIME",
    );

    vi.unstubAllGlobals();
  });

  it("prefers invalid binding input over later formatting-option failures", () => {
    expectKeyplaneError(
      () => formatBinding("-", { style: "debug" as never }),
      "KP_FORMAT_INVALID_BINDING",
    );
  });
});
