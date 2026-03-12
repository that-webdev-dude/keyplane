import type {
  KeyplaneBindingSource,
  KeyplaneFormatOptions,
} from "../types/public";
import { formatBindingFromSource } from "../formatting/format-binding";

export function formatBinding(
  binding: KeyplaneBindingSource,
  options?: KeyplaneFormatOptions,
): string {
  return formatBindingFromSource(binding, options);
}
