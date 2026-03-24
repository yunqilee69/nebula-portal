export function hasSessionToken(value: unknown): value is { token: string } {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.token === "string" && candidate.token.length > 0;
}

export function parseStoredSession<T>(raw: string | null, deserialize: (value: unknown) => T | null): T | null {
  if (!raw) {
    return null;
  }

  try {
    return deserialize(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function stringifyStoredSession<T>(session: T) {
  return JSON.stringify(session);
}
