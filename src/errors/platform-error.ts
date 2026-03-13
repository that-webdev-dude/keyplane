import { KeyplaneError } from "./keyplane-error";

export const PLATFORM_ERROR_CODES = {
  UNSUPPORTED_RUNTIME: "KP_PLATFORM_UNSUPPORTED_RUNTIME",
  UNSUPPORTED_TARGET: "KP_PLATFORM_UNSUPPORTED_TARGET",
  MISSING_KEYBOARD_CAPABILITY: "KP_PLATFORM_MISSING_KEYBOARD_CAPABILITY",
  MISSING_DOM_CONTAINMENT_CAPABILITY:
    "KP_PLATFORM_MISSING_DOM_CONTAINMENT_CAPABILITY",
} as const;

export type KeyplanePlatformErrorCode =
  (typeof PLATFORM_ERROR_CODES)[keyof typeof PLATFORM_ERROR_CODES];

export function createPlatformError(
  code: KeyplanePlatformErrorCode,
  message: string,
  details?: Record<string, unknown>,
): KeyplaneError {
  return new KeyplaneError(code, message, details);
}
