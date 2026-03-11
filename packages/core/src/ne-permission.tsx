import type { ReactNode } from "react";
import { useAppContext } from "./app-context";

export interface NePermissionProps {
  code: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function NePermission({ code, children, fallback = null }: NePermissionProps) {
  const ctx = useAppContext();
  return ctx.auth.hasPermission(code) ? <>{children}</> : <>{fallback}</>;
}
