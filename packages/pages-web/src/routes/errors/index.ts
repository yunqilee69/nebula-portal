import { UnauthorizedPage } from "../../pages/401";
import { NotFoundPage } from "../../pages/404";
import { UnavailablePage } from "../../pages/unavailable";
import type { RouteComponentLoaderMap } from "@nebula/core";

export const errorsRoutes: RouteComponentLoaderMap = {
  UnauthorizedPage: {
    loader: async () => ({ default: UnauthorizedPage }),
    meta: {
      nameKey: "errors.unauthorized",
      path: "/401",
      sort: 10000,
    },
  },
  NotFoundPage: {
    loader: async () => ({ default: NotFoundPage }),
    meta: {
      nameKey: "errors.notFound",
      path: "/404",
      sort: 10001,
    },
  },
  UnavailablePage: {
    loader: async () => ({ default: UnavailablePage }),
    meta: {
      nameKey: "errors.unavailable",
      path: "*",
      sort: 10002,
    },
  },
};