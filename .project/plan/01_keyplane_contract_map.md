# Keyplane — Contract Map

## 1. Purpose of this document

This file defines the proposed source-of-truth specification set for Keyplane.

The objective is to break the project into a small number of logically ordered contract files that:

- are easy to review
- remove ambiguity before implementation
- support staged execution later
- can be expanded safely without collapsing into one giant spec file

## 2. Authoring order

The files should be authored in this order because each later file depends on decisions made earlier.

### Batch 1 — Foundation

1. `00_keyplane_project_overview.md`
2. `01_keyplane_contract_map.md`

### Batch 2 — Core semantics

3. `02_keyplane_public_api_contract.md`
4. `03_keyplane_binding_model_contract.md`
5. `04_keyplane_parsing_and_normalization_contract.md`

### Batch 3 — Runtime behavior

6. `05_keyplane_event_matching_contract.md`
7. `06_keyplane_sequence_and_chord_state_contract.md`
8. `07_keyplane_scope_and_context_contract.md`
9. `08_keyplane_subscription_lifecycle_contract.md`

### Batch 4 — Platform boundaries and UX support

10. `09_keyplane_browser_platform_contract.md`
11. `10_keyplane_label_rendering_contract.md`
12. `11_keyplane_errors_warnings_and_debug_contract.md`

### Batch 5 — Quality and delivery

13. `12_keyplane_test_strategy_contract.md`
14. `13_keyplane_docs_and_examples_contract.md`
15. `14_keyplane_packaging_and_distribution_contract.md`

### Batch 6 — Execution support

16. `15_keyplane_implementation_staging_plan.md`
17. `16_keyplane_codex_execution_prompts.md`

## 3. File-by-file scope

## 3.1 `02_keyplane_public_api_contract.md`

Defines:

- top-level public API surface
- binding registration API
- bind/unbind/subscription contracts
- string form vs object form inputs
- return types and lifecycle expectations
- default options and opt-in behaviors

This file must answer: **what developers call**.

## 3.2 `03_keyplane_binding_model_contract.md`

Defines the canonical binding model.

Must cover:

- physical bindings
- semantic bindings
- modifier representation
- single bindings vs combos vs sequences
- canonical normalized shape
- equality rules

This file must answer: **what a binding means**.

## 3.3 `04_keyplane_parsing_and_normalization_contract.md`

Defines:

- parsing rules for string syntax
- aliases
- reserved tokens
- normalization rules
- invalid syntax handling
- ambiguity policy

This file must answer: **how loose user input becomes strict internal data**.

## 3.4 `05_keyplane_event_matching_contract.md`

Defines:

- how events are evaluated against bindings
- physical vs semantic matching paths
- modifier matching rules
- repeated key behavior
- default event-phase expectations where relevant
- keydown vs keyup semantics

This file must answer: **when a handler matches**.

## 3.5 `06_keyplane_sequence_and_chord_state_contract.md`

Defines:

- sequence progression rules
- timeout/reset rules
- incorrect-key interruption behavior
- overlap handling between bindings
- deterministic state transitions

This file must answer: **how multi-step bindings behave over time**.

## 3.6 `07_keyplane_scope_and_context_contract.md`

Defines:

- scope model
- active scope rules
- nested or multiple scopes if supported
- element/context filtering
- focused-input exclusion rules

This file must answer: **where a binding is allowed to fire**.

## 3.7 `08_keyplane_subscription_lifecycle_contract.md`

Defines:

- registration lifecycle
- listener attachment/detachment rules
- unbind/dispose semantics
- idempotency expectations
- global instance vs scoped manager strategy

This file must answer: **how runtime resources are managed**.

## 3.8 `09_keyplane_browser_platform_contract.md`

Defines browser-facing boundaries.

Must cover:

- required browser APIs
- optional browser APIs
- support floor
- behavior when APIs are missing
- secure-context-only dependencies if any
- SSR/non-browser boundaries

This file must answer: **what the platform is expected to provide**.

## 3.9 `10_keyplane_label_rendering_contract.md`

Defines:

- how binding labels are generated for UI
- relationship between matching and display
- use of browser layout lookup when available
- fallback policy when unavailable
- platform-specific label conventions where supported

This file must answer: **how the shortcut is shown to the user**.

## 3.10 `11_keyplane_errors_warnings_and_debug_contract.md`

Defines:

- parse errors
- invalid configuration reporting
- dev warnings
- debug hooks or diagnostics if included
- production behavior expectations

This file must answer: **how misuse is surfaced**.

## 3.11 `12_keyplane_test_strategy_contract.md`

Defines:

- unit test domains
- integration test domains
- browser matrix expectations
- layout-oriented test coverage
- sequence/scope/lifecycle test requirements
- regression strategy

This file must answer: **how correctness is proven**.

## 3.12 `13_keyplane_docs_and_examples_contract.md`

Defines:

- README scope
- example app requirements
- migration-guide requirements
- terminology rules
- required docs pages

This file must answer: **how the project is explained**.

## 3.13 `14_keyplane_packaging_and_distribution_contract.md`

Defines:

- package format targets
- ESM/CJS policy
- types distribution
- export map strategy
- dependency policy
- release/versioning expectations

This file must answer: **how the library ships**.

## 3.14 `15_keyplane_implementation_staging_plan.md`

Defines the execution sequence used later during implementation.

Must include:

- implementation phases
- file groups per phase
- acceptance criteria per phase
- phase dependencies
- non-goals per phase

This file must answer: **in what order the code should be built**.

## 3.15 `16_keyplane_codex_execution_prompts.md`

Defines the execution prompts/templates used later for Codex or similar assisted implementation.

Must include:

- implementation prompt template
- patch prompt template
- review/validation prompt template
- phase handoff rules

This file must answer: **how assisted implementation work is driven safely**.

## 4. Minimal next batch

The minimum next batch required before implementation discussion should be:

1. `02_keyplane_public_api_contract.md`
2. `03_keyplane_binding_model_contract.md`
3. `04_keyplane_parsing_and_normalization_contract.md`

These three files will remove the biggest ambiguities early.

## 5. Contract-writing rules

Each contract file should:

- define purpose and scope
- define in-scope and out-of-scope items
- state normative rules clearly
- separate requirements from rationale where useful
- avoid implementation-specific code unless necessary
- remain small enough to edit safely in future batches

## 6. Summary

The Keyplane spec set should be developed as a layered contract system.

The first important implementation-facing layer is:

- public API
- binding model
- parsing/normalization

Once those are stable, the runtime behavior contracts can be written with much less ambiguity.
