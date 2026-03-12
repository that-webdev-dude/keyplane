import type { KeyplaneBindingSource } from "../types/public";
import {
  areNormalizedBindingsEqual,
  normalizeBindingInput,
} from "../binding/normalize";

export function isSameBinding(
  left: KeyplaneBindingSource,
  right: KeyplaneBindingSource,
): boolean {
  return areNormalizedBindingsEqual(
    normalizeBindingInput(left),
    normalizeBindingInput(right),
  );
}
