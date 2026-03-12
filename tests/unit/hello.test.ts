import { describe, expect, it } from "vitest";

import * as keyplane from "../../src/index";

describe("public surface", () => {
  it("exports the required Phase 1 API functions", () => {
    expect(typeof keyplane.createKeyplane).toBe("function");
    expect(typeof keyplane.normalizeBinding).toBe("function");
    expect(typeof keyplane.isSameBinding).toBe("function");
    expect(typeof keyplane.formatBinding).toBe("function");
  });
});
