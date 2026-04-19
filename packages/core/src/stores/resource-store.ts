import { create } from "zustand";

export type NebulaResourceName =
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
  resources: Record<NebulaResourceName, ResourceStatus>;
  start: (name: NebulaResourceName) => void;
  succeed: (name: NebulaResourceName) => void;
  fail: (name: NebulaResourceName, error: string) => void;
  resetAll: () => void;
}

const createStatus = (): ResourceStatus => ({
  loading: false,
  error: null,
  lastLoadedAt: null,
});

const initialResources: Record<NebulaResourceName, ResourceStatus> = {
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
