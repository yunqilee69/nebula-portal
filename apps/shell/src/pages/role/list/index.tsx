import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, Input, List, Pagination, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import type { RoleDetail, RoleItem, RoleMutationPayload, RolePageQuery } from "@platform/core";
import { NePermission, useI18n } from "@platform/core";
import { useEffect, useMemo, useState } from "react";
import { createRole, deleteRole, fetchRoleDetail, fetchRoleList, fetchRolePage, updateRole } from "../../../api/role-api";
import { NeDetailDrawer, NeFormDrawer, NePage, NeSearchPanel, NeTablePanel } from "@platform/ui";

const initialQuery: RolePageQuery = {
  pageNum: 1,
  pageSize: 10,
  orderName: "updateTime",
  orderType: "desc",
};

const initialForm: RoleMutationPayload = {
  name: "",
  code: "",
  description: "",
  status: 1,
};

export function RoleManagementPage() {
  const { t } = useI18n();
  const [form] = Form.useForm<RolePageQuery>();
  const [drawerForm] = Form.useForm<RoleMutationPayload>();
  const [query, setQuery] = useState<RolePageQuery>(initialQuery);
  const [rows, setRows] = useState<RoleItem[]>([]);
  const [allRoles, setAllRoles] = useState<RoleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<RoleItem | null>(null);
  const [detail, setDetail] = useState<RoleDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadRoleOptions() {
    setMetaLoading(true);
    try {
      setAllRoles(await fetchRoleList());
    } finally {
      setMetaLoading(false);
    }
  }

  async function loadRoles(nextQuery: RolePageQuery) {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRolePage(nextQuery);
      setRows(result.data);
      setTotal(result.total);
    } catch (caughtError) {
      setRows([]);
      setTotal(0);
      setError(caughtError instanceof Error ? caughtError.message : t("roleManagement.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function reloadCurrentData() {
    await Promise.all([loadRoles(query), loadRoleOptions()]);
  }

  async function openDetail(roleId: string) {
    setDetailOpen(true);
    try {
      setDetail(await fetchRoleDetail(roleId));
    } catch {
      const fallbackRole = rows.find((item) => item.id === roleId) ?? null;
      setDetail(
        fallbackRole
          ? {
              ...fallbackRole,
              permissions: [],
            }
          : null,
      );
    }
  }

  async function openEditor(target: RoleItem | null) {
    setEditing(target);
    if (!target) {
      drawerForm.resetFields();
      drawerForm.setFieldsValue(initialForm);
      setDrawerOpen(true);
      return;
    }

    const fullDetail = await fetchRoleDetail(target.id).catch(() => null);
    drawerForm.setFieldsValue({
      name: fullDetail?.name ?? target.name,
      code: fullDetail?.code ?? target.code,
      description: fullDetail?.description ?? target.description ?? "",
      status: fullDetail?.status ?? target.status ?? 1,
    });
    setDrawerOpen(true);
  }

  useEffect(() => {
    loadRoleOptions().catch(() => undefined);
  }, []);

  useEffect(() => {
    loadRoles(query).catch(() => undefined);
  }, [query]);

  const columns = useMemo(
    () => [
      { title: t("common.name"), dataIndex: "name" },
      { title: t("common.code"), dataIndex: "code" },
      {
        title: t("common.status"),
        render: (_: unknown, row: RoleItem) =>
          row.status === 1 ? <Tag color="success">{t("common.enabled")}</Tag> : <Tag color="error">{t("common.disabled")}</Tag>,
      },
      { title: t("common.createTime"), dataIndex: "createTime", render: (value: string | undefined) => value ?? "-" },
      { title: t("roleManagement.updatedAt"), dataIndex: "updateTime", render: (value: string | undefined) => value ?? "-" },
      {
        title: t("common.actions"),
        render: (_: unknown, row: RoleItem) => (
          <Space>
            <NePermission code="platform:role:edit">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  openEditor(row).catch(() => undefined);
                }}
              >
                {t("common.edit")}
              </Button>
            </NePermission>
            <NePermission code="platform:role:delete">
              <Popconfirm
                title={t("roleManagement.deleteConfirm")}
                onConfirm={async (event) => {
                  event?.stopPropagation();
                  await deleteRole(row.id);
                  if (detail?.id === row.id) {
                    setDetail(null);
                    setDetailOpen(false);
                  }
                  await reloadCurrentData();
                }}
              >
                <Button size="small" danger icon={<DeleteOutlined />}>
                  {t("common.delete")}
                </Button>
              </Popconfirm>
            </NePermission>
          </Space>
        ),
      },
    ],
    [detail?.id, t],
  );

  return (
    <NePage>
      <NeSearchPanel
        title={t("common.filters")}
        labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
        onReset={() => {
          form.resetFields();
          setQuery(initialQuery);
        }}
      >
        <Form form={form} layout="inline" initialValues={initialQuery} onFinish={(values) => setQuery((current) => ({ ...current, ...values, pageNum: 1 }))}>
          <Form.Item name="name" label={t("common.name")}>
            <Input allowClear placeholder={t("roleManagement.namePlaceholder")} />
          </Form.Item>
          <Form.Item name="code" label={t("common.code")}>
            <Input allowClear placeholder={t("roleManagement.codePlaceholder")} />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}>
            <Select style={{ width: 140 }} allowClear options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              {t("common.search")}
            </Button>
          </Form.Item>
        </Form>
        {error ? <Typography.Paragraph type="danger" style={{ marginTop: 16, marginBottom: 0 }}>{error}</Typography.Paragraph> : null}
      </NeSearchPanel>
      <NeTablePanel
        toolbar={
          <NePermission code="platform:role:create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                openEditor(null).catch(() => undefined);
              }}
            >
              {t("roleManagement.createRole")}
            </Button>
          </NePermission>
        }
        summary={t("common.recordCount", undefined, { count: total })}
        pagination={<Pagination align="end" current={query.pageNum} pageSize={query.pageSize} total={total} onChange={(pageNum, pageSize) => setQuery((current) => ({ ...current, pageNum, pageSize }))} />}
      >
        <Table<RoleItem>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={columns}
          pagination={false}
          onRow={(record) => ({
            onClick: () => {
              openDetail(record.id).catch(() => undefined);
            },
          })}
        />
      </NeTablePanel>
      <NeDetailDrawer title={t("roleManagement.detailTitle")} open={detailOpen && Boolean(detail)} onClose={() => setDetailOpen(false)} width={560}>
        {detail ? (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label={t("common.name")}>{detail.name}</Descriptions.Item>
              <Descriptions.Item label={t("common.code")}>{detail.code}</Descriptions.Item>
              <Descriptions.Item label={t("common.description")}>{detail.description ?? "-"}</Descriptions.Item>
              <Descriptions.Item label={t("common.status")}>{detail.status === 1 ? t("common.enabled") : t("common.disabled")}</Descriptions.Item>
              <Descriptions.Item label={t("common.permissionCount")}>{detail.permissions.length}</Descriptions.Item>
              <Descriptions.Item label={t("common.createTime")}>{detail.createTime ?? "-"}</Descriptions.Item>
              <Descriptions.Item label={t("roleManagement.updatedAt")}>{detail.updateTime ?? "-"}</Descriptions.Item>
            </Descriptions>
            <div>
              <Typography.Title level={5} style={{ marginTop: 0 }}>{t("roleManagement.permissions")}</Typography.Title>
              <List
                locale={{ emptyText: t("common.noData") }}
                dataSource={detail.permissions}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      <Tag color="processing">{item.code}</Tag>
                      <Typography.Text>{item.name}</Typography.Text>
                    </Space>
                  </List.Item>
                )}
              />
            </div>
          </Space>
        ) : null}
      </NeDetailDrawer>
      <NeFormDrawer
        title={editing ? t("roleManagement.editRole") : t("roleManagement.createRole")}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={() => drawerForm.submit()}
        submitting={submitting || metaLoading}
      >
        <Form
          form={drawerForm}
          layout="vertical"
          initialValues={initialForm}
          onFinish={async (values) => {
            setSubmitting(true);
            try {
              if (editing) {
                await updateRole(editing.id, values);
              } else {
                await createRole(values);
              }
              setDrawerOpen(false);
              await reloadCurrentData();
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form.Item name="name" label={t("common.name")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.name") }) }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label={t("common.code")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.code") }) }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t("common.description")}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}>
            <Select options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} />
          </Form.Item>
          <Typography.Text type="secondary">{t("roleManagement.permissionHint")}</Typography.Text>
        </Form>
      </NeFormDrawer>
    </NePage>
  );
}
