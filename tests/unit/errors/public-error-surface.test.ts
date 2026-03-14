import { describe, expect, expectTypeOf, it } from "vitest";

import {
  FORMAT_ERROR_CODES,
  KeyplaneError,
  LIFECYCLE_ERROR_CODES,
  PARSE_ERROR_CODES,
  PLATFORM_ERROR_CODES,
  REGISTER_ERROR_CODES,
  formatBinding,
  normalizeBinding,
  type KeyplaneErrorCode,
} from "../../../src/index";

describe("public error surface", () => {
  it("exports the required base error class and family code constants", () => {
    expect(KeyplaneError).toBeTypeOf("function");
    expect(PARSE_ERROR_CODES.EMPTY_INPUT).toBe("KP_PARSE_EMPTY_INPUT");
    expect(REGISTER_ERROR_CODES.PREFIX_CONFLICT).toBe("KP_REGISTER_PREFIX_CONFLICT");
    expect(LIFECYCLE_ERROR_CODES.MANAGER_DESTROYED).toBe(
      "KP_LIFECYCLE_MANAGER_DESTROYED",
    );
    expect(PLATFORM_ERROR_CODES.UNSUPPORTED_RUNTIME).toBe(
      "KP_PLATFORM_UNSUPPORTED_RUNTIME",
    );
    expect(FORMAT_ERROR_CODES.INVALID_BINDING).toBe("KP_FORMAT_INVALID_BINDING");
  });

  it("preserves the public error shape and instanceof checks", () => {
    try {
      normalizeBinding("   ");
    } catch (error) {
      expect(error).toBeInstanceOf(KeyplaneError);
      expect(error).toMatchObject({
        name: "KeyplaneError",
        code: "KP_PARSE_EMPTY_INPUT",
        message: "Binding input is empty.",
      });
      return;
    }

    throw new Error("Expected normalizeBinding to throw.");
  });

  it("exposes wrapped formatting failures with details and cause", () => {
    try {
      formatBinding("-");
    } catch (error) {
      expect(error).toBeInstanceOf(KeyplaneError);
      expect(error).toMatchObject({
        name: "KeyplaneError",
        code: "KP_FORMAT_INVALID_BINDING",
        details: {
          causeCode: "KP_PARSE_PHYSICAL_PUNCTUATION_SHORTHAND_REJECTED",
        },
      });
      expect((error as KeyplaneError).cause).toBeInstanceOf(KeyplaneError);
      return;
    }

    throw new Error("Expected formatBinding to throw.");
  });

  it("exports the public error code union type", () => {
    expectTypeOf<KeyplaneErrorCode>().toEqualTypeOf<
      | "KP_PARSE_EMPTY_INPUT"
      | "KP_PARSE_EMPTY_STEP"
      | "KP_PARSE_NO_PRIMARY_KEY"
      | "KP_PARSE_MULTIPLE_PRIMARY_KEYS"
      | "KP_PARSE_UNSUPPORTED_MODIFIER_ALIAS"
      | "KP_PARSE_INVALID_PRIMARY_TOKEN"
      | "KP_PARSE_MODE_PREFIX_MISUSE"
      | "KP_PARSE_PHYSICAL_PUNCTUATION_SHORTHAND_REJECTED"
      | "KP_PARSE_OBJECT_MODE_REQUIRED"
      | "KP_PARSE_EMPTY_STEPS"
      | "KP_REGISTER_PREFIX_CONFLICT"
      | "KP_REGISTER_UNSUPPORTED_BINDING_OBJECT"
      | "KP_LIFECYCLE_MANAGER_DESTROYED"
      | "KP_LIFECYCLE_INVALID_STATE"
      | "KP_PLATFORM_UNSUPPORTED_RUNTIME"
      | "KP_PLATFORM_UNSUPPORTED_TARGET"
      | "KP_PLATFORM_MISSING_KEYBOARD_CAPABILITY"
      | "KP_PLATFORM_MISSING_DOM_CONTAINMENT_CAPABILITY"
      | "KP_FORMAT_INVALID_BINDING"
      | "KP_FORMAT_UNSUPPORTED_INPUT"
    >();
  });
});
