import type { UserItem } from "@nebula/core";
import { fetchUserPage } from "@nebula/pages-web/api/user-api";
import { fetchOrganizationList } from "@nebula/pages-web/api/organization-api";
import { fetchRoleList } from "@nebula/pages-web/api/role-api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { NeUserPickerModal } from "./ne-user-picker-modal";
import { NeUserPickerTrigger } from "./ne-user-picker-trigger";
import type { NeUserPickerProps } from "./types";

function normalizeValue(value: string | string[] | undefined) {
  if (typeof value === "string") {
    return value ? [value] : [];
  }

  return value ?? [];
}

export function NeUserPicker(props: NeUserPickerProps) {
  const {
    mode = "multiple",
    value,
    onChange,
    placeholder = "请选择用户",
    disabled = false,
    maxTagCount = 3,
    showOrgFilter = true,
    showRoleFilter = true,
    showStatusFilter = false,
    defaultOrgId,
    defaultRoleId,
    modalTitle,
    modalWidth = 600,
    excludeUserIds,
    includeUserIds,
    fetchUsers = fetchUserPage,
    fetchOrganizations = fetchOrganizationList,
    fetchRoles = fetchRoleList,
  } = props;
  const [open, setOpen] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[]>(() => normalizeValue(value));
  const userCacheRef = useRef<Map<string, UserItem>>(new Map());

  const selectedIds = useMemo(() => normalizeValue(value), [value]);
  const selectedUsers = useMemo(
    () => selectedIds.map((id) => userCacheRef.current.get(id)).filter((user): user is UserItem => Boolean(user)),
    [selectedIds],
  );

  useEffect(() => {
    setPendingIds(selectedIds);
  }, [selectedIds]);

  const handleSelectedIdsChange = useCallback((nextSelectedIds: string[]) => {
    setPendingIds(nextSelectedIds);
  }, []);

  const handleComplete = useCallback(
    (users: UserItem[]) => {
      users.forEach((user) => {
        userCacheRef.current.set(user.id, user);
      });

      const nextValue = mode === "single" ? pendingIds[0] : pendingIds;
      onChange?.(nextValue, users);
    },
    [mode, onChange, pendingIds],
  );

  const handleRemove = useCallback(
    (userId: string) => {
      const nextSelectedIds = selectedIds.filter((id) => id !== userId);
      const nextSelectedUsers = nextSelectedIds
        .map((id) => userCacheRef.current.get(id))
        .filter((user): user is UserItem => Boolean(user));

      onChange?.(mode === "single" ? nextSelectedIds[0] : nextSelectedIds, nextSelectedUsers);
    },
    [mode, onChange, selectedIds],
  );

  const handleClick = useCallback(() => {
    if (disabled) {
      return;
    }

    setPendingIds(selectedIds);
    setOpen(true);
  }, [disabled, selectedIds]);

  return (
    <>
      <NeUserPickerTrigger
        selectedUsers={selectedUsers}
        mode={mode}
        maxTagCount={maxTagCount}
        placeholder={placeholder}
        disabled={disabled}
        onClick={handleClick}
        onRemove={handleRemove}
      />
      <NeUserPickerModal
        open={open}
        onOpenChange={setOpen}
        mode={mode}
        selectedIds={pendingIds}
        onSelectedIdsChange={handleSelectedIdsChange}
        onComplete={handleComplete}
        showOrgFilter={showOrgFilter}
        showRoleFilter={showRoleFilter}
        showStatusFilter={showStatusFilter}
        defaultOrgId={defaultOrgId}
        defaultRoleId={defaultRoleId}
        title={modalTitle}
        width={modalWidth}
        excludeUserIds={excludeUserIds}
        includeUserIds={includeUserIds}
        fetchUsers={fetchUsers}
        fetchOrganizations={fetchOrganizations}
        fetchRoles={fetchRoles}
      />
    </>
  );
}
