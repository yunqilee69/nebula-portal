import type {
  OrganizationItem,
  RoleItem,
  UserItem,
  UserPageQuery,
  UserPageResult,
} from "@nebula/core";

export type UserPickerMode = "single" | "multiple";

export type UserPickerValue = string | string[] | undefined;

export type FetchUsersFn = (query: UserPageQuery) => Promise<UserPageResult>;

export type FetchOrganizationsFn = () => Promise<OrganizationItem[]>;

export type FetchRolesFn = () => Promise<RoleItem[]>;

export interface NeUserPickerProps {
  /** Selection mode for the picker trigger and modal. */
  mode?: UserPickerMode;
  /** Currently selected user id or user id list. */
  value?: UserPickerValue;
  /** Called when the selected value changes. */
  onChange?: (value: UserPickerValue, users: UserItem[]) => void;
  /** Placeholder text shown when no user is selected. */
  placeholder?: string;
  /** Disables the picker trigger and remove actions. */
  disabled?: boolean;
  /** Maximum number of tags shown before collapsing the remainder. */
  maxTagCount?: number | "responsive";
  /** Whether to show the organization filter in the modal. */
  showOrgFilter?: boolean;
  /** Whether to show the role filter in the modal. */
  showRoleFilter?: boolean;
  /** Whether to show the status filter in the modal. */
  showStatusFilter?: boolean;
  /** Default organization id applied when the modal opens. */
  defaultOrgId?: string;
  /** Default role id applied when the modal opens. */
  defaultRoleId?: string;
  /** Title displayed in the selection modal. */
  modalTitle?: string;
  /** Width applied to the selection modal. */
  modalWidth?: number | string;
  /** User ids that must be excluded from selection results. */
  excludeUserIds?: string[];
  /** User ids that should remain available even when external filtering is applied. */
  includeUserIds?: string[];
  /** Async data source used to fetch paginated users by filter conditions. */
  fetchUsers: FetchUsersFn;
  /** Async data source used to fetch organization filter options. */
  fetchOrganizations?: FetchOrganizationsFn;
  /** Async data source used to fetch role filter options. */
  fetchRoles?: FetchRolesFn;
}

export interface NeUserPickerModalProps {
  /** Controls whether the selection modal is open. */
  open: boolean;
  /** Called when the modal open state changes. */
  onOpenChange: (open: boolean) => void;
  /** Selection mode for the modal list behavior. */
  mode?: UserPickerMode;
  /** Currently selected user ids managed by the modal. */
  selectedIds: string[];
  /** Called when the modal selection changes. */
  onSelectedIdsChange: (selectedIds: string[]) => void;
  /** Called when the user confirms the current selection. */
  onComplete: (users: UserItem[]) => void;
  /** Whether to show the organization filter in the modal toolbar. */
  showOrgFilter?: boolean;
  /** Whether to show the role filter in the modal toolbar. */
  showRoleFilter?: boolean;
  /** Whether to show the status filter in the modal toolbar. */
  showStatusFilter?: boolean;
  /** Default organization id applied to the first modal query. */
  defaultOrgId?: string;
  /** Default role id applied to the first modal query. */
  defaultRoleId?: string;
  /** Modal title text. */
  title?: string;
  /** Modal width. */
  width?: number | string;
  /** User ids that must be removed from selectable results. */
  excludeUserIds?: string[];
  /** User ids that should remain selectable even when other filters apply. */
  includeUserIds?: string[];
  /** Async data source used to fetch paginated users by filter conditions. */
  fetchUsers: FetchUsersFn;
  /** Async data source used to fetch organization filter options. */
  fetchOrganizations?: FetchOrganizationsFn;
  /** Async data source used to fetch role filter options. */
  fetchRoles?: FetchRolesFn;
}

export interface NeUserPickerTriggerProps {
  /** Fully resolved users used to render selected labels and avatars. */
  selectedUsers: UserItem[];
  /** Selection mode used for trigger rendering. */
  mode?: UserPickerMode;
  /** Maximum number of tags shown before collapsing the remainder. */
  maxTagCount?: number | "responsive";
  /** Placeholder text shown when no user is selected. */
  placeholder?: string;
  /** Disables trigger interactions and remove actions. */
  disabled?: boolean;
  /** Called when the trigger is clicked to open the modal. */
  onClick?: () => void;
  /** Called when a selected user is removed from the trigger. */
  onRemove?: (userId: string) => void;
}
