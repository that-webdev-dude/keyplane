import type { KeyplaneManagerConfig } from "../types/public";
import { PLATFORM_ERROR_CODES, createPlatformError } from "../errors/platform-error";

export type KeyplaneRuntimeTarget = Document | Window | HTMLElement;

export function resolveManagerTarget(
  config: KeyplaneManagerConfig | undefined,
): KeyplaneRuntimeTarget {
  const target = config?.target ?? getDefaultDocumentTarget();

  assertKeyboardCapability();
  assertSupportedTarget(target);

  if (isHTMLElementTarget(target) && typeof target.contains !== "function") {
    throw createPlatformError(
      PLATFORM_ERROR_CODES.MISSING_DOM_CONTAINMENT_CAPABILITY,
      "HTMLElement targets must provide DOM containment checks.",
    );
  }

  return target;
}

function getDefaultDocumentTarget(): Document {
  const documentValue =
    typeof document === "object" && document !== null ? document : undefined;

  if (!documentValue) {
    throw createPlatformError(
      PLATFORM_ERROR_CODES.UNSUPPORTED_RUNTIME,
      "Keyplane managers require a browser-like runtime with a document target.",
    );
  }

  return documentValue;
}

function assertKeyboardCapability(): void {
  const keyboardEventCtor =
    typeof KeyboardEvent === "function" ? KeyboardEvent : undefined;

  if (!keyboardEventCtor) {
    throw createPlatformError(
      PLATFORM_ERROR_CODES.MISSING_KEYBOARD_CAPABILITY,
      "Keyplane requires KeyboardEvent support in the active runtime.",
    );
  }

  const prototype = keyboardEventCtor.prototype as unknown;

  if (!prototype) {
    throw createPlatformError(
      PLATFORM_ERROR_CODES.MISSING_KEYBOARD_CAPABILITY,
      "Keyplane requires KeyboardEvent prototype support in the active runtime.",
    );
  }

  for (const property of ["code", "key", "repeat"] as const) {
    if (!(property in (prototype as object))) {
      throw createPlatformError(
        PLATFORM_ERROR_CODES.MISSING_KEYBOARD_CAPABILITY,
        "Keyplane requires KeyboardEvent code, key, and repeat support.",
        { property },
      );
    }
  }
}

function assertSupportedTarget(target: unknown): asserts target is KeyplaneRuntimeTarget {
  if (!hasEventTargetMethods(target)) {
    throw createPlatformError(
      PLATFORM_ERROR_CODES.UNSUPPORTED_TARGET,
      "Keyplane target must be a supported browser EventTarget.",
    );
  }

  if (
    isDocumentTarget(target) ||
    isWindowTarget(target) ||
    isHTMLElementTarget(target)
  ) {
    return;
  }

  throw createPlatformError(
    PLATFORM_ERROR_CODES.UNSUPPORTED_TARGET,
    "Keyplane supports only Document, Window, and HTMLElement targets in v1.",
  );
}

function hasEventTargetMethods(
  value: unknown,
): value is Pick<EventTarget, "addEventListener" | "removeEventListener"> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as EventTarget).addEventListener === "function" &&
    typeof (value as EventTarget).removeEventListener === "function"
  );
}

function isDocumentTarget(value: unknown): value is Document {
  return (
    hasEventTargetMethods(value) &&
    typeof (value as Document).nodeType === "number" &&
    (value as Document).nodeType === 9
  );
}

function isWindowTarget(value: unknown): value is Window {
  return (
    hasEventTargetMethods(value) &&
    typeof value === "object" &&
    value !== null &&
    (value as Window).window === value
  );
}

function isHTMLElementTarget(value: unknown): value is HTMLElement {
  if (typeof HTMLElement === "function") {
    return value instanceof HTMLElement;
  }

  return (
    hasEventTargetMethods(value) &&
    typeof (value as HTMLElement).nodeType === "number" &&
    (value as HTMLElement).nodeType === 1
  );
}
