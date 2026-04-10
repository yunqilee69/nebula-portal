import { create } from "zustand";
import type { DictMap } from "../types";

const STORAGE_KEY = "nebula-shell-dicts";

function readStoredRecords(): DictMap {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {} satisfies DictMap;
  }

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as DictMap) : ({} satisfies DictMap);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return {} satisfies DictMap;
  }
}

function persistRecords(records: DictMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function hasRecord(records: DictMap, dictCode: string): boolean {
  return Object.prototype.hasOwnProperty.call(records, dictCode);
}

interface DictState {
  records: DictMap;
  setRecords: (records: DictMap) => void;
  setRecord: (dictCode: string, records: DictMap[string]) => void;
  clear: () => void;
}

export const useDictStore = create<DictState>((set) => ({
  records: readStoredRecords(),
  setRecords: (records) =>
    set((state) => {
      const next = { ...state.records, ...records };
      persistRecords(next);
      return { records: next };
    }),
  setRecord: (dictCode, records) =>
    set((state) => {
      const next = { ...state.records, [dictCode]: records };
      persistRecords(next);
      return { records: next };
    }),
  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ records: {} });
  },
}));

const inflightDictRequests = new Map<string, Promise<DictMap[string]>>();

export async function ensureDictRecords(dictCode: string, fetchFn: () => Promise<DictMap[string]>) {
  const state = useDictStore.getState();
  if (hasRecord(state.records, dictCode)) {
    return state.records[dictCode] ?? [];
  }

  const inflight = inflightDictRequests.get(dictCode);
  if (inflight) {
    return inflight;
  }

  const request = fetchFn()
    .then((records) => {
      useDictStore.getState().setRecord(dictCode, records);
      return records;
    })
    .finally(() => {
      inflightDictRequests.delete(dictCode);
    });

  inflightDictRequests.set(dictCode, request);
  return request;
}

export function hasStoredDictRecords(dictCode: string) {
  return hasRecord(useDictStore.getState().records, dictCode);
}
