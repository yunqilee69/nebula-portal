import { createContext, useContext } from "react";
import type { AppContextValue } from "../types";

const AppContext = createContext<AppContextValue | null>(null);

export const AppContextProvider = AppContext.Provider;

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("AppContext is not available");
  }
  return ctx;
}
