// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { createKeyplane } from "../../../src/index";

function expectKeyplaneError(action: () => unknown, code: string): void {
  try {
    action();
  } catch (error) {
    expect(error).toMatchObject({ code, name: "KeyplaneError" });
    return;
  }

  throw new Error(`Expected KeyplaneError ${code}.`);
}

describe("Keyplane manager lifecycle shell", () => {
  it("creates managers on supported browser targets", () => {
    expect(createKeyplane()).toMatchObject({
      bind: expect.any(Function),
      setScope: expect.any(Function),
      getScope: expect.any(Function),
      enable: expect.any(Function),
      disable: expect.any(Function),
      isEnabled: expect.any(Function),
      destroy: expect.any(Function),
    });

    expect(createKeyplane({ target: document })).toBeDefined();
    expect(createKeyplane({ target: window })).toBeDefined();
    expect(createKeyplane({ target: document.body })).toBeDefined();
  });

  it("returns one independent subscription per bind call, including duplicates", () => {
    const manager = createKeyplane();
    const first = manager.bind("KeyG", () => {});
    const second = manager.bind("KeyG", () => {});

    expect(first).not.toBe(second);
    expect(first.binding).toEqual(second.binding);
    expect(first.isEnabled()).toBe(true);
    expect(second.isEnabled()).toBe(true);

    first.dispose();

    expect(first.isEnabled()).toBe(false);
    expect(second.isEnabled()).toBe(true);
  });

  it("disposes only the targeted duplicate registration", () => {
    const manager = createKeyplane();
    const first = manager.bind("KeyD", () => {});
    const second = manager.bind("KeyD", () => {});

    second.dispose();

    expect(first.isEnabled()).toBe(true);
    expect(second.isEnabled()).toBe(false);
  });

  it("rejects exact-prefix conflicts in the same matching domain", () => {
    const manager = createKeyplane();

    manager.bind("KeyG", () => {});

    expectKeyplaneError(
      () => manager.bind("KeyG then KeyC", () => {}),
      "KP_REGISTER_PREFIX_CONFLICT",
    );
  });

  it("allows prefix-related bindings when the matching domain differs", () => {
    const manager = createKeyplane();

    manager.bind("KeyG", () => {}, { eventType: "keydown" });
    manager.bind("KeyG then KeyC", () => {}, { eventType: "keyup" });
    manager.bind(
      {
        mode: "semantic",
        steps: [{ key: "g", modifiers: [] }, { key: "c", modifiers: [] }],
      },
      () => {},
      { eventType: "keydown" },
    );
    manager.bind("KeyG then KeyC", () => {}, { scope: "editor" });
  });

  it("keeps bind atomic when listener attachment fails", () => {
    const target = document.createElement("div");
    const originalAddEventListener = target.addEventListener.bind(target);
    let shouldThrow = true;

    target.addEventListener = ((...args: Parameters<typeof target.addEventListener>) => {
      if (shouldThrow && args[0] === "keydown") {
        shouldThrow = false;
        throw new Error("attach failed");
      }

      return originalAddEventListener(...args);
    }) as typeof target.addEventListener;

    const manager = createKeyplane({ target });

    expect(() => manager.bind("KeyG", () => {})).toThrow("attach failed");

    expect(() =>
      manager.bind("KeyG then KeyC", () => {}, { eventType: "keydown" }),
    ).not.toThrow();
  });

  it("keeps subscription disposal idempotent and terminal", () => {
    const manager = createKeyplane();
    const subscription = manager.bind("KeyK", () => {});

    subscription.disable();
    expect(subscription.isEnabled()).toBe(false);

    subscription.enable();
    expect(subscription.isEnabled()).toBe(true);

    expect(() => subscription.dispose()).not.toThrow();
    expect(() => subscription.dispose()).not.toThrow();
    expect(() => subscription.enable()).not.toThrow();
    expect(() => subscription.disable()).not.toThrow();

    expect(subscription.isEnabled()).toBe(false);
  });

  it("tracks manager enabled state independently from subscriptions", () => {
    const manager = createKeyplane({ enabled: false });
    const subscription = manager.bind("KeyK", () => {});

    expect(manager.isEnabled()).toBe(false);
    expect(subscription.isEnabled()).toBe(true);

    manager.enable();
    expect(manager.isEnabled()).toBe(true);

    manager.disable();
    expect(manager.isEnabled()).toBe(false);
    expect(subscription.isEnabled()).toBe(true);
  });

  it("destroys managers idempotently and rejects post-destroy mutation", () => {
    const manager = createKeyplane({ defaultScope: "initial" });
    const subscription = manager.bind("KeyX", () => {});

    expect(() => manager.destroy()).not.toThrow();
    expect(() => manager.destroy()).not.toThrow();

    expect(manager.isEnabled()).toBe(false);
    expect(manager.getScope()).toBe("initial");
    expect(subscription.isEnabled()).toBe(false);

    expect(() => subscription.dispose()).not.toThrow();
    expect(() => subscription.enable()).not.toThrow();
    expect(() => subscription.disable()).not.toThrow();
    expect(subscription.isEnabled()).toBe(false);

    expectKeyplaneError(
      () => manager.bind("KeyY", () => {}),
      "KP_LIFECYCLE_MANAGER_DESTROYED",
    );
    expectKeyplaneError(
      () => manager.setScope("next"),
      "KP_LIFECYCLE_MANAGER_DESTROYED",
    );
    expectKeyplaneError(
      () => manager.enable(),
      "KP_LIFECYCLE_MANAGER_DESTROYED",
    );
    expectKeyplaneError(
      () => manager.disable(),
      "KP_LIFECYCLE_MANAGER_DESTROYED",
    );
  });

  it("rejects invalid scope values deterministically", () => {
    expectKeyplaneError(
      () => createKeyplane({ defaultScope: 42 as never }),
      "KP_LIFECYCLE_INVALID_STATE",
    );

    const manager = createKeyplane();

    expectKeyplaneError(
      () => manager.setScope(42 as never),
      "KP_LIFECYCLE_INVALID_STATE",
    );
    expectKeyplaneError(
      () => manager.bind("KeyQ", () => {}, { scope: false as never }),
      "KP_LIFECYCLE_INVALID_STATE",
    );
  });

  it("rejects invalid eventType values deterministically", () => {
    expectKeyplaneError(
      () => createKeyplane({ defaultEventType: "keypress" as never }),
      "KP_LIFECYCLE_INVALID_STATE",
    );

    const manager = createKeyplane();

    expectKeyplaneError(
      () => manager.bind("KeyQ", () => {}, { eventType: "keypress" as never }),
      "KP_LIFECYCLE_INVALID_STATE",
    );
  });
});
