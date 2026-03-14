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

test("browser scope gating and scope-change sequence reset are deterministic", async ({
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
    const manager = createKeyplane({ defaultScope: "editor" });

    manager.bind("KeyA", () => {
      seen.push("global");
    });
    manager.bind("KeyS", () => {
      seen.push("scoped");
    }, { scope: "editor" });
    manager.bind("KeyG then KeyC", () => {
      seen.push("sequence");
    }, { scope: "editor" });

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyA",
        key: "a",
      }),
    );
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyS",
        key: "s",
      }),
    );

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyG",
        key: "g",
      }),
    );
    manager.setScope("palette");
    manager.setScope("editor");
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
        code: "KeyC",
        key: "c",
      }),
    );

    manager.setScope("palette");
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyA",
        key: "a",
      }),
    );
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyS",
        key: "s",
      }),
    );

    return {
      activeScope: manager.getScope(),
      seen,
    };
  });

  expect(result).toEqual({
    activeScope: "palette",
    seen: ["global", "scoped", "sequence", "global"],
  });
});
