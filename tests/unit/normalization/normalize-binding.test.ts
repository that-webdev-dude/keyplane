import { afterEach, describe, expect, it, vi } from "vitest";

import { normalizeBinding } from "../../../src/index";

type StubNavigator = Partial<Navigator> & {
  userAgentData?: {
    platform?: string;
  };
};

function stubNavigator(navigatorValue: StubNavigator): void {
  vi.stubGlobal("navigator", navigatorValue as Navigator);
}

describe("normalizeBinding", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes physical string bindings deterministically", () => {
    expect(normalizeBinding("Ctrl+s")).toEqual({
      mode: "physical",
      steps: [{ key: "KeyS", modifiers: ["Control"] }],
    });

    expect(normalizeBinding("code:Alt+arrowdown")).toEqual({
      mode: "physical",
      steps: [{ key: "ArrowDown", modifiers: ["Alt"] }],
    });

    expect(normalizeBinding("digit1")).toEqual({
      mode: "physical",
      steps: [{ key: "Digit1", modifiers: [] }],
    });
  });

  it("normalizes semantic string bindings deterministically", () => {
    expect(normalizeBinding("key:Ctrl+s")).toEqual({
      mode: "semantic",
      steps: [{ key: "s", modifiers: ["Control"] }],
    });

    expect(normalizeBinding("key:Shift+? then ArrowRight")).toEqual({
      mode: "semantic",
      steps: [
        { key: "?", modifiers: ["Shift"] },
        { key: "ArrowRight", modifiers: [] },
      ],
    });

    expect(normalizeBinding("KEY:escape")).toEqual({
      mode: "semantic",
      steps: [{ key: "Escape", modifiers: [] }],
    });

    expect(normalizeBinding("key:-")).toEqual({
      mode: "semantic",
      steps: [{ key: "-", modifiers: [] }],
    });
  });

  it("normalizes object input with canonical primary keys only", () => {
    expect(
      normalizeBinding({
        mode: "physical",
        steps: [{ key: "Digit1", modifiers: [] }],
      }),
    ).toEqual({
      mode: "physical",
      steps: [{ key: "Digit1", modifiers: [] }],
    });

    expect(
      normalizeBinding({
        mode: "physical",
        steps: [{ key: "Minus", modifiers: [] }],
      }),
    ).toEqual({
      mode: "physical",
      steps: [{ key: "Minus", modifiers: [] }],
    });

    expect(
      normalizeBinding({
        mode: "physical",
        steps: [{ key: "ArrowDown", modifiers: ["Shift", "Control", "Shift"] }],
      }),
    ).toEqual({
      mode: "physical",
      steps: [{ key: "ArrowDown", modifiers: ["Control", "Shift"] }],
    });

    expect(
      normalizeBinding({
        mode: "semantic",
        steps: [{ key: "Enter", modifiers: [] }],
      }),
    ).toEqual({
      mode: "semantic",
      steps: [{ key: "Enter", modifiers: [] }],
    });

    expect(
      normalizeBinding({
        mode: "semantic",
        steps: [{ key: "a", modifiers: [] }],
      }),
    ).toEqual({
      mode: "semantic",
      steps: [{ key: "a", modifiers: [] }],
    });

    expect(
      normalizeBinding({
        mode: "semantic",
        steps: [{ key: "?", modifiers: ["AltGr" as any] }],
      }),
    ).toEqual({
      mode: "semantic",
      steps: [{ key: "?", modifiers: ["AltGraph"] }],
    });
  });

  it("accepts delimiter-colliding semantic keys through object input only", () => {
    expect(
      normalizeBinding({
        mode: "semantic",
        steps: [{ key: "+", modifiers: [] }],
      }),
    ).toEqual({
      mode: "semantic",
      steps: [{ key: "+", modifiers: [] }],
    });
  });

  it("normalizes string and object input to the same meaning", () => {
    expect(normalizeBinding("Ctrl+ArrowDown")).toEqual(
      normalizeBinding({
        mode: "physical",
        steps: [{ key: "ArrowDown", modifiers: ["Control"] }],
      }),
    );
  });

  it("resolves Mod during normalization and defaults unknown classification to Control", () => {
    stubNavigator({ platform: "Win32" });

    expect(normalizeBinding("Mod+KeyS")).toEqual({
      mode: "physical",
      steps: [{ key: "KeyS", modifiers: ["Control"] }],
    });

    stubNavigator({});

    expect(normalizeBinding("Mod+KeyS")).toEqual({
      mode: "physical",
      steps: [{ key: "KeyS", modifiers: ["Control"] }],
    });
  });

  it("resolves Mod to Meta only when Apple-like classification is positively identified", () => {
    stubNavigator({ platform: "MacIntel" });

    expect(normalizeBinding("Mod+KeyS")).toEqual({
      mode: "physical",
      steps: [{ key: "KeyS", modifiers: ["Meta"] }],
    });
  });

  it("keeps physical and semantic meanings distinct", () => {
    expect(normalizeBinding("KeyZ")).toEqual({
      mode: "physical",
      steps: [{ key: "KeyZ", modifiers: [] }],
    });

    expect(normalizeBinding("key:z")).toEqual({
      mode: "semantic",
      steps: [{ key: "z", modifiers: [] }],
    });
  });

  it("normalizes surrounding whitespace around tokens and delimiters", () => {
    expect(normalizeBinding("  Control +  KeyS  then  ArrowDown  ")).toEqual({
      mode: "physical",
      steps: [
        { key: "KeyS", modifiers: ["Control"] },
        { key: "ArrowDown", modifiers: [] },
      ],
    });
  });
});
