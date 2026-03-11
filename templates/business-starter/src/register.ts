import type { PlatformModule } from "@platform/core";

const module: PlatformModule = {
  id: "__MODULE_ID__",
  name: "__APP_TITLE__",
  version: "0.1.0",
  components: {
    "__COMPONENT_KEY__": async () => ({ default: (await import("./pages/starter-home-page")).StarterHomePage }),
  },
  menus: [
    {
      id: "__MENU_ID__",
      name: "__APP_TITLE__",
      type: 2,
      path: "__ROUTE_PATH__",
      component: "__COMPONENT_KEY__",
      linkType: 1,
      visible: 1,
      icon: "AppstoreOutlined",
    },
  ],
  routes: [{ path: "__ROUTE_PATH__", componentKey: "__COMPONENT_KEY__" }],
};

export default module;
