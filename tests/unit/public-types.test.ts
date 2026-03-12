import { describe, expectTypeOf, it } from "vitest";

import { createKeyplane } from "../../src/index";
import type {
  KeyplaneBindOptions,
  KeyplaneBindingInput,
  KeyplaneFormatOptions,
  KeyplaneManager,
  KeyplaneManagerConfig,
  KeyplaneNormalizedBinding,
  KeyplaneSubscription,
} from "../../src/index";

describe("public type surface", () => {
  it("exposes the manager shell types through the public entry point", () => {
    expectTypeOf(createKeyplane).parameter(0).toEqualTypeOf<
      KeyplaneManagerConfig | undefined
    >();
    expectTypeOf(createKeyplane).returns.toEqualTypeOf<KeyplaneManager>();
  });

  it("exposes bind and formatting helper signatures through the public entry point", () => {
    const manager = createKeyplane();

    expectTypeOf(manager.bind).parameter(0).toEqualTypeOf<KeyplaneBindingInput>();
    expectTypeOf(manager.bind).parameter(2).toEqualTypeOf<
      KeyplaneBindOptions | undefined
    >();
    expectTypeOf(manager.bind).returns.toEqualTypeOf<KeyplaneSubscription>();
    expectTypeOf<KeyplaneFormatOptions>().toMatchTypeOf<KeyplaneFormatOptions>();
    expectTypeOf<KeyplaneNormalizedBinding>().toMatchTypeOf<KeyplaneNormalizedBinding>();
  });
});
