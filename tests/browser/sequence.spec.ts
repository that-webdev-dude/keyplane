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

test("browser sequence progression, restart, timeout, and prefix conflicts are deterministic", async ({
  page,
}) => {
  ensureBuild();

  await page.route("http://keyplane.test/**", async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname === "/") {
      await route.fulfill({
        contentType: "text/html",
        body: `
          <!doctype html>
          <html>
            <body>
              <script type="module" src="/dist/index.js"></script>
            </body>
          </html>
        `,
      });
      return;
    }

    if (url.pathname === "/dist/index.js") {
      await route.fulfill({
        contentType: "application/javascript",
        body: readFileSync(path.resolve("dist/index.js"), "utf8"),
      });
      return;
    }

    await route.abort();
  });

  await page.goto("http://keyplane.test/");

  const result = await page.evaluate(async () => {
    const { createKeyplane } = await import("http://keyplane.test/dist/index.js");
    const seen: string[] = [];
    const manager = createKeyplane();

    manager.bind("KeyG then KeyC", () => {
      seen.push("gc");
    });
    manager.bind("KeyG then KeyI", () => {
      seen.push("gi");
    });
    manager.bind("KeyG then KeyG", () => {
      seen.push("gg");
    }, { sequenceTimeoutMs: 30 });

    let prefixConflictCode: string | null = null;

    try {
      manager.bind("KeyG", () => {});
    } catch (error) {
      prefixConflictCode = (error as { code?: string }).code ?? null;
    }

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyG",
        key: "g",
      }),
    );
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyC",
        key: "c",
      }),
    );

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyG",
        key: "g",
      }),
    );
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyG",
        key: "g",
      }),
    );

    await new Promise((resolve) => window.setTimeout(resolve, 40));

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyG",
        key: "g",
      }),
    );
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyI",
        key: "i",
      }),
    );

    return { prefixConflictCode, seen };
  });

  expect(result).toEqual({
    prefixConflictCode: "KP_REGISTER_PREFIX_CONFLICT",
    seen: ["gc", "gg", "gi"],
  });
});
