export function hasSessionToken(value) {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const candidate = value;
    return typeof candidate.token === "string" && candidate.token.length > 0;
}
export function parseStoredSession(raw, deserialize) {
    if (!raw) {
        return null;
    }
    try {
        return deserialize(JSON.parse(raw));
    }
    catch {
        return null;
    }
}
export function stringifyStoredSession(session) {
    return JSON.stringify(session);
}
