import type { ComponentLoaderMap } from "../types";
import { registerComponents } from "../component-registry";

let registered = false;

export function registerNebulaComponents() {
  if (registered) {
    return;
  }

  // Shell should call this function after importing all page components
  // The actual component registration is done in Shell's local module

  registered = true;
}

export function registerNebulaComponentsInternal(components: ComponentLoaderMap, source: string) {
  if (registered) {
    return;
  }
  registerComponents(components, source);
  registered = true;
}
