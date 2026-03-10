# Keyplane — Project Overview

## 1. Project identity

**Project name:** Keyplane

**Category:** Open-source browser library for keyboard shortcuts / hotkeys.

**Primary product thesis:** Keyplane provides **layout-independent key bindings** for web applications by treating **physical key identity** as a first-class concept instead of treating keyboard layout differences as an edge case.

## 2. Problem statement

Most browser hotkey libraries are easy to use, but they often blur two very different concepts:

- the **physical key** a user presses on the keyboard
- the **character/value** produced by that key on the current layout

Those are not the same thing.

This causes shortcuts to break or become inconsistent across layouts such as UK, US, French AZERTY, German QWERTZ, and others.

Keyplane exists to solve that problem explicitly and cleanly.

## 3. Core promise

Keyplane must let developers define shortcuts that remain stable across keyboard layouts when they want **layout-independent behavior**.

At the same time, Keyplane must still allow **layout-dependent / semantic behavior** when the application genuinely wants to bind to the produced character rather than the physical key.

## 4. Product positioning

### 4.1 Initial scope

Keyplane is positioned as a **browser-only core library first**.

Adapters for frameworks such as React, Vue, Svelte, or others may be added later, but they are **not part of the core identity** of the initial project.

### 4.2 Ecosystem strategy

The core must be designed so that adapters can be added later with minimal friction, but the first release must prioritize:

- correctness
- clarity
- deterministic matching rules
- a clean public API
- strong documentation around international keyboard layouts

## 5. Architectural direction

### 5.1 Primary matching model

Keyplane should use **physical key matching** as its primary model.

This means the library should be architected around a normalized binding representation that can express physical-key semantics explicitly.

### 5.2 Secondary matching model

Keyplane should also support **semantic / produced-key matching** as an explicit secondary mode.

This is not a fallback or accidental side effect.
It is a separate user intent and must be represented clearly in the API and in the documentation.

### 5.3 Separation of concerns

The architecture must keep these concerns separate:

- parsing user binding definitions
- normalization into canonical binding objects
- event matching
- scope/context filtering
- sequence/chord state management
- listener lifecycle and subscription management
- label/display helpers for UI

Matching correctness must not depend on display-label discovery.

## 6. Design principles

Keyplane should follow these principles:

1. **Correctness before convenience**
   - Layout-independent matching must be reliable.

2. **Clarity over magic**
   - Physical bindings and semantic bindings must not be silently conflated.

3. **Small but explicit API**
   - Avoid feature sprawl and overloaded behavior.

4. **Framework-agnostic core**
   - Core logic must not depend on React or other frameworks.

5. **Deterministic behavior**
   - Matching, sequences, scopes, and subscription lifecycle must have clearly defined rules.

6. **Documentation as part of the product**
   - The library must teach developers when to use physical bindings vs semantic bindings.

## 7. Proposed v1 feature envelope

### 7.1 Included in v1

- single-key bindings
- modifier combinations
- multi-step sequences
- scope/context support
- keydown / keyup mode selection
- bind / unbind lifecycle
- enable / disable behavior where appropriate
- input / textarea / contenteditable guards
- normalized modifier aliases
- clear public API for physical vs semantic binding intent
- helper utilities for rendering user-facing shortcut labels

### 7.2 Excluded from v1

- framework adapters
- Electron / native desktop integration
- mobile-first virtual keyboard strategy
- IME-heavy text composition semantics beyond safety guards
- mouse / pointer / gamepad shortcuts
- recording UI / shortcut editor UI in core

## 8. Public API direction

Keyplane should expose a public API that is ergonomic for developers migrating from existing hotkey libraries.

Recommended direction:

- accept a **developer-friendly string syntax** for common bindings
- normalize strings into a **canonical internal object model**
- use the canonical object model for parsing, matching, testing, and adapter integration

This preserves ergonomics while keeping the implementation precise.

## 9. Differentiation

Keyplane is not valuable merely because it supports keyboard shortcuts.
Its differentiation is that it treats **layout independence as the primary contract**.

That differentiation must be visible in:

- the API
- the terminology
- the documentation
- the test strategy
- the examples
- the migration story from existing libraries

## 10. Quality bar

Before the library is considered implementation-ready, the specification set must make the following unambiguous:

- what a binding means
- how physical and semantic modes differ
- how modifiers are normalized
- how sequences are tracked and reset
- how scopes are resolved
- when handlers fire
- how subscriptions are removed
- what is guaranteed across layouts
- what is intentionally left browser-dependent

## 11. Documentation and adoption strategy

To maximize adoption, Keyplane should launch with:

- a concise README
- a “why Keyplane exists” explanation
- documentation for `code` vs `key`
- migration guidance from hotkeys-js / Mousetrap / similar libraries
- examples using non-US layouts
- a small demo/playground showing layout-independent matching

## 12. Implementation philosophy

The project will be developed spec-first.

That means:

- overview first
- domain contracts second
- implementation prompts and staged execution later
- no implementation should proceed until the relevant contracts are explicit enough to remove ambiguity

## 13. Summary

Keyplane is a browser-first, framework-agnostic hotkeys library whose defining promise is **layout-independent shortcut correctness**.

Its architecture must explicitly distinguish:

- physical key intent
- semantic / produced-key intent
- matching behavior
- UI label rendering

That separation is the foundation of the project.