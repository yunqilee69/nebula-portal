import { DeleteOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Badge, Button, Descriptions, Input, Popconfirm, Space, Table, Tag, Typography, message } from "antd";
import { useI18n } from "@nebula/core";
import { NeEmptyState, NePage, NePanel } from "@nebula/ui-web";
import { useEffect, useMemo, useState } from "react";
import type { FrontendCacheEntry, FrontendCacheGroup } from "../../../api/frontend-api";
import { deleteFrontendCacheEntry, fetchFrontendCaches } from "../../../api/frontend-api";

interface CachePageState {
  loading: boolean;
  deleteLoading: boolean;
  groups: FrontendCacheGroup[];
  activeCacheName: string | null;
  selectedCacheKey: string | null;
  selectedCacheKeys: string[];
  groupKeyword: string;
  keyKeyword: string;
}

const initialState: CachePageState = {
  loading: false,
  deleteLoading: false,
  groups: [],
  activeCacheName: null,
  selectedCacheKey: null,
  selectedCacheKeys: [],
  groupKeyword: "",
  keyKeyword: "",
};

function formatSeconds(seconds?: number | null) {
  if (seconds == null) {
    return "-";
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function resolveRemainingTtlTone(seconds: number | null) {
  if (seconds == null) {
    return "default";
  }
  if (seconds <= 60) {
    return "error";
  }
  if (seconds <= 300) {
    return "warning";
  }
  return "success";
}

function resolveActiveCacheName(groups: FrontendCacheGroup[], current: string | null) {
  if (current && groups.some((group) => group.cacheName === current)) {
    return current;
  }
  const firstNonEmptyGroup = groups.find((group) => group.entryCount > 0);
  return firstNonEmptyGroup?.cacheName ?? groups[0]?.cacheName ?? null;
}

function getActiveGroup(groups: FrontendCacheGroup[], activeCacheName: string | null) {
  return groups.find((group) => group.cacheName === activeCacheName) ?? null;
}

function resolveSelectedCacheKey(group: FrontendCacheGroup | null, current: string | null) {
  if (!group || group.entries.length === 0) {
    return null;
  }
  if (current && group.entries.some((entry) => entry.cacheKey === current)) {
    return current;
  }
  return group.entries[0]?.cacheKey ?? null;
}

function buildValuePreview(value: string | null, limit = 72) {
  if (!value) {
    return "-";
  }
  const compactValue = value.replace(/\s+/g, " ").trim();
  if (compactValue.length <= limit) {
    return compactValue;
  }
  return `${compactValue.slice(0, limit)}...`;
}

export function AdvancedCachePage() {
  const { t } = useI18n();
  const [state, setState] = useState<CachePageState>(initialState);

  const activeGroup = useMemo(
    () => getActiveGroup(state.groups, state.activeCacheName),
    [state.activeCacheName, state.groups],
  );

  const filteredGroups = useMemo(() => {
    const keyword = state.groupKeyword.trim().toLowerCase();
    if (!keyword) {
      return state.groups;
    }
    return state.groups.filter((group) => group.cacheName.toLowerCase().includes(keyword));
  }, [state.groupKeyword, state.groups]);

  const selectedEntry = useMemo(
    () => activeGroup?.entries.find((entry) => entry.cacheKey === state.selectedCacheKey) ?? null,
    [activeGroup, state.selectedCacheKey],
  );

  const filteredEntries = useMemo(() => {
    const keyword = state.keyKeyword.trim().toLowerCase();
    if (!activeGroup) {
      return [];
    }
    if (!keyword) {
      return activeGroup.entries;
    }
    return activeGroup.entries.filter((entry) => entry.cacheKey.toLowerCase().includes(keyword));
  }, [activeGroup, state.keyKeyword]);

  async function loadGroups() {
    setState((current) => ({ ...current, loading: true }));
    try {
      const groups = await fetchFrontendCaches();
      setState((current) => {
        const activeCacheName = resolveActiveCacheName(groups, current.activeCacheName);
        const activeGroup = getActiveGroup(groups, activeCacheName);
        return {
          ...current,
          loading: false,
          groups,
          activeCacheName,
          selectedCacheKey: resolveSelectedCacheKey(activeGroup, current.selectedCacheKey),
          selectedCacheKeys: current.selectedCacheKeys.filter((cacheKey) => activeGroup?.entries.some((entry) => entry.cacheKey === cacheKey) ?? false),
        };
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : t("frontend.cache.loadFailed"));
      setState((current) => ({ ...current, loading: false }));
    }
  }

  useEffect(() => {
    void loadGroups();
  }, []);

  useEffect(() => {
    if (filteredGroups.length === 0) {
      if (state.activeCacheName !== null || state.selectedCacheKey !== null) {
        setState((current) => ({
          ...current,
          activeCacheName: null,
          selectedCacheKey: null,
          selectedCacheKeys: [],
        }));
      }
      return;
    }

    if (!state.activeCacheName || !filteredGroups.some((group) => group.cacheName === state.activeCacheName)) {
      const nextActiveGroup = filteredGroups[0] ?? null;
      setState((current) => ({
        ...current,
        activeCacheName: nextActiveGroup?.cacheName ?? null,
        selectedCacheKey: resolveSelectedCacheKey(nextActiveGroup, null),
        selectedCacheKeys: [],
        keyKeyword: "",
      }));
    }
  }, [filteredGroups, state.activeCacheName, state.selectedCacheKey]);

  useEffect(() => {
    if (!activeGroup) {
      if (state.selectedCacheKey !== null) {
        setState((current) => ({ ...current, selectedCacheKey: null, selectedCacheKeys: [] }));
      }
      return;
    }

    if (filteredEntries.length === 0) {
      if (state.selectedCacheKey !== null || state.selectedCacheKeys.length > 0) {
        setState((current) => ({ ...current, selectedCacheKey: null, selectedCacheKeys: [] }));
      }
      return;
    }

    if (!state.selectedCacheKey || !filteredEntries.some((entry) => entry.cacheKey === state.selectedCacheKey)) {
      setState((current) => ({
        ...current,
        selectedCacheKey: filteredEntries[0]?.cacheKey ?? null,
      }));
    }
  }, [activeGroup, filteredEntries, state.selectedCacheKey, state.selectedCacheKeys.length]);

  useEffect(() => {
    if (state.selectedCacheKeys.length === 0) {
      return;
    }

    const visibleSelectedKeys = state.selectedCacheKeys.filter((cacheKey) => filteredEntries.some((entry) => entry.cacheKey === cacheKey));
    if (visibleSelectedKeys.length !== state.selectedCacheKeys.length) {
      setState((current) => ({ ...current, selectedCacheKeys: visibleSelectedKeys }));
    }
  }, [filteredEntries, state.selectedCacheKeys]);

  async function handleDeleteSelected() {
    if (!activeGroup || state.selectedCacheKeys.length === 0) {
      return;
    }

    const selectedCount = state.selectedCacheKeys.length;
    setState((current) => ({ ...current, deleteLoading: true }));
    try {
      const results = await Promise.allSettled(
        state.selectedCacheKeys.map((cacheKey) => deleteFrontendCacheEntry(activeGroup.cacheName, cacheKey)),
      );
      const successCount = results.filter((result) => result.status === "fulfilled").length;
      const failedCount = selectedCount - successCount;

      setState((current) => ({ ...current, selectedCacheKeys: [] }));
      await loadGroups();

      if (failedCount === 0) {
        message.success(t("frontend.cache.batchDeleteSuccess", undefined, { count: successCount }));
        return;
      }

      if (successCount > 0) {
        message.warning(t("frontend.cache.batchDeletePartial", undefined, { successCount, failedCount }));
        return;
      }

      message.error(t("frontend.cache.batchDeleteFailed", undefined, { count: failedCount }));
    } catch (error) {
      message.error(error instanceof Error ? error.message : t("frontend.cache.deleteFailed"));
    } finally {
      setState((current) => ({ ...current, deleteLoading: false }));
    }
  }

  const keyColumns = useMemo(
    () => [
      {
        title: t("frontend.cache.cacheKey"),
        dataIndex: "cacheKey",
        render: (value: string, row: FrontendCacheEntry) => (
          <div className="cache-management-layout__key-cell">
            <Typography.Text strong>{value}</Typography.Text>
            <Typography.Text type="secondary">{buildValuePreview(row.cacheValueJson)}</Typography.Text>
          </div>
        ),
      },
      {
        title: t("frontend.cache.remainingTtl"),
        dataIndex: "remainingTtlSeconds",
        width: 140,
        render: (value: number | null) => <Tag color={resolveRemainingTtlTone(value)}>{formatSeconds(value)}</Tag>,
      },
    ],
    [t],
  );

  return (
    <NePage>
      <div className="cache-management-layout">
        <NePanel
          title={t("frontend.cache.groupListTitle")}
          extra={(
            <Space size={8}>
              <Tag>{`${t("frontend.cache.entryCount")}: ${state.groups.reduce((total, group) => total + group.entryCount, 0)}`}</Tag>
              <Button icon={<ReloadOutlined />} onClick={() => void loadGroups()} loading={state.loading}>
                {t("common.refresh")}
              </Button>
            </Space>
          )}
          className="cache-management-layout__panel cache-management-layout__panel--groups"
        >
          {state.groups.length > 0 ? (
            <div className="cache-management-layout__group-list">
              <Input
                allowClear
                value={state.groupKeyword}
                prefix={<SearchOutlined />}
                placeholder={t("frontend.cache.searchGroupsPlaceholder")}
                onChange={(event) => {
                  const nextKeyword = event.target.value;
                  setState((current) => ({ ...current, groupKeyword: nextKeyword }));
                }}
              />
              {filteredGroups.map((group) => {
                const active = group.cacheName === state.activeCacheName;
                return (
                  <button
                    key={group.cacheName}
                    type="button"
                    className={[
                      "cache-management-layout__group-item",
                      active ? "cache-management-layout__group-item--active" : undefined,
                    ].filter(Boolean).join(" ")}
                    onClick={() => {
                      setState((current) => ({
                        ...current,
                        activeCacheName: group.cacheName,
                        selectedCacheKey: resolveSelectedCacheKey(group, null),
                        selectedCacheKeys: [],
                        keyKeyword: "",
                      }));
                    }}
                  >
                    <div className="cache-management-layout__group-main">
                      <Typography.Text strong>{group.cacheName}</Typography.Text>
                    </div>
                    <Badge count={group.entryCount} size="small" />
                  </button>
                );
              })}
              {filteredGroups.length === 0 ? (
                <NeEmptyState
                  title={t("frontend.cache.emptyGroupsTitle")}
                  description={t("frontend.cache.emptyGroupsDescription")}
                />
              ) : null}
            </div>
          ) : (
            <NeEmptyState title={t("frontend.cache.emptyTitle")} description={t("frontend.cache.emptyDescription")} />
          )}
        </NePanel>

        <NePanel
          title={t("frontend.cache.keyListTitle")}
          extra={activeGroup ? <Tag color="processing">{activeGroup.cacheName}</Tag> : null}
          className="cache-management-layout__panel cache-management-layout__panel--keys"
        >
          {activeGroup ? (
            <div className="cache-management-layout__keys-pane">
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Input
                  allowClear
                  value={state.keyKeyword}
                  prefix={<SearchOutlined />}
                  placeholder={t("frontend.cache.searchKeysPlaceholder")}
                  onChange={(event) => {
                    const nextKeyword = event.target.value;
                    setState((current) => ({ ...current, keyKeyword: nextKeyword }));
                  }}
                />
                <Space size={[8, 8]} wrap>
                  <Tag>{`${t("frontend.cache.entryCount")}: ${activeGroup.entryCount}`}</Tag>
                  <Tag>{`${t("frontend.cache.defaultTtl")}: ${formatSeconds(activeGroup.defaultTtlSeconds)}`}</Tag>
                  <Tag color={state.selectedCacheKeys.length > 0 ? "processing" : "default"}>
                    {t("frontend.cache.selectedKeys", undefined, { count: state.selectedCacheKeys.length })}
                  </Tag>
                  <Popconfirm
                    title={t("frontend.cache.confirmBatchDelete")}
                    description={t("frontend.cache.confirmBatchDeleteDescription", undefined, { count: state.selectedCacheKeys.length })}
                    onConfirm={() => handleDeleteSelected()}
                    disabled={state.selectedCacheKeys.length === 0}
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      loading={state.deleteLoading}
                      disabled={state.selectedCacheKeys.length === 0}
                    >
                      {t("frontend.cache.deleteSelected")}
                    </Button>
                  </Popconfirm>
                </Space>
              </Space>
              <div className="cache-management-layout__table-wrap">
                <Table<FrontendCacheEntry>
                  className="cache-management-layout__key-table"
                  rowKey="cacheKey"
                  loading={state.loading}
                  dataSource={filteredEntries}
                  columns={keyColumns}
                  rowSelection={{
                    selectedRowKeys: state.selectedCacheKeys,
                    onChange: (selectedRowKeys) => {
                      setState((current) => ({
                        ...current,
                        selectedCacheKeys: selectedRowKeys.map(String),
                      }));
                    },
                    preserveSelectedRowKeys: false,
                  }}
                  scroll={{ x: 720, y: "100%" }}
                  pagination={{ pageSize: 12, showSizeChanger: true, hideOnSinglePage: filteredEntries.length <= 12 }}
                  rowClassName={(record) => record.cacheKey === state.selectedCacheKey ? "cache-management-layout__table-row--active" : ""}
                  onRow={(record) => ({
                    onClick: () => {
                      setState((current) => ({ ...current, selectedCacheKey: record.cacheKey }));
                    },
                  })}
                />
              </div>
            </div>
          ) : (
            <NeEmptyState
              title={t("frontend.cache.emptyKeysTitle")}
              description={t("frontend.cache.emptyKeysDescription")}
            />
          )}
        </NePanel>

        <NePanel
          title={t("frontend.cache.detailPanelTitle")}
          extra={selectedEntry ? <Typography.Text copyable={{ text: selectedEntry.cacheKey }}>{selectedEntry.cacheKey}</Typography.Text> : null}
          className="cache-management-layout__panel cache-management-layout__panel--detail"
        >
          {selectedEntry ? (
            <div className="cache-management-layout__detail-pane">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label={t("frontend.cache.cacheGroup")}>{activeGroup?.cacheName ?? "-"}</Descriptions.Item>
                <Descriptions.Item label={t("frontend.cache.cacheKey")}>{selectedEntry.cacheKey}</Descriptions.Item>
                <Descriptions.Item label={t("frontend.cache.valueType")}>{selectedEntry.cacheValueType ?? "-"}</Descriptions.Item>
                <Descriptions.Item label={t("frontend.cache.ttl")}>{formatSeconds(selectedEntry.ttlSeconds)}</Descriptions.Item>
                <Descriptions.Item label={t("frontend.cache.remainingTtl")}>{formatSeconds(selectedEntry.remainingTtlSeconds)}</Descriptions.Item>
              </Descriptions>

              <div className="cache-management-layout__json-panel">
                <Typography.Text strong>{t("frontend.cache.valueJson")}</Typography.Text>
                <Typography.Paragraph
                  copyable={selectedEntry.cacheValueJson ? { text: selectedEntry.cacheValueJson } : false}
                  className="cache-management-layout__json-content"
                >
                  {selectedEntry.cacheValueJson ?? "-"}
                </Typography.Paragraph>
              </div>
            </div>
          ) : (
            <NeEmptyState
              title={t("frontend.cache.emptyValueTitle")}
              description={t("frontend.cache.emptyValueDescription")}
            />
          )}
        </NePanel>
      </div>
    </NePage>
  );
}
