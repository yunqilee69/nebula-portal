import type { ColumnsType } from "antd/es/table";
import type { PaginationProps, TableProps } from "antd";
import { Avatar, Empty, Input, Pagination, Select, Space, Spin, Table, Tag, Typography } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type OrganizationItem, type RoleItem, type UserItem, type UserPageQuery, useI18n } from "@nebula/core";
import { fetchUserPage } from "@nebula/pages-web/api/user-api";
import { fetchOrganizationList } from "@nebula/pages-web/api/organization-api";
import { fetchRoleList } from "@nebula/pages-web/api/role-api";

import { NeModal } from "../ne-modal/ne-modal";
import type { NeUserPickerModalProps } from "./types";

const PAGE_SIZE = 10;
const DEBOUNCE_MS = 300;

function getUserDisplayName(user: UserItem) {
  return user.nickname || user.username;
}

function applyClientSideFilters(users: UserItem[], options: { selectedRoleId?: string; excludeUserIds?: string[]; includeUserIds?: string[] }) {
  const { selectedRoleId, excludeUserIds = [], includeUserIds = [] } = options;
  const excludeSet = new Set(excludeUserIds);
  const includeSet = new Set(includeUserIds);

  return users.filter((user) => {
    if (excludeSet.has(user.id) && !includeSet.has(user.id)) {
      return false;
    }

    if (includeSet.size > 0 && !includeSet.has(user.id)) {
      return false;
    }

    if (!selectedRoleId) {
      return true;
    }

    return user.roles?.some((role) => role.id === selectedRoleId) ?? false;
  });
}

function getStatusColor(status: UserItem["status"]) {
  return status === 1 ? "success" : "error";
}

function getStatusLabel(status: UserItem["status"], t: ReturnType<typeof useI18n>["t"]) {
  return status === 1 ? t("common.enabled") : t("common.disabled");
}

