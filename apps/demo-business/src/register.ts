import type { AppContextValue, PlatformModule } from "@platform/core";

const module: PlatformModule = {
  id: "@business/demo",
  name: "Demo CRM",
  version: "0.1.0",
  components: {
    "crm/CustomerList": async () => ({ default: (await import("./pages/customer-list-page")).CustomerListPage }),
    "crm/CustomerDetail": async () => ({ default: (await import("./pages/customer-detail-page")).CustomerDetailPage }),
  },
  menus: [
    {
      id: "crm-root",
      name: "客户管理",
      type: 1,
      icon: "TeamOutlined",
      visible: 1,
      children: [
        {
          id: "crm-list",
          name: "客户列表",
          type: 2,
          path: "/crm/list",
          component: "crm/CustomerList",
          linkType: 1,
          icon: "UnorderedListOutlined",
          visible: 1,
        },
        {
          id: "crm-detail",
          name: "客户详情",
          type: 2,
          path: "/crm/detail",
          component: "crm/CustomerDetail",
          linkType: 1,
          visible: 1,
        },
      ],
    },
  ],
  routes: [
    { path: "/crm/list", componentKey: "crm/CustomerList" },
    { path: "/crm/detail", componentKey: "crm/CustomerDetail" },
  ],
  async bootstrap(ctx: AppContextValue) {
    ctx.bus.emit("notify:new", {
      id: "demo-module-loaded",
      title: `Module ${ctx.auth.getSession()?.user.username ?? "user"} is ready`,
      type: "info",
    });
  },
};

export default module;
