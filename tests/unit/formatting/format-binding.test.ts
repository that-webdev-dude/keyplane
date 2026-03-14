import { afterEach, describe, expect, it, vi } from "vitest";

import { formatBinding, normalizeBinding } from "../../../src/index";
import { resetLayoutMapForTests } from "../../../src/platform/layout-map";

function expectKeyplaneError(action: () => unknown, code: string): void {
  try {
    action();
  } catch (error) {
    expect(error).toMatchObject({ code, name: "KeyplaneError" });
    return;
  }

  throw new Error(`Expected KeyplaneError ${code}.`);
}

describe("formatBinding", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetLayoutMapForTests();
  });

  it("formats semantic bindings from normalized meaning and preserves printable case", () => {
    expect(
      formatBinding({
        mode: "semantic",
        steps: [{ key: "a", modifiers: ["Control"] }],
      }),
    ).toBe("Ctrl+a");

    expect(formatBinding("key:Ctrl+A")).toBe("Ctrl+A");
    expect(formatBinding("key:Ctrl+a")).toBe("Ctrl+a");
  });

  it("normalizes string and object inputs before formatting", () => {
    expect(formatBinding("Ctrl+KeyS")).toBe("Ctrl+S");

    expect(
      formatBinding({
        mode: "physical",
        steps: [{ key: "ArrowDown", modifiers: ["Shift", "Control"] }],
      }),
    ).toBe("Ctrl+Shift+Down");
  });

  it("formats already-normalized input directly from canonical meaning", () => {
    const normalizedBinding = {
      mode: "physical" as const,
      steps: [{ key: "KeyS", modifiers: ["Control"] as const }],
    };

    expect(formatBinding(normalizedBinding)).toBe("Ctrl+S");
  });

  it("does not change normalized binding meaning when layout-aware display is available", async () => {
    vi.stubGlobal("navigator", {
      keyboard: {
        getLayoutMap: vi.fn().mockResolvedValue(
          new Map<string, string>([["Minus", "-"]]),
        ),
      },
    });

    const normalizedBinding = normalizeBinding("Ctrl+Minus");

    expect(normalizedBinding).toEqual({
      mode: "physical",
      steps: [{ key: "Minus", modifiers: ["Control"] }],
    });

    formatBinding(normalizedBinding);
    await Promise.resolve();
    await Promise.resolve();
    expect(formatBinding(normalizedBinding)).toBe("Ctrl+-");

    expect(normalizedBinding).toEqual({
      mode: "physical",
      steps: [{ key: "Minus", modifiers: ["Control"] }],
    });
  });

  it("formats sequences in normalized step order and honors the sequence joiner override", () => {
    expect(formatBinding("Ctrl+KeyK then Ctrl+KeyC")).toBe("Ctrl+K then Ctrl+C");
    expect(
      formatBinding("Ctrl+KeyK then Ctrl+KeyC", { sequenceJoiner: "->" }),
    ).toBe("Ctrl+K -> Ctrl+C");
  });

  it("uses deterministic physical fallback labels without implying semantic glyphs", () => {
    expect(formatBinding("Minus")).toBe("Minus");
    expect(formatBinding("Equal")).toBe("Equal");
    expect(formatBinding("Slash")).toBe("Slash");
    expect(formatBinding("BracketLeft")).toBe("Left Bracket");
    expect(formatBinding("NumpadSubtract")).toBe("Numpad Subtract");
  });

  it("uses the default modifier display order deterministically", () => {
    expect(
      formatBinding({
        mode: "physical",
        steps: [
          {
            key: "KeyS",
            modifiers: ["Meta", "Shift", "Alt", "Control", "AltGraph"],
          },
        ],
      }),
    ).toBe("Ctrl+Alt+Shift+Meta+AltGr+S");
  });

  it("applies the default physical fallback to valid pattern-based tokens", () => {
    expect(formatBinding("KeyQ")).toBe("Q");
    expect(formatBinding("Digit7")).toBe("7");
  });

  it("uses deterministic canonical style for debugging output", () => {
    expect(
      formatBinding("Ctrl+Minus", {
        style: "canonical",
      }),
    ).toBe("Control+Minus");

    expect(
      formatBinding({
        mode: "semantic",
        steps: [{ key: "A", modifiers: ["AltGraph", "Shift"] }],
      }, {
        style: "canonical",
      }),
    ).toBe("Shift+AltGraph+A");
  });

  it("treats preferLayout as optional and falls back deterministically when requested", () => {
    expect(formatBinding("Ctrl+Minus", { preferLayout: true })).toBe("Ctrl+Minus");
  });

  it("defaults preferLayout to true without requiring layout discovery for success", () => {
    expect(formatBinding("Ctrl+Minus")).toBe("Ctrl+Minus");
  });

  it("uses layout-aware physical labels only after optional discovery resolves", async () => {
    vi.stubGlobal("navigator", {
      keyboard: {
        getLayoutMap: vi.fn().mockResolvedValue(
          new Map<string, string>([
            ["Minus", "-"],
            ["BracketLeft", "u"],
          ]),
        ),
      },
    });

    expect(formatBinding("Ctrl+Minus")).toBe("Ctrl+Minus");

    await Promise.resolve();
    await Promise.resolve();

    expect(formatBinding("Ctrl+Minus")).toBe("Ctrl+-");
    expect(formatBinding("BracketLeft")).toBe("u");
  });

  it("keeps semantic bindings and canonical style independent from layout-aware display", async () => {
    vi.stubGlobal("navigator", {
      keyboard: {
        getLayoutMap: vi.fn().mockResolvedValue(
          new Map<string, string>([["Minus", "-"]]),
        ),
      },
    });

    formatBinding("Minus");
    await Promise.resolve();
    await Promise.resolve();

    expect(formatBinding("key:-")).toBe("-");
    expect(formatBinding("Minus", { style: "canonical" })).toBe("Minus");
    expect(formatBinding("Minus", { preferLayout: false })).toBe("Minus");
  });

  it("falls back when optional layout discovery rejects or yields no reliable label", async () => {
    vi.stubGlobal("navigator", {
      keyboard: {
        getLayoutMap: vi.fn()
          .mockRejectedValueOnce(new Error("denied"))
          .mockResolvedValueOnce(new Map<string, string>([["Minus", ""]])),
      },
    });

    expect(formatBinding("Minus")).toBe("Minus");
    await Promise.resolve();
    await Promise.resolve();
    expect(formatBinding("Minus")).toBe("Minus");

    resetLayoutMapForTests();

    expect(formatBinding("Minus")).toBe("Minus");
    await Promise.resolve();
    await Promise.resolve();
    expect(formatBinding("Minus")).toBe("Minus");
  });

  it("does not apply optional layout-aware enhancement to non-punctuation physical fallback labels", async () => {
    vi.stubGlobal("navigator", {
      keyboard: {
        getLayoutMap: vi.fn().mockResolvedValue(
          new Map<string, string>([["KeyQ", "A"]]),
        ),
      },
    });

    expect(formatBinding("KeyQ")).toBe("Q");

    await Promise.resolve();
    await Promise.resolve();

    expect(formatBinding("KeyQ")).toBe("Q");
  });

  it("does not treat the physical catch-all rule as expanding the closed v1 token set", () => {
    expectKeyplaneError(
      () =>
      formatBinding({
        mode: "physical",
        steps: [{ key: "Numpad1" }],
      } as never),
      "KP_FORMAT_INVALID_BINDING",
    );
  });
});
