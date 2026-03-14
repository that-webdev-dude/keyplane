# Getting Started

This guide uses the built browser bundle directly so the flow stays close to the shipped package.

## Minimal Setup

1. Run `npm run build`.
2. Serve the repository root with any static file server.
3. Open a page that can import `./dist/index.js`.

```html
<!doctype html>
<html lang="en">
  <body>
    <input id="editor" type="text" placeholder="Editable target" />
    <script type="module">
      import { createKeyplane, formatBinding } from "./dist/index.js";

      const manager = createKeyplane();

      const save = manager.bind("Control+KeyS", ({ event }) => {
        event.preventDefault();
        console.log("Physical save shortcut");
      });

      const semanticSlash = manager.bind("key:/", () => {
        console.log("Semantic slash shortcut");
      });

      const blockedInEditor = manager.bind("KeyS", () => {
        console.log("Blocked by default inside editable targets");
      });

      const allowedInEditor = manager.bind("KeyD", () => {
        console.log("Allowed inside editable targets");
      }, { allowInEditable: true });

      console.log(formatBinding("Control+KeyS"));
      console.log(formatBinding("key:/"));

      window.addEventListener("beforeunload", () => {
        save.dispose();
        semanticSlash.dispose();
        blockedInEditor.dispose();
        allowedInEditor.dispose();
        manager.destroy();
      });
    </script>
  </body>
</html>
```

## What This Shows

- `createKeyplane()` creates a manager bound to `document` by default
- `"Control+KeyS"` is physical because string bindings default to physical mode
- `"key:/"` is semantic because `key:` opts into produced-key matching
- `"KeyS"` is blocked inside the editable input by default
- `"KeyD"` shows the `allowInEditable: true` override
- `dispose()` unregisters exactly one binding-handler pair
- `destroy()` permanently tears down the manager

## Editable Suppression

Editable targets are blocked by default. In the sample above, typing in the input will not fire the `KeyS` binding, but it can still fire the `KeyD` binding because that one opts in:

```ts
manager.bind("KeyD", () => {
  console.log("Allowed in an editor");
}, { allowInEditable: true });
```

Manager-level default:

```ts
const manager = createKeyplane({ allowInEditable: true });
```

## Default Formatting

Default formatting is for UI labels:

```ts
formatBinding("Control+KeyS");
formatBinding("Minus");
formatBinding("Control+KeyK then Control+KeyC");
```

Formatting may use optional layout-aware labels when the browser provides them, but that never changes matching meaning.

## Cleanup

Explicit cleanup keeps example intent clear:

```ts
const subscription = manager.bind("KeyP", () => {});

subscription.dispose();
manager.destroy();
```
