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

test("browser single-step matching works for physical and semantic bindings", async ({
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
              <input id="editor" type="text" />
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
    const input = document.getElementById("editor") as HTMLInputElement;

    const manager = createKeyplane();

    manager.bind("KeyZ", () => {
      seen.push("physical");
    });
    manager.bind("key:y", () => {
      seen.push("semantic");
    });
    manager.bind("Control+KeyK", () => {
      seen.push("modifier");
    });
    manager.bind("KeyE", () => {
      seen.push("blocked");
    });
    manager.bind("KeyE", () => {
      seen.push("editable");
    }, { allowInEditable: true });

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyZ",
        key: "y",
      }),
    );

    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyE",
        key: "e",
      }),
    );

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyK",
        key: "k",
        ctrlKey: true,
      }),
    );

    return seen;
  });

  expect(result).toEqual(["physical", "semantic", "editable", "modifier"]);
});

test("browser matching canonicalizes semantic Space and suppresses composition/dead-key input", async ({
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

    manager.bind("key:Space", () => {
      seen.push("space");
    });
    manager.bind("key:a", () => {
      seen.push("a");
    });

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "Space",
        key: " ",
      }),
    );

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyA",
        key: "a",
        isComposing: true,
      }),
    );

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "Quote",
        key: "Dead",
      }),
    );

    return seen;
  });

  expect(result).toEqual(["space"]);
});

test("browser HTMLElement targets only match inside their subtree", async ({ page }) => {
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
              <section id="inside-host">
                <button id="inside-trigger">Inside</button>
              </section>
              <button id="outside-trigger">Outside</button>
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
    const insideHost = document.getElementById("inside-host") as HTMLElement;
    const insideTrigger = document.getElementById("inside-trigger") as HTMLButtonElement;
    const outsideTrigger = document.getElementById("outside-trigger") as HTMLButtonElement;

    const manager = createKeyplane({ target: insideHost });

    manager.bind("KeyT", () => {
      seen.push("inside");
    });

    insideTrigger.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyT",
        key: "t",
      }),
    );

    outsideTrigger.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyT",
        key: "t",
      }),
    );

    return seen;
  });

  expect(result).toEqual(["inside"]);
});
