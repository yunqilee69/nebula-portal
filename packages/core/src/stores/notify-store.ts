import { create } from "zustand";
import type { NotificationItem } from "../types";

interface NotifyState {
  items: NotificationItem[];
  setItems: (items: NotificationItem[]) => void;
  addItem: (item: NotificationItem) => void;
  markRead: (id: string) => void;
  markReadMany: (ids: string[]) => void;
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
  markReadMany: (ids) => {
    const idSet = new Set(ids);
    set((state) => ({
      items: state.items.map((item) => (idSet.has(item.id) ? { ...item, read: true } : item)),
    }));
  },
  clear: () => set({ items: [] }),
}));
