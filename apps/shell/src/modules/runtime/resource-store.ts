import { create } from "zustand";

export type ShellResourceName =
  | "menus"
  | "dicts"
  | "config"
  | "notifications"
  | "systemParams"
  | "roles";

interface ResourceStatus {
  loading: boolean;
  error: string | null;
  lastLoadedAt: string | null;
}

interface ResourceState {
  resources: Record<ShellResourceName, ResourceStatus>;
  start: (name: ShellResourceName) => void;
  succeed: (name: ShellResourceName) => void;
  fail: (name: ShellResourceName, error: string) => void;
  resetAll: () => void;
}

const createStatus = (): ResourceStatus => ({
  loading: false,
  error: null,
  lastLoadedAt: null,
});

const initialResources: Record<ShellResourceName, ResourceStatus> = {
  menus: createStatus(),
  dicts: createStatus(),
  config: createStatus(),
  notifications: createStatus(),
  systemParams: createStatus(),
  roles: createStatus(),
};

export const useResourceStore = create<ResourceState>((set) => ({
  resources: initialResources,
  start: (name) =>
    set((state) => ({
      resources: {
        ...state.resources,
        [name]: { ...state.resources[name], loading: true, error: null },
      },
    })),
  succeed: (name) =>
    set((state) => ({
      resources: {
        ...state.resources,
        [name]: { loading: false, error: null, lastLoadedAt: new Date().toISOString() },
      },
    })),
  fail: (name, error) =>
    set((state) => ({
      resources: {
        ...state.resources,
        [name]: { ...state.resources[name], loading: false, error, lastLoadedAt: state.resources[name].lastLoadedAt },
      },
    })),
  resetAll: () => set({ resources: initialResources }),
}));
