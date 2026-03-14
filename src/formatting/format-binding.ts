import type {
  KeyplaneBindingSource,
  KeyplaneFormatOptions,
  KeyplaneModifier,
  KeyplaneNormalizedBinding,
  KeyplaneNormalizedStep,
} from "../types/public";
import { normalizeBindingInput } from "../binding/normalize";
import { createFormatError, FORMAT_ERROR_CODES } from "../errors/format-error";
import { getLayoutAwarePhysicalKeyLabel } from "../platform/layout-map";

const DEFAULT_SEQUENCE_JOINER = "then";
const COMBO_JOINER = "+";
const DEFAULT_STYLE = "default";

const DEFAULT_MODIFIER_LABELS: Record<KeyplaneModifier, string> = {
  Control: "Ctrl",
  Alt: "Alt",
  Shift: "Shift",
  Meta: "Meta",
  AltGraph: "AltGr",
};

const DEFAULT_PHYSICAL_LABELS = new Map<string, string>([
  ["Enter", "Enter"],
  ["Escape", "Escape"],
  ["Tab", "Tab"],
  ["Space", "Space"],
  ["ArrowUp", "Up"],
  ["ArrowDown", "Down"],
  ["ArrowLeft", "Left"],
  ["ArrowRight", "Right"],
  ["Minus", "Minus"],
  ["Equal", "Equal"],
  ["BracketLeft", "Left Bracket"],
  ["BracketRight", "Right Bracket"],
  ["Semicolon", "Semicolon"],
  ["Quote", "Quote"],
  ["Comma", "Comma"],
  ["Period", "Period"],
  ["Slash", "Slash"],
  ["Backquote", "Backquote"],
  ["Backslash", "Backslash"],
  ["NumpadSubtract", "Numpad Subtract"],
]);

export function formatBindingFromSource(
  binding: KeyplaneBindingSource,
  options?: KeyplaneFormatOptions,
): string {
  const normalized = normalizeFormattingInput(binding);
  const resolvedOptions = normalizeFormatOptions(options);

  return normalized.steps
    .map((step) =>
      formatStep(
        normalized.mode,
        step,
        resolvedOptions.style,
        resolvedOptions.preferLayout,
      ),
    )
    .join(` ${resolvedOptions.sequenceJoiner} `);
}

function normalizeFormattingInput(
  binding: KeyplaneBindingSource,
): KeyplaneNormalizedBinding {
  if (typeof binding !== "string" && !isObjectLike(binding)) {
    throw createFormatError(
      FORMAT_ERROR_CODES.UNSUPPORTED_INPUT,
      "Formatting input must be a binding string or binding object.",
    );
  }

  try {
    return normalizeBindingInput(binding);
  } catch (error) {
    throw createFormatError(
      FORMAT_ERROR_CODES.INVALID_BINDING,
      "Binding could not be normalized for formatting.",
      error instanceof Error && "code" in error
        ? { causeCode: (error as Error & { code: string }).code }
        : undefined,
    );
  }
}

function normalizeFormatOptions(options: KeyplaneFormatOptions | undefined): {
  preferLayout: boolean;
  sequenceJoiner: string;
  style: "default" | "canonical";
} {
  if (options === undefined) {
    return {
      preferLayout: true,
      sequenceJoiner: DEFAULT_SEQUENCE_JOINER,
      style: DEFAULT_STYLE,
    };
  }

  if (!isObjectLike(options)) {
    throw createFormatError(
      FORMAT_ERROR_CODES.UNSUPPORTED_INPUT,
      "Formatting options must be an object when provided.",
    );
  }

  const { preferLayout = true, sequenceJoiner, style = DEFAULT_STYLE } = options;

  if (typeof preferLayout !== "boolean") {
    throw createFormatError(
      FORMAT_ERROR_CODES.UNSUPPORTED_INPUT,
      "Formatting option preferLayout must be a boolean.",
      { preferLayout },
    );
  }

  if (sequenceJoiner !== undefined && typeof sequenceJoiner !== "string") {
    throw createFormatError(
      FORMAT_ERROR_CODES.UNSUPPORTED_INPUT,
      "Formatting option sequenceJoiner must be a string.",
      { sequenceJoiner },
    );
  }

  if (style !== "default" && style !== "canonical") {
    throw createFormatError(
      FORMAT_ERROR_CODES.UNSUPPORTED_INPUT,
      "Formatting option style must be 'default' or 'canonical'.",
      { style },
    );
  }

  return {
    preferLayout,
    sequenceJoiner: sequenceJoiner ?? DEFAULT_SEQUENCE_JOINER,
    style,
  };
}

function formatStep(
  mode: KeyplaneNormalizedBinding["mode"],
  step: KeyplaneNormalizedStep,
  style: "default" | "canonical",
  preferLayout: boolean,
): string {
  const modifierLabels = step.modifiers.map((modifier) =>
    style === "canonical" ? modifier : DEFAULT_MODIFIER_LABELS[modifier],
  );
  const primaryLabel =
    style === "canonical"
      ? step.key
      : mode === "semantic"
        ? step.key
        : formatPhysicalPrimaryLabel(step.key, preferLayout);

  return [...modifierLabels, primaryLabel].join(COMBO_JOINER);
}

function formatPhysicalPrimaryLabel(key: string, preferLayout: boolean): string {
  if (preferLayout) {
    const layoutLabel = getLayoutAwarePhysicalKeyLabel(key);

    if (layoutLabel) {
      return layoutLabel;
    }
  }

  return formatPhysicalFallbackLabel(key);
}

function formatPhysicalFallbackLabel(key: string): string {
  if (/^Key[A-Z]$/.test(key)) {
    return key.slice(3);
  }

  if (/^Digit[0-9]$/.test(key)) {
    return key.slice(5);
  }

  return DEFAULT_PHYSICAL_LABELS.get(key) ?? key;
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
