import { create } from "zustand";
import type { MenuItem } from "@platform/core";

interface MenuState {
  menus: MenuItem[];
  setMenus: (menus: MenuItem[]) => void;
  appendShellMenus: (menus: MenuItem[]) => void;
  clear: () => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  menus: [],
  setMenus: (menus) => set({ menus }),
  appendShellMenus: (menus) =>
    set((state) => ({
      menus: [...state.menus, ...menus.filter((menu) => !state.menus.some((existing) => existing.id === menu.id))],
    })),
  clear: () => set({ menus: [] }),
}));
