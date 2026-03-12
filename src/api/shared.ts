export const PHASE_1_SHELL_MESSAGE =
  "Keyplane Phase 1 public shell: runtime behavior is not implemented yet.";

export function createPhase1ShellError(): Error {
  return new Error(PHASE_1_SHELL_MESSAGE);
}

export function throwPhase1ShellError(): never {
  throw createPhase1ShellError();
}
