import { getRegisteredRouteComponentSource, getRouteComponentRegistrationConflicts, hasRouteComponent } from "../routing/route-component-registry";
import type { MenuItem } from "../types";

export type PlatformValidationIssueCode =
  | "duplicate-route-component-key"
  | "menu-route-component-missing";

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

  const routeComponentConflicts = getRouteComponentRegistrationConflicts();
  if (routeComponentConflicts.length > 0) {
    issues.push({
      code: "duplicate-route-component-key",
      severity: "error",
      summary: "Duplicate route component keys detected.",
      details: routeComponentConflicts.map((item) => `route component key "${item.key}" was registered by both "${item.existingSource}" and "${item.nextSource}"`),
    });
  }

  const missingMenuRouteComponents: string[] = [];
  visitMenus(menus, (menu) => {
    if (menu.type !== 2 || menu.linkType !== 1 || !menu.component) {
      return;
    }

    if (!hasRouteComponent(menu.component)) {
      missingMenuRouteComponents.push(
        `menu "${menu.name}" (${String(menu.id)}) points to missing route component key "${menu.component}"${menu.path ? ` at path "${menu.path}"` : ""}`,
      );
      return;
    }

    const source = getRegisteredRouteComponentSource(menu.component);
    if (!source) {
      missingMenuRouteComponents.push(
        `menu "${menu.name}" (${String(menu.id)}) uses route component key "${menu.component}" but its registration source is unknown`,
      );
    }
  });

  if (missingMenuRouteComponents.length > 0) {
    issues.push({
      code: "menu-route-component-missing",
      severity: "error",
      summary: "Menu items reference invalid frontend route components.",
      details: missingMenuRouteComponents,
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
