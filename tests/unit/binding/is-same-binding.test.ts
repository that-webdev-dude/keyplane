import { describe, expect, it } from "vitest";

import { isSameBinding } from "../../../src/index";

describe("isSameBinding", () => {
  it("compares normalized meaning rather than authored form", () => {
    expect(isSameBinding("Ctrl+s", "code:Control+KeyS")).toBe(true);
    expect(
      isSameBinding(
        { mode: "physical", steps: [{ key: "ArrowRight", modifiers: ["Shift"] }] },
        "Shift+ArrowRight",
      ),
    ).toBe(true);
  });

  it("enforces physical versus semantic separation", () => {
    expect(isSameBinding("KeyZ", "key:z")).toBe(false);
    expect(isSameBinding("ArrowDown", "key:ArrowDown")).toBe(false);
  });

  it("treats sequence step order as meaningfully distinct", () => {
    expect(isSameBinding("key:g then c", "key:c then g")).toBe(false);
  });
});
