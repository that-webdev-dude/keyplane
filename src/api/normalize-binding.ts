import { throwPhase1ShellError } from "./shared";
import type {
  KeyplaneBindingInput,
  KeyplaneNormalizedBinding,
} from "../types/public";

export function normalizeBinding(
  _binding: KeyplaneBindingInput,
): KeyplaneNormalizedBinding {
  return throwPhase1ShellError();
}
