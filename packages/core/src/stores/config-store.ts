import { create } from "zustand";
import type { ConfigMap } from "../types";

interface ConfigState {
  values: ConfigMap;
  setValues: (values: ConfigMap) => void;
  mergeValues: (values: ConfigMap) => void;
  clear: () => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  values: {},
  setValues: (values) => set({ values }),
  mergeValues: (values) => set((state) => ({ values: { ...state.values, ...values } })),
  clear: () => set({ values: {} }),
}));
