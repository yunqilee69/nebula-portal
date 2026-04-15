import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, Input, Pagination, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import type { OrganizationItem, OrganizationTreeItem, RoleItem, UserDetail, UserItem, UserMutationPayload, UserPageQuery } from "@nebula/core";
import { useI18n } from "@nebula/core";
import { useEffect, useMemo, useState } from "react";
import { fetchOrganizationList, fetchOrganizationTree } from "../../../api/organization-api";
import { fetchRoleList } from "../../../api/role-api";
import { createUser, deleteUser, fetchUserDetail, fetchUserPage, updateUser } from "../../../api/user-api";
import { OrganizationTree } from "@nebula/ui-web";
import { NeDetailDrawer, NeModal, NePage, NePanel, NeSearchPanel, NeTablePanel } from "@nebula/ui-web";

const initialQuery: UserPageQuery = {
  pageNum: 1,
  pageSize: 10,
  orderName: "updateTime",
  orderType: "desc",
};

const initialForm: UserMutationPayload = {
  username: "",
  password: "",
  nickname: "",
  avatar: "",
  email: "",
  phone: "",
  status: 1,
  remark: "",
  roleIds: [],
  orgIds: [],
};

function formatRelation(items: Array<{ id: string; name: string; code: string }> | undefined) {
  if (!items?.length) {
    return "-";
  }

  return items.map((item) => `${item.name} (${item.code})`).join(", ");
}

function findOrganization(nodes: OrganizationTreeItem[], id: string): OrganizationTreeItem | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const match = findOrganization(node.children ?? [], id);
    if (match) {
      return match;
    }
  }
  return null;
}

