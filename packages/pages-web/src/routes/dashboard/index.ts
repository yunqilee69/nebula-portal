import { DashboardPage } from "../../pages/dashboard";
import type { RouteComponentLoaderMap } from "@nebula/core";

export const dashboardRoutes: RouteComponentLoaderMap = {
  DashboardPage: {
    loader: async () => ({ default: DashboardPage }),
    meta: {
      nameKey: "dashboard.title",
      path: "/dashboard",
      icon: "DashboardOutlined",
      sort: 0,
    },
  },
};