import { KeyplaneError, type KeyplaneErrorDetails } from "./keyplane-error";

export const REGISTER_ERROR_CODES = {
  PREFIX_CONFLICT: "KP_REGISTER_PREFIX_CONFLICT",
  UNSUPPORTED_BINDING_OBJECT: "KP_REGISTER_UNSUPPORTED_BINDING_OBJECT",
} as const;

export type KeyplaneRegisterErrorCode =
  (typeof REGISTER_ERROR_CODES)[keyof typeof REGISTER_ERROR_CODES];

export function createRegisterError(
  code: KeyplaneRegisterErrorCode,
  message: string,
  details?: KeyplaneErrorDetails,
): KeyplaneError {
  return new KeyplaneError(code, message, { details });
}
