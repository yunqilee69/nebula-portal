import { create } from "zustand";
import type { MenuItem } from "../types";

interface MenuState {
  menus: MenuItem[];
  setMenus: (menus: MenuItem[]) => void;
  appendNebulaMenus: (menus: MenuItem[]) => void;
  clear: () => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  menus: [],
  setMenus: (menus) => set({ menus }),
  appendNebulaMenus: (menus) =>
    set((state) => ({
      menus: [...state.menus, ...menus.filter((menu) => !state.menus.some((existing) => existing.id === menu.id))],
    })),
  clear: () => set({ menus: [] }),
}));
