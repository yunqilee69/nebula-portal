import { getModuleRegistrationConflicts, getRegisteredModules } from "../module-registry";
import { getComponentRegistrationConflicts, getRegisteredComponentSource, hasComponent } from "../component-registry";
import type { MenuItem } from "../types";

export type PlatformValidationIssueCode =
  | "duplicate-module-id"
  | "duplicate-component-key"
  | "duplicate-route-path"
  | "menu-component-missing";

export interface PlatformValidationIssue {
  code: PlatformValidationIssueCode;
  severity: "error";
  summary: string;
  details: string[];
}

export interface PlatformValidationResult {
  issues: PlatformValidationIssue[];
  hasErrors: boolean;
}

interface RouteOwner {
  kind: "menu" | "module-route";
  path: string;
  description: string;
}

function visitMenus(nodes: MenuItem[], visitor: (item: MenuItem) => void) {
  nodes.forEach((node) => {
    visitor(node);
    if (node.children?.length) {
      visitMenus(node.children, visitor);
    }
  });
}

export function validatePlatformConsistency(menus: MenuItem[]) {
  const issues: PlatformValidationIssue[] = [];

  const moduleConflicts = getModuleRegistrationConflicts();
  if (moduleConflicts.length > 0) {
    issues.push({
      code: "duplicate-module-id",
      severity: "error",
      summary: "Duplicate platform module ids detected.",
      details: moduleConflicts.map((item) => `module id "${item.id}" was registered by both "${item.existingName}" and "${item.nextName}"`),
    });
  }

  const componentConflicts = getComponentRegistrationConflicts();
  if (componentConflicts.length > 0) {
    issues.push({
      code: "duplicate-component-key",
      severity: "error",
      summary: "Duplicate component keys detected.",
      details: componentConflicts.map((item) => `component key "${item.key}" was registered by both "${item.existingSource}" and "${item.nextSource}"`),
    });
  }

  const routeOwners = new Map<string, RouteOwner[]>();
  const registerRouteOwner = (path: string | undefined, owner: RouteOwner) => {
    if (!path?.trim()) {
      return;
    }
    const normalizedPath = path.trim();
    const current = routeOwners.get(normalizedPath) ?? [];
    current.push({ ...owner, path: normalizedPath });
    routeOwners.set(normalizedPath, current);
  };

  visitMenus(menus, (menu) => {
    if (menu.type === 2 && menu.linkType === 1 && menu.path) {
      registerRouteOwner(menu.path, {
        kind: "menu",
        path: menu.path,
        description: `menu "${menu.name}" (${String(menu.id)})${menu.component ? ` -> ${menu.component}` : ""}`,
      });
    }
  });

  getRegisteredModules().forEach((module) => {
    module.routes?.forEach((route) => {
      registerRouteOwner(route.path, {
        kind: "module-route",
        path: route.path,
        description: `module route "${module.name}" (${module.id})${route.componentKey ? ` -> ${route.componentKey}` : ""}`,
      });
    });
  });

  const duplicateRouteDetails = [...routeOwners.entries()]
    .filter(([, owners]) => owners.length > 1)
    .map(([path, owners]) => `route path "${path}" is declared multiple times: ${owners.map((owner) => owner.description).join(" | ")}`);

  if (duplicateRouteDetails.length > 0) {
    issues.push({
      code: "duplicate-route-path",
      severity: "error",
      summary: "Duplicate route paths detected.",
      details: duplicateRouteDetails,
    });
  }

  const missingMenuComponents: string[] = [];
  visitMenus(menus, (menu) => {
    if (menu.type !== 2 || menu.linkType !== 1 || !menu.component) {
      return;
    }

    if (!hasComponent(menu.component)) {
      missingMenuComponents.push(
        `menu "${menu.name}" (${String(menu.id)}) points to missing component key "${menu.component}"${menu.path ? ` at path "${menu.path}"` : ""}`,
      );
      return;
    }

    const source = getRegisteredComponentSource(menu.component);
    if (!source) {
      missingMenuComponents.push(
        `menu "${menu.name}" (${String(menu.id)}) uses component key "${menu.component}" but its registration source is unknown`,
      );
    }
  });

  if (missingMenuComponents.length > 0) {
    issues.push({
      code: "menu-component-missing",
      severity: "error",
      summary: "Menu items reference invalid frontend components.",
      details: missingMenuComponents,
    });
  }

  return {
    issues,
    hasErrors: issues.length > 0,
  } satisfies PlatformValidationResult;
}

export function reportPlatformValidation(result: PlatformValidationResult) {
  if (!result.hasErrors) {
    return;
  }

  console.group("[platform-validation] Startup consistency check failed");
  result.issues.forEach((issue, index) => {
    console.error(`[platform-validation:${index + 1}] ${issue.code} :: ${issue.summary}`);
    issue.details.forEach((detail) => {
      console.error(`  - ${detail}`);
    });
  });
  console.groupEnd();
}
