import { getArray, getRecord, getString, unwrapEnvelope } from "@nebula/request";
import { normalizeSessionExpiry } from "./session-utils";
export function toUserProfile(candidate) {
    const record = getRecord(candidate) ?? {};
    return {
        userId: getString(record.userId) ?? getString(record.id) ?? "demo-user",
        username: getString(record.username) ?? getString(record.nickname) ?? getString(record.nickName) ?? "Demo User",
        avatar: getString(record.avatar),
        roles: getArray(record.roles ?? record.roleCodeList),
    };
}
export function normalizeTokenPayload(payload) {
    const data = unwrapEnvelope(payload);
    return {
        token: getString(data.token) ?? getString(data.accessToken) ?? "",
        refreshToken: getString(data.refreshToken),
        accessTokenExpiresIn: typeof data.accessTokenExpiresIn === "number" ? data.accessTokenExpiresIn : undefined,
        refreshTokenExpiresIn: typeof data.refreshTokenExpiresIn === "number" ? data.refreshTokenExpiresIn : undefined,
    };
}
export function normalizeCurrentUser(payload, options = {}) {
    const data = unwrapEnvelope(payload);
    const menuSource = data.menuList ?? data.menus ?? [];
    return {
        user: toUserProfile(data),
        permissions: getArray(data.permissions ?? data.permissionCodeList),
        menuList: options.normalizeMenuList ? options.normalizeMenuList(menuSource) : undefined,
    };
}
export function buildSessionFromPayload(payload, currentUser) {
    const { token, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn } = normalizeTokenPayload(payload);
    return normalizeSessionExpiry({
        token,
        refreshToken,
        accessTokenExpiresIn,
        refreshTokenExpiresIn,
        user: currentUser.user,
        permissions: currentUser.permissions,
        menuList: currentUser.menuList,
    });
}
export function mergeSessionWithCurrentUser(session, currentUser) {
    return normalizeSessionExpiry({
        ...session,
        user: currentUser.user,
        permissions: currentUser.permissions,
        menuList: currentUser.menuList,
    });
}
