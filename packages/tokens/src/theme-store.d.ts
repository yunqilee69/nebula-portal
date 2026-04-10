export interface StorageAdapter {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
}
export interface ThemeSnapshot {
    themeCode: string;
    themeName: string;
    builtinFlag: boolean;
    themeConfig: Record<string, string>;
}
interface ThemeState {
    hydrated: boolean;
    currentTheme: ThemeSnapshot;
    availableThemes: ThemeSnapshot[];
    storageAdapter: StorageAdapter;
    configureThemeStorage: (adapter: StorageAdapter) => void;
    hydrate: (themeCode: string, themes?: ThemeSnapshot[]) => void;
    setAvailableThemes: (themes: ThemeSnapshot[]) => void;
    applyTheme: (themeCode: string) => ThemeSnapshot;
}
export declare const builtinThemeCatalog: {
    themes: {
        themeCode: string;
        themeName: string;
        builtinFlag: true;
        themeConfig: Record<string, string>;
    }[];
};
export declare const useThemeStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ThemeState>>;
export {};
//# sourceMappingURL=theme-store.d.ts.map