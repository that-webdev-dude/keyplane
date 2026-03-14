# Keyplane

Keyplane is a browser-first keyboard shortcut core for apps that need layout-independent correctness.

It treats three things as separate on purpose:

- physical bindings, matched by physical key identity like `KeyZ` or `Minus`
- semantic bindings, matched by produced key meaning like `key:z` or `key:-`
- formatting, used only to render labels for UI

If you need `KeyZ` to keep meaning "the physical `KeyboardEvent.code` identity" across QWERTZ, AZERTY, and US layouts, use a physical binding. If you need "the character the user actually produced", use a semantic binding.

## Why Keyplane Exists

Many shortcut libraries blur `event.code`, `event.key`, and UI labels into one idea. That works until keyboard layout differences stop being edge cases.

Keyplane exists to keep those concerns separate:

- matching can be layout-independent when you want it
- character-driven shortcuts stay explicitly semantic
- label rendering never changes what a binding means

## Installation

```bash
npm install keyplane
```

Keyplane ships ESM-first with first-party TypeScript types.

## First Use

String bindings default to physical mode.

```ts
import { createKeyplane, formatBinding } from "keyplane";

const manager = createKeyplane();

const save = manager.bind("Control+KeyS", ({ event }) => {
  event.preventDefault();
  console.log("Save by physical key position");
});

const findSlash = manager.bind("key:/", () => {
  console.log("Search by produced character");
});

console.log(formatBinding("Control+KeyS"));
console.log(formatBinding("key:/"));

save.dispose();
findSlash.dispose();
manager.destroy();
```

The two bindings above are visibly different:

- `Control+KeyS` is physical
- `key:/` is semantic

## Physical Vs Semantic

Use a physical binding when the shortcut should follow key position:

```ts
manager.bind("KeyZ", () => {
  console.log("Physical KeyZ identity");
});
```

Use a semantic binding when the shortcut should follow produced meaning:

```ts
manager.bind("key:z", () => {
  console.log("Produced lowercase z");
});
```

These are not interchangeable.

Another important contrast is punctuation:

```ts
manager.bind("Control+Minus", () => {
  console.log("Physical minus key position");
});

manager.bind("key:Control+-", () => {
  console.log("Produced Ctrl+- meaning");
});
```

`Control+Minus` and `key:Control+-` are different meanings.

## Sequences

```ts
manager.bind("Control+KeyK then Control+KeyC", () => {
  console.log("Comment selection");
});
```

Exact-prefix conflicts stay rejected in v1. A short binding like `KeyG` cannot coexist with `KeyG then KeyC` in the same matching domain.

## Scopes

```ts
const scoped = createKeyplane({ defaultScope: "editor" });

scoped.bind("KeyP", () => {
  console.log("Runs only in the editor scope");
}, { scope: "editor" });

scoped.setScope("palette");
```

Keyplane v1 supports one active named scope per manager.

## Editable Contexts

Bindings are blocked in editable targets by default:

- `input`
- `textarea`
- `contenteditable`

Opt in when needed:

```ts
manager.bind("KeyB", () => {
  console.log("Allowed inside editors");
}, { allowInEditable: true });
```

You can also set the manager default with `createKeyplane({ allowInEditable: true })`.

## Formatting

`formatBinding` is display-only. It never changes normalized binding meaning or matching behavior.

```ts
formatBinding("Minus");
formatBinding("Minus", { style: "canonical" });
formatBinding("Control+KeyK then Control+KeyC", { sequenceJoiner: "->" });
```

Notes:

- default formatting may use optional layout-aware display labels when the browser exposes them
- canonical formatting stays deterministic for debugging and docs
- physical fallback labels like `Minus` are not semantic glyphs

## Semantic Printable Notes

Semantic printable bindings describe the actual produced character plus the exact modifier set.

Examples:

- `key:Shift+?` means the produced `?` character with `Shift`
- `key:Control+-` means the produced `-` character with `Control`

Some semantic printable characters collide with v1 string syntax and require object input:

```ts
manager.bind({
  mode: "semantic",
  steps: [{ key: "+", modifiers: [] }],
}, () => {
  console.log("Literal plus character");
});
```

## API Surface

Top-level exports:

- `createKeyplane`
- `normalizeBinding`
- `isSameBinding`
- `formatBinding`

Manager methods:

- `bind`
- `setScope`
- `getScope`
- `enable`
- `disable`
- `isEnabled`
- `destroy`

## Docs

- [Getting started](./docs/getting-started.md)
- [Binding model explainer](./docs/binding-model.md)
- [API reference](./docs/api-reference.md)
- [Migration guide](./docs/migration-guide.md)
- [FAQ](./docs/faq.md)
- [Browser demo example](./examples/browser-core-demo/README.md)

## Migration

If you are coming from Mousetrap, hotkeys-js, or a similar library, start with the [migration guide](./docs/migration-guide.md).
