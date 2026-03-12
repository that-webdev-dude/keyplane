import { describe, expect, it } from "vitest";

import * as keyplane from "../index";

describe("Phase 1 public surface", () => {
  it("imports without module-top-level side effects", async () => {
    await expect(import("../index")).resolves.toBeDefined();
  });

  it("exports the required top-level API entry points", () => {
    expect(typeof keyplane.createKeyplane).toBe("function");
    expect(typeof keyplane.normalizeBinding).toBe("function");
    expect(typeof keyplane.isSameBinding).toBe("function");
    expect(typeof keyplane.formatBinding).toBe("function");
  });

  it("returns a manager shell with the required method names", () => {
    const manager = keyplane.createKeyplane();

    expect(typeof manager.bind).toBe("function");
    expect(typeof manager.setScope).toBe("function");
    expect(typeof manager.getScope).toBe("function");
    expect(typeof manager.enable).toBe("function");
    expect(typeof manager.disable).toBe("function");
    expect(typeof manager.isEnabled).toBe("function");
    expect(typeof manager.destroy).toBe("function");
  });
});
