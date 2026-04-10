import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { AppContextValue } from "@nebula/core";

const AppContext = createContext<AppContextValue | null>(null);

export function AppContextProvider({ children, value }: { children: ReactNode; value: AppContextValue }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("AppContext is not available");
  }

  return context;
}
