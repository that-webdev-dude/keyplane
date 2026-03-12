import type { KeyplaneBindingMode, KeyplaneModifier } from "../types/public";

export const CANONICAL_MODIFIER_ORDER: readonly KeyplaneModifier[] = [
  "Control",
  "Alt",
  "Shift",
  "Meta",
  "AltGraph",
];

export const PHYSICAL_NAMED_TOKENS = [
  "Enter",
  "Escape",
  "Tab",
  "Space",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
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
] as const;

export const SEMANTIC_NAMED_TOKENS = [
  "Enter",
  "Escape",
  "Tab",
  "Space",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
] as const;

const physicalTokens = new Set<string>();
const semanticNamedTokens = new Set<string>(SEMANTIC_NAMED_TOKENS);

for (let code = 65; code <= 90; code += 1) {
  physicalTokens.add(`Key${String.fromCharCode(code)}`);
}

for (let digit = 0; digit <= 9; digit += 1) {
  physicalTokens.add(`Digit${digit}`);
}

for (const token of PHYSICAL_NAMED_TOKENS) {
  physicalTokens.add(token);
}

export const CANONICAL_PHYSICAL_PRIMARY_TOKENS = physicalTokens;
export const CANONICAL_SEMANTIC_NAMED_PRIMARY_TOKENS = semanticNamedTokens;

export const CANONICAL_PHYSICAL_BY_LOWER = new Map<string, string>(
  [...CANONICAL_PHYSICAL_PRIMARY_TOKENS].map((token) => [token.toLowerCase(), token]),
);

export const CANONICAL_SEMANTIC_NAMED_BY_LOWER = new Map<string, string>(
  [...CANONICAL_SEMANTIC_NAMED_PRIMARY_TOKENS].map((token) => [
    token.toLowerCase(),
    token,
  ]),
);

export const PHYSICAL_PUNCTUATION_SHORTHAND = new Set([
  "-",
  "/",
  "[",
  "]",
  ";",
  "'",
  ",",
  ".",
  "`",
  "\\",
]);

export function isCanonicalPrimaryToken(
  mode: KeyplaneBindingMode,
  token: string,
): boolean {
  if (mode === "physical") {
    return CANONICAL_PHYSICAL_PRIMARY_TOKENS.has(token);
  }

  return (
    CANONICAL_SEMANTIC_NAMED_PRIMARY_TOKENS.has(token) ||
    isCanonicalSemanticPrintableToken(token)
  );
}

export function isCanonicalSemanticPrintableToken(token: string): boolean {
  return (
    [...token].length === 1 &&
    !/\s/u.test(token) &&
    !/\p{C}/u.test(token)
  );
}
