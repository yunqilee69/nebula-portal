function normalizeValue(value: string) {
  return value.trim();
}

interface ParsedPermissionCode {
  resourceType: string;
  resourceCode: string;
  permissionType: string;
}

function parsePermissionCode(code: string): ParsedPermissionCode | null {
  const segments = code.split(":").map(normalizeValue);
  if (segments.length !== 3 || segments.some((segment) => !segment)) {
    return null;
  }

  const [resourceType, resourceCode, permissionType] = segments;
  return { resourceType, resourceCode, permissionType };
}

function matchesSegment(candidate: string, expected: string) {
  return candidate === "*" || candidate === expected;
}

function isDeniedPermission(permissionType: string) {
  return permissionType.toLowerCase() === "deny";
}

function isAllowedPermission(permissionType: string) {
  return permissionType.toLowerCase() === "allow";
}

function isGrantedPermission(candidate: ParsedPermissionCode, expected: ParsedPermissionCode) {
  if (!matchesSegment(candidate.resourceType, expected.resourceType)) {
    return false;
  }
  if (!matchesSegment(candidate.resourceCode, expected.resourceCode)) {
    return false;
  }
  if (isDeniedPermission(candidate.permissionType)) {
    return false;
  }

  return (
    candidate.permissionType === "*"
    || isAllowedPermission(candidate.permissionType)
    || expected.permissionType === "*"
    || candidate.permissionType === expected.permissionType
  );
}

function isDeniedMatch(candidate: ParsedPermissionCode, expected: ParsedPermissionCode) {
  return (
    isDeniedPermission(candidate.permissionType)
    && matchesSegment(candidate.resourceType, expected.resourceType)
    && matchesSegment(candidate.resourceCode, expected.resourceCode)
  );
}

function normalizePermissionList(permissions: string[]) {
  return permissions.map(normalizeValue).filter(Boolean);
}

function normalizeRoleList(roles: string[]) {
  return roles.map(normalizeValue).filter(Boolean);
}

export function hasPermissionCode(permissions: string[], requestedCode: string) {
  const code = normalizeValue(requestedCode);
  if (!code) {
    return false;
  }

  const parsedRequestedCode = parsePermissionCode(code);
  if (!parsedRequestedCode) {
    return false;
  }
  if (isDeniedPermission(parsedRequestedCode.permissionType)) {
    return false;
  }

  const parsedPermissions = normalizePermissionList(permissions)
    .map(parsePermissionCode)
    .filter((permission): permission is ParsedPermissionCode => permission !== null);

  if (parsedPermissions.some((parsed) => isDeniedMatch(parsed, parsedRequestedCode))) {
    return false;
  }
  if (parsedPermissions.some((parsed) => isGrantedPermission(parsed, parsedRequestedCode))) {
    return true;
  }

  return false;
}

export function hasAnyPermissionCode(permissions: string[], codes: string[]) {
  return codes.some((code) => hasPermissionCode(permissions, code));
}

export function hasAllPermissionCode(permissions: string[], codes: string[]) {
  return codes.every((code) => hasPermissionCode(permissions, code));
}

export function hasRoleCode(roles: string[], requestedRole: string) {
  const role = normalizeValue(requestedRole);
  if (!role) {
    return false;
  }

  return normalizeRoleList(roles).includes(role);
}

export function hasAnyRoleCode(roles: string[], requestedRoles: string[]) {
  return requestedRoles.some((role) => hasRoleCode(roles, role));
}

export function hasAllRoleCode(roles: string[], requestedRoles: string[]) {
  return requestedRoles.every((role) => hasRoleCode(roles, role));
}
