// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { createKeyplane } from "../../../src/index";

describe("scope API", () => {
  it("uses null as the default active scope and exposes the configured initial scope", () => {
    expect(createKeyplane().getScope()).toBeNull();
    expect(createKeyplane({ defaultScope: "editor" }).getScope()).toBe("editor");
  });

  it("updates the active scope with exact string values and null", () => {
    const manager = createKeyplane({ defaultScope: "editor" });

    manager.setScope("palette");
    expect(manager.getScope()).toBe("palette");

    manager.setScope(null);
    expect(manager.getScope()).toBeNull();
  });
});
