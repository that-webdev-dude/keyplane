import type { KeyplaneFormatErrorCode } from "./format-error";
import type { KeyplaneLifecycleErrorCode } from "./lifecycle-error";
import type { KeyplaneParseErrorCode } from "./parse-error";
import type { KeyplanePlatformErrorCode } from "./platform-error";
import type { KeyplaneRegisterErrorCode } from "./register-error";

export {
  FORMAT_ERROR_CODES,
  type KeyplaneFormatErrorCode,
} from "./format-error";
export {
  KeyplaneError,
  type KeyplaneErrorDetails,
  type KeyplaneErrorOptions,
} from "./keyplane-error";
export {
  LIFECYCLE_ERROR_CODES,
  type KeyplaneLifecycleErrorCode,
} from "./lifecycle-error";
export {
  PARSE_ERROR_CODES,
  type KeyplaneParseErrorCode,
} from "./parse-error";
export {
  PLATFORM_ERROR_CODES,
  type KeyplanePlatformErrorCode,
} from "./platform-error";
export {
  REGISTER_ERROR_CODES,
  type KeyplaneRegisterErrorCode,
} from "./register-error";

export type KeyplaneErrorCode =
  | KeyplaneParseErrorCode
  | KeyplaneRegisterErrorCode
  | KeyplaneLifecycleErrorCode
  | KeyplanePlatformErrorCode
  | KeyplaneFormatErrorCode;
