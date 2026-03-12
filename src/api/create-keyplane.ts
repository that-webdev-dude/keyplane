import { throwPhase1ShellError } from "./shared";
import type {
  KeyplaneBindingInput,
  KeyplaneBindOptions,
  KeyplaneHandler,
  KeyplaneManager,
  KeyplaneManagerConfig,
  KeyplaneSubscription,
} from "../types/public";

function createSubscriptionShell(): KeyplaneSubscription {
  return {
    get binding() {
      return throwPhase1ShellError();
    },
    dispose: throwPhase1ShellError,
    enable: throwPhase1ShellError,
    disable: throwPhase1ShellError,
    isEnabled: throwPhase1ShellError,
  };
}

export function createKeyplane(_config?: KeyplaneManagerConfig): KeyplaneManager {
  return {
    bind(
      _binding: KeyplaneBindingInput,
      _handler: KeyplaneHandler,
      _options?: KeyplaneBindOptions,
    ): KeyplaneSubscription {
      return createSubscriptionShell();
    },
    setScope(_scope: string | null): void {
      throwPhase1ShellError();
    },
    getScope(): string | null {
      return throwPhase1ShellError();
    },
    enable(): void {
      throwPhase1ShellError();
    },
    disable(): void {
      throwPhase1ShellError();
    },
    isEnabled(): boolean {
      return throwPhase1ShellError();
    },
    destroy(): void {
      throwPhase1ShellError();
    },
  };
}
