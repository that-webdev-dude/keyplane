import { normalizeBindingInput } from "../binding/normalize";
import { LIFECYCLE_ERROR_CODES, createLifecycleError } from "../errors/lifecycle-error";
import { REGISTER_ERROR_CODES, createRegisterError } from "../errors/register-error";
import { resolveManagerTarget, type KeyplaneRuntimeTarget } from "../platform/validate-target";
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
  enabled: boolean;
  disposed: boolean;
}

interface KeyplaneManagerState {
  destroyed: boolean;
  enabled: boolean;
  scope: string | null;
  defaultEventType: KeyplaneEventType;
  target: KeyplaneRuntimeTarget;
  nextRegistrationId: number;
  registrations: Map<number, KeyplaneRegistration>;
  phaseCounts: PhaseCountState;
  phaseListenersAttached: PhaseListenerState;
  phaseHandlers: PhaseHandlers;
}

export function createManager(config?: KeyplaneManagerConfig): KeyplaneManager {
  const target = resolveManagerTarget(config);
  const state: KeyplaneManagerState = {
    destroyed: false,
    enabled: config?.enabled !== false,
    scope: normalizeScopeValue(config?.defaultScope, "defaultScope"),
    defaultEventType: normalizeEventTypeValue(
      config?.defaultEventType,
      "defaultEventType",
    ),
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
      keydown: createPhaseListener("keydown", () => state),
      keyup: createPhaseListener("keyup", () => state),
    },
  };

  const manager: KeyplaneManager = {
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
        enabled: options?.enabled !== false,
        disposed: false,
      };

      state.nextRegistrationId += 1;
      state.registrations.set(registration.id, registration);
      state.phaseCounts[registration.eventType] += 1;

      return createSubscription(state, registration);
    },
    setScope(scope) {
      assertManagerUsable(state, "setScope");
      state.scope = normalizeScopeValue(scope, "scope");
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
    },
    isEnabled() {
      return !state.destroyed && !registration.disposed && registration.enabled;
    },
  };
}

function createPhaseListener(
  _eventType: KeyplaneEventType,
  getState: () => KeyplaneManagerState,
): EventListener {
  return (_event) => {
    const state = getState();

    if (state.destroyed || !state.enabled) {
      return;
    }

    // Phase 4 owns listener lifecycle only. Matching is implemented later.
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
