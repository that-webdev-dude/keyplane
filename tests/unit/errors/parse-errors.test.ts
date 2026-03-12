import { describe, expect, it } from "vitest";

import { normalizeBinding } from "../../../src/index";

type NormalizeBindingInput = Parameters<typeof normalizeBinding>[0];

function expectParseErrorCode(
  action: () => unknown,
  code: string,
  name = "KeyplaneError",
): void {
  try {
    action();
  } catch (error) {
    expect(error).toMatchObject({ code, name });
    return;
  }

  throw new Error(`Expected parse error ${code}.`);
}

function normalizeInvalidBinding(binding: unknown) {
  return normalizeBinding(binding as NormalizeBindingInput);
}

describe("parse and normalization errors", () => {
  it("reports the ambiguity-closure fixtures with the required attribution", () => {
    expectParseErrorCode(
      () => normalizeBinding("Hyper+KeyS"),
      "KP_PARSE_MULTIPLE_PRIMARY_KEYS",
    );
    expectParseErrorCode(
      () => normalizeBinding("key:Hyper+s"),
      "KP_PARSE_MULTIPLE_PRIMARY_KEYS",
    );
    expectParseErrorCode(
      () => normalizeBinding("Hyper"),
      "KP_PARSE_INVALID_PRIMARY_TOKEN",
    );
  });

  it("rejects empty input and empty sequence steps", () => {
    expectParseErrorCode(() => normalizeBinding("   "), "KP_PARSE_EMPTY_INPUT");
    expectParseErrorCode(
      () => normalizeBinding("KeyS then "),
      "KP_PARSE_EMPTY_STEP",
    );
    expectParseErrorCode(
      () => normalizeBinding(" then KeyS"),
      "KP_PARSE_EMPTY_STEP",
    );
  });

  it("rejects malformed combo delimiter usage", () => {
    expectParseErrorCode(
      () => normalizeBinding("Control++KeyS"),
      "KP_PARSE_NO_PRIMARY_KEY",
    );
  });

  it("accepts ArrowDown and ArrowRight in the closed v1 token sets", () => {
    expect(normalizeBinding("ArrowDown")).toEqual({
      mode: "physical",
      steps: [{ key: "ArrowDown", modifiers: [] }],
    });

    expect(normalizeBinding("ArrowRight")).toEqual({
      mode: "physical",
      steps: [{ key: "ArrowRight", modifiers: [] }],
    });

    expect(normalizeBinding("key:ArrowDown")).toEqual({
      mode: "semantic",
      steps: [{ key: "ArrowDown", modifiers: [] }],
    });

    expect(normalizeBinding("key:ArrowRight")).toEqual({
      mode: "semantic",
      steps: [{ key: "ArrowRight", modifiers: [] }],
    });
  });

  it("rejects parser-only primary key conveniences in object input", () => {
    expectParseErrorCode(
      () =>
        normalizeBinding({
          mode: "physical",
          steps: [{ key: "1" }],
        }),
      "KP_PARSE_INVALID_PRIMARY_TOKEN",
    );

    expectParseErrorCode(
      () =>
        normalizeBinding({
          mode: "physical",
          steps: [{ key: "minus" }],
        }),
      "KP_PARSE_INVALID_PRIMARY_TOKEN",
    );

    expectParseErrorCode(
      () =>
        normalizeBinding({
          mode: "semantic",
          steps: [{ key: "enter" }],
        }),
      "KP_PARSE_INVALID_PRIMARY_TOKEN",
    );
  });

  it("rejects missing object mode and empty object steps", () => {
    expectParseErrorCode(
      () =>
        normalizeInvalidBinding({
          steps: [{ key: "KeyS" }],
        }),
      "KP_PARSE_OBJECT_MODE_REQUIRED",
    );

    expectParseErrorCode(
      () =>
        normalizeBinding({
          mode: "physical",
          steps: [],
        }),
      "KP_PARSE_EMPTY_STEPS",
    );
  });

  it("rejects internal ambiguous whitespace using the existing invalid-primary case", () => {
    expectParseErrorCode(
      () => normalizeBinding("Arrow Right"),
      "KP_PARSE_INVALID_PRIMARY_TOKEN",
    );
  });

  it("rejects object modifier aliases only through the dedicated modifier case", () => {
    expectParseErrorCode(
      () =>
        normalizeBinding({
          mode: "physical",
          steps: [{ key: "KeyS", modifiers: ["Hyper" as any] }],
        }),
      "KP_PARSE_UNSUPPORTED_MODIFIER_ALIAS",
    );
  });

  it("rejects physical punctuation shorthand in strings", () => {
    expectParseErrorCode(
      () => normalizeBinding("-"),
      "KP_PARSE_PHYSICAL_PUNCTUATION_SHORTHAND_REJECTED",
    );
  });

  it("rejects mixed per-step mode prefixes", () => {
    expectParseErrorCode(
      () => normalizeBinding("key:Escape then code:Enter"),
      "KP_PARSE_MODE_PREFIX_MISUSE",
    );
  });

  it("rejects delimiter-colliding semantic printable tokens in string form", () => {
    expectParseErrorCode(
      () => normalizeBinding("key:+"),
      "KP_PARSE_NO_PRIMARY_KEY",
    );
  });
});