export function OperationsUserPage() {
  const { t } = useI18n();
  const [form] = Form.useForm<UserPageQuery>();
  const [drawerForm] = Form.useForm<UserMutationPayload>();
  const [query, setQuery] = useState<UserPageQuery>(initialQuery);
  const [rows, setRows] = useState<UserItem[]>([]);
  const [organizationTree, setOrganizationTree] = useState<OrganizationTreeItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);

  const roleOptions = useMemo(
    () => roles.map((role) => ({ label: `${role.name} (${role.code})`, value: role.id })),
    [roles],
  );
  const organizationOptions = useMemo(
    () => organizations.map((organization) => ({ label: `${organization.name} (${organization.code})`, value: organization.id })),
    [organizations],
  );

  async function loadMeta() {
    setMetaLoading(true);
    try {
      const [roleRows, organizationRows, organizationTreeRows] = await Promise.all([fetchRoleList(), fetchOrganizationList(), fetchOrganizationTree()]);
      setRoles(roleRows);
      setOrganizations(organizationRows);
      setOrganizationTree(organizationTreeRows);
    } finally {
      setMetaLoading(false);
    }
  }

  async function loadUsers(nextQuery: UserPageQuery) {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchUserPage(nextQuery);
      setRows(result.data);
      setTotal(result.total);
    } catch (caughtError) {
      setRows([]);
      setTotal(0);
      setError(caughtError instanceof Error ? caughtError.message : t("userManagement.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(userId: string) {
    setDetailOpen(true);
    try {
      setDetail(await fetchUserDetail(userId));
    } catch {
      setDetail(rows.find((item) => item.id === userId) ?? null);
    }
  }

  async function openEditor(target: UserItem | null) {
    setEditing(target);
    if (!target) {
      drawerForm.resetFields();
      drawerForm.setFieldsValue(initialForm);
      setDrawerOpen(true);
      return;
    }

    const fullDetail = (await fetchUserDetail(target.id).catch(() => null)) ?? target;
    drawerForm.setFieldsValue({
      username: fullDetail.username,
      password: "",
      nickname: fullDetail.nickname ?? "",
      avatar: fullDetail.avatar ?? "",
      email: fullDetail.email ?? "",
      phone: fullDetail.phone ?? "",
      status: fullDetail.status ?? 1,
      remark: fullDetail.remark ?? "",
      roleIds: fullDetail.roles?.map((item) => item.id) ?? [],
      orgIds: fullDetail.organizations?.map((item) => item.id) ?? [],
    });
    setDrawerOpen(true);
  }

  useEffect(() => {
    loadMeta().catch(() => undefined);
  }, []);

  useEffect(() => {
    loadUsers(query).catch(() => undefined);
  }, [query]);

  const columns = useMemo(
    () => [
      { title: t("common.username"), dataIndex: "username" },
      { title: t("common.nickname"), dataIndex: "nickname", render: (value: string | undefined) => value ?? "-" },
      { title: t("common.email"), dataIndex: "email", render: (value: string | undefined) => value ?? "-" },
      { title: t("common.phone"), dataIndex: "phone", render: (value: string | undefined) => value ?? "-" },
      {
        title: t("common.role"),
        render: (_: unknown, row: UserItem) => formatRelation(row.roles),
      },
      {
        title: t("common.organization"),
        render: (_: unknown, row: UserItem) => formatRelation(row.organizations),
      },
      {
        title: t("common.status"),
        render: (_: unknown, row: UserItem) =>
          row.status === 1 ? <Tag color="success">{t("common.enabled")}</Tag> : <Tag color="error">{t("common.disabled")}</Tag>,
      },
      {
        title: t("common.actions"),
        render: (_: unknown, row: UserItem) => (
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
              title={t("common.confirmDelete")}
              onConfirm={async (event) => {
                event?.stopPropagation();
                await deleteUser(row.id);
                if (detail?.id === row.id) {
                  setDetail(null);
                  setDetailOpen(false);
                }
                await loadUsers(query);
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
    [detail?.id, query, t],
  );

  return (
    <NePage className="user-management-page">
      <div className="shell-split-grid user-management-page__content">
        <NePanel title={t("organization.tree")} className="shell-panel user-management-page__tree-panel">
          <OrganizationTree
            className="user-management-page__tree-surface"
            treeClassName="user-management-page__tree"
            data={organizationTree}
            selectedIds={selectedOrganizationId ? [selectedOrganizationId] : []}
            searchPlaceholder={t("permissionAssignment.searchOrganizations")}
            onSelectIdsChange={(ids) => {
              const key = ids[0];
              if (!key) {
                setSelectedOrganizationId(null);
                setDetail(null);
                setDetailOpen(false);
                setQuery((current) => ({ ...initialQuery, orgId: undefined, orgIds: undefined }));
                return;
              }

              const next = findOrganization(organizationTree, key);
              if (!next) {
                return;
              }

              setSelectedOrganizationId(next.id);
              setDetail(null);
              setDetailOpen(false);
              setQuery((current) => ({
                ...current,
                orgId: next.id,
                orgIds: [next.id],
                pageNum: 1,
              }));
            }}
          />
        </NePanel>
        <div className="user-management-page__main">
          <NeSearchPanel
            title={t("common.filters")}
            labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
            onReset={() => {
              form.resetFields();
              setQuery((current) => ({ ...initialQuery, orgId: current.orgId, orgIds: current.orgIds }));
            }}
          >
            <Form form={form} layout="inline" initialValues={initialQuery} onFinish={(values) => setQuery((current) => ({ ...current, ...values, pageNum: 1 }))}>
              <Form.Item name="username" label={t("common.username")}>
                <Input allowClear placeholder={t("common.search")} />
              </Form.Item>
              <Form.Item name="nickname" label={t("common.nickname")}>
                <Input allowClear placeholder={t("common.search")} />
              </Form.Item>
              <Form.Item name="email" label={t("common.email")}>
                <Input allowClear placeholder={t("common.emailExample")} />
              </Form.Item>
              <Form.Item name="phone" label={t("common.phone")}>
                <Input allowClear placeholder={t("common.phoneExample")} />
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
            className="user-management-page__table-panel"
            toolbar={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  openEditor(null).catch(() => undefined);
                }}
              >
                {t("userManagement.createUser")}
              </Button>
            }
            summary={t("common.recordCount", undefined, { count: total })}
            pagination={<Pagination align="end" current={query.pageNum} pageSize={query.pageSize} total={total} onChange={(pageNum, pageSize) => setQuery((current) => ({ ...current, pageNum, pageSize }))} />}
          >
            <Table<UserItem>
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
        </div>
      </div>
      <NeDetailDrawer title={t("userManagement.detailTitle")} open={detailOpen && Boolean(detail)} onClose={() => setDetailOpen(false)} width={520}>
        {detail ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t("common.username")}>{detail.username}</Descriptions.Item>
            <Descriptions.Item label={t("common.nickname")}>{detail.nickname ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.email")}>{detail.email ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.phone")}>{detail.phone ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.status")}>{detail.status === 1 ? t("common.enabled") : t("common.disabled")}</Descriptions.Item>
            <Descriptions.Item label={t("common.role")}>{formatRelation(detail.roles)}</Descriptions.Item>
            <Descriptions.Item label={t("common.organization")}>{formatRelation(detail.organizations)}</Descriptions.Item>
            <Descriptions.Item label={t("common.remark")}>{detail.remark ?? "-"}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </NeDetailDrawer>
      <NeModal
        title={editing ? t("userManagement.editUser") : t("userManagement.createUser")}
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
                await updateUser(editing.id, values);
              } else {
                await createUser(values);
              }
              setDrawerOpen(false);
              await loadUsers(query);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form.Item name="username" label={t("common.username")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.username") }) }]}>
            <Input disabled={Boolean(editing)} />
          </Form.Item>
          {!editing ? (
            <Form.Item name="password" label={t("common.password")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.password") }) }]}>
              <Input.Password />
            </Form.Item>
          ) : null}
          <Form.Item name="nickname" label={t("common.nickname")}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label={t("common.email")}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label={t("common.phone")}>
            <Input />
          </Form.Item>
          <Form.Item name="avatar" label={t("common.avatar")}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}>
            <Select options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} />
          </Form.Item>
          <Form.Item name="roleIds" label={t("common.role")} className="ne-modal-form-grid__full">
            <Select mode="multiple" allowClear options={roleOptions} />
          </Form.Item>
          <Form.Item name="orgIds" label={t("common.organization")} className="ne-modal-form-grid__full">
            <Select mode="multiple" allowClear options={organizationOptions} />
          </Form.Item>
          <Form.Item name="remark" label={t("common.remark")} className="ne-modal-form-grid__full">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </NeModal>
    </NePage>
  );
}
