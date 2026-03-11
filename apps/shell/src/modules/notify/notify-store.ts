import { create } from "zustand";
import type { NotificationItem } from "@platform/core";

interface NotifyState {
  items: NotificationItem[];
  setItems: (items: NotificationItem[]) => void;
  addItem: (item: NotificationItem) => void;
  markRead: (id: string) => void;
  clear: () => void;
}

export const useNotifyStore = create<NotifyState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
  markRead: (id) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    })),
  clear: () => set({ items: [] }),
}));
