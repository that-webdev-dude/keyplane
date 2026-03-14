# FAQ

## Why Not Just Use `event.key`?

Because `event.key` tells you produced meaning, not physical key identity. That is correct for semantic bindings and wrong for layout-independent physical shortcuts.

## Why Does Keyplane Use Names Like `Minus` For Physical Punctuation?

Because physical punctuation bindings describe the physical key, not the glyph a layout may print on that key.

## When Should I Use Physical Vs Semantic Bindings?

Use physical bindings for layout-independent muscle-memory shortcuts. Use semantic bindings when the actual produced character is the intent.

## Why Does Formatting Sometimes Show `Minus` Instead Of `-`?

Because formatting keeps physical fallback labels honest. `Minus` is a safe physical label when no reliable layout-aware display label is available.

## Why Are `KeyZ` And `key:z` Different?

`KeyZ` is matched by physical position. `key:z` is matched by produced character meaning. They can diverge across layouts.

## Why Is A Short Binding Not Allowed To Conflict With A Longer Exact-Prefix Sequence?

Keyplane v1 rejects exact-prefix overlaps deliberately so short bindings do not require delayed dispatch. That avoids ambiguous latency and keeps matching deterministic.

## Why Do Some Semantic Printable Keys Require Object Input In v1?

Some printable characters collide with reserved string syntax. When that happens, object input preserves exact meaning without broadening the grammar.
