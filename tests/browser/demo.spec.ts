import path from "node:path";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

let built = false;

function ensureBuild(): void {
  if (built) {
    return;
  }

  execSync(process.platform === "win32" ? "npm.cmd run build" : "npm run build", {
    cwd: process.cwd(),
    shell: true,
    stdio: "inherit",
  });
  built = true;
}

test("browser demo loads and its documented scenarios remain interactive", async ({ page }) => {
  ensureBuild();

  await page.route("http://keyplane.test/**", async (route) => {
    const url = new URL(route.request().url());

    const staticFiles = new Map<string, { type: string; body: string }>([
      [
        "/examples/browser-core-demo/index.html",
        {
          type: "text/html",
          body: readFileSync(path.resolve("examples/browser-core-demo/index.html"), "utf8"),
        },
      ],
      [
        "/examples/browser-core-demo/main.js",
        {
          type: "application/javascript",
          body: readFileSync(path.resolve("examples/browser-core-demo/main.js"), "utf8"),
        },
      ],
      [
        "/examples/browser-core-demo/styles.css",
        {
          type: "text/css",
          body: readFileSync(path.resolve("examples/browser-core-demo/styles.css"), "utf8"),
        },
      ],
      [
        "/dist/index.js",
        {
          type: "application/javascript",
          body: readFileSync(path.resolve("dist/index.js"), "utf8"),
        },
      ],
    ]);

    const file = staticFiles.get(url.pathname);

    if (file) {
      await route.fulfill({
        contentType: file.type,
        body: file.body,
      });
      return;
    }

    await route.abort();
  });

  await page.goto("http://keyplane.test/examples/browser-core-demo/index.html");

  await expect(
    page.getByRole("heading", { name: "Physical and semantic meanings stay separate." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Runtime-Like Meanings" })).toBeVisible();
  await expect(page.getByText("Physical punctuation")).toBeVisible();
  await expect(page.getByText("Semantic punctuation")).toBeVisible();

  await page.getByRole("button", { name: "Palette" }).click();
  await expect(page.getByText("\"palette\"")).toBeVisible();

  await page.locator("#capture").focus();
  await page.keyboard.press("p");

  await expect(page.getByText("Scoped: KeyP")).toBeVisible();
});
