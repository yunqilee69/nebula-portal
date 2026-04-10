// Permission utility functions for checking permissions and roles

export function hasPermissionCode(permissions: string[], code: string): boolean {
  return permissions.includes(code);
}

export function hasAnyPermissionCode(permissions: string[], codes: string[]): boolean {
  return codes.some((code) => permissions.includes(code));
}

export function hasAllPermissionCode(permissions: string[], codes: string[]): boolean {
  return codes.every((code) => permissions.includes(code));
}

export function hasRoleCode(roles: string[], code: string): boolean {
  return roles.includes(code);
}

export function hasAnyRoleCode(roles: string[], codes: string[]): boolean {
  return codes.some((code) => roles.includes(code));
}

export function hasAllRoleCode(roles: string[], codes: string[]): boolean {
  return codes.every((code) => roles.includes(code));
}
