import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, List, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import type { ButtonItem, MenuItem, OrganizationItem, PermissionItem, PermissionMutationPayload } from "@platform/core";
import { NePermission, useI18n } from "@platform/core";
import { useEffect, useMemo, useState } from "react";
import { fetchButtonPage } from "../api/button-api";
import { fetchMenuTree } from "../api/menu-admin-api";
import { fetchOrganizationList } from "../api/organization-api";
import { createPermission, deletePermission, fetchPermissionPage, updatePermission } from "../api/permission-api";
import { NeFormDrawer, NePage, NePanel, NeTablePanel } from "@platform/ui";

function flattenMenus(items: MenuItem[]): Array<{ label: string; value: string }> {
  return items.flatMap((item) => [
    { label: item.name, value: String(item.id) },
    ...flattenMenus(item.children ?? []),
  ]);
}

export function OrgPermissionPage() {
  const { t } = useI18n();
  const [form] = Form.useForm<PermissionMutationPayload>();
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>();
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [buttons, setButtons] = useState<ButtonItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<PermissionItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const menuOptions = useMemo(() => flattenMenus(menus), [menus]);
  const buttonOptions = useMemo(() => buttons.map((item) => ({ label: `${item.name} (${item.code})`, value: item.id })), [buttons]);
  const currentOrg = useMemo(() => organizations.find((item) => item.id === selectedOrgId) ?? null, [organizations, selectedOrgId]);
  const currentResourceType = Form.useWatch("resourceType", form) ?? editing?.resourceType ?? "MENU";

  async function loadBase() {
    const [orgResult, menuResult, buttonResult] = await Promise.all([
      fetchOrganizationList(),
      fetchMenuTree(),
      fetchButtonPage({ pageNum: 1, pageSize: 200 }),
    ]);
    setOrganizations(orgResult);
    setMenus(menuResult);
    setButtons(buttonResult.data);
    setSelectedOrgId((current) => current ?? orgResult[0]?.id);
  }

  async function loadPermissions(orgId: string) {
    setLoading(true);
    try {
      const result = await fetchPermissionPage({ pageNum: 1, pageSize: 200, subjectType: "ORG", subjectId: orgId });
      setPermissions(result.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBase().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selectedOrgId) {
      setPermissions([]);
      return;
    }
    loadPermissions(selectedOrgId).catch(() => undefined);
  }, [selectedOrgId]);

  const columns = useMemo(
    () => [
      { title: t("orgPermission.resourceType"), render: (_: unknown, row: PermissionItem) => <Tag color={row.resourceType === "MENU" ? "processing" : "purple"}>{row.resourceType === "MENU" ? t("common.menu") : t("common.button")}</Tag> },
      {
        title: t("orgPermission.resource"),
        render: (_: unknown, row: PermissionItem) =>
          row.resourceType === "MENU"
            ? menuOptions.find((item) => item.value === row.resourceId)?.label ?? row.resourceId
            : buttonOptions.find((item) => item.value === row.resourceId)?.label ?? row.resourceId,
      },
      { title: t("common.effect"), render: (_: unknown, row: PermissionItem) => <Tag color={row.effect === "Allow" ? "success" : "error"}>{row.effect === "Allow" ? t("permission.allow") : t("permission.deny")}</Tag> },
      { title: t("common.scope"), dataIndex: "scope", render: (value: string | undefined) => value === "CURRENT_ORG" ? t("permission.scope.currentOrg") : value === "CASCADE" ? t("permission.scope.cascade") : value === "ALL" ? t("permission.scope.all") : value ?? t("permission.scope.all") },
      {
        title: t("common.actions"),
        render: (_: unknown, row: PermissionItem) => (
          <Space>
            <NePermission code="platform:org-permission:edit">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditing(row);
                  form.setFieldsValue(row);
                  setDrawerOpen(true);
                }}
              >
                {t("common.edit")}
              </Button>
            </NePermission>
            <NePermission code="platform:org-permission:delete">
              <Popconfirm title={t("common.confirmDelete")} onConfirm={async () => {
                await deletePermission(row.id);
                if (selectedOrgId) {
                  await loadPermissions(selectedOrgId);
                }
              }}>
                <Button size="small" danger icon={<DeleteOutlined />}>{t("common.delete")}</Button>
              </Popconfirm>
            </NePermission>
          </Space>
        ),
      },
    ],
    [buttonOptions, form, menuOptions, selectedOrgId],
  );

  return (
    <NePage>
      <div className="shell-split-grid">
        <NePanel title={t("organization.list")}>
          <List
            dataSource={organizations}
            locale={{ emptyText: t("orgPermission.noOrganizations") }}
            renderItem={(item) => (
              <List.Item onClick={() => setSelectedOrgId(item.id)} style={{ cursor: "pointer", background: item.id === selectedOrgId ? "rgba(16, 119, 255, 0.08)" : undefined, borderRadius: 12, paddingInline: 12 }}>
                <Space direction="vertical" size={2}>
                  <Typography.Text strong>{item.name}</Typography.Text>
                  <Typography.Text type="secondary">{item.code}</Typography.Text>
                </Space>
              </List.Item>
            )}
          />
        </NePanel>
        <NePanel title={t("common.organization")}>
          {currentOrg ? (
            <Descriptions column={1} bordered>
              <Descriptions.Item label={t("common.name")}>{currentOrg.name}</Descriptions.Item>
              <Descriptions.Item label={t("common.code")}>{currentOrg.code}</Descriptions.Item>
              <Descriptions.Item label={t("common.leader")}>{currentOrg.leader ?? "-"}</Descriptions.Item>
              <Descriptions.Item label={t("common.status")}>{currentOrg.status === 1 ? t("common.enabled") : t("common.disabled")}</Descriptions.Item>
            </Descriptions>
          ) : (
            <Typography.Text type="secondary">{t("organization.selectHint")}</Typography.Text>
          )}
        </NePanel>
      </div>
      <NeTablePanel
        toolbar={
          <NePermission code="platform:org-permission:create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!selectedOrgId}
              onClick={() => {
                setEditing(null);
                form.setFieldsValue({ subjectType: "ORG", subjectId: selectedOrgId!, resourceType: "MENU", effect: "Allow", scope: "ALL" });
                setDrawerOpen(true);
              }}
            >
              {t("orgPermission.create")}
            </Button>
          </NePermission>
        }
        summary={t("common.recordCount", undefined, { count: permissions.length })}
      >
        <Table<PermissionItem> rowKey="id" loading={loading} dataSource={permissions} columns={columns} pagination={false} />
      </NeTablePanel>
      <NeFormDrawer title={editing ? t("orgPermission.edit") : t("orgPermission.create")} open={drawerOpen} onClose={() => setDrawerOpen(false)} onSubmit={() => form.submit()} submitting={submitting}>
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
              if (selectedOrgId) {
                await loadPermissions(selectedOrgId);
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form.Item name="subjectType" initialValue="ORG" hidden><Select /></Form.Item>
          <Form.Item name="subjectId" label={t("common.organization")} rules={[{ required: true, message: t("validation.selectField", undefined, { field: t("common.organization") }) }]}> 
            <Select options={organizations.map((item) => ({ label: item.name, value: item.id }))} />
          </Form.Item>
          <Form.Item name="resourceType" label={t("orgPermission.resourceType")} rules={[{ required: true, message: t("validation.selectField", undefined, { field: t("orgPermission.resourceType") }) }]}> 
            <Select options={[{ label: t("common.menu"), value: "MENU" }, { label: t("common.button"), value: "BUTTON" }]} />
          </Form.Item>
          <Form.Item name="resourceId" label={t("orgPermission.resource")} rules={[{ required: true, message: t("validation.selectField", undefined, { field: t("orgPermission.resource") }) }]}> 
            <Select options={currentResourceType === "BUTTON" ? buttonOptions : menuOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="effect" label={t("common.effect")} initialValue="Allow"><Select options={[{ label: t("permission.allow"), value: "Allow" }, { label: t("permission.deny"), value: "Deny" }]} /></Form.Item>
          <Form.Item name="scope" label={t("common.scope")} initialValue="ALL"><Select options={[{ label: t("permission.scope.all"), value: "ALL" }, { label: t("permission.scope.currentOrg"), value: "CURRENT_ORG" }, { label: t("permission.scope.cascade"), value: "CASCADE" }]} /></Form.Item>
        </Form>
      </NeFormDrawer>
    </NePage>
  );
}
