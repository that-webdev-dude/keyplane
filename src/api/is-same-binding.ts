import { throwPhase1ShellError } from "./shared";
import type { KeyplaneBindingSource } from "../types/public";

export function isSameBinding(
  _left: KeyplaneBindingSource,
  _right: KeyplaneBindingSource,
): boolean {
  return throwPhase1ShellError();
}
