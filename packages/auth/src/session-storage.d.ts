export declare function hasSessionToken(value: unknown): value is {
    token: string;
};
export declare function parseStoredSession<T>(raw: string | null, deserialize: (value: unknown) => T | null): T | null;
export declare function stringifyStoredSession<T>(session: T): string;
//# sourceMappingURL=session-storage.d.ts.map