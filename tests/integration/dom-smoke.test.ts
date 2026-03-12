// @vitest-environment jsdom

import { expect, test } from "vitest";

test("jsdom exposes basic DOM APIs", () => {
  const element = document.createElement("div");
  element.textContent = "ready";

  expect(element.textContent).toBe("ready");
});
