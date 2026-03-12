import { describe, expect, it } from "vitest";

import { formatBinding } from "../../../src/index";

function expectKeyplaneError(action: () => unknown, code: string): void {
  try {
    action();
  } catch (error) {
    expect(error).toMatchObject({ code, name: "KeyplaneError" });
    return;
  }

  throw new Error(`Expected KeyplaneError ${code}.`);
}

describe("formatting errors", () => {
  it("uses KP_FORMAT_UNSUPPORTED_INPUT for non-binding formatting input", () => {
    expectKeyplaneError(
      () => formatBinding(42 as never),
      "KP_FORMAT_UNSUPPORTED_INPUT",
    );
  });

  it("uses KP_FORMAT_UNSUPPORTED_INPUT for invalid formatting options", () => {
    expectKeyplaneError(
      () => formatBinding("KeyS", { style: "debug" as never }),
      "KP_FORMAT_UNSUPPORTED_INPUT",
    );
  });

  it("preserves parse-family precedence for invalid bindings", () => {
    expectKeyplaneError(
      () => formatBinding("-"),
      "KP_FORMAT_INVALID_BINDING",
    );
  });
});
