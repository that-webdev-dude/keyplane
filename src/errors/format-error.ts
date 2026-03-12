import { KeyplaneError } from "./keyplane-error";

export const FORMAT_ERROR_CODES = {
  INVALID_BINDING: "KP_FORMAT_INVALID_BINDING",
  UNSUPPORTED_INPUT: "KP_FORMAT_UNSUPPORTED_INPUT",
} as const;

export type KeyplaneFormatErrorCode =
  (typeof FORMAT_ERROR_CODES)[keyof typeof FORMAT_ERROR_CODES];

export function createFormatError(
  code: KeyplaneFormatErrorCode,
  message: string,
  details?: Record<string, unknown>,
): KeyplaneError {
  return new KeyplaneError(code, message, details);
}
