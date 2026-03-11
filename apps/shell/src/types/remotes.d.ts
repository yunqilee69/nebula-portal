declare module "demoBusiness/register" {
  import type { PlatformModule } from "@platform/core";

  const module: PlatformModule;
  export default module;
}

declare module "demoBusiness/App" {
  import type { ComponentType } from "react";

  const App: ComponentType<object>;
  export default App;
}
