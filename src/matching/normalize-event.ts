import { CANONICAL_MODIFIER_ORDER } from "../binding/constants";
import { PLATFORM_ERROR_CODES, createPlatformError } from "../errors/platform-error";
import type { KeyplaneEventType, KeyplaneModifier } from "../types/public";

export interface KeyplaneNormalizedEventView {
  eventType: KeyplaneEventType;
  physicalKey: string;
  semanticKey: string;
  modifiers: readonly KeyplaneModifier[];
  repeat: boolean;
  composing: boolean;
  deadKey: boolean;
}

export function normalizeKeyboardEvent(
  event: Event,
): {
  event: KeyboardEvent;
  view: KeyplaneNormalizedEventView;
} {
  if (!isKeyboardEventLike(event)) {
    throw createPlatformError(
      PLATFORM_ERROR_CODES.MISSING_KEYBOARD_CAPABILITY,
      "Keyplane requires keyboard events with code, key, repeat, and modifier-state support.",
    );
  }

  const eventType = normalizeEventType(event.type);
  const semanticKey = normalizeSemanticKey(event.key);
  const modifiers = getEffectiveModifiers(event);

  return {
    event,
    view: {
      eventType,
      physicalKey: event.code,
      semanticKey,
      modifiers,
      repeat: eventType === "keydown" ? event.repeat : false,
      composing: event.isComposing === true,
      deadKey: semanticKey === "Dead",
    },
  };
}

function normalizeSemanticKey(key: string): string {
  if (key === " ") {
    return "Space";
  }

  return key;
}

function normalizeEventType(type: string): KeyplaneEventType {
  if (type === "keydown" || type === "keyup") {
    return type;
  }

  throw createPlatformError(
    PLATFORM_ERROR_CODES.MISSING_KEYBOARD_CAPABILITY,
    "Keyplane requires keyboard events delivered as 'keydown' or 'keyup'.",
    { eventType: type },
  );
}

function getEffectiveModifiers(event: KeyboardEvent): readonly KeyplaneModifier[] {
  const modifiers: KeyplaneModifier[] = [];
  const altGraph = event.getModifierState("AltGraph");

  for (const modifier of CANONICAL_MODIFIER_ORDER) {
    if (modifier === "AltGraph") {
      if (altGraph) {
        modifiers.push("AltGraph");
      }

      continue;
    }

    if ((modifier === "Control" || modifier === "Alt") && altGraph) {
      continue;
    }

    if (event.getModifierState(modifier)) {
      modifiers.push(modifier);
    }
  }

  return modifiers;
}

function isKeyboardEventLike(event: Event): event is KeyboardEvent {
  return (
    typeof event === "object" &&
    event !== null &&
    typeof (event as KeyboardEvent).code === "string" &&
    typeof (event as KeyboardEvent).key === "string" &&
    typeof (event as KeyboardEvent).repeat === "boolean" &&
    typeof (event as KeyboardEvent).getModifierState === "function"
  );
}
