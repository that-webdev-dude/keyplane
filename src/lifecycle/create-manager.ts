import { normalizeBindingInput } from "../binding/normalize";
import { LIFECYCLE_ERROR_CODES, createLifecycleError } from "../errors/lifecycle-error";
import { REGISTER_ERROR_CODES, createRegisterError } from "../errors/register-error";
import { normalizeKeyboardEvent, type KeyplaneNormalizedEventView } from "../matching/normalize-event";
import { isEditableEventTarget, isEventWithinTargetBoundary } from "../platform/event-context";
import { resolveManagerTarget, type KeyplaneRuntimeTarget } from "../platform/validate-target";
import {
  DEFAULT_SEQUENCE_TIMEOUT_MS,
  advanceSequenceState,
  createSequenceState,
  hasActiveSequenceState,
  hasSequenceTimedOut,
  resetSequenceState,
  startSequenceState,
  type KeyplaneSequenceState,
} from "../sequence/state";
import type {
  KeyplaneEventType,
  KeyplaneHandler,
  KeyplaneManager,
  KeyplaneManagerConfig,
  KeyplaneNormalizedBinding,
  KeyplaneNormalizedStep,
  KeyplaneSubscription,
} from "../types/public";

type PhaseListenerState = Record<KeyplaneEventType, boolean>;
type PhaseCountState = Record<KeyplaneEventType, number>;
type PhaseHandlers = Record<KeyplaneEventType, EventListener>;

interface KeyplaneRegistration {
  id: number;
  binding: KeyplaneNormalizedBinding;
  eventType: KeyplaneEventType;
  handler: KeyplaneHandler;
  scope: string | null;
  preventDefault: boolean;
  stopPropagation: boolean;
  allowRepeat: boolean;
  allowInEditable: boolean;
  sequenceTimeoutMs: number;
  enabled: boolean;
  disposed: boolean;
  sequenceState: KeyplaneSequenceState;
}

interface KeyplaneManagerState {
  destroyed: boolean;
  enabled: boolean;
  scope: string | null;
  defaultEventType: KeyplaneEventType;
  defaultSequenceTimeoutMs: number;
  allowInEditable: boolean;
  target: KeyplaneRuntimeTarget;
  nextRegistrationId: number;
  registrations: Map<number, KeyplaneRegistration>;
  phaseCounts: PhaseCountState;
  phaseListenersAttached: PhaseListenerState;
  phaseHandlers: PhaseHandlers;
}

