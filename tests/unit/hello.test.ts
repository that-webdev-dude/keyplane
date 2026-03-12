import { describe, expect, it } from "vitest";

import { hello } from "../../src/index";

describe("hello", () => {
  it("returns a greeting", () => {
    expect(hello("Keyplane")).toBe("Hello, Keyplane!");
  });
});
