import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("package metadata", () => {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    bugs?: { url?: string };
    dependencies?: Record<string, string>;
    description?: string;
    exports?: Record<string, { import?: string; types?: string }>;
    files?: string[];
    homepage?: string;
    keywords?: string[];
    license?: string;
    repository?: { type?: string; url?: string };
    sideEffects?: boolean;
    type?: string;
    types?: string;
  };

  it("stays ESM-first with an explicit single public entry point", () => {
    expect(packageJson.type).toBe("module");
    expect(packageJson.types).toBe("./dist/index.d.ts");
    expect(packageJson.exports).toEqual({
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
      },
    });
    expect(packageJson.sideEffects).toBe(false);
  });

  it("includes the required consumer-facing package artifacts", () => {
    expect(packageJson.files).toEqual(["dist", "README.md", "LICENSE"]);
    expect(packageJson.license).toBe("MIT");
  });

  it("does not declare required runtime dependencies in v1", () => {
    expect(packageJson.dependencies ?? {}).toEqual({});
  });

  it("communicates the browser-first release identity in metadata", () => {
    expect(packageJson.description).toContain("Browser-first");
    expect(packageJson.keywords).toEqual(
      expect.arrayContaining(["browser", "keyboard-shortcuts", "layout-independent"]),
    );
    expect(packageJson.repository).toEqual({
      type: "git",
      url: "git+https://github.com/that-webdev-dude/keyplane.git",
    });
    expect(packageJson.homepage).toBe("https://github.com/that-webdev-dude/keyplane#readme");
    expect(packageJson.bugs).toEqual({
      url: "https://github.com/that-webdev-dude/keyplane/issues",
    });
  });
});
