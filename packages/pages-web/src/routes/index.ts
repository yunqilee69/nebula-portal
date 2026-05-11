import { createElement, type ComponentType } from "react";
import type { RouteObject } from "react-router-dom";
import { registryRouteComponents, registryStaticRoutes } from "@nebula/core";
import { LoginPage } from "../pages/auth/login-page";
import { UnauthorizedPage } from "../pages/401";
import { NotFoundPage } from "../pages/404";
import { IframePage } from "../pages/iframe";
import { UnavailablePage } from "../pages/unavailable";
import { dashboardRoutes } from "./dashboard";
import { operationsRoutes } from "./operations";
import { notificationsRoutes } from "./notifications";
import { advancedRoutes } from "./advanced";
import { storageRoutes } from "./storage";
import { errorsRoutes } from "./errors";
import { authRoutes } from "./auth";
import { userStaticRoutes } from "./user";
import type { RouteComponentLoaderMap } from "@nebula/core";

export const allRouteConfigs: RouteComponentLoaderMap = {
  ...authRoutes,
  ...dashboardRoutes,
  ...operationsRoutes,
  ...notificationsRoutes,
  ...advancedRoutes,
  ...storageRoutes,
  ...errorsRoutes,
};

const NEBULA_PAGES_REGISTERED_FLAG = "__nebulaPagesRegistered__";
const NEBULA_PAGES_SOURCE = "@nebula/pages-web";

type GlobalRegistrationState = typeof globalThis & {
  [NEBULA_PAGES_REGISTERED_FLAG]?: boolean;
};

function autoRegisterNebulaPages(): void {
  const globalState = globalThis as GlobalRegistrationState;

  if (globalState[NEBULA_PAGES_REGISTERED_FLAG]) {
    return;
  }

  registryRouteComponents(allRouteConfigs, NEBULA_PAGES_SOURCE);
  registryStaticRoutes(userStaticRoutes, NEBULA_PAGES_SOURCE);
  globalState[NEBULA_PAGES_REGISTERED_FLAG] = true;
}

autoRegisterNebulaPages();

export interface NebulaRoutesOptions {
  overrides?: Record<string, ComponentType>;
}

function createRoute(path: string, fallback: ComponentType, overrides?: Record<string, ComponentType>): RouteObject {
  const Component = overrides?.[path] ?? fallback;
  return { path, element: createElement(Component) };
}

export function createNebulaRoutes(options?: NebulaRoutesOptions): RouteObject[] {
  const overrides = options?.overrides;

  return [
    createRoute("/login", LoginPage, overrides),
    createRoute("/401", UnauthorizedPage, overrides),
    createRoute("/404", NotFoundPage, overrides),
    createRoute("/iframe", IframePage, overrides),
    createRoute("*", UnavailablePage, overrides),
  ];
}

export { dashboardRoutes } from "./dashboard";
export { operationsRoutes } from "./operations";
export { notificationsRoutes } from "./notifications";
export { advancedRoutes } from "./advanced";
export { storageRoutes } from "./storage";
export { errorsRoutes } from "./errors";
export { authRoutes } from "./auth";
export { userStaticRoutes } from "./user";
export { type RouteComponentLoaderMap, type RouteComponentMeta, type RouteComponentRegistration } from "@nebula/core";