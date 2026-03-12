import type {
  KeyplaneBindingInput,
  KeyplaneBindingMode,
  KeyplaneBindingObject,
  KeyplaneModifier,
  KeyplaneNormalizedBinding,
  KeyplaneNormalizedStep,
} from "../types/public";
import {
  CANONICAL_MODIFIER_ORDER,
  CANONICAL_PHYSICAL_BY_LOWER,
  CANONICAL_SEMANTIC_NAMED_BY_LOWER,
  PHYSICAL_PUNCTUATION_SHORTHAND,
  isCanonicalPrimaryToken,
  isCanonicalSemanticPrintableToken,
} from "./constants";
import { PARSE_ERROR_CODES, createParseError } from "../errors/parse-error";

type ParsedStringBinding = {
  mode: KeyplaneBindingMode;
  steps: string[];
};

const MODIFIER_ALIAS_TO_CANONICAL = new Map<string, KeyplaneModifier | "Mod">([
  ["ctrl", "Control"],
  ["control", "Control"],
  ["alt", "Alt"],
  ["option", "Alt"],
  ["shift", "Shift"],
  ["meta", "Meta"],
  ["cmd", "Meta"],
  ["command", "Meta"],
  ["altgr", "AltGraph"],
  ["altgraph", "AltGraph"],
  ["mod", "Mod"],
]);

const MODE_PREFIX_PATTERN = /^(key|code):/i;

export function normalizeBindingInput(
  binding: KeyplaneBindingInput,
): KeyplaneNormalizedBinding {
  if (typeof binding === "string") {
    return normalizeStringBinding(binding);
  }

  return normalizeObjectBinding(binding);
}

export function areNormalizedBindingsEqual(
  left: KeyplaneNormalizedBinding,
  right: KeyplaneNormalizedBinding,
): boolean {
  if (left.mode !== right.mode || left.steps.length !== right.steps.length) {
    return false;
  }

  for (let index = 0; index < left.steps.length; index += 1) {
    const leftStep = left.steps[index];
    const rightStep = right.steps[index];

    if (leftStep.key !== rightStep.key) {
      return false;
    }

    if (leftStep.modifiers.length !== rightStep.modifiers.length) {
      return false;
    }

    for (let modifierIndex = 0; modifierIndex < leftStep.modifiers.length; modifierIndex += 1) {
      if (leftStep.modifiers[modifierIndex] !== rightStep.modifiers[modifierIndex]) {
        return false;
      }
    }
  }

  return true;
}

function normalizeStringBinding(binding: string): KeyplaneNormalizedBinding {
  const parsedBinding = parseStringBinding(binding);
  const steps = parsedBinding.steps.map((step) =>
    normalizeStringStep(step, parsedBinding.mode),
  );

  return {
    mode: parsedBinding.mode,
    steps,
  };
}

function parseStringBinding(binding: string): ParsedStringBinding {
  const trimmed = binding.trim();

  if (trimmed.length === 0) {
    throw createParseError(PARSE_ERROR_CODES.EMPTY_INPUT, "Binding input is empty.");
  }

  let mode: KeyplaneBindingMode = "physical";
  let remainder = trimmed;

  const prefixMatch = remainder.match(MODE_PREFIX_PATTERN);
  if (prefixMatch) {
    mode = prefixMatch[1].toLowerCase() === "key" ? "semantic" : "physical";
    remainder = remainder.slice(prefixMatch[0].length).trim();
  }

  if (remainder.length === 0) {
    throw createParseError(
      PARSE_ERROR_CODES.NO_PRIMARY_KEY,
      "Binding step is missing a primary key.",
    );
  }

  if (/^then(?:\s|$)/i.test(remainder) || /(?:\s|^)then$/i.test(remainder)) {
    throw createParseError(
      PARSE_ERROR_CODES.EMPTY_STEP,
      "Binding contains an empty sequence step.",
    );
  }

  const steps = remainder.split(/\s+then\s+/i).map((step) => step.trim());

  if (steps.some((step) => step.length === 0)) {
    throw createParseError(
      PARSE_ERROR_CODES.EMPTY_STEP,
      "Binding contains an empty sequence step.",
    );
  }

  return { mode, steps };
}

function normalizeStringStep(
  step: string,
  mode: KeyplaneBindingMode,
): KeyplaneNormalizedStep {
  const rawTokens = step.split("+");
  const modifiers = new Set<KeyplaneModifier>();
  const primaryCandidates: string[] = [];

  for (const rawToken of rawTokens) {
    const token = rawToken.trim();

    if (token.length === 0) {
      throw createParseError(
        PARSE_ERROR_CODES.NO_PRIMARY_KEY,
        "Binding step contains an empty combo token.",
        { step },
      );
    }

    if (MODE_PREFIX_PATTERN.test(token)) {
      throw createParseError(
        PARSE_ERROR_CODES.MODE_PREFIX_MISUSE,
        "Mode prefixes apply to the whole binding, not individual steps.",
        { token },
      );
    }

    const modifier = normalizeModifierAlias(token);

    if (modifier) {
      modifiers.add(modifier);
      continue;
    }

    primaryCandidates.push(token);
  }

  if (primaryCandidates.length === 0) {
    throw createParseError(
      PARSE_ERROR_CODES.NO_PRIMARY_KEY,
      "Binding step is missing a primary key.",
      { step },
    );
  }

  if (primaryCandidates.length > 1) {
    throw createParseError(
      PARSE_ERROR_CODES.MULTIPLE_PRIMARY_KEYS,
      "Binding step contains multiple primary keys.",
      { step, primaryCandidates },
    );
  }

  const key = normalizeStringPrimaryToken(primaryCandidates[0], mode);

  return {
    key,
    modifiers: sortModifiers(modifiers),
  };
}

function normalizeStringPrimaryToken(
  token: string,
  mode: KeyplaneBindingMode,
): string {
  if (mode === "physical") {
    if (PHYSICAL_PUNCTUATION_SHORTHAND.has(token)) {
      throw createParseError(
        PARSE_ERROR_CODES.PHYSICAL_PUNCTUATION_SHORTHAND_REJECTED,
        "Physical punctuation shorthand is rejected in v1.",
        { token },
      );
    }

    if (/^[a-z]$/i.test(token)) {
      return `Key${token.toUpperCase()}`;
    }

    if (/^[0-9]$/.test(token)) {
      return `Digit${token}`;
    }

    if (/^key[a-z]$/i.test(token)) {
      return `Key${token.slice(3).toUpperCase()}`;
    }

    if (/^digit[0-9]$/i.test(token)) {
      return `Digit${token.slice(5)}`;
    }

    const canonicalPhysical = CANONICAL_PHYSICAL_BY_LOWER.get(token.toLowerCase());

    if (canonicalPhysical) {
      return canonicalPhysical;
    }
  } else {
    const canonicalSemanticNamed = CANONICAL_SEMANTIC_NAMED_BY_LOWER.get(
      token.toLowerCase(),
    );

    if (canonicalSemanticNamed) {
      return canonicalSemanticNamed;
    }

    if (isCanonicalSemanticPrintableToken(token)) {
      return token;
    }
  }

  throw createParseError(
    PARSE_ERROR_CODES.INVALID_PRIMARY_TOKEN,
    "Binding contains an invalid primary token for the selected mode.",
    { mode, token },
  );
}

function normalizeObjectBinding(
  binding: KeyplaneBindingObject,
): KeyplaneNormalizedBinding {
  if (binding.mode !== "physical" && binding.mode !== "semantic") {
    throw createParseError(
      PARSE_ERROR_CODES.OBJECT_MODE_REQUIRED,
      "Object binding mode must be explicitly set to 'physical' or 'semantic'.",
    );
  }

  if (!Array.isArray(binding.steps) || binding.steps.length === 0) {
    throw createParseError(
      PARSE_ERROR_CODES.EMPTY_STEPS,
      "Object binding must include a non-empty steps array.",
    );
  }

  return {
    mode: binding.mode,
    steps: binding.steps.map((step, index) => {
      const key = typeof step?.key === "string" ? step.key : "";

      if (!isCanonicalPrimaryToken(binding.mode, key)) {
        throw createParseError(
          PARSE_ERROR_CODES.INVALID_PRIMARY_TOKEN,
          "Object binding contains a non-canonical primary token for the selected mode.",
          { mode: binding.mode, key, stepIndex: index },
        );
      }

      const modifiers = normalizeObjectModifiers(step?.modifiers, index);

      return {
        key,
        modifiers,
      };
    }),
  };
}

function normalizeObjectModifiers(
  modifiers: readonly string[] | undefined,
  stepIndex: number,
): readonly KeyplaneModifier[] {
  if (modifiers === undefined) {
    return [];
  }

  if (!Array.isArray(modifiers)) {
    throw createParseError(
      PARSE_ERROR_CODES.UNSUPPORTED_MODIFIER_ALIAS,
      "Object binding modifiers must be an array of supported modifier aliases.",
      { stepIndex },
    );
  }

  const normalized = new Set<KeyplaneModifier>();

  for (const modifier of modifiers) {
    const canonicalModifier =
      typeof modifier === "string" ? normalizeModifierAlias(modifier) : null;

    if (!canonicalModifier) {
      throw createParseError(
        PARSE_ERROR_CODES.UNSUPPORTED_MODIFIER_ALIAS,
        "Object binding contains an unsupported modifier alias.",
        { modifier, stepIndex },
      );
    }

    normalized.add(canonicalModifier);
  }

  return sortModifiers(normalized);
}

function normalizeModifierAlias(token: string): KeyplaneModifier | null {
  const modifier = MODIFIER_ALIAS_TO_CANONICAL.get(token.toLowerCase());

  if (!modifier) {
    return null;
  }

  if (modifier === "Mod") {
    return isAppleLikePlatform() ? "Meta" : "Control";
  }

  return modifier;
}

function sortModifiers(modifiers: Iterable<KeyplaneModifier>): readonly KeyplaneModifier[] {
  const modifierSet = new Set(modifiers);

  return CANONICAL_MODIFIER_ORDER.filter((modifier) => modifierSet.has(modifier));
}

function isAppleLikePlatform(): boolean {
  const navigatorValue =
    typeof navigator === "object" && navigator !== null
      ? (navigator as Navigator & {
          userAgentData?: {
            platform?: string;
          };
        })
      : undefined;

  const platformCandidates = [
    navigatorValue?.userAgentData?.platform,
    navigatorValue?.platform,
  ];

  for (const candidate of platformCandidates) {
    if (typeof candidate !== "string") {
      continue;
    }

    if (/(mac|iphone|ipad|ipod)/i.test(candidate)) {
      return true;
    }
  }

  return false;
}
