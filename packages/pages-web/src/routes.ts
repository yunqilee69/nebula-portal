import { createElement, type ComponentType } from "react";
import type { RouteObject } from "react-router-dom";
import { IframePage, LoginPage, NotFoundPage, UnauthorizedPage, UnavailablePage } from "./index";

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
