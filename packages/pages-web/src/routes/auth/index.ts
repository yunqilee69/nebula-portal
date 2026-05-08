import { LoginPage } from "../../pages/auth/login-page";
import type { RouteComponentLoaderMap } from "@nebula/core";

export const authRoutes: RouteComponentLoaderMap = {
  LoginPage: {
    loader: async () => ({ default: LoginPage }),
    meta: {
      nameKey: "auth.login",
      path: "/login",
      sort: -1,
    },
  },
};