import { useMemo } from "react";
import { useAppContext } from "./app-context";

export function usePermission() {
  const ctx = useAppContext();

  return useMemo(
    () => ({
      can: (code: string) => ctx.auth.hasPermission(code),
      canAny: (codes: string[]) => codes.some((code) => ctx.auth.hasPermission(code)),
      canAll: (codes: string[]) => codes.every((code) => ctx.auth.hasPermission(code)),
    }),
    [ctx],
  );
}
