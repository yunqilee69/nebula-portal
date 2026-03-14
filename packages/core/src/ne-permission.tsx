import type { ReactNode } from "react";
import { useAppContext } from "./app-context";

export interface NePermissionProps {
  code?: string;
  role?: string;
  hasAnyRole?: string[];
  hasAllRole?: string[];
  hasAnyCode?: string[];
  hasAllCode?: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function NePermission({
  code,
  role,
  hasAnyRole,
  hasAllRole,
  hasAnyCode,
  hasAllCode,
  children,
  fallback = null,
}: NePermissionProps) {
  const ctx = useAppContext();
  const allowed = [
    code ? ctx.auth.hasPermission(code) : true,
    role ? ctx.auth.hasRole(role) : true,
    hasAnyRole?.length ? ctx.auth.hasAnyRole(hasAnyRole) : true,
    hasAllRole?.length ? ctx.auth.hasAllRole(hasAllRole) : true,
    hasAnyCode?.length ? ctx.auth.hasAnyCode(hasAnyCode) : true,
    hasAllCode?.length ? ctx.auth.hasAllCode(hasAllCode) : true,
  ].every(Boolean);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
