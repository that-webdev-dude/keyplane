# Browser Core Demo

This example is a small browser-only inspection surface for Keyplane's core concepts.

It shows:

- raw incoming keyboard event data
- runtime-like physical event meaning
- runtime-like semantic event meaning
- registered example bindings
- default and canonical formatted labels

## Run

1. Build the package with `npm run build`.
2. Serve the repository root with any static file server.
3. Open `/examples/browser-core-demo/index.html`.

The demo imports `../../dist/index.js`, so it is meant to run from the built repository, not from an npm install.
