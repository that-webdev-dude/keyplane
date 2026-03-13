import type { KeyplaneManager, KeyplaneManagerConfig } from "../types/public";
import { createManager } from "../lifecycle/create-manager";

export function createKeyplane(config?: KeyplaneManagerConfig): KeyplaneManager {
  return createManager(config);
}