export function createManager(config?: KeyplaneManagerConfig): KeyplaneManager {
  const target = resolveManagerTarget(config);
  let manager!: KeyplaneManager;
  const state: KeyplaneManagerState = {
    destroyed: false,
    enabled: config?.enabled !== false,
    scope: normalizeScopeValue(config?.defaultScope, "defaultScope"),
    defaultEventType: normalizeEventTypeValue(
      config?.defaultEventType,
      "defaultEventType",
    ),
    defaultSequenceTimeoutMs:
      config?.sequenceTimeoutMs ?? DEFAULT_SEQUENCE_TIMEOUT_MS,
    allowInEditable: config?.allowInEditable === true,
    target,
    nextRegistrationId: 1,
    registrations: new Map(),
    phaseCounts: {
      keydown: 0,
      keyup: 0,
    },
    phaseListenersAttached: {
      keydown: false,
      keyup: false,
    },
    phaseHandlers: {
      keydown: createPhaseListener("keydown", () => state, () => manager),
      keyup: createPhaseListener("keyup", () => state, () => manager),
    },
  };

  manager = {
    bind(binding, handler, options) {
      assertManagerUsable(state, "bind");

      const normalizedBinding = normalizeBindingInput(binding);
      const eventType = normalizeEventTypeValue(
        options?.eventType ?? state.defaultEventType,
        "bind options eventType",
      );
      const scope = normalizeScopeValue(options?.scope, "bind options scope");

      assertNoExactPrefixConflict(state, normalizedBinding, eventType, scope);
      ensurePhaseListenerAvailable(state, eventType);

      const registration: KeyplaneRegistration = {
        id: state.nextRegistrationId,
        binding: freezeBinding(normalizedBinding),
        eventType,
        handler,
        scope,
        preventDefault: options?.preventDefault === true,
        stopPropagation: options?.stopPropagation === true,
        allowRepeat: options?.allowRepeat === true,
        allowInEditable: options?.allowInEditable ?? state.allowInEditable,
        sequenceTimeoutMs:
          options?.sequenceTimeoutMs ?? state.defaultSequenceTimeoutMs,
        enabled: options?.enabled !== false,
        disposed: false,
        sequenceState: createSequenceState(),
      };

      state.nextRegistrationId += 1;
      state.registrations.set(registration.id, registration);
      state.phaseCounts[registration.eventType] += 1;

      return createSubscription(state, registration);
    },
    setScope(scope) {
      assertManagerUsable(state, "setScope");
      const nextScope = normalizeScopeValue(scope, "scope");

      if (state.scope !== nextScope) {
        resetAllSequenceState(state);
        state.scope = nextScope;
      }
    },
    getScope() {
      return state.scope;
    },
    enable() {
      assertManagerUsable(state, "enable");
      state.enabled = true;
    },
    disable() {
      assertManagerUsable(state, "disable");
      state.enabled = false;
      resetAllSequenceState(state);
    },
    isEnabled() {
      return !state.destroyed && state.enabled;
    },
    destroy() {
      if (state.destroyed) {
        return;
      }

      state.destroyed = true;
      state.enabled = false;

      for (const registration of state.registrations.values()) {
        registration.disposed = true;
        registration.enabled = false;
        resetSequenceState(registration.sequenceState);
      }

      state.registrations.clear();
      detachPhaseListener(state, "keydown");
      detachPhaseListener(state, "keyup");
      state.phaseCounts.keydown = 0;
      state.phaseCounts.keyup = 0;
    },
  };

  return manager;
}

function createSubscription(
  state: KeyplaneManagerState,
  registration: KeyplaneRegistration,
): KeyplaneSubscription {
  return {
    get binding() {
      return registration.binding;
    },
    dispose() {
      if (registration.disposed) {
        return;
      }

      registration.disposed = true;
      registration.enabled = false;
      resetSequenceState(registration.sequenceState);

      if (state.destroyed) {
        return;
      }

      state.registrations.delete(registration.id);
      detachPhaseListenerIfUnused(state, registration.eventType);
    },
    enable() {
      if (state.destroyed || registration.disposed) {
        return;
      }

      registration.enabled = true;
    },
    disable() {
      if (state.destroyed || registration.disposed) {
        return;
      }

      registration.enabled = false;
      resetSequenceState(registration.sequenceState);
    },
    isEnabled() {
      return !state.destroyed && !registration.disposed && registration.enabled;
    },
  };
}

function createPhaseListener(
  eventType: KeyplaneEventType,
  getState: () => KeyplaneManagerState,
  getManager: () => KeyplaneManager,
): EventListener {
  return (event) => {
    const state = getState();

    if (state.destroyed || !state.enabled) {
      return;
    }

    const normalizedEvent = normalizeKeyboardEvent(event);
    const eventTarget = normalizedEvent.event.target;

    if (normalizedEvent.view.eventType !== eventType) {
      return;
    }

    if (
      normalizedEvent.view.composing ||
      normalizedEvent.view.deadKey ||
      !isEventWithinTargetBoundary(state.target, eventTarget)
    ) {
      return;
    }

    const registrations = [...state.registrations.values()];
    const now = Date.now();

    for (const registration of registrations) {
      if (!isRegistrationEventEligible(registration, state, normalizedEvent.view, eventTarget)) {
        continue;
      }

      if (registration.binding.steps.length === 1) {
        if (!stepMatchesEvent(registration.binding, registration.binding.steps[0], normalizedEvent.view)) {
          continue;
        }

        invokeRegistrationHandler(registration, normalizedEvent.event, state.scope, getManager());
        continue;
      }

      processSequenceRegistration(
        registration,
        normalizedEvent.event,
        normalizedEvent.view,
        state.scope,
        now,
        getManager(),
      );
    }
  };
}

