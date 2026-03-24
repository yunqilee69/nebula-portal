import type { AuthSession } from "@platform/core";
import { buildSessionFromPayload, mergeSessionWithCurrentUser, normalizeCurrentUser as normalizeSharedCurrentUser, normalizeTokenPayload, toUserProfile } from "@nebula/auth";
import { normalizeMenus } from "../../api/menu-api";
import { unwrapEnvelope } from "../../api/client";

export function normalizeCurrentUser(payload: unknown) {
  return normalizeSharedCurrentUser(unwrapEnvelope<Record<string, unknown>>(payload), {
    normalizeMenuList: normalizeMenus,
  });
}

export { buildSessionFromPayload, mergeSessionWithCurrentUser, normalizeTokenPayload, toUserProfile };
