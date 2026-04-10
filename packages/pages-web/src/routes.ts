import { createElement, type ComponentType } from "react";
import type { RouteObject } from "react-router-dom";
import {
  AnnouncementPage,
  CachePage,
  ConfigListPage,
  DashboardPage,
  DictListPage,
  IframePage,
  LoginPage,
  MenuListPage,
  NotFoundPage,
  NotificationRecordPage,
  NotificationTemplatePage,
  OAuth2AccountPage,
  OAuth2ClientPage,
  OrgListPage,
  ParamListPage,
  PermissionListPage,
  RoleListPage,
  UnauthorizedPage,
  UnavailablePage,
  UserListPage,
} from "./index";

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
    createRoute("/", DashboardPage, overrides),
    createRoute("/iframe", IframePage, overrides),
    createRoute("/operations/user", UserListPage, overrides),
    createRoute("/operations/role", RoleListPage, overrides),
    createRoute("/operations/permission", PermissionListPage, overrides),
    createRoute("/operations/org", OrgListPage, overrides),
    createRoute("/operations/menu", MenuListPage, overrides),
    createRoute("/advanced/dict", DictListPage, overrides),
    createRoute("/advanced/param", ParamListPage, overrides),
    createRoute("/advanced/config", ConfigListPage, overrides),
    createRoute("/advanced/oauth2/client", OAuth2ClientPage, overrides),
    createRoute("/advanced/oauth2/account", OAuth2AccountPage, overrides),
    createRoute("/advanced/cache", CachePage, overrides),
    createRoute("/notifications/record", NotificationRecordPage, overrides),
    createRoute("/notifications/template", NotificationTemplatePage, overrides),
    createRoute("/notifications/announcement", AnnouncementPage, overrides),
    createRoute("*", UnavailablePage, overrides),
  ];
}
