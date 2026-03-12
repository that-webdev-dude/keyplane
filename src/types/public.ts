export type KeyplaneBindingMode = "physical" | "semantic";

export type KeyplaneModifier =
  | "Control"
  | "Alt"
  | "Shift"
  | "Meta"
  | "AltGraph";

export type KeyplaneEventType = "keydown" | "keyup";

export interface KeyplaneBindingStep {
  key: string;
  modifiers?: readonly KeyplaneModifier[];
}

export interface KeyplaneBindingObject {
  mode: KeyplaneBindingMode;
  steps: readonly KeyplaneBindingStep[];
}

export interface KeyplaneNormalizedStep {
  key: string;
  modifiers: readonly KeyplaneModifier[];
}

export interface KeyplaneNormalizedBinding {
  mode: KeyplaneBindingMode;
  steps: readonly KeyplaneNormalizedStep[];
}

export type KeyplaneBindingInput = string | KeyplaneBindingObject;

export type KeyplaneBindingSource =
  | KeyplaneBindingInput
  | KeyplaneNormalizedBinding;

export interface KeyplaneFormatOptions {
  preferLayout?: boolean;
  style?: "default" | "canonical";
  sequenceJoiner?: string;
}

export interface KeyplaneManagerConfig {
  target?: Document | Window | HTMLElement;
  defaultScope?: string | null;
  defaultEventType?: KeyplaneEventType;
  enabled?: boolean;
  sequenceTimeoutMs?: number;
  allowInEditable?: boolean;
}

export interface KeyplaneBindOptions {
  scope?: string | null;
  eventType?: KeyplaneEventType;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  allowRepeat?: boolean;
  allowInEditable?: boolean;
  sequenceTimeoutMs?: number;
  enabled?: boolean;
}

export interface KeyplaneManager {
  bind(
    binding: KeyplaneBindingInput,
    handler: KeyplaneHandler,
    options?: KeyplaneBindOptions,
  ): KeyplaneSubscription;
  setScope(scope: string | null): void;
  getScope(): string | null;
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
  destroy(): void;
}

export interface KeyplaneHandlerContext {
  event: KeyboardEvent;
  binding: KeyplaneNormalizedBinding;
  scope: string | null;
  manager: KeyplaneManager;
}

export type KeyplaneHandler = (context: KeyplaneHandlerContext) => void;

export interface KeyplaneSubscription {
  readonly binding: KeyplaneNormalizedBinding;
  dispose(): void;
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
}
