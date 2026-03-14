import {
  KeyplaneError,
  type KeyplaneErrorDetails,
  type KeyplaneErrorOptions,
} from "./keyplane-error";

export const FORMAT_ERROR_CODES = {
  INVALID_BINDING: "KP_FORMAT_INVALID_BINDING",
  UNSUPPORTED_INPUT: "KP_FORMAT_UNSUPPORTED_INPUT",
} as const;

export type KeyplaneFormatErrorCode =
  (typeof FORMAT_ERROR_CODES)[keyof typeof FORMAT_ERROR_CODES];

export function createFormatError(
  code: KeyplaneFormatErrorCode,
  message: string,
  detailsOrOptions?: KeyplaneErrorDetails | KeyplaneErrorOptions,
): KeyplaneError {
  return new KeyplaneError(
    code,
    message,
    isErrorOptions(detailsOrOptions)
      ? detailsOrOptions
      : { details: detailsOrOptions },
  );
}

function isErrorOptions(
  value: KeyplaneErrorDetails | KeyplaneErrorOptions | undefined,
): value is KeyplaneErrorOptions {
  return (
    value !== undefined &&
    ("details" in value || "cause" in value)
  );
}
