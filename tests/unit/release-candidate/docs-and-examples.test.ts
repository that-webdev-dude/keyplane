import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readRepoFile(relativePath: string): string {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("release-candidate docs and examples surface", () => {
  it("includes the required documentation assets", () => {
    for (const filePath of [
      "README.md",
      "docs/getting-started.md",
      "docs/binding-model.md",
      "docs/api-reference.md",
      "docs/migration-guide.md",
      "docs/faq.md",
      "examples/browser-core-demo/README.md",
      "examples/browser-core-demo/index.html",
      "examples/browser-core-demo/main.js",
    ]) {
      expect(() => readRepoFile(filePath)).not.toThrow();
    }
  });

  it("keeps the README aligned with the required release-candidate messaging", () => {
    const readme = readRepoFile("README.md");

    expect(readme).toContain("layout-independent correctness");
    expect(readme).toContain("String bindings default to physical mode.");
    expect(readme).toContain("`key:Shift+?` means the produced `?` character with `Shift`");
    expect(readme).toContain("require object input");
    expect(readme).toContain("Control+KeyK then Control+KeyC");
    expect(readme).toContain("scope");
    expect(readme).toContain("allowInEditable");
    expect(readme).toContain("formatBinding");
    expect(readme).toContain("migration guide");
  });

  it("keeps the binding-model and migration docs focused on physical vs semantic intent", () => {
    const bindingModel = readRepoFile("docs/binding-model.md");
    const migrationGuide = readRepoFile("docs/migration-guide.md");

    expect(bindingModel).toContain("`KeyS` Vs `key:s`");
    expect(bindingModel).toContain("`Control+Minus` Vs `key:Control+-`");
    expect(bindingModel).toContain("Literal `+` is the clearest example");

    expect(migrationGuide).toContain("layout assumptions");
    expect(migrationGuide).toContain("physical or semantic");
    expect(migrationGuide).toContain("Control+Minus");
    expect(migrationGuide).toContain("key:/");
    expect(migrationGuide).toContain("Keyplane supports ordered sequences");
    expect(migrationGuide).toContain("Keyplane scopes are named eligibility gates");
    expect(migrationGuide).toContain("Formatting Does Not Define Matching");
  });

  it("avoids claiming unsupported adapter or framework guidance", () => {
    const combinedDocs = [
      "README.md",
      "docs/getting-started.md",
      "docs/binding-model.md",
      "docs/api-reference.md",
      "docs/migration-guide.md",
      "docs/faq.md",
      "examples/browser-core-demo/README.md",
    ].map(readRepoFile).join("\n");

    for (const unsupported of ["React adapter", "Vue adapter", "Svelte adapter", "Electron"]) {
      expect(combinedDocs).not.toContain(unsupported);
    }
  });

  it("keeps the demo scenarios aligned with implemented browser-core behavior", () => {
    const demoReadme = readRepoFile("examples/browser-core-demo/README.md");
    const demoHtml = readRepoFile("examples/browser-core-demo/index.html");
    const demoMain = readRepoFile("examples/browser-core-demo/main.js");

    expect(demoReadme).toContain("runtime-like physical event meaning");
    expect(demoReadme).toContain("runtime-like semantic event meaning");
    expect(demoHtml).toContain("Runtime-Like Meanings");

    for (const binding of [
      "\"KeyZ\"",
      "\"key:z\"",
      "\"Control+Minus\"",
      "\"key:Control+-\"",
      "\"Control+KeyK then Control+KeyC\"",
    ]) {
      expect(demoMain).toContain(binding);
    }

    expect(demoMain).toContain("scope: \"palette\"");
    expect(demoMain).toContain("allowInEditable: true");
    expect(demoMain).toContain("manager.setScope(scope)");
  });
});
