import { useMemo } from "react";
import { useAppContext } from "../context/app-context";

export function usePermission() {
  const ctx = useAppContext();

  return useMemo(
    () => ({
      can: (code: string) => ctx.auth.hasPermission(code),
      canAny: (codes: string[]) => ctx.auth.hasAnyCode(codes),
      canAll: (codes: string[]) => ctx.auth.hasAllCode(codes),
      hasCode: (code: string) => ctx.auth.hasPermission(code),
      hasAnyCode: (codes: string[]) => ctx.auth.hasAnyCode(codes),
      hasAllCode: (codes: string[]) => ctx.auth.hasAllCode(codes),
      hasRole: (role: string) => ctx.auth.hasRole(role),
      hasAnyRole: (roles: string[]) => ctx.auth.hasAnyRole(roles),
      hasAllRole: (roles: string[]) => ctx.auth.hasAllRole(roles),
    }),
    [ctx],
  );
}
