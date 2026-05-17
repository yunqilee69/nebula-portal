import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, Input, List, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import { useI18n } from "@nebula/core";

import type { RoleDetail, RoleItem, RoleMutationPayload, RolePageQuery } from "@nebula/core";
import { useEffect, useMemo, useState } from "react";
import { createRole, deleteRole, fetchRoleDetail, fetchRoleList, fetchRolePage, updateRole } from "../../../api/role-api";
import { NeDetailDrawer, NeModal, NePage, NeSearch, NeTablePage } from "@nebula/ui-web";

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

export function OperationsRolePage() {
  const { t } = useI18n();
  const [form] = Form.useForm<RolePageQuery>();
  const [drawerForm] = Form.useForm<RoleMutationPayload>();
  const [reloadSeed, setReloadSeed] = useState(0);
  const [allRoles, setAllRoles] = useState<RoleItem[]>([]);
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

  async function reloadCurrentData() {
    setReloadSeed((current) => current + 1);
    await loadRoleOptions();
  }

  async function openDetail(role: RoleItem) {
    setDetailOpen(true);
    try {
      setDetail(await fetchRoleDetail(role.id));
    } catch {
      setDetail({
        ...role,
        permissions: [],
      });
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
          </Space>
        ),
      },
    ],
    [detail?.id, t],
  );

  return (
    <NePage>
      <NeTablePage<RolePageQuery>
        searchForm={form}
        request={fetchRolePage}
        initialQuery={initialQuery}
        reloadToken={reloadSeed}
        onRequestSuccess={() => setError(null)}
        onRequestFail={(caughtError) => {
          setError(caughtError instanceof Error ? caughtError.message : t("roleManagement.loadFailed"));
        }}
        toolbar={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              openEditor(null).catch(() => undefined);
            }}
          >
            {t("roleManagement.createRole")}
          </Button>
        }
        summary={(result) => t("common.recordCount", undefined, { count: result.total })}
      >
        <NeSearch
          title={t("common.filters")}
          labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
          onReset={() => {
            form.resetFields();
            setReloadSeed((current) => current + 1);
          }}
        >
          <Form form={form} layout="inline" initialValues={initialQuery} onFinish={() => setReloadSeed((current) => current + 1)}>
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
          {error ? <Typography.Paragraph type="danger" className="ne-request-error">{error}</Typography.Paragraph> : null}
        </NeSearch>

        <Table<RoleItem>
          rowKey="id"
          columns={columns}
          onRow={(record) => ({
            onClick: () => {
              openDetail(record).catch(() => undefined);
            },
          })}
        />
      </NeTablePage>
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
      <NeModal
        title={editing ? t("roleManagement.editRole") : t("roleManagement.createRole")}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={720}
        confirmText={t("common.save")}
        cancelText={t("common.cancel")}
        onConfirm={() => drawerForm.submit()}
        confirmLoading={submitting || metaLoading}
      >
        <Form
          form={drawerForm}
          layout="vertical" className="ne-modal-form-grid"
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
          <Form.Item name="description" label={t("common.description")} className="ne-modal-form-grid__full">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}>
            <Select options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} />
          </Form.Item>
          <Typography.Text type="secondary" className="ne-modal-form-grid__full">{t("roleManagement.permissionHint")}</Typography.Text>
        </Form>
      </NeModal>
    </NePage>
  );
}
