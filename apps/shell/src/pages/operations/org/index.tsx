import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, Input, Pagination, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import type { OrganizationItem, OrganizationMutationPayload, OrganizationPageQuery, OrganizationTreeItem } from "@platform/core";
import { NePermission, useI18n } from "@platform/core";
import { useEffect, useMemo, useState } from "react";
import { createOrganization, deleteOrganization, fetchOrganizationDetail, fetchOrganizationPage, fetchOrganizationTree, updateOrganization } from "@/api/organization-api";
import { NeDetailDrawer, NeModal, NePage, NePanel, NeSearchPanel, NeTablePanel, NeTree } from "@platform/ui";

const initialQuery: OrganizationPageQuery = {
  pageNum: 1,
  pageSize: 10,
};

const initialForm: OrganizationMutationPayload = {
  name: "",
  code: "",
  leader: "",
  phone: "",
  address: "",
  status: 1,
};

function flattenTree(nodes: OrganizationTreeItem[], level = 0): Array<{ label: string; value: string }> {
  return nodes.flatMap((node) => [
    { label: `${"- ".repeat(level)}${node.name}`, value: node.id },
    ...flattenTree(node.children ?? [], level + 1),
  ]);
}

function findOrganization(nodes: OrganizationTreeItem[], id: string): OrganizationItem | null {
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

export function OperationsOrgPage() {
  const { t } = useI18n();
  const [filterForm] = Form.useForm<OrganizationPageQuery>();
  const [drawerForm] = Form.useForm<OrganizationMutationPayload>();
  const [query, setQuery] = useState<OrganizationPageQuery>(initialQuery);
  const [rows, setRows] = useState<OrganizationItem[]>([]);
  const [tree, setTree] = useState<OrganizationTreeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OrganizationItem | null>(null);
  const [detail, setDetail] = useState<OrganizationItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<OrganizationItem | null>(null);
  const parentOptions = useMemo(() => flattenTree(tree), [tree]);

  async function loadData(nextQuery: OrganizationPageQuery) {
    setLoading(true);
    setError(null);
    try {
      const [pageResult, treeResult] = await Promise.all([fetchOrganizationPage(nextQuery), fetchOrganizationTree()]);
      setRows(pageResult.data);
      setTotal(pageResult.total);
      setTree(treeResult);
      setSelected((current) => current ?? pageResult.data[0] ?? null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t("organization.loadFailed"));
      setRows([]);
      setTotal(0);
      setTree([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(query).catch(() => undefined);
  }, [query]);

  useEffect(() => {
    if (!selected?.id) {
      setDetail(null);
      return;
    }
    fetchOrganizationDetail(selected.id)
      .then((result) => setDetail(result))
      .catch(() => setDetail(selected));
  }, [selected]);

  const columns = useMemo(
    () => [
      { title: t("common.name"), dataIndex: "name" },
      { title: t("common.code"), dataIndex: "code" },
      { title: t("common.leader"), dataIndex: "leader", render: (value: string | undefined) => value ?? "-" },
      { title: t("common.phone"), dataIndex: "phone", render: (value: string | undefined) => value ?? "-" },
      {
        title: t("common.status"),
        render: (_: unknown, row: OrganizationItem) =>
          row.status === 1 ? <Tag color="success">{t("common.enabled")}</Tag> : <Tag color="error">{t("common.disabled")}</Tag>,
      },
      {
        title: t("common.actions"),
        render: (_: unknown, row: OrganizationItem) => (
          <Space>
            <NePermission code="platform:org:edit">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  setEditing(row);
                  drawerForm.setFieldsValue({
                    name: row.name,
                    code: row.code,
                    leader: row.leader,
                    phone: row.phone,
                    address: row.address,
                    parentId: row.parentId,
                    status: row.status ?? 1,
                  });
                  setDrawerOpen(true);
                }}
              >
                {t("common.edit")}
              </Button>
            </NePermission>
            <NePermission code="platform:org:delete">
              <Popconfirm
                title={t("organization.deleteConfirm")}
                onConfirm={async (event) => {
                  event?.stopPropagation();
                  await deleteOrganization(row.id);
                  if (selected?.id === row.id) {
                    setSelected(null);
                    setDetail(null);
                  }
                  await loadData(query);
                }}
              >
                <Button size="small" danger icon={<DeleteOutlined />}>{t("common.delete")}</Button>
              </Popconfirm>
            </NePermission>
          </Space>
        ),
      },
    ],
    [drawerForm, query, selected?.id],
  );

  return (
    <NePage>
      <NeSearchPanel
        title={t("common.filters")}
        labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
        onReset={() => {
          filterForm.resetFields();
          setQuery(initialQuery);
        }}
      >
        <Form form={filterForm} layout="inline" initialValues={initialQuery} onFinish={(values) => setQuery((current) => ({ ...current, ...values, pageNum: 1 }))}>
          <Form.Item name="name" label={t("common.name")}>
            <Input allowClear placeholder={t("common.organizationPlaceholder")} />
          </Form.Item>
          <Form.Item name="code" label={t("common.code")}>
            <Input allowClear placeholder={t("common.organizationCodePlaceholder")} />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}>
            <Select style={{ width: 140 }} allowClear options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>{t("common.search")}</Button>
          </Form.Item>
        </Form>
        {error ? <Typography.Paragraph type="danger" style={{ marginTop: 16, marginBottom: 0 }}>{error}</Typography.Paragraph> : null}
      </NeSearchPanel>
      <div className="shell-split-grid">
        <NePanel title={t("organization.tree")}>
          <NeTree<OrganizationTreeItem>
            treeData={tree}
            searchable
            searchPlaceholder={t("permissionAssignment.searchOrganizations")}
            filterNode={(node, keyword) => [node.name, node.code, node.leader].some((value) => value?.toLowerCase().includes(keyword))}
            selectedKeys={selected ? [selected.id] : []}
            onSelect={(keys) => {
              const key = String(keys[0] ?? "");
              if (key) {
                const next = rows.find((row) => row.id === key) ?? findOrganization(tree, key);
                setSelected(next ?? null);
              }
            }}
          />
        </NePanel>
        <NeTablePanel
          toolbar={
            <NePermission code="platform:org:create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditing(null);
                  drawerForm.setFieldsValue(initialForm);
                  setDrawerOpen(true);
                }}
              >
                {t("organization.new")}
              </Button>
            </NePermission>
          }
          summary={t("common.recordCount", undefined, { count: total })}
          pagination={<Pagination align="end" current={query.pageNum} pageSize={query.pageSize} total={total} onChange={(pageNum, pageSize) => setQuery((current) => ({ ...current, pageNum, pageSize }))} />}
        >
          <Table<OrganizationItem>
            rowKey="id"
            loading={loading}
            dataSource={rows}
            columns={columns}
            onRow={(record) => ({ onClick: () => setSelected(record) })}
            pagination={false}
          />
        </NeTablePanel>
      </div>
      <NeDetailDrawer title={t("organization.detail")} open={Boolean(detail)} onClose={() => setDetail(null)}>
        {detail ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t("common.name")}>{detail.name}</Descriptions.Item>
            <Descriptions.Item label={t("common.code")}>{detail.code}</Descriptions.Item>
            <Descriptions.Item label={t("common.leader")}>{detail.leader ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.phone")}>{detail.phone ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.address")}>{detail.address ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.parent")}>{parentOptions.find((option) => option.value === detail.parentId)?.label ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.status")}>{detail.status === 1 ? t("common.enabled") : t("common.disabled")}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </NeDetailDrawer>
      <NeModal
        title={editing ? t("organization.edit") : t("organization.new")}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={720}
        confirmText={t("common.save")}
        cancelText={t("common.cancel")}
        onConfirm={() => drawerForm.submit()}
        confirmLoading={submitting}
      >
        <Form
          form={drawerForm}
          layout="vertical" className="ne-modal-form-grid"
          initialValues={initialForm}
          onFinish={async (values) => {
            setSubmitting(true);
            try {
              if (editing) {
                await updateOrganization(editing.id, values);
              } else {
                await createOrganization(values);
              }
              setDrawerOpen(false);
              await loadData(query);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form.Item name="name" label={t("common.name")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.name") }) }]}><Input /></Form.Item>
          <Form.Item name="code" label={t("common.code")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.code") }) }]}><Input /></Form.Item>
          <Form.Item name="leader" label={t("common.leader")}><Input /></Form.Item>
          <Form.Item name="phone" label={t("common.phone")}><Input /></Form.Item>
           <Form.Item name="address" label={t("common.address")} className="ne-modal-form-grid__full"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="parentId" label={t("organization.parentOrg")}>
            <Select allowClear options={parentOptions.filter((option) => option.value !== editing?.id)} />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}><Select options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item>
        </Form>
      </NeModal>
    </NePage>
  );
}
