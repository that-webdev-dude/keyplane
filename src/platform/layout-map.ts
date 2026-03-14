interface KeyboardLayoutMapLike {
  get(code: string): string | undefined;
}

interface NavigatorKeyboardLike {
  getLayoutMap(): Promise<KeyboardLayoutMapLike>;
}

interface NavigatorLike {
  keyboard?: NavigatorKeyboardLike;
}

type LayoutState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; map: KeyboardLayoutMapLike }
  | { status: "unavailable" };

let layoutState: LayoutState = { status: "idle" };

export function getLayoutAwarePhysicalKeyLabel(code: string): string | null {
  if (!isLayoutDisplayEligible(code)) {
    return null;
  }

  if (layoutState.status === "ready") {
    return normalizeLayoutLabel(layoutState.map.get(code));
  }

  if (layoutState.status === "idle") {
    const keyboard = getNavigatorKeyboard();

    if (!keyboard) {
      layoutState = { status: "unavailable" };
      return null;
    }

    layoutState = { status: "loading" };

    void keyboard.getLayoutMap()
      .then((map) => {
        layoutState = isKeyboardLayoutMapLike(map)
          ? { status: "ready", map }
          : { status: "unavailable" };
      })
      .catch(() => {
        layoutState = { status: "unavailable" };
      });
  }

  return null;
}

export function resetLayoutMapForTests(): void {
  layoutState = { status: "idle" };
}

function getNavigatorKeyboard(): NavigatorKeyboardLike | null {
  const navigatorValue =
    typeof navigator === "object" && navigator !== null
      ? (navigator as NavigatorLike)
      : undefined;

  if (
    !navigatorValue?.keyboard ||
    typeof navigatorValue.keyboard.getLayoutMap !== "function"
  ) {
    return null;
  }

  return navigatorValue.keyboard;
}

function isKeyboardLayoutMapLike(value: unknown): value is KeyboardLayoutMapLike {
  return typeof value === "object" && value !== null && typeof (value as KeyboardLayoutMapLike).get === "function";
}

function isLayoutDisplayEligible(code: string): boolean {
  return PUNCTUATION_DISPLAY_KEYS.has(code);
}

function normalizeLayoutLabel(label: string | undefined): string | null {
  if (typeof label !== "string") {
    return null;
  }

  if (label.trim().length === 0) {
    return null;
  }

  return label;
}

const PUNCTUATION_DISPLAY_KEYS = new Set([
  "Minus",
  "Equal",
  "BracketLeft",
  "BracketRight",
  "Semicolon",
  "Quote",
  "Comma",
  "Period",
  "Slash",
  "Backquote",
  "Backslash",
  "NumpadSubtract",
]);
