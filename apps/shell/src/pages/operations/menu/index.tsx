import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Pagination, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import type { MenuItem, MenuMutationPayload, MenuPageQuery } from "@platform/core";
import { NePermission, useI18n } from "@platform/core";
import { useEffect, useMemo, useState } from "react";
import { createMenu, deleteMenu, fetchMenuPage, fetchMenuTree, updateMenu } from "@/api/menu-admin-api";
import { NeModal, NePage, NeSearchPanel, NeTablePanel } from "@platform/ui";

const initialQuery: MenuPageQuery = {
  pageNum: 1,
  pageSize: 10,
  orderName: "sort",
  orderType: "asc",
};

const initialForm: MenuMutationPayload = {
  name: "",
  code: "",
  path: "",
  icon: "",
  component: "",
  type: "MENU",
  sort: 1,
  status: 1,
};

function menuTypeLabel(
  type: MenuItem["type"],
  t: (key: string, fallback?: string, variables?: Record<string, string | number>) => string,
) {
  if (type === 1) {
    return <Tag color="processing">{t("common.directory")}</Tag>;
  }
  if (type === 3) {
    return <Tag color="warning">{t("common.permission")}</Tag>;
  }
  return <Tag color="success">{t("common.menu")}</Tag>;
}

function toMutationPayload(values: MenuMutationPayload) {
  return {
    ...values,
    parentId: values.parentId || undefined,
    code: values.code || undefined,
    path: values.path || undefined,
    icon: values.icon || undefined,
    component: values.component || undefined,
    sort: values.sort ?? 1,
    status: values.status ?? 1,
  } satisfies MenuMutationPayload;
}

function flattenDirectoryOptions(nodes: MenuItem[], excludedIds: Set<string>, level = 0): Array<{ label: string; value: string }> {
  return nodes.flatMap((node) => {
    const nodeId = String(node.id);
    const children = flattenDirectoryOptions(node.children ?? [], excludedIds, level + 1);

    if (excludedIds.has(nodeId) || node.type !== 1) {
      return children;
    }

    return [{ label: `${"- ".repeat(level)}${node.name}`, value: nodeId }, ...children];
  });
}

function collectDescendantIds(node: MenuItem | null): Set<string> {
  const result = new Set<string>();

  const visit = (item: MenuItem | null) => {
    if (!item) {
      return;
    }
    result.add(String(item.id));
    for (const child of item.children ?? []) {
      visit(child);
    }
  };

  visit(node);
  return result;
}

function findMenuNode(nodes: MenuItem[], id: string | null): MenuItem | null {
  if (!id) {
    return null;
  }

  for (const node of nodes) {
    if (String(node.id) === id) {
      return node;
    }
    const childMatch = findMenuNode(node.children ?? [], id);
    if (childMatch) {
      return childMatch;
    }
  }

  return null;
}

