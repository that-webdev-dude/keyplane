export const DEFAULT_SEQUENCE_TIMEOUT_MS = 1000;

export interface KeyplaneSequenceState {
  nextStepIndex: number;
  deadline: number | null;
}

export function createSequenceState(): KeyplaneSequenceState {
  return {
    nextStepIndex: 0,
    deadline: null,
  };
}

export function resetSequenceState(state: KeyplaneSequenceState): void {
  state.nextStepIndex = 0;
  state.deadline = null;
}

export function hasActiveSequenceState(state: KeyplaneSequenceState): boolean {
  return state.nextStepIndex > 0;
}

export function hasSequenceTimedOut(
  state: KeyplaneSequenceState,
  now: number,
): boolean {
  return state.deadline !== null && now >= state.deadline;
}

export function startSequenceState(
  state: KeyplaneSequenceState,
  timeoutMs: number,
  now: number,
): void {
  state.nextStepIndex = 1;
  state.deadline = now + timeoutMs;
}

export function advanceSequenceState(
  state: KeyplaneSequenceState,
  timeoutMs: number,
  now: number,
): void {
  state.nextStepIndex += 1;
  state.deadline = now + timeoutMs;
}
