import { Avatar, Tag, Typography } from "antd";
import type { UserItem } from "@nebula/core";

import type { NeUserPickerTriggerProps } from "./types";

function getUserDisplayName(user: UserItem) {
  return user.nickname || user.username;
}

function renderUserTag(user: UserItem, disabled: boolean, onRemove?: (userId: string) => void) {
  return (
    <Tag
      key={user.id}
      className="ne-user-picker-trigger__tag"
      closable={!disabled}
      onClose={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (disabled) {
          return;
        }
        onRemove?.(user.id);
      }}
    >
      <Avatar size={20} src={user.avatar} className="ne-user-picker-trigger__avatar">
        {getUserDisplayName(user).slice(0, 1)}
      </Avatar>
      <Typography.Text className="ne-user-picker-trigger__name">{getUserDisplayName(user)}</Typography.Text>
    </Tag>
  );
}

export function NeUserPickerTrigger(props: NeUserPickerTriggerProps) {
  const { selectedUsers, mode = "single", maxTagCount, placeholder, disabled = false, onClick, onRemove } = props;

  if (selectedUsers.length === 0) {
    return (
      <div
        className={["ne-user-picker-trigger", disabled ? "ne-user-picker-trigger--disabled" : null].filter(Boolean).join(" ")}
        onClick={disabled ? undefined : onClick}
        aria-disabled={disabled}
      >
        <Typography.Text type="secondary" className="ne-user-picker-trigger__placeholder">
          {placeholder}
        </Typography.Text>
      </div>
    );
  }

  const isMultiple = mode === "multiple";
  const visibleUsers = isMultiple && typeof maxTagCount === "number" && maxTagCount >= 0
    ? selectedUsers.slice(0, maxTagCount)
    : selectedUsers;
  const overflowCount = isMultiple ? selectedUsers.length - visibleUsers.length : 0;
  const singleUser = selectedUsers[0];

  return (
    <div
      className={["ne-user-picker-trigger", disabled ? "ne-user-picker-trigger--disabled" : null].filter(Boolean).join(" ")}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
    >
      {isMultiple ? visibleUsers.map((user) => renderUserTag(user, disabled, onRemove)) : renderUserTag(singleUser, disabled, onRemove)}
      {isMultiple && overflowCount > 0 ? <Tag className="ne-user-picker-trigger__overflow">+{overflowCount} more</Tag> : null}
    </div>
  );
}
