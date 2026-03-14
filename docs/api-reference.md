# API Reference

## Top-Level Exports

```ts
import {
  createKeyplane,
  formatBinding,
  isSameBinding,
  normalizeBinding,
} from "keyplane";
```

## `createKeyplane(config?)`

Creates a manager instance.

```ts
const manager = createKeyplane();
```

`config`:

- `target?: Document | Window | HTMLElement`
  Default: `document`
- `defaultScope?: string | null`
  Default: `null`
- `defaultEventType?: "keydown" | "keyup"`
  Default: `"keydown"`
- `enabled?: boolean`
  Default: `true`
- `sequenceTimeoutMs?: number`
  Default: `1000`
- `allowInEditable?: boolean`
  Default: `false`

## `manager.bind(binding, handler, options?)`

Registers one binding-handler pair and returns a subscription handle.

```ts
const subscription = manager.bind("Control+KeyS", ({ event, binding, scope, manager }) => {
  event.preventDefault();
});
```

`binding` accepts:

- a string binding
- an object binding

`options`:

- `scope?: string | null`
  Default: `null`
- `eventType?: "keydown" | "keyup"`
  Default: manager `defaultEventType`
- `preventDefault?: boolean`
  Default: `false`
- `stopPropagation?: boolean`
  Default: `false`
- `allowRepeat?: boolean`
  Default: `false`
- `allowInEditable?: boolean`
  Default: manager `allowInEditable`
- `sequenceTimeoutMs?: number`
  Default: manager `sequenceTimeoutMs`
- `enabled?: boolean`
  Default: `true`

Notes:

- string bindings default to physical mode
- `key:` selects semantic mode
- exact-prefix conflicts are rejected during registration in the same event type, scope, and matching mode

## Subscription Handle

Returned from `bind(...)`.

```ts
subscription.dispose();
subscription.disable();
subscription.enable();
subscription.isEnabled();
subscription.binding;
```

Behavior:

- `dispose()` unregisters exactly that binding-handler pair
- repeated `dispose()` is safe
- `binding` is the normalized binding meaning

## Manager Methods

### `setScope(scope)`

Sets the active named scope or clears it with `null`.

```ts
manager.setScope("editor");
manager.setScope(null);
```

Changing scope clears in-progress sequence state.

### `getScope()`

Returns the current active scope.

### `enable()` / `disable()` / `isEnabled()`

Controls manager-level activation without deleting registrations.

Disabling also clears in-progress sequence state.

### `destroy()`

Permanently tears down the manager.

After `destroy()`:

- listeners are detached
- registrations become inactive
- sequence state is cleared
- `bind(...)` fails deterministically

## `normalizeBinding(binding)`

Normalizes a string or object binding into canonical meaning.

```ts
normalizeBinding("Control+KeyS");
normalizeBinding("key:/");
normalizeBinding({
  mode: "semantic",
  steps: [{ key: "+", modifiers: [] }],
});
```

Use this when you need canonical comparison or adapter-side integration.

## `isSameBinding(left, right)`

Compares normalized binding meaning.

```ts
isSameBinding("Control+KeyS", {
  mode: "physical",
  steps: [{ key: "KeyS", modifiers: ["Control"] }],
});
```

Physical and semantic bindings are not equal just because their labels look similar.

## `formatBinding(binding, options?)`

Formats a binding for UI display.

```ts
formatBinding("Control+KeyS");
formatBinding("Minus");
formatBinding("Control+KeyK then Control+KeyC", { sequenceJoiner: "->" });
formatBinding("Minus", { style: "canonical" });
```

`options`:

- `preferLayout?: boolean`
  Default: `true`
- `style?: "default" | "canonical"`
  Default: `"default"`
- `sequenceJoiner?: string`
  Default: `"then"`

Formatting is display-only. It does not affect matching, normalization, scope rules, or lifecycle.
