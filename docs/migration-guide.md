# Migration Guide

This guide is for developers coming from hotkeys-style libraries that mainly think in terms of one shortcut string model.

Keyplane differs in one important way: it makes you choose whether a binding is physical or semantic.

## The Main Migration Question

Ask this first:

- should the shortcut follow physical key position?
- or should it follow produced character meaning?

If the old binding relied on US-layout assumptions without saying so, that assumption needs to become explicit during migration.

## Translating Common Shortcut Styles

### Editor-Style Shortcuts

Bindings like save, comment, open palette, or navigation shortcuts usually want physical intent.

Typical migration:

```ts
// before
"ctrl+s"

// keyplane
"Control+KeyS"
```

```ts
// before
"ctrl+-"

// keyplane, physical punctuation
"Control+Minus"
```

## Character-Driven Shortcuts

If the app really wants the produced character, use semantic bindings.

```ts
// before
"/"

// keyplane
"key:/"
```

```ts
// before
"z"

// keyplane
"key:z"
```

## Physical And Semantic Are Not A Fallback Pair

These are different migrations:

- `KeyZ` for physical intent
- `key:z` for semantic intent

Do not migrate to one and assume it covers the other.

## Sequences

Keyplane supports ordered sequences:

```ts
"Control+KeyK then Control+KeyC"
```

Keyplane intentionally rejects exact-prefix overlaps like:

- `KeyG`
- `KeyG then KeyC`

That v1 tradeoff avoids delayed dispatch and ambiguous latency for the short binding.

## Scopes

Keyplane scopes are named eligibility gates.

```ts
manager.bind("KeyP", openPalette, { scope: "editor" });
manager.setScope("editor");
```

Global bindings use `scope: null` or omit `scope`.

## Formatting Does Not Define Matching

Some older shortcut code paths treat the displayed label as if it were the binding meaning. Keyplane does not.

Examples:

- physical `Minus` may format as `Minus` or, if optional layout discovery resolves, `-`
- semantic `key:-` always means the produced `-` character

UI labels are not matching semantics.

## Semantic Printable Edge Cases

Some semantic printable characters require object input in v1 because the string grammar reserves certain delimiters.

```ts
manager.bind({
  mode: "semantic",
  steps: [{ key: "+", modifiers: [] }],
}, handler);
```

## No Exact Parity Promise

Keyplane is migration-friendly, but it does not promise exact parity with libraries that:

- rely only on `event.key`
- blur physical and semantic meaning
- tolerate exact-prefix sequence conflicts through delayed dispatch

Those differences are intentional parts of the v1 contract.