function ensurePhaseListenerAvailable(
  state: KeyplaneManagerState,
  eventType: KeyplaneEventType,
): void {
  if (state.phaseListenersAttached[eventType]) {
    return;
  }

  state.target.addEventListener(eventType, state.phaseHandlers[eventType], false);
  state.phaseListenersAttached[eventType] = true;
}

function detachPhaseListenerIfUnused(
  state: KeyplaneManagerState,
  eventType: KeyplaneEventType,
): void {
  state.phaseCounts[eventType] = Math.max(0, state.phaseCounts[eventType] - 1);

  if (state.phaseCounts[eventType] > 0) {
    return;
  }

  detachPhaseListener(state, eventType);
}

function detachPhaseListener(
  state: KeyplaneManagerState,
  eventType: KeyplaneEventType,
): void {
  if (!state.phaseListenersAttached[eventType]) {
    return;
  }

  state.target.removeEventListener(eventType, state.phaseHandlers[eventType], false);
  state.phaseListenersAttached[eventType] = false;
}

function resetAllSequenceState(state: KeyplaneManagerState): void {
  for (const registration of state.registrations.values()) {
    resetSequenceState(registration.sequenceState);
  }
}

function assertManagerUsable(
  state: KeyplaneManagerState,
  operation: "bind" | "setScope" | "enable" | "disable",
): void {
  if (!state.destroyed) {
    return;
  }

  throw createLifecycleError(
    LIFECYCLE_ERROR_CODES.MANAGER_DESTROYED,
    `Cannot ${operation} on a destroyed Keyplane manager.`,
  );
}

function assertNoExactPrefixConflict(
  state: KeyplaneManagerState,
  binding: KeyplaneNormalizedBinding,
  eventType: KeyplaneEventType,
  scope: string | null,
): void {
  for (const existing of state.registrations.values()) {
    if (existing.disposed) {
      continue;
    }

    if (existing.eventType !== eventType) {
      continue;
    }

    if (existing.scope !== scope) {
      continue;
    }

    if (existing.binding.mode !== binding.mode) {
      continue;
    }

    if (!bindingsHaveExactPrefixConflict(existing.binding, binding)) {
      continue;
    }

    throw createRegisterError(
      REGISTER_ERROR_CODES.PREFIX_CONFLICT,
      "Binding conflicts with an existing exact-prefix sequence in the same matching domain.",
      {
        eventType,
        scope,
      },
    );
  }
}

function bindingsHaveExactPrefixConflict(
  left: KeyplaneNormalizedBinding,
  right: KeyplaneNormalizedBinding,
): boolean {
  if (left.steps.length === right.steps.length) {
    return false;
  }

  const shorter = left.steps.length < right.steps.length ? left.steps : right.steps;
  const longer = left.steps.length < right.steps.length ? right.steps : left.steps;

  for (let index = 0; index < shorter.length; index += 1) {
    if (!areStepsEqual(shorter[index], longer[index])) {
      return false;
    }
  }

  return true;
}

function areStepsEqual(
  left: KeyplaneNormalizedStep,
  right: KeyplaneNormalizedStep,
): boolean {
  if (left.key !== right.key) {
    return false;
  }

  if (left.modifiers.length !== right.modifiers.length) {
    return false;
  }

  for (let index = 0; index < left.modifiers.length; index += 1) {
    if (left.modifiers[index] !== right.modifiers[index]) {
      return false;
    }
  }

  return true;
}

function freezeBinding(
  binding: KeyplaneNormalizedBinding,
): KeyplaneNormalizedBinding {
  return Object.freeze({
    mode: binding.mode,
    steps: Object.freeze(
      binding.steps.map((step) =>
        Object.freeze({
          key: step.key,
          modifiers: Object.freeze([...step.modifiers]),
        }),
      ),
    ),
  });
}