export function NeUserPickerModal(props: NeUserPickerModalProps) {
  const {
    open,
    onOpenChange,
    mode = "single",
    selectedIds,
    onSelectedIdsChange,
    onComplete,
    showOrgFilter = true,
    showRoleFilter = true,
    showStatusFilter = true,
    defaultOrgId,
    defaultRoleId,
    title,
    width,
    excludeUserIds,
    includeUserIds,
    fetchUsers = fetchUserPage,
    fetchOrganizations = fetchOrganizationList,
    fetchRoles = fetchRoleList,
  } = props;
  const { t } = useI18n();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(defaultOrgId);
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(defaultRoleId);
  const [selectedStatus, setSelectedStatus] = useState<number | undefined>(undefined);
  const [orgOptions, setOrgOptions] = useState<OrganizationItem[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleItem[]>([]);
  const userCacheRef = useRef<Map<string, UserItem>>(new Map());
  const debounceTimerRef = useRef<number | null>(null);

  const isMultiple = mode === "multiple";

  const selectedUsers = useMemo(
    () => selectedIds.map((id) => userCacheRef.current.get(id)).filter((user): user is UserItem => Boolean(user)),
    [selectedIds, users],
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);

    try {
      const query: UserPageQuery = {
        pageNum,
        pageSize: PAGE_SIZE,
        orgId: selectedOrgId,
        status: selectedStatus,
      };

      const trimmedKeyword = keyword.trim();
      if (trimmedKeyword) {
        query.username = trimmedKeyword;
        query.nickname = trimmedKeyword;
        query.email = trimmedKeyword;
        query.phone = trimmedKeyword;
      }

      const response = await fetchUsers(query);
      const filteredUsers = applyClientSideFilters(response.data, {
        selectedRoleId,
        excludeUserIds,
        includeUserIds,
      });

      filteredUsers.forEach((user) => {
        userCacheRef.current.set(user.id, user);
      });

      setUsers(filteredUsers);
      setTotal(selectedRoleId || excludeUserIds?.length || includeUserIds?.length ? filteredUsers.length : response.total);
    } finally {
      setLoading(false);
    }
  }, [excludeUserIds, fetchUsers, includeUserIds, keyword, pageNum, selectedOrgId, selectedRoleId, selectedStatus]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setKeyword("");
    setPageNum(1);
    setSelectedOrgId(defaultOrgId);
    setSelectedRoleId(defaultRoleId);
    setSelectedStatus(undefined);
  }, [defaultOrgId, defaultRoleId, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    Promise.all([fetchOrganizations(), fetchRoles()])
      .then(([organizations, roles]) => {
        setOrgOptions(organizations);
        setRoleOptions(roles);
      })
      .catch(() => {
        setOrgOptions([]);
        setRoleOptions([]);
      });
  }, [fetchOrganizations, fetchRoles, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    loadUsers().catch(() => {
      setUsers([]);
      setTotal(0);
    });
  }, [loadUsers, open]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleKeywordChange = useCallback((value: string) => {
    setPageNum(1);

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      setKeyword(value);
    }, DEBOUNCE_MS);
  }, []);

  const handleRowSelect = useCallback(
    (nextSelectedIds: string[], nextRows: UserItem[]) => {
      nextRows.forEach((user) => {
        userCacheRef.current.set(user.id, user);
      });
      onSelectedIdsChange(nextSelectedIds);
    },
    [onSelectedIdsChange],
  );

  const handleConfirm = useCallback(() => {
    onComplete(selectedUsers);
    onOpenChange(false);
  }, [onComplete, onOpenChange, selectedUsers]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const columns = useMemo<ColumnsType<UserItem>>(
    () => [
      {
        title: t("common.user"),
        dataIndex: "username",
        render: (_value: string, row) => (
          <Space size={10}>
            <Avatar src={row.avatar}>{getUserDisplayName(row).slice(0, 1)}</Avatar>
            <Space direction="vertical" size={0}>
              <Typography.Text strong>{getUserDisplayName(row)}</Typography.Text>
              <Typography.Text type="secondary">{row.username}</Typography.Text>
            </Space>
          </Space>
        ),
      },
      {
        title: t("common.email"),
        dataIndex: "email",
        render: (value: string | undefined) => value ?? "-",
      },
      {
        title: t("common.phone"),
        dataIndex: "phone",
        render: (value: string | undefined) => value ?? "-",
      },
      {
        title: t("common.status"),
        dataIndex: "status",
        render: (value: UserItem["status"]) => <Tag color={getStatusColor(value)}>{getStatusLabel(value, t)}</Tag>,
      },
    ],
    [t],
  );

  const rowSelection = useMemo<TableProps<UserItem>["rowSelection"]>(
    () => ({
      type: isMultiple ? "checkbox" : "radio",
      selectedRowKeys: selectedIds,
      preserveSelectedRowKeys: isMultiple,
      onChange: (keys, rows) => handleRowSelect(keys.map(String), rows),
    }),
    [handleRowSelect, isMultiple, selectedIds],
  );

  return (
    <NeModal
      title={title ?? t("common.select")}
      open={open}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      confirmText={t("common.confirm")}
      cancelText={t("common.cancel")}
      width={typeof width === "number" ? width : 860}
      bodyHeight={620}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Space wrap size={12} style={{ width: "100%" }}>
          {showOrgFilter ? (
            <Select
              allowClear
              value={selectedOrgId}
              style={{ width: 180 }}
              placeholder={t("common.organization")}
              options={orgOptions.map((item) => ({ label: item.name, value: item.id }))}
              onChange={(value) => {
                setPageNum(1);
                setSelectedOrgId(value);
              }}
            />
          ) : null}
          {showRoleFilter ? (
            <Select
              allowClear
              value={selectedRoleId}
              style={{ width: 180 }}
              placeholder={t("common.role")}
              options={roleOptions.map((item) => ({ label: item.name, value: item.id }))}
              onChange={(value) => {
                setPageNum(1);
                setSelectedRoleId(value);
              }}
            />
          ) : null}
          {showStatusFilter ? (
            <Select
              allowClear
              value={selectedStatus}
              style={{ width: 140 }}
              placeholder={t("common.status")}
              options={[
                { label: t("common.enabled"), value: 1 },
                { label: t("common.disabled"), value: 0 },
              ]}
              onChange={(value) => {
                setPageNum(1);
                setSelectedStatus(value);
              }}
            />
          ) : null}
          <Input.Search
            allowClear
            style={{ minWidth: 240, flex: 1 }}
            placeholder={t("common.search")}
            onChange={(event) => handleKeywordChange(event.target.value)}
          />
        </Space>

        <Typography.Text type="secondary">
          {t("common.recordCount", undefined, { count: selectedIds.length })}
        </Typography.Text>

        <Spin spinning={loading}>
          <Table<UserItem>
            rowKey="id"
            size="middle"
            dataSource={users}
            columns={columns}
            pagination={false}
            rowSelection={rowSelection}
            locale={{
              emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} />,
            }}
          />
        </Spin>

        <Pagination
          align="end"
          current={pageNum}
          pageSize={PAGE_SIZE}
          total={total}
          onChange={(nextPageNum) => setPageNum(nextPageNum)}
        />
      </Space>
    </NeModal>
  );
}
