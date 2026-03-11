import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Col, Descriptions, Form, Input, List, Popconfirm, Row, Select, Space, Tag, Typography } from "antd";
import type { RoleDetail, RoleItem, RoleMutationPayload } from "@platform/core";
import { NePermission, useI18n } from "@platform/core";
import { useEffect, useMemo, useState } from "react";
import { createRole, deleteRole, fetchRoleDetail, fetchRolePage, updateRole } from "../api/role-api";
import { NeDetailDrawer, NeFormDrawer, NePage, NePanel } from "@platform/ui";
import { useMenuStore } from "../modules/menu/menu-store";
import { useResourceStore } from "../modules/runtime/resource-store";

export function RoleAccessPage() {
  const { t } = useI18n();
  const [form] = Form.useForm<RoleMutationPayload>();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);
  const [detail, setDetail] = useState<RoleDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RoleItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const menus = useMenuStore((state) => state.menus);
  const roleResource = useResourceStore((state) => state.resources.roles);
  const start = useResourceStore((state) => state.start);
  const succeed = useResourceStore((state) => state.succeed);
  const fail = useResourceStore((state) => state.fail);

  async function loadRoles() {
    start("roles");
    try {
      const rows = await fetchRolePage();
      setRoles(rows);
      setSelectedRoleId((current) => current ?? rows[0]?.id);
      succeed("roles");
    } catch (error) {
      fail("roles", error instanceof Error ? error.message : "Failed to load roles");
    }
  }

  useEffect(() => {
    loadRoles().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selectedRoleId) {
      return;
    }
    start("roles");
    fetchRoleDetail(selectedRoleId)
      .then((result) => {
        setDetail(result);
        succeed("roles");
      })
      .catch((error) => {
        fail("roles", error instanceof Error ? error.message : "Failed to load role detail");
      });
  }, [fail, selectedRoleId, start, succeed]);

  const flatMenus = useMemo(() => {
    const rows: Array<{ id: string | number; name: string; path?: string }> = [];
    const visit = (items: typeof menus) => {
      items.forEach((item) => {
        rows.push({ id: item.id, name: item.name, path: item.path });
        if (item.children?.length) {
          visit(item.children);
        }
      });
    };
    visit(menus);
    return rows;
  }, [menus]);

  return (
    <NePage>
      <NePanel
        title={t("roleAccess.selector")}
        extra={
          <Space>
            <NePermission code="crm:customer:create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditing(null);
                  form.setFieldsValue({ name: "", code: "", description: "", status: 1, permissionIds: [] });
                  setEditorOpen(true);
                }}
              >
                {t("common.create")}角色
              </Button>
            </NePermission>
            <NePermission code="crm:customer:export">
              <Button>{t("common.exportAccessMatrix")}</Button>
            </NePermission>
          </Space>
        }
      >
        <Space wrap>
          <Select
            loading={roleResource.loading}
            style={{ width: 320 }}
            value={selectedRoleId}
            onChange={(value) => {
              setSelectedRoleId(value);
              setDrawerOpen(true);
            }}
            options={roles.map((role) => ({ label: `${role.name} (${role.code})`, value: role.id }))}
          />
          <NePermission code="crm:customer:edit">
            <Button
              icon={<EditOutlined />}
              disabled={!selectedRoleId}
              onClick={() => {
                const target = roles.find((role) => role.id === selectedRoleId) ?? null;
                setEditing(target);
                form.setFieldsValue({
                  name: target?.name ?? "",
                  code: target?.code ?? "",
                  description: detail?.description ?? "",
                  status: target?.status ?? 1,
                  permissionIds: [],
                });
                setEditorOpen(true);
              }}
            >
              {t("common.edit")}
            </Button>
          </NePermission>
          <NePermission code="crm:customer:export">
            <Popconfirm
              title={t("common.confirmDelete")}
              disabled={!selectedRoleId}
              onConfirm={async () => {
                if (!selectedRoleId) {
                  return;
                }
                await deleteRole(selectedRoleId);
                await loadRoles();
              }}
            >
              <Button danger icon={<DeleteOutlined />} disabled={!selectedRoleId}>{t("common.delete")}</Button>
            </Popconfirm>
          </NePermission>
        </Space>
        {roleResource.error ? <Typography.Paragraph type="danger" style={{ marginTop: 16 }}>{roleResource.error}</Typography.Paragraph> : null}
      </NePanel>
      <Row className="shell-split-grid" gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <NePanel title={t("roleAccess.permissions")}>
            <List
              locale={{ emptyText: t("common.noData") }}
              dataSource={detail?.permissions ?? []}
              renderItem={(item) => (
                <List.Item>
                  <Tag color="processing">{t("common.permission")}</Tag>
                  <Typography.Text>{item}</Typography.Text>
                </List.Item>
              )}
            />
          </NePanel>
        </Col>
        <Col xs={24} xl={12}>
          <NePanel title={t("roleAccess.currentMenus")}>
            <List
              locale={{ emptyText: t("common.noData") }}
              dataSource={flatMenus}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    <Tag>{item.path ? t("common.route") : t("common.groupLabel")}</Tag>
                    <Typography.Text>{item.name}</Typography.Text>
                    {item.path ? <Typography.Text type="secondary">{item.path}</Typography.Text> : null}
                  </Space>
                </List.Item>
              )}
            />
          </NePanel>
        </Col>
      </Row>
      <NeDetailDrawer title={`角色${t("common.detail")}`} open={drawerOpen && Boolean(detail)} onClose={() => setDrawerOpen(false)} width={460}>
        {detail ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t("common.name")}>{detail.name}</Descriptions.Item>
            <Descriptions.Item label={t("common.code")}>{detail.code}</Descriptions.Item>
            <Descriptions.Item label={t("common.description")}>{detail.description ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.permissionCount")}>{detail.permissions.length}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </NeDetailDrawer>
      <NeFormDrawer
        title={editing ? `${t("common.edit")}角色` : `${t("common.create")}角色`}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSubmit={() => form.submit()}
        submitting={submitting}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            setSubmitting(true);
            try {
              if (editing) {
                await updateRole(String(editing.id), values);
              } else {
                await createRole(values);
              }
              setEditorOpen(false);
              await loadRoles();
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form.Item name="name" label={t("common.name")} rules={[{ required: true, message: "请输入角色名称" }]}><Input /></Form.Item>
          <Form.Item name="code" label={t("common.code")} rules={[{ required: true, message: "请输入角色编码" }]}><Input /></Form.Item>
          <Form.Item name="description" label={t("common.description")}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="status" label={t("common.status")}><Select options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item>
        </Form>
      </NeFormDrawer>
    </NePage>
  );
}