function isRegistrationEventEligible(
  registration: KeyplaneRegistration,
  state: KeyplaneManagerState,
  event: KeyplaneNormalizedEventView,
  eventTarget: EventTarget | null,
): boolean {
  if (
    registration.disposed ||
    !registration.enabled ||
    registration.eventType !== event.eventType
  ) {
    return false;
  }

  if (!isScopeEligible(registration.scope, state.scope)) {
    return false;
  }

  if (!registration.allowInEditable && isEditableEventTarget(eventTarget)) {
    return false;
  }

  if (!registration.allowRepeat && event.repeat) {
    return false;
  }

  return true;
}

function processSequenceRegistration(
  registration: KeyplaneRegistration,
  event: KeyboardEvent,
  eventView: KeyplaneNormalizedEventView,
  activeScope: string | null,
  now: number,
  manager: KeyplaneManager,
): void {
  if (hasSequenceTimedOut(registration.sequenceState, now)) {
    resetSequenceState(registration.sequenceState);
  }

  if (hasActiveSequenceState(registration.sequenceState)) {
    const nextStep = registration.binding.steps[registration.sequenceState.nextStepIndex];

    if (stepMatchesEvent(registration.binding, nextStep, eventView)) {
      const finalStepIndex = registration.binding.steps.length - 1;

      if (registration.sequenceState.nextStepIndex === finalStepIndex) {
        resetSequenceState(registration.sequenceState);
        invokeRegistrationHandler(registration, event, activeScope, manager);
        return;
      }

      advanceSequenceState(registration.sequenceState, registration.sequenceTimeoutMs, now);
      return;
    }

    resetSequenceState(registration.sequenceState);
  }

  if (!stepMatchesEvent(registration.binding, registration.binding.steps[0], eventView)) {
    return;
  }

  startSequenceState(registration.sequenceState, registration.sequenceTimeoutMs, now);
}

function invokeRegistrationHandler(
  registration: KeyplaneRegistration,
  event: KeyboardEvent,
  activeScope: string | null,
  manager: KeyplaneManager,
): void {
  if (registration.preventDefault) {
    event.preventDefault();
  }

  if (registration.stopPropagation) {
    event.stopPropagation();
  }

  registration.handler({
    event,
    binding: registration.binding,
    scope: activeScope,
    manager,
  });
}

function stepMatchesEvent(
  binding: KeyplaneNormalizedBinding,
  step: KeyplaneNormalizedStep,
  event: KeyplaneNormalizedEventView,
): boolean {
  const primaryKey =
    binding.mode === "physical" ? event.physicalKey : event.semanticKey;

  return primaryKey === step.key && modifiersMatch(step.modifiers, event.modifiers);
}

function isScopeEligible(
  bindingScope: string | null,
  activeScope: string | null,
): boolean {
  return bindingScope === null || bindingScope === activeScope;
}

function modifiersMatch(
  expected: readonly string[],
  actual: readonly string[],
): boolean {
  if (expected.length !== actual.length) {
    return false;
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (expected[index] !== actual[index]) {
      return false;
    }
  }

  return true;
}

function normalizeScopeValue(
  scope: string | null | undefined,
  source: string,
): string | null {
  if (scope === undefined || scope === null) {
    return null;
  }

  if (typeof scope === "string") {
    return scope;
  }

  throw createLifecycleError(
    LIFECYCLE_ERROR_CODES.INVALID_STATE,
    `${source} must be a string or null.`,
  );
}

function normalizeEventTypeValue(
  eventType: KeyplaneEventType | undefined,
  source: string,
): KeyplaneEventType {
  if (eventType === undefined || eventType === "keydown" || eventType === "keyup") {
    return eventType ?? "keydown";
  }

  throw createLifecycleError(
    LIFECYCLE_ERROR_CODES.INVALID_STATE,
    `${source} must be 'keydown' or 'keyup'.`,
  );
}
