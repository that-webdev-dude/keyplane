import { KeyplaneError, type KeyplaneErrorDetails } from "./keyplane-error";

export const LIFECYCLE_ERROR_CODES = {
  MANAGER_DESTROYED: "KP_LIFECYCLE_MANAGER_DESTROYED",
  INVALID_STATE: "KP_LIFECYCLE_INVALID_STATE",
} as const;

export type KeyplaneLifecycleErrorCode =
  (typeof LIFECYCLE_ERROR_CODES)[keyof typeof LIFECYCLE_ERROR_CODES];

export function createLifecycleError(
  code: KeyplaneLifecycleErrorCode,
  message: string,
  details?: KeyplaneErrorDetails,
): KeyplaneError {
  return new KeyplaneError(code, message, { details });
}
