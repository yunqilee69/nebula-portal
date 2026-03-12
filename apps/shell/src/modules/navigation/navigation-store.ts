import { create } from "zustand";

export interface WorkspaceTabItem {
  key: string;
  path: string;
  label: string;
  defaultLabel?: string;
  temporaryLabel?: string;
  closable: boolean;
}

interface NavigationState {
  tabs: WorkspaceTabItem[];
  activeKey?: string;
  refreshKeys: Record<string, number>;
  clear: () => void;
  openTab: (tab: WorkspaceTabItem) => void;
  closeTab: (key: string) => void;
  closeOtherTabs: (key: string) => void;
  refreshTab: (key: string) => void;
  renameTab: (key: string, label?: string) => void;
  setActiveKey: (key: string) => void;
}

function resolveAdjacentActiveKey(tabs: WorkspaceTabItem[], key: string) {
  const currentIndex = tabs.findIndex((item) => item.key === key);

  if (currentIndex < 0) {
    return tabs.at(-1)?.key;
  }

  return tabs[currentIndex + 1]?.key ?? tabs[currentIndex - 1]?.key;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  tabs: [],
  activeKey: undefined,
  refreshKeys: {},
  clear: () => set({ tabs: [], activeKey: undefined, refreshKeys: {} }),
  openTab: (tab) =>
    set((state) => ({
      tabs: state.tabs.some((item) => item.key === tab.key)
        ? state.tabs.map((item) => {
          if (item.key !== tab.key) {
            return item;
          }

          const defaultLabel = tab.defaultLabel ?? tab.label;

          return {
            ...item,
            ...tab,
            defaultLabel,
            label: item.temporaryLabel ?? defaultLabel,
          };
        })
        : [
          ...state.tabs,
          {
            ...tab,
            defaultLabel: tab.defaultLabel ?? tab.label,
            label: tab.temporaryLabel ?? (tab.defaultLabel ?? tab.label),
          },
        ],
      activeKey: tab.key,
      refreshKeys: state.refreshKeys[tab.key] !== undefined ? state.refreshKeys : { ...state.refreshKeys, [tab.key]: 0 },
    })),
  closeTab: (key) =>
    set((state) => {
      const tabs = state.tabs.filter((item) => item.key !== key);
      const { [key]: _removedRefreshKey, ...refreshKeys } = state.refreshKeys;

      return {
        tabs,
        activeKey: state.activeKey === key ? resolveAdjacentActiveKey(state.tabs, key) : state.activeKey,
        refreshKeys,
      };
    }),
  closeOtherTabs: (key) =>
    set((state) => {
      const tabs = state.tabs.filter((item) => item.key === key);

      return {
        tabs,
        activeKey: key,
        refreshKeys: { [key]: state.refreshKeys[key] ?? 0 },
      };
    }),
  refreshTab: (key) =>
    set((state) => ({
      refreshKeys: {
        ...state.refreshKeys,
        [key]: (state.refreshKeys[key] ?? 0) + 1,
      },
    })),
  renameTab: (key, label) =>
    set((state) => ({
      tabs: state.tabs.map((item) => {
        if (item.key !== key) {
          return item;
        }

        const temporaryLabel = label?.trim() || undefined;
        const defaultLabel = item.defaultLabel ?? item.label;

        return {
          ...item,
          defaultLabel,
          temporaryLabel,
          label: temporaryLabel ?? defaultLabel,
        };
      }),
    })),
  setActiveKey: (key) => set({ activeKey: key }),
}));
