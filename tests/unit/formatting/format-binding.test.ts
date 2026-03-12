import { describe, expect, it } from "vitest";

import { formatBinding } from "../../../src/index";

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
