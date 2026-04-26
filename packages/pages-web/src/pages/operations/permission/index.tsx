import { DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, Select, Space, Table, Tabs, Tag, Typography, message } from "antd";
import type {
  ButtonItem,
  MenuItem,
  OrganizationTreeItem,
  PermissionItem,
  PermissionMutationPayload,
  PermissionSubjectType,
  RoleItem,
  UserItem,
} from "@nebula/core";
import { useI18n } from "@nebula/core";
import { NePermission } from "@nebula/core";
import { OrganizationTree } from "@nebula/ui-web";
import { NePage, NePanel, NeSearchPanel, NeTable } from "@nebula/ui-web";
import { useEffect, useMemo, useState } from "react";
import type { Key } from "react";
import { fetchButtonPage } from "../../../api/button-api";
import { fetchMenuTree } from "../../../api/menu-admin-api";
import { fetchOrganizationTree } from "../../../api/organization-api";
import { createPermission, deletePermission, fetchPermissionPage, updatePermission } from "../../../api/permission-api";
import { fetchRoleList } from "../../../api/role-api";
import { fetchUserPage } from "../../../api/user-api";

type SubjectKey = "ORG" | "ROLE" | "USER";
type ResourceKey = "MENU" | "BUTTON";

interface SubjectRef {
  id: string;
  label: string;
  type: PermissionSubjectType;
}

interface ResourceRef {
  id: string;
  label: string;
  type: ResourceKey;
}

interface ButtonFilterState {
  menuId?: string;
  name?: string;
  code?: string;
  status?: number;
}

interface StatusSummary {
  allow: number;
  deny: number;
  none: number;
  total: number;
}

interface SelectionLabelCache {
  organizations: Record<string, string>;
  roles: Record<string, string>;
  users: Record<string, string>;
  menus: Record<string, string>;
  buttons: Record<string, string>;
}

const buttonFilterDefaults: ButtonFilterState = {};
const buttonQueryDefaults = { pageNum: 1, pageSize: 200 };

function flattenMenus(items: MenuItem[]): MenuItem[] {
  return items.flatMap((item) => [item, ...flattenMenus(item.children ?? [])]);
}

function flattenOrganizations(items: OrganizationTreeItem[]): OrganizationTreeItem[] {
  return items.flatMap((item) => [item, ...flattenOrganizations(item.children ?? [])]);
}

function filterMenuTree(nodes: MenuItem[], keyword: string): MenuItem[] {
  if (!keyword.trim()) {
    return nodes;
  }
  const normalized = keyword.trim().toLowerCase();
  return nodes.flatMap((node) => {
    const children = filterMenuTree(node.children ?? [], keyword);
    const matched = [node.name, node.path, node.permission].some((value) => value?.toLowerCase().includes(normalized));
    if (!matched && children.length === 0) {
      return [];
    }
    return [{ ...node, children }];
  });
}

function buildPermissionKey(subjectType: PermissionSubjectType, subjectId: string, resourceType: ResourceKey, resourceId: string) {
  return `${subjectType}:${subjectId}:${resourceType}:${resourceId}`;
}

function dedupePermissions(items: PermissionItem[]) {
  const map = new Map<string, PermissionItem>();
  for (const item of items) {
    map.set(buildPermissionKey(item.subjectType, item.subjectId, item.resourceType, item.resourceId), item);
  }
  return Array.from(map.values());
}

