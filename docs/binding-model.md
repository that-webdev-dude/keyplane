# Binding Model

Keyplane has two matching modes and one display layer.

- physical binding: matched by physical key identity
- semantic binding: matched by produced key meaning
- formatting: display only

Keeping those separate is the core design rule.

## Physical Bindings

Physical bindings match `KeyboardEvent.code` meaning.

Examples:

- `KeyS`
- `Control+KeyS`
- `Minus`
- `Control+Minus`

Physical punctuation uses code names like `Minus`, `Equal`, and `Slash`. That is deliberate. A physical punctuation binding names the physical key, not the glyph a layout might print on it.

## Semantic Bindings

Semantic bindings match produced meaning.

Examples:

- `key:s`
- `key:/`
- `key:Control+-`
- `key:Shift+?`

Semantic printable bindings describe the actual produced character plus the exact modifier set. `key:Shift+?` means the produced `?` character with `Shift`, not a base `?` glyph chosen before modifiers are considered.

## `KeyS` Vs `key:s`

These are different ideas:

- `KeyS` means the physical S key position
- `key:s` means the produced lowercase `s` character

That difference matters across layouts. A physical binding can stay stable while the produced character changes.

## `Control+Minus` Vs `key:Control+-`

These are also different ideas:

- `Control+Minus` means the physical minus-key position with `Control`
- `key:Control+-` means the produced `-` character with `Control`

Do not treat them as interchangeable.

## Why Physical Punctuation Uses Names

Physical punctuation bindings use names like `Minus` because a physical binding should not pretend it knows the user-facing glyph on every layout.

This is correct:

```ts
normalizeBinding("Minus");
```

This is semantic instead:

```ts
normalizeBinding("key:-");
```

## Display Formatting Is Separate

Formatting is not matching.

```ts
formatBinding("Minus");
formatBinding("Minus", { style: "canonical" });
```

The default label may later become `-` if optional browser layout discovery is available. The binding still means physical `Minus`.

## When To Choose Physical

Choose physical bindings when:

- the shortcut should follow key position
- layout-independent behavior is the goal
- you are matching editor-style shortcuts or muscle-memory actions

## When To Choose Semantic

Choose semantic bindings when:

- the shortcut should follow produced character meaning
- the app genuinely cares about text-like intent
- punctuation or printable characters must track what the user actually typed

## Semantic Printable Characters That Need Object Input

Some semantic printable characters collide with v1 string grammar and must use object input.

Literal `+` is the clearest example:

```ts
normalizeBinding({
  mode: "semantic",
  steps: [{ key: "+", modifiers: [] }],
});
```

That is a grammar limit in v1, not a signal that semantic punctuation is unsupported.
