import { throwPhase1ShellError } from "./shared";
import type {
  KeyplaneBindingSource,
  KeyplaneFormatOptions,
} from "../types/public";

export function formatBinding(
  _binding: KeyplaneBindingSource,
  _options?: KeyplaneFormatOptions,
): string {
  return throwPhase1ShellError();
}