function groupPermissionsByPair(items: PermissionItem[]) {
  const map = new Map<string, PermissionItem[]>();
  for (const item of items) {
    const key = buildPermissionKey(item.subjectType, item.subjectId, item.resourceType, item.resourceId);
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return map;
}

function pickCanonicalPermission(items: PermissionItem[]) {
  return [...items].sort((left, right) => {
    const leftTime = left.updateTime ?? left.createTime ?? "";
    const rightTime = right.updateTime ?? right.createTime ?? "";
    if (leftTime !== rightTime) {
      return rightTime.localeCompare(leftTime);
    }
    return left.id.localeCompare(right.id);
  })[0];
}

function summarizeStatus(items: PermissionItem[], principals: SubjectRef[], resourceType: ResourceKey, resourceId: string): StatusSummary {
  const recordMap = new Map<string, PermissionItem>();
  for (const item of items) {
    recordMap.set(buildPermissionKey(item.subjectType, item.subjectId, item.resourceType, item.resourceId), item);
  }
  let allow = 0;
  let deny = 0;
  let none = 0;
  for (const principal of principals) {
    const record = recordMap.get(buildPermissionKey(principal.type, principal.id, resourceType, resourceId));
    if (!record) {
      none += 1;
      continue;
    }
    if (record.effect === "Allow") {
      allow += 1;
    } else {
      deny += 1;
    }
  }
  return { allow, deny, none, total: principals.length };
}

function renderStatusTag(summary: StatusSummary, t: (key: string, fallback?: string, variables?: Record<string, string | number>) => string) {
  if (summary.total === 0) {
    return <Tag>{t("permissionAssignment.notSelected")}</Tag>;
  }
  if (summary.allow === summary.total) {
    return <Tag color="success">{t("permissionAssignment.allAllowed")}</Tag>;
  }
  if (summary.deny === summary.total) {
    return <Tag color="error">{t("permissionAssignment.allDenied")}</Tag>;
  }
  if (summary.allow > 0 && summary.deny > 0) {
    return <Tag color="magenta">{t("permissionAssignment.mixed")}</Tag>;
  }
  if (summary.allow > 0) {
    return <Tag color="processing">{t("permissionAssignment.partialAllowed")}</Tag>;
  }
  if (summary.deny > 0) {
    return <Tag color="warning">{t("permissionAssignment.partialDenied")}</Tag>;
  }
  return <Tag>{t("permissionAssignment.unconfigured")}</Tag>;
}

function roleMatches(role: RoleItem, keyword: string) {
  if (!keyword.trim()) {
    return true;
  }
  const normalized = keyword.trim().toLowerCase();
  return [role.name, role.code, role.description].some((value) => value?.toLowerCase().includes(normalized));
}

function pickSelectedSubjects(
  organizations: OrganizationTreeItem[],
  roles: RoleItem[],
  users: UserItem[],
  labelCache: SelectionLabelCache,
  selectedOrgIds: string[],
  selectedRoleIds: string[],
  selectedUserIds: string[],
): SubjectRef[] {
  const orgMap = new Map(flattenOrganizations(organizations).map((item) => [item.id, item]));
  const roleMap = new Map(roles.map((item) => [item.id, item]));
  const userMap = new Map(users.map((item) => [item.id, item]));
  return [
    ...selectedOrgIds.map((id) => ({ id, type: "ORG" as const, label: orgMap.get(id)?.name ?? labelCache.organizations[id] ?? id })),
    ...selectedRoleIds.map((id) => ({ id, type: "ROLE" as const, label: roleMap.get(id)?.name ?? labelCache.roles[id] ?? id })),
    ...selectedUserIds.map((id) => ({ id, type: "USER" as const, label: userMap.get(id)?.nickname ?? userMap.get(id)?.username ?? labelCache.users[id] ?? id })),
  ];
}

function pickSelectedResources(menus: MenuItem[], buttons: ButtonItem[], labelCache: SelectionLabelCache, selectedMenuIds: string[], selectedButtonIds: string[]): ResourceRef[] {
  const menuMap = new Map(flattenMenus(menus).map((item) => [String(item.id), item]));
  const buttonMap = new Map(buttons.map((item) => [item.id, item]));
  return [
    ...selectedMenuIds.map((id) => ({ id, type: "MENU" as const, label: menuMap.get(id)?.name ?? labelCache.menus[id] ?? id })),
    ...selectedButtonIds.map((id) => ({ id, type: "BUTTON" as const, label: buttonMap.get(id)?.name ?? labelCache.buttons[id] ?? id })),
  ];
}

interface PermissionAssignmentPageProps {
  embedded?: boolean;
}

export function OperationsPermissionPage({ embedded = false }: PermissionAssignmentPageProps) {
  const { t } = useI18n();
  const [activeSubjectTab, setActiveSubjectTab] = useState<SubjectKey>("ORG");
  const [activeResourceTab, setActiveResourceTab] = useState<ResourceKey>("MENU");
  const [roleKeyword, setRoleKeyword] = useState("");
  const [userKeyword, setUserKeyword] = useState("");
  const [menuKeyword, setMenuKeyword] = useState("");
  const [menuSelectionMode, setMenuSelectionMode] = useState<"cascade" | "strict">("cascade");
  const [decision, setDecision] = useState<PermissionItem["effect"]>("Allow");
  const [organizations, setOrganizations] = useState<OrganizationTreeItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [buttons, setButtons] = useState<ButtonItem[]>([]);
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [selectedButtonIds, setSelectedButtonIds] = useState<string[]>([]);
  const [buttonFilters, setButtonFilters] = useState<ButtonFilterState>(buttonFilterDefaults);
  const [userLoading, setUserLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [baseLoading, setBaseLoading] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [buttonFilterForm] = Form.useForm<ButtonFilterState>();
  const [selectionLabelCache, setSelectionLabelCache] = useState<SelectionLabelCache>({ organizations: {}, roles: {}, users: {}, menus: {}, buttons: {} });

  function reportError(error: unknown, fallbackKey: string) {
    const text = error instanceof Error ? error.message : t(fallbackKey);
    message.error(text);
  }

  const filteredRoles = useMemo(() => roles.filter((item) => roleMatches(item, roleKeyword)), [roleKeyword, roles]);
  const filteredMenus = useMemo(() => filterMenuTree(menus.filter((item) => item.type !== 3), menuKeyword), [menuKeyword, menus]);
  const buttonMenuOptions = useMemo(
    () => flattenMenus(menus).filter((item) => item.type !== 3).map((item) => ({ label: `${item.name}${item.path ? ` (${item.path})` : ""}`, value: String(item.id) })),
    [menus],
  );
  const selectedSubjects = useMemo(
    () => pickSelectedSubjects(organizations, roles, users, selectionLabelCache, selectedOrgIds, selectedRoleIds, selectedUserIds),
    [organizations, roles, users, selectionLabelCache, selectedOrgIds, selectedRoleIds, selectedUserIds],
  );
  const selectedResources = useMemo(
    () => pickSelectedResources(menus, buttons, selectionLabelCache, selectedMenuIds, selectedButtonIds),
    [buttons, menus, selectionLabelCache, selectedButtonIds, selectedMenuIds],
  );

  async function loadBaseData() {
    setBaseLoading(true);
    try {
      const [organizationTree, roleRows, menuRows] = await Promise.all([fetchOrganizationTree(), fetchRoleList(), fetchMenuTree()]);
      setOrganizations(organizationTree);
      setRoles(roleRows);
      setMenus(menuRows);
      setSelectionLabelCache((current) => ({
        ...current,
        organizations: { ...current.organizations, ...Object.fromEntries(flattenOrganizations(organizationTree).map((item) => [item.id, item.name])) },
        roles: { ...current.roles, ...Object.fromEntries(roleRows.map((item) => [item.id, item.name])) },
        menus: { ...current.menus, ...Object.fromEntries(flattenMenus(menuRows).map((item) => [String(item.id), item.name])) },
      }));
    } finally {
      setBaseLoading(false);
    }
  }

  async function loadUsers(keyword = userKeyword) {
    setUserLoading(true);
    try {
      const result = await fetchUserPage({ ...buttonQueryDefaults, username: keyword || undefined });
      setUsers(result.data);
      setSelectionLabelCache((current) => ({
        ...current,
        users: {
          ...current.users,
          ...Object.fromEntries(result.data.map((item) => [item.id, item.nickname ?? item.username])),
        },
      }));
    } finally {
      setUserLoading(false);
    }
  }

  async function loadButtons(filters: ButtonFilterState = buttonFilters) {
    setButtonLoading(true);
    try {
      const result = await fetchButtonPage({ ...buttonQueryDefaults, ...filters });
      setButtons(result.data);
      setSelectionLabelCache((current) => ({
        ...current,
        buttons: {
          ...current.buttons,
          ...Object.fromEntries(result.data.map((item) => [item.id, item.name])),
        },
      }));
    } finally {
      setButtonLoading(false);
    }
  }

  async function fetchAllPermissionsForSubject(subject: SubjectRef) {
    const rows: PermissionItem[] = [];
    let pageNum = 1;
    while (true) {
      const result = await fetchPermissionPage({ pageNum, pageSize: 200, subjectType: subject.type, subjectId: subject.id });
      rows.push(...result.data);
      if (rows.length >= result.total || result.data.length === 0) {
        break;
      }
      pageNum += 1;
    }
    return rows;
  }

  async function loadPermissionsForSelection(subjects: SubjectRef[]) {
    if (subjects.length === 0) {
      setPermissions([]);
      return;
    }
    setPermissionLoading(true);
    try {
      const results = await Promise.all(subjects.map((subject) => fetchAllPermissionsForSubject(subject)));
      setPermissions(dedupePermissions(results.flatMap((result) => result)));
    } finally {
      setPermissionLoading(false);
    }
  }

  useEffect(() => {
    loadBaseData().catch((error) => reportError(error, "permissionAssignment.loadBaseFailed"));
  }, []);

  useEffect(() => {
    loadUsers().catch((error) => reportError(error, "permissionAssignment.loadUsersFailed"));
  }, []);

  useEffect(() => {
    loadButtons().catch((error) => reportError(error, "permissionAssignment.loadButtonsFailed"));
  }, []);

  useEffect(() => {
    loadPermissionsForSelection(selectedSubjects).catch((error) => reportError(error, "permissionAssignment.loadPermissionsFailed"));
  }, [selectedSubjects]);

  const menuColumns = useMemo(
    () => [
      { title: t("common.name"), dataIndex: "name" },
      { title: t("common.codeOrPath"), render: (_: unknown, row: MenuItem) => row.path ?? row.permission ?? "-" },
      {
        title: t("common.status"),
        render: (_: unknown, row: MenuItem) => (row.status === 0 ? <Tag color="error">{t("common.disabled")}</Tag> : <Tag color="success">{t("common.enabled")}</Tag>),
      },
      {
        title: t("permissionAssignment.currentDecision"),
        render: (_: unknown, row: MenuItem) => {
          const summary = summarizeStatus(permissions, selectedSubjects, "MENU", String(row.id));
          return renderStatusTag(summary, t);
        },
      },
      {
        title: t("permissionAssignment.coverage"),
        render: (_: unknown, row: MenuItem) => {
          const summary = summarizeStatus(permissions, selectedSubjects, "MENU", String(row.id));
          return `${t("permissionAssignment.allowShort")}: ${summary.allow} / ${t("permissionAssignment.denyShort")}: ${summary.deny} / ${t("permissionAssignment.noneShort")}: ${summary.none}`;
        },
      },
    ],
    [permissions, selectedSubjects, t],
  );

  const buttonColumns = useMemo(
    () => [
      { title: t("common.name"), dataIndex: "name" },
      { title: t("common.code"), dataIndex: "code" },
      {
        title: t("common.menu"),
        render: (_: unknown, row: ButtonItem) => buttonMenuOptions.find((item) => item.value === row.menuId)?.label ?? row.menuId ?? "-",
      },
      {
        title: t("common.status"),
        render: (_: unknown, row: ButtonItem) => (row.status === 1 ? <Tag color="success">{t("common.enabled")}</Tag> : <Tag color="error">{t("common.disabled")}</Tag>),
      },
      {
        title: t("permissionAssignment.currentDecision"),
        render: (_: unknown, row: ButtonItem) => {
          const summary = summarizeStatus(permissions, selectedSubjects, "BUTTON", row.id);
          return renderStatusTag(summary, t);
        },
      },
      {
        title: t("permissionAssignment.coverage"),
        render: (_: unknown, row: ButtonItem) => {
          const summary = summarizeStatus(permissions, selectedSubjects, "BUTTON", row.id);
          return `${t("permissionAssignment.allowShort")}: ${summary.allow} / ${t("permissionAssignment.denyShort")}: ${summary.deny} / ${t("permissionAssignment.noneShort")}: ${summary.none}`;
        },
      },
    ],
    [buttonMenuOptions, permissions, selectedSubjects, t],
  );

  const roleColumns = useMemo(
    () => [
      { title: t("common.name"), dataIndex: "name" },
      { title: t("common.code"), dataIndex: "code" },
      {
        title: t("common.status"),
        render: (_: unknown, row: RoleItem) => (row.status === 0 ? <Tag color="error">{t("common.disabled")}</Tag> : <Tag color="success">{t("common.enabled")}</Tag>),
      },
    ],
    [t],
  );

  const userColumns = useMemo(
    () => [
      { title: t("common.username"), dataIndex: "username" },
      { title: t("common.nickname"), dataIndex: "nickname", render: (value: string | undefined) => value ?? "-" },
      { title: t("common.email"), dataIndex: "email", render: (value: string | undefined) => value ?? "-" },
      {
        title: t("common.status"),
        render: (_: unknown, row: UserItem) => (row.status === 0 ? <Tag color="error">{t("common.disabled")}</Tag> : <Tag color="success">{t("common.enabled")}</Tag>),
      },
    ],
    [t],
  );

  const resourceRowSelection = useMemo(
    () =>
      activeResourceTab === "MENU"
        ? {
            selectedRowKeys: selectedMenuIds,
            onChange: (keys: Key[]) => setSelectedMenuIds(keys.map(String)),
            preserveSelectedRowKeys: true,
            checkStrictly: menuSelectionMode === "strict",
          }
        : {
            selectedRowKeys: selectedButtonIds,
            onChange: (keys: Key[]) => setSelectedButtonIds(keys.map(String)),
            preserveSelectedRowKeys: true,
          },
    [activeResourceTab, menuSelectionMode, selectedButtonIds, selectedMenuIds],
  );

  async function handleApplyDecision() {
    if (selectedSubjects.length === 0 || selectedResources.length === 0) {
      return;
    }
    const permissionMap = groupPermissionsByPair(permissions);
    const createQueue: PermissionMutationPayload[] = [];
    const updateQueue: Array<{ id: string; payload: PermissionMutationPayload }> = [];
    const deleteQueue = new Set<string>();
    for (const subject of selectedSubjects) {
      for (const resource of selectedResources) {
        const key = buildPermissionKey(subject.type, subject.id, resource.type, resource.id);
        const existingRecords = permissionMap.get(key) ?? [];
        const canonical = existingRecords.length ? pickCanonicalPermission(existingRecords) : null;
        if (!canonical) {
          createQueue.push({ subjectType: subject.type, subjectId: subject.id, resourceType: resource.type, resourceId: resource.id, effect: decision, scope: "ALL" });
          continue;
        }
        for (const item of existingRecords) {
          if (item.id !== canonical.id) {
            deleteQueue.add(item.id);
          }
        }
        if (canonical.effect !== decision || canonical.scope !== "ALL") {
          updateQueue.push({
            id: canonical.id,
            payload: {
              subjectType: canonical.subjectType,
              subjectId: canonical.subjectId,
              resourceType: canonical.resourceType,
              resourceId: canonical.resourceId,
              effect: decision,
              scope: "ALL",
            },
          });
        }
      }
    }
    if (createQueue.length === 0 && updateQueue.length === 0) {
      message.info(t("permissionAssignment.noChanges"));
      return;
    }
    setSubmitting(true);
    try {
      const failedIds: string[] = [];
      for (const payload of createQueue) {
        try {
          await createPermission(payload);
        } catch {
          failedIds.push(`${payload.subjectType}:${payload.subjectId}:${payload.resourceType}:${payload.resourceId}`);
        }
      }
      for (const item of updateQueue) {
        try {
          await updatePermission(item.id, item.payload);
        } catch {
          failedIds.push(item.id);
        }
      }
      for (const id of deleteQueue) {
        try {
          await deletePermission(id);
        } catch {
          failedIds.push(id);
        }
      }
      await loadPermissionsForSelection(selectedSubjects);
      if (failedIds.length > 0) {
        message.warning(t("permissionAssignment.applyPartialFailure", undefined, { count: failedIds.length }));
        return;
      }
      message.success(t("permissionAssignment.applySuccess", undefined, { count: createQueue.length + updateQueue.length + deleteQueue.size }));
    } catch (error) {
      reportError(error, "permissionAssignment.applyFailed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClearAssignments() {
    if (selectedSubjects.length === 0 || selectedResources.length === 0) {
      return;
    }
    const permissionMap = groupPermissionsByPair(permissions);
    const deleteIds: string[] = [];
    for (const subject of selectedSubjects) {
      for (const resource of selectedResources) {
        deleteIds.push(...(permissionMap.get(buildPermissionKey(subject.type, subject.id, resource.type, resource.id)) ?? []).map((item) => item.id));
      }
    }
    if (deleteIds.length === 0) {
      message.info(t("permissionAssignment.noAssignmentsToClear"));
      return;
    }
    setSubmitting(true);
    try {
      const failedIds: string[] = [];
      for (const id of deleteIds) {
        try {
          await deletePermission(id);
        } catch {
          failedIds.push(id);
        }
      }
      await loadPermissionsForSelection(selectedSubjects);
      if (failedIds.length > 0) {
        message.warning(t("permissionAssignment.clearPartialFailure", undefined, { count: failedIds.length }));
        return;
      }
      message.success(t("permissionAssignment.clearSuccess", undefined, { count: deleteIds.length }));
    } catch (error) {
      reportError(error, "permissionAssignment.clearFailed");
    } finally {
      setSubmitting(false);
    }
  }

  const content = (
    <div className="nebula-split-grid permission-assignment-layout">
        <NePanel
          title={t("permissionAssignment.principalPanelTitle")}
          extra={
            <Space wrap size={8}>
              <Tag color={selectedOrgIds.length ? "processing" : "default"}>{t("common.organization")}: {selectedOrgIds.length}</Tag>
              <Tag color={selectedRoleIds.length ? "gold" : "default"}>{t("common.role")}: {selectedRoleIds.length}</Tag>
              <Tag color={selectedUserIds.length ? "purple" : "default"}>{t("permissionAssignment.userLabel")}: {selectedUserIds.length}</Tag>
            </Space>
          }
          className="permission-assignment-layout__panel permission-assignment-layout__panel--subjects"
        >
          <div className="permission-assignment-layout__subject-stack">
            <Tabs
              activeKey={activeSubjectTab}
              onChange={(key) => setActiveSubjectTab(key as SubjectKey)}
              items={[
                {
                  key: "ORG",
                  label: t("common.organization"),
                  children: (
                    <OrganizationTree
                      className="permission-assignment-layout__tree-surface"
                      treeClassName="permission-assignment-layout__tree"
                      data={organizations}
                      mode="multiple"
                      checkedIds={selectedOrgIds}
                      searchPlaceholder={t("permissionAssignment.searchOrganizations")}
                      onCheckIdsChange={setSelectedOrgIds}
                    />
                  ),
                },
                {
                  key: "ROLE",
                  label: t("common.role"),
                  children: (
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                      <Input allowClear prefix={<SearchOutlined />} value={roleKeyword} onChange={(event) => setRoleKeyword(event.target.value)} placeholder={t("permissionAssignment.searchRoles")} />
                      <Table<RoleItem>
                        rowKey="id"
                        size="small"
                        loading={baseLoading}
                        dataSource={filteredRoles}
                        columns={roleColumns}
                        pagination={false}
                        rowSelection={{ selectedRowKeys: selectedRoleIds, onChange: (keys) => setSelectedRoleIds(keys.map(String)), preserveSelectedRowKeys: true }}
                      />
                    </Space>
                  ),
                },
                {
                  key: "USER",
                  label: t("permissionAssignment.userLabel"),
                  children: (
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                      <Input.Search
                        allowClear
                        defaultValue={userKeyword}
                        placeholder={t("permissionAssignment.searchUsers")}
                        onSearch={(value) => {
                          setUserKeyword(value);
                           loadUsers(value).catch((error) => reportError(error, "permissionAssignment.loadUsersFailed"));
                        }}
                      />
                      <Table<UserItem>
                        rowKey="id"
                        size="small"
                        loading={userLoading}
                        dataSource={users}
                        columns={userColumns}
                        pagination={false}
                        rowSelection={{ selectedRowKeys: selectedUserIds, onChange: (keys) => setSelectedUserIds(keys.map(String)), preserveSelectedRowKeys: true }}
                      />
                    </Space>
                  ),
                },
              ]}
            />
          </div>
        </NePanel>

        <div className="permission-assignment-layout__content">
          <NeSearchPanel
            className="permission-assignment-layout__filters permission-assignment-layout__filters--tabs"
            title={
              <Tabs
                className="permission-assignment-layout__resource-tabs"
                activeKey={activeResourceTab}
                onChange={(key) => setActiveResourceTab(key as ResourceKey)}
                items={[
                  { key: "MENU", label: t("common.menu") },
                  { key: "BUTTON", label: t("common.button") },
                ]}
              />
            }
            labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
            onReset={() => {
              setMenuKeyword("");
              setButtonFilters(buttonFilterDefaults);
              buttonFilterForm.resetFields();
              loadButtons(buttonFilterDefaults).catch((error) => reportError(error, "permissionAssignment.loadButtonsFailed"));
            }}
          >
            {activeResourceTab === "MENU" ? (
              <Input allowClear prefix={<SearchOutlined />} value={menuKeyword} onChange={(event) => setMenuKeyword(event.target.value)} placeholder={t("permissionAssignment.searchMenus")} />
            ) : (
              <Form<ButtonFilterState>
                form={buttonFilterForm}
                layout="inline"
                initialValues={buttonFilters}
                onFinish={(values) => {
                  const nextFilters = {
                    menuId: values.menuId || undefined,
                    name: values.name || undefined,
                    code: values.code || undefined,
                    status: typeof values.status === "number" ? values.status : undefined,
                  } satisfies ButtonFilterState;
                  setButtonFilters(nextFilters);
                  loadButtons(nextFilters).catch((error) => reportError(error, "permissionAssignment.loadButtonsFailed"));
                }}
              >
                <Form.Item name="menuId" label={t("common.menu")}><Select allowClear style={{ width: 220 }} options={buttonMenuOptions} showSearch optionFilterProp="label" /></Form.Item>
                <Form.Item name="name" label={t("common.name")}><Input allowClear placeholder={t("common.button")} /></Form.Item>
                <Form.Item name="code" label={t("common.code")}><Input allowClear placeholder={t("common.permissionCodeExample")} /></Form.Item>
                <Form.Item name="status" label={t("common.status")}><Select allowClear style={{ width: 140 }} options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item>
                <Form.Item><Button type="primary" htmlType="submit" icon={<SearchOutlined />}>{t("common.search")}</Button></Form.Item>
              </Form>
            )}
          </NeSearchPanel>

          <NePanel
            title={t("permissionAssignment.operationPanelTitle")}
            extra={
              <Space wrap size={8}>
                <Tag color="processing">{t("permissionAssignment.selectedPrincipals", undefined, { count: selectedSubjects.length })}</Tag>
                <Tag color="purple">{t("permissionAssignment.selectedResources", undefined, { count: selectedResources.length })}</Tag>
                <Tag>{t("permissionAssignment.loadedRules", undefined, { count: permissions.length })}</Tag>
              </Space>
            }
            className="permission-assignment-layout__actions"
          > 
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Space wrap>
                {activeResourceTab === "MENU" ? (
                  <>
                    <Typography.Text strong>{t("permissionAssignment.menuSelectionMode")}</Typography.Text>
                    <Select
                      value={menuSelectionMode}
                      onChange={(value) => setMenuSelectionMode(value)}
                      style={{ width: 220 }}
                      options={[
                        { label: t("permissionAssignment.menuSelectionModeCascade"), value: "cascade" },
                        { label: t("permissionAssignment.menuSelectionModeStrict"), value: "strict" },
                      ]}
                    />
                  </>
                ) : null}
                <Typography.Text strong>{t("permissionAssignment.decisionLabel")}</Typography.Text>
                <Select value={decision} onChange={(value) => setDecision(value)} style={{ width: 160 }} options={[{ label: t("permission.allow"), value: "Allow" }, { label: t("permission.deny"), value: "Deny" }]} />
                <NePermission hasAnyCode={["platform:menu-permission:create", "platform:button-permission:create", "platform:org-permission:create"]}>
                  <Button type="primary" loading={submitting} disabled={selectedSubjects.length === 0 || selectedResources.length === 0} onClick={() => handleApplyDecision()}>
                    {t("permissionAssignment.applyDecision")}
                  </Button>
                </NePermission>
                <NePermission hasAnyCode={["platform:menu-permission:delete", "platform:button-permission:delete", "platform:org-permission:delete"]}>
                  <Button danger icon={<DeleteOutlined />} loading={submitting} disabled={selectedSubjects.length === 0 || selectedResources.length === 0} onClick={() => handleClearAssignments()}>
                    {t("permissionAssignment.clearAssignments")}
                  </Button>
                </NePermission>
              </Space>
              <Typography.Text type="secondary">{t("permissionAssignment.operationHint")}</Typography.Text>
            </Space>
          </NePanel>

          <NeTable
            className="permission-assignment-layout__table"
            rowSelection={resourceRowSelection}
            summary={t("permissionAssignment.resourceSummary", undefined, { count: activeResourceTab === "MENU" ? flattenMenus(filteredMenus).length : buttons.length })}
            toolbar={
              <Space wrap>
                {selectedSubjects.slice(0, 6).map((item) => <Tag key={`${item.type}-${item.id}`}>{item.label}</Tag>)}
                {selectedSubjects.length > 6 ? <Tag>+{selectedSubjects.length - 6}</Tag> : null}
              </Space>
            }
          >
            {activeResourceTab === "MENU" ? (
              <Table<MenuItem>
                rowKey={(row) => String(row.id)}
                loading={baseLoading || permissionLoading}
                dataSource={filteredMenus}
                columns={menuColumns}
                pagination={false}
                expandable={{ defaultExpandAllRows: true }}
              />
            ) : (
              <Table<ButtonItem>
                rowKey="id"
                loading={buttonLoading || permissionLoading}
                dataSource={buttons}
                columns={buttonColumns}
                pagination={false}
              />
            )}
          </NeTable>
        </div>
      </div>
  );

  if (embedded) {
    return content;
  }

  return <NePage className="permission-assignment-page">{content}</NePage>;
}