export function OperationsMenuPage() {
  const { t } = useI18n();
  const [form] = Form.useForm<MenuPageQuery>();
  const [drawerForm] = Form.useForm<MenuMutationPayload>();
  const [query, setQuery] = useState<MenuPageQuery>(initialQuery);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rows, setRows] = useState<MenuItem[]>([]);
  const [menuTree, setMenuTree] = useState<MenuItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const currentType = Form.useWatch("type", drawerForm) ?? initialForm.type;
  const editingTreeNode = useMemo(() => findMenuNode(menuTree, editing ? String(editing.id) : null), [editing, menuTree]);
  const editingDescendantIds = useMemo(() => collectDescendantIds(editingTreeNode ?? editing), [editing, editingTreeNode]);
  const parentOptions = useMemo(() => flattenDirectoryOptions(menuTree, editingDescendantIds), [editingDescendantIds, menuTree]);
  const editingHasChildren = Boolean(editingTreeNode?.children?.length);

  async function loadRows(nextQuery: MenuPageQuery) {
    setLoading(true);
    setError(null);
    try {
      const [result, treeResult] = await Promise.all([fetchMenuPage(nextQuery), fetchMenuTree()]);
      setRows(result.data);
      setMenuTree(treeResult);
      setTotal(result.total);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t("menuManagement.loadFailed"));
      setRows([]);
      setMenuTree([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows(query).catch(() => undefined);
  }, [query]);

  const columns = useMemo(
    () => [
      { title: t("common.name"), dataIndex: "name" },
      { title: t("common.codeOrPath"), render: (_: unknown, row: MenuItem) => row.path ?? row.permission ?? "-" },
       { title: t("common.type"), render: (_: unknown, row: MenuItem) => menuTypeLabel(row.type, t) },
      { title: t("common.component"), dataIndex: "component", render: (value: string | undefined) => value ?? "-" },
      {
        title: t("common.status"),
        render: (_: unknown, row: MenuItem) =>
          row.status === 0 ? <Tag color="error">{t("common.disabled")}</Tag> : <Tag color="success">{t("common.enabled")}</Tag>,
      },
      {
        title: t("common.actions"),
        render: (_: unknown, row: MenuItem) => (
          <Space>
            <NePermission code="crm:customer:edit">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditing(row);
                  drawerForm.setFieldsValue({
                    name: row.name,
                    parentId: row.parentId ? String(row.parentId) : undefined,
                    code: row.permission,
                    path: row.path,
                    icon: row.icon,
                    component: row.component,
                    type: row.type === 1 ? "DIRECTORY" : row.type === 3 ? "BUTTON" : "MENU",
                    sort: row.sort,
                    status: row.status,
                  });
                  setDrawerOpen(true);
                }}
              >
                {t("common.edit")}
              </Button>
            </NePermission>
            <NePermission code="crm:customer:export">
              <Popconfirm
                title={t("common.confirmDelete")}
                onConfirm={async () => {
                  await deleteMenu(String(row.id));
                  await loadRows(query);
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
    [drawerForm, query, t],
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
            <Input placeholder={t("common.search")} allowClear />
          </Form.Item>
          <Form.Item name="code" label={t("common.code")}>
            <Input placeholder={t("common.search")} allowClear />
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
      <NeTablePanel
        toolbar={
          <NePermission code="crm:customer:create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                drawerForm.setFieldsValue({ ...initialForm, parentId: undefined });
                setDrawerOpen(true);
              }}
            >
              {t("menuManagement.createMenu")}
            </Button>
          </NePermission>
        }
        summary={t("common.recordCount", undefined, { count: total })}
        pagination={<Pagination align="end" current={query.pageNum} pageSize={query.pageSize} total={total} onChange={(pageNum, pageSize) => setQuery((current) => ({ ...current, pageNum, pageSize }))} />}
      >
        <Table<MenuItem>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={columns}
          expandable={{ defaultExpandAllRows: true }}
          pagination={false}
        />
      </NeTablePanel>
      <NeModal
        title={editing ? t("menuManagement.editMenu") : t("menuManagement.createMenu")}
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
            if (editingHasChildren && values.type !== "DIRECTORY") {
              drawerForm.setFields([{ name: "type", errors: [t("menuManagement.directoryRequiredForChildren")] }]);
              return;
            }

            setSubmitting(true);
            try {
              const payload = toMutationPayload(values);
              if (editing) {
                await updateMenu(String(editing.id), payload);
              } else {
                await createMenu(payload);
              }
              setDrawerOpen(false);
              await loadRows(query);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form.Item name="name" label={t("common.name")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.name") }) }]}><Input /></Form.Item>
          <Form.Item name="parentId" label={t("common.parent")}>
            <Select
              allowClear
              options={parentOptions}
              placeholder={t("menuManagement.rootMenu")}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="code" label={t("common.code")}><Input /></Form.Item>
          <Form.Item name="path" label={t("common.path")}><Input /></Form.Item>
          <Form.Item
            name="icon"
            label={t("common.icon")}
            extra={t("menuManagement.iconHint")}
          >
            <Input placeholder={t("menuManagement.iconPlaceholder")} />
          </Form.Item>
          <Form.Item name="component" label={t("common.component")}><Input /></Form.Item>
          <Form.Item
            name="type"
            label={t("common.type")}
            rules={[{ required: true, message: t("validation.selectField", undefined, { field: t("common.type") }) }]}
            extra={currentType !== "DIRECTORY" ? t("menuManagement.nonDirectoryHint") : undefined}
          >
            <Select
              options={[
                { label: t("common.directory"), value: "DIRECTORY" },
                { label: t("common.menu"), value: "MENU", disabled: editingHasChildren },
                { label: t("common.button"), value: "BUTTON", disabled: editingHasChildren },
              ]}
            />
          </Form.Item>
          <Form.Item name="sort" label={t("common.sort")}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="status" label={t("common.status")}><Select options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item>
        </Form>
      </NeModal>
    </NePage>
  );
}
