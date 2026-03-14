import { KeyplaneError, type KeyplaneErrorDetails } from "./keyplane-error";

export const PARSE_ERROR_CODES = {
  EMPTY_INPUT: "KP_PARSE_EMPTY_INPUT",
  EMPTY_STEP: "KP_PARSE_EMPTY_STEP",
  NO_PRIMARY_KEY: "KP_PARSE_NO_PRIMARY_KEY",
  MULTIPLE_PRIMARY_KEYS: "KP_PARSE_MULTIPLE_PRIMARY_KEYS",
  UNSUPPORTED_MODIFIER_ALIAS: "KP_PARSE_UNSUPPORTED_MODIFIER_ALIAS",
  INVALID_PRIMARY_TOKEN: "KP_PARSE_INVALID_PRIMARY_TOKEN",
  MODE_PREFIX_MISUSE: "KP_PARSE_MODE_PREFIX_MISUSE",
  PHYSICAL_PUNCTUATION_SHORTHAND_REJECTED:
    "KP_PARSE_PHYSICAL_PUNCTUATION_SHORTHAND_REJECTED",
  OBJECT_MODE_REQUIRED: "KP_PARSE_OBJECT_MODE_REQUIRED",
  EMPTY_STEPS: "KP_PARSE_EMPTY_STEPS",
} as const;

export type KeyplaneParseErrorCode =
  (typeof PARSE_ERROR_CODES)[keyof typeof PARSE_ERROR_CODES];

export function createParseError(
  code: KeyplaneParseErrorCode,
  message: string,
  details?: KeyplaneErrorDetails,
): KeyplaneError {
  return new KeyplaneError(code, message, { details });
}
