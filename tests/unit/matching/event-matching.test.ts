// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import { createKeyplane } from "../../../src/index";

function dispatchKeyboardEvent(
  target: EventTarget,
  type: "keydown" | "keyup",
  init: KeyboardEventInit & { code: string; key: string },
): KeyboardEvent {
  const event = new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    ...init,
  });

  target.dispatchEvent(event);
  return event;
}

describe("single-step event matching", () => {
  it("fires physical and semantic bindings through distinct matching paths", () => {
    const manager = createKeyplane();
    const seen: string[] = [];

    manager.bind("KeyZ", () => {
      seen.push("physical");
    });
    manager.bind("key:y", () => {
      seen.push("semantic");
    });

    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyZ", key: "y" });

    expect(seen).toEqual(["physical", "semantic"]);
  });

  it("matches canonical semantic named keys from normalized event meaning", () => {
    const manager = createKeyplane();
    const handler = vi.fn();

    manager.bind("key:Space", handler);

    dispatchKeyboardEvent(document.body, "keydown", { code: "Space", key: " " });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("rejects wrong event phase and extra modifiers", () => {
    const manager = createKeyplane();
    const keydown = vi.fn();
    const exactModifiers = vi.fn();

    manager.bind("KeyA", keydown, { eventType: "keydown" });
    manager.bind("Control+KeyA", exactModifiers);

    dispatchKeyboardEvent(document.body, "keyup", { code: "KeyA", key: "a" });
    dispatchKeyboardEvent(document.body, "keydown", {
      code: "KeyA",
      key: "a",
      ctrlKey: true,
    });

    expect(keydown).toHaveBeenCalledTimes(0);
    expect(exactModifiers).toHaveBeenCalledTimes(1);
  });

  it("separates keydown and keyup subscriptions and uses the actual keyup modifier snapshot", () => {
    const manager = createKeyplane();
    const keydownHandler = vi.fn();
    const keyupHandler = vi.fn();

    manager.bind("Control+KeyU", keydownHandler, { eventType: "keydown" });
    manager.bind("Control+KeyU", keyupHandler, { eventType: "keyup" });

    dispatchKeyboardEvent(document.body, "keydown", {
      code: "KeyU",
      key: "u",
      ctrlKey: true,
    });
    dispatchKeyboardEvent(document.body, "keyup", {
      code: "KeyU",
      key: "u",
      ctrlKey: false,
    });
    dispatchKeyboardEvent(document.body, "keyup", {
      code: "KeyU",
      key: "u",
      ctrlKey: true,
    });

    expect(keydownHandler).toHaveBeenCalledTimes(1);
    expect(keyupHandler).toHaveBeenCalledTimes(1);
  });

  it("suppresses repeats by default and allows explicit repeat handling", () => {
    const manager = createKeyplane();
    const defaultHandler = vi.fn();
    const repeatHandler = vi.fn();

    manager.bind("KeyR", defaultHandler);
    manager.bind("KeyR", repeatHandler, { allowRepeat: true });

    dispatchKeyboardEvent(document.body, "keydown", {
      code: "KeyR",
      key: "r",
      repeat: true,
    });

    expect(defaultHandler).toHaveBeenCalledTimes(0);
    expect(repeatHandler).toHaveBeenCalledTimes(1);
  });

  it("suppresses composing and dead-key events", () => {
    const manager = createKeyplane();
    const handler = vi.fn();

    manager.bind("key:a", handler);

    dispatchKeyboardEvent(document.body, "keydown", {
      code: "KeyA",
      key: "a",
      isComposing: true,
    });
    dispatchKeyboardEvent(document.body, "keydown", {
      code: "Quote",
      key: "Dead",
    });

    expect(handler).toHaveBeenCalledTimes(0);
  });

  it("suppresses editable targets by default and honors allowInEditable", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.append(input);

    const manager = createKeyplane();
    const blocked = vi.fn();
    const allowed = vi.fn();

    manager.bind("KeyE", blocked);
    manager.bind("KeyE", allowed, { allowInEditable: true });

    dispatchKeyboardEvent(input, "keydown", { code: "KeyE", key: "e" });

    expect(blocked).toHaveBeenCalledTimes(0);
    expect(allowed).toHaveBeenCalledTimes(1);
  });

  it("inherits allowInEditable from the manager default", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.append(input);

    const manager = createKeyplane({ allowInEditable: true });
    const inherited = vi.fn();
    const overridden = vi.fn();

    manager.bind("KeyI", inherited);
    manager.bind("KeyI", overridden, { allowInEditable: false });

    dispatchKeyboardEvent(input, "keydown", { code: "KeyI", key: "i" });

    expect(inherited).toHaveBeenCalledTimes(1);
    expect(overridden).toHaveBeenCalledTimes(0);
  });

  it("filters HTMLElement targets to their subtree only, including descendant effective targets", () => {
    const root = document.createElement("div");
    const inside = document.createElement("button");
    const outside = document.createElement("button");
    const text = document.createTextNode("inside");

    inside.append(text);
    root.append(inside);
    document.body.append(root, outside);

    const manager = createKeyplane({ target: root });
    const handler = vi.fn();

    manager.bind("Enter", handler);

    dispatchKeyboardEvent(inside, "keydown", { code: "Enter", key: "Enter" });
    dispatchKeyboardEvent(text, "keydown", { code: "Enter", key: "Enter" });
    dispatchKeyboardEvent(outside, "keydown", { code: "Enter", key: "Enter" });

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("fires multiple matches in registration order", () => {
    const manager = createKeyplane();
    const seen: string[] = [];

    manager.bind("KeyO", () => {
      seen.push("first");
    });
    manager.bind("KeyO", () => {
      seen.push("second");
    });

    dispatchKeyboardEvent(document.body, "keydown", { code: "KeyO", key: "o" });

    expect(seen).toEqual(["first", "second"]);
  });
});
