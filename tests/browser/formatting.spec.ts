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

test("layout-aware formatting enhances display only and does not affect physical matching", async ({
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
    Object.defineProperty(navigator, "keyboard", {
      configurable: true,
      value: {
        getLayoutMap: async () =>
          new Map([
            ["Minus", "-"],
          ]),
      },
    });

    const { createKeyplane, formatBinding } = await import("http://keyplane.test/dist/index.js");
    const seen: string[] = [];
    const manager = createKeyplane();

    manager.bind("Minus", () => {
      seen.push("physical");
    });
    manager.bind("key:-", () => {
      seen.push("semantic");
    });

    const initialPhysicalLabel = formatBinding("Minus");
    await Promise.resolve();
    await Promise.resolve();
    const enhancedPhysicalLabel = formatBinding("Minus");
    const semanticLabel = formatBinding("key:-");

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "Minus",
        key: "=",
      }),
    );

    return {
      enhancedPhysicalLabel,
      initialPhysicalLabel,
      seen,
      semanticLabel,
    };
  });

  expect(result).toEqual({
    initialPhysicalLabel: "Minus",
    enhancedPhysicalLabel: "-",
    semanticLabel: "-",
    seen: ["physical"],
  });
});

test("missing optional layout discovery does not break physical matching", async ({
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
    const { createKeyplane, formatBinding } = await import("http://keyplane.test/dist/index.js");
    const seen: string[] = [];
    const manager = createKeyplane();

    manager.bind("Minus", () => {
      seen.push("physical");
    });

    const label = formatBinding("Minus");

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "Minus",
        key: "-",
      }),
    );

    return {
      label,
      seen,
    };
  });

  expect(result).toEqual({
    label: "Minus",
    seen: ["physical"],
  });
});
