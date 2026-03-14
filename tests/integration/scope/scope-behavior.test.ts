// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import { createKeyplane } from "../../../src/index";

function dispatchKeyboardEvent(
  target: EventTarget,
  type: "keydown" | "keyup",
  init: KeyboardEventInit & { code: string; key: string },
): void {
  target.dispatchEvent(
    new KeyboardEvent(type, {
      bubbles: true,
      cancelable: true,
      ...init,
    }),
  );
}

describe("scope behavior integration", () => {
  it("keeps global bindings eligible in any active scope", () => {
    const manager = createKeyplane();
    const handler = vi.fn();

    manager.bind("KeyG", handler);

    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    manager.setScope("editor");
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    manager.setScope("command-palette");
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });

    expect(handler).toHaveBeenCalledTimes(3);
  });

  it("requires exact scope equality for named-scope bindings", () => {
    const manager = createKeyplane({ defaultScope: "editor" });
    const handler = vi.fn();

    manager.bind("KeyP", handler, { scope: "editor" });

    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyP", key: "p" });
    manager.setScope("editor.child");
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyP", key: "p" });
    manager.setScope("Editor");
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyP", key: "p" });
    manager.setScope(null);
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyP", key: "p" });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not inherit bind-option scope from defaultScope", () => {
    const manager = createKeyplane({ defaultScope: "editor" });
    const handler = vi.fn();

    manager.bind("KeyB", handler);

    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyB", key: "b" });
    manager.setScope("palette");
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyB", key: "b" });

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("does not clear sequence state when setScope receives the current scope", () => {
    const manager = createKeyplane({ defaultScope: "editor" });
    const handler = vi.fn();

    manager.bind("KeyG then KeyC", handler, { scope: "editor" });

    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyG", key: "g" });
    manager.setScope("editor");
    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyC", key: "c" });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("keeps editable suppression unchanged when scope gating is involved", () => {
    const manager = createKeyplane({ defaultScope: "editor" });
    const blocked = vi.fn();
    const allowed = vi.fn();
    const input = document.createElement("input");

    document.body.append(input);

    manager.bind("KeyE", blocked, { scope: "editor" });
    manager.bind("KeyE", allowed, {
      scope: "editor",
      allowInEditable: true,
    });

    dispatchKeyboardEvent(input, "keydown", { code: "KeyE", key: "e" });
    manager.setScope("palette");
    dispatchKeyboardEvent(input, "keydown", { code: "KeyE", key: "e" });

    expect(blocked).toHaveBeenCalledTimes(0);
    expect(allowed).toHaveBeenCalledTimes(1);
  });

  it("keeps target-boundary gating unchanged when scope gating is involved", () => {
    const host = document.createElement("div");
    const inside = document.createElement("button");
    const outside = document.createElement("button");
    const handler = vi.fn();

    host.append(inside);
    document.body.append(host, outside);

    const manager = createKeyplane({ target: host, defaultScope: "editor" });
    manager.bind("KeyT", handler, { scope: "editor" });

    dispatchKeyboardEvent(inside, "keydown", { code: "KeyT", key: "t" });
    dispatchKeyboardEvent(outside, "keydown", { code: "KeyT", key: "t" });
    manager.setScope("palette");
    dispatchKeyboardEvent(inside, "keydown", { code: "KeyT", key: "t" });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("keeps active scope state independent across overlapping managers", () => {
    const host = document.createElement("div");
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();

    document.body.append(host);

    const first = createKeyplane({ target: host, defaultScope: "editor" });
    const second = createKeyplane({ target: host, defaultScope: "palette" });

    first.bind("KeyM", firstHandler, { scope: "editor" });
    second.bind("KeyM", secondHandler, { scope: "palette" });

    dispatchKeyboardEvent(host, "keydown", { code: "KeyM", key: "m" });

    first.setScope("palette");
    second.setScope("editor");
    dispatchKeyboardEvent(host, "keydown", { code: "KeyM", key: "m" });

    expect(firstHandler).toHaveBeenCalledTimes(1);
    expect(secondHandler).toHaveBeenCalledTimes(1);
    expect(first.getScope()).toBe("palette");
    expect(second.getScope()).toBe("editor");
  });
});
