import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, List, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import type { MenuItem, OrganizationItem, PermissionItem, PermissionMutationPayload, RoleItem } from "@platform/core";
import { NePermission, useI18n } from "@platform/core";
import { useEffect, useMemo, useState } from "react";
import { fetchMenuTree } from "../../../api/menu-admin-api";
import { fetchOrganizationList } from "../../../api/organization-api";
import { createPermission, deletePermission, fetchPermissionPage, updatePermission } from "../../../api/permission-api";
import { fetchRoleList } from "../../../api/role-api";
import { NeFormDrawer, NePage, NePanel, NeTablePanel } from "@platform/ui";

function flattenMenus(items: MenuItem[]): MenuItem[] {
  return items.flatMap((item) => [item, ...flattenMenus(item.children ?? [])]);
}

export function MenuPermissionPage() {
  const { t } = useI18n();
  const [form] = Form.useForm<PermissionMutationPayload>();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>();
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<PermissionItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const allMenus = useMemo(() => flattenMenus(menus), [menus]);
  const currentMenu = useMemo(() => allMenus.find((item) => String(item.id) === selectedMenuId) ?? null, [allMenus, selectedMenuId]);
  const subjectType = Form.useWatch("subjectType", form) ?? editing?.subjectType ?? "ROLE";
  const subjectOptions = useMemo(
    () =>
      subjectType === "ORG"
        ? organizations.map((item) => ({ label: `${item.name} (${item.code})`, value: item.id }))
        : roles.map((item) => ({ label: `${item.name} (${item.code})`, value: item.id })),
    [organizations, roles, subjectType],
  );

  async function loadBase() {
    const [menuResult, roleResult, orgResult] = await Promise.all([fetchMenuTree(), fetchRoleList(), fetchOrganizationList()]);
    setMenus(menuResult);
    setRoles(roleResult);
    setOrganizations(orgResult);
    setSelectedMenuId((current) => current ?? (menuResult.length ? String(flattenMenus(menuResult)[0]?.id) : undefined));
  }

  async function loadPermissions(menuId: string) {
    setLoading(true);
    try {
      const result = await fetchPermissionPage({ pageNum: 1, pageSize: 200, resourceType: "MENU", resourceId: menuId });
      setPermissions(result.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBase().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selectedMenuId) {
      setPermissions([]);
      return;
    }
    loadPermissions(selectedMenuId).catch(() => undefined);
  }, [selectedMenuId]);

  const columns = useMemo(
    () => [
      { title: t("common.subjectType"), render: (_: unknown, row: PermissionItem) => <Tag color={row.subjectType === "ORG" ? "geekblue" : "gold"}>{row.subjectType === "ORG" ? t("common.organization") : t("common.role")}</Tag> },
      {
        title: t("common.subject"),
        render: (_: unknown, row: PermissionItem) =>
          row.subjectType === "ORG"
            ? organizations.find((item) => item.id === row.subjectId)?.name ?? row.subjectId
            : roles.find((item) => item.id === row.subjectId)?.name ?? row.subjectId,
      },
      { title: t("common.effect"), render: (_: unknown, row: PermissionItem) => <Tag color={row.effect === "Allow" ? "success" : "error"}>{row.effect === "Allow" ? t("permission.allow") : t("permission.deny")}</Tag> },
      { title: t("common.scope"), dataIndex: "scope", render: (value: string | undefined) => value === "CURRENT_ORG" ? t("permission.scope.currentOrg") : value === "CURRENT_ROLE" ? t("permission.scope.currentRole") : value === "ALL" ? t("permission.scope.all") : value ?? t("permission.scope.all") },
      {
        title: t("common.actions"),
        render: (_: unknown, row: PermissionItem) => (
          <Space>
            <NePermission code="platform:menu-permission:edit">
              <Button size="small" icon={<EditOutlined />} onClick={() => {
                setEditing(row);
                form.setFieldsValue(row);
                setDrawerOpen(true);
              }}>{t("common.edit")}</Button>
            </NePermission>
            <NePermission code="platform:menu-permission:delete">
              <Popconfirm title={t("menuPermission.deleteConfirm")} onConfirm={async () => {
                await deletePermission(row.id);
                if (selectedMenuId) {
                  await loadPermissions(selectedMenuId);
                }
              }}>
                <Button size="small" danger icon={<DeleteOutlined />}>{t("common.delete")}</Button>
              </Popconfirm>
            </NePermission>
          </Space>
        ),
      },
    ],
    [form, organizations, roles, selectedMenuId],
  );

  return (
    <NePage>
      <div className="shell-split-grid">
        <NePanel title={t("menuPermission.catalog")}>
          <List
            dataSource={allMenus.filter((item) => item.type !== 3)}
            locale={{ emptyText: t("common.noData") }}
            renderItem={(item) => (
              <List.Item onClick={() => setSelectedMenuId(String(item.id))} style={{ cursor: "pointer", background: String(item.id) === selectedMenuId ? "rgba(16, 119, 255, 0.08)" : undefined, borderRadius: 12, paddingInline: 12 }}>
                <Space direction="vertical" size={2}>
                  <Typography.Text strong>{item.name}</Typography.Text>
                  <Typography.Text type="secondary">{item.path ?? item.permission ?? t("common.groupLabel")}</Typography.Text>
                </Space>
              </List.Item>
            )}
          />
        </NePanel>
        <NePanel title={t("menuPermission.current")}>
          {currentMenu ? (
            <Descriptions column={1} bordered>
              <Descriptions.Item label={t("common.name")}>{currentMenu.name}</Descriptions.Item>
              <Descriptions.Item label={t("common.path")}>{currentMenu.path ?? "-"}</Descriptions.Item>
              <Descriptions.Item label={t("common.component")}>{currentMenu.component ?? "-"}</Descriptions.Item>
              <Descriptions.Item label={`${t("common.permission")}${t("common.code")}`}>{currentMenu.permission ?? "-"}</Descriptions.Item>
            </Descriptions>
          ) : (
            <Typography.Text type="secondary">{t("menuPermission.selectHint")}</Typography.Text>
          )}
        </NePanel>
      </div>
      <NeTablePanel
        toolbar={
          <NePermission code="platform:menu-permission:create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!selectedMenuId}
              onClick={() => {
                setEditing(null);
                form.setFieldsValue({ subjectType: "ROLE", resourceType: "MENU", resourceId: selectedMenuId!, effect: "Allow", scope: "ALL" });
                setDrawerOpen(true);
              }}
            >
              {t("menuPermission.create")}
            </Button>
          </NePermission>
        }
        summary={t("common.recordCount", undefined, { count: permissions.length })}
      >
        <Table<PermissionItem> rowKey="id" loading={loading} dataSource={permissions} columns={columns} pagination={false} />
      </NeTablePanel>
      <NeFormDrawer title={editing ? t("menuPermission.edit") : t("menuPermission.create")} open={drawerOpen} onClose={() => setDrawerOpen(false)} onSubmit={() => form.submit()} submitting={submitting}>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            setSubmitting(true);
            try {
              if (editing) {
                await updatePermission(editing.id, values);
              } else {
                await createPermission(values);
              }
              setDrawerOpen(false);
              if (selectedMenuId) {
                await loadPermissions(selectedMenuId);
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form.Item name="subjectType" label={t("common.subjectType")} rules={[{ required: true, message: t("validation.selectField", undefined, { field: t("common.subjectType") }) }]}> 
            <Select options={[{ label: t("common.role"), value: "ROLE" }, { label: t("common.organization"), value: "ORG" }]} />
          </Form.Item>
          <Form.Item name="subjectId" label={t("common.subject")} rules={[{ required: true, message: t("validation.selectField", undefined, { field: t("common.subject") }) }]}> 
            <Select options={subjectOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="resourceType" initialValue="MENU" hidden><Select /></Form.Item>
          <Form.Item name="resourceId" label={t("common.menu")} rules={[{ required: true, message: t("validation.selectField", undefined, { field: t("common.menu") }) }]}> 
            <Select options={allMenus.filter((item) => item.type !== 3).map((item) => ({ label: `${item.name}${item.path ? ` (${item.path})` : ""}`, value: String(item.id) }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="effect" label={t("common.effect")} initialValue="Allow"><Select options={[{ label: t("permission.allow"), value: "Allow" }, { label: t("permission.deny"), value: "Deny" }]} /></Form.Item>
          <Form.Item name="scope" label={t("common.scope")} initialValue="ALL"><Select options={[{ label: t("permission.scope.all"), value: "ALL" }, { label: t("permission.scope.currentOrg"), value: "CURRENT_ORG" }, { label: t("permission.scope.currentRole"), value: "CURRENT_ROLE" }]} /></Form.Item>
        </Form>
      </NeFormDrawer>
    </NePage>
  );
}
