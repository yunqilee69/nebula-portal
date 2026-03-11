import type { PlatformEventBus, PlatformEvents } from "./types";

type Handler<K extends keyof PlatformEvents> = (payload: PlatformEvents[K]) => void;

class EventBus implements PlatformEventBus {
  private listeners = new Map<keyof PlatformEvents | string, Set<Handler<keyof PlatformEvents>>>();

  on<K extends keyof PlatformEvents>(event: K, handler: Handler<K>) {
    const current = this.listeners.get(event) ?? new Set();
    current.add(handler as Handler<keyof PlatformEvents>);
    this.listeners.set(event, current);
    return () => this.off(event, handler);
  }

  emit<K extends keyof PlatformEvents>(event: K, payload: PlatformEvents[K]) {
    this.listeners.get(event)?.forEach((listener) => {
      listener(payload as PlatformEvents[keyof PlatformEvents]);
    });
  }

  off<K extends keyof PlatformEvents>(event: K, handler: Handler<K>) {
    const current = this.listeners.get(event);
    current?.delete(handler as Handler<keyof PlatformEvents>);
    if (current && current.size === 0) {
      this.listeners.delete(event);
    }
  }
}

export const eventBus = new EventBus();
