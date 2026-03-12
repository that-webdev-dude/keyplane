import type {
  KeyplaneBindingInput,
  KeyplaneNormalizedBinding,
} from "../types/public";
import { normalizeBindingInput } from "../binding/normalize";

export function normalizeBinding(
  binding: KeyplaneBindingInput,
): KeyplaneNormalizedBinding {
  return normalizeBindingInput(binding);
}
