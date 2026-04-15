import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, Input, Pagination, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import type { OrganizationItem, OrganizationMutationPayload, OrganizationPageQuery, OrganizationTreeItem } from "@nebula/core";
import { NePermission, useI18n } from "@nebula/core";
import { useEffect, useMemo, useState } from "react";
import { createOrganization, deleteOrganization, fetchOrganizationDetail, fetchOrganizationPage, fetchOrganizationTree, updateOrganization } from "../../../api/organization-api";
import { OrganizationTree } from "@nebula/ui-web";
import { NeModal, NePage, NePanel, NeSearchPanel, NeTablePanel } from "@nebula/ui-web";

type OrganizationType = NonNullable<OrganizationItem["type"]>;

const organizationChildTypeMap: Record<OrganizationType, OrganizationType[]> = {
  COMPANY: ["COMPANY", "DEPARTMENT", "TEAM"],
  DEPARTMENT: ["DEPARTMENT", "TEAM"],
  TEAM: [],
};

const organizationTypeOrder: OrganizationType[] = ["COMPANY", "DEPARTMENT", "TEAM"];

function normalizeOrganizationType(type: OrganizationItem["type"]): OrganizationType {
  return type && type in organizationChildTypeMap ? type : "COMPANY";
}

const initialQuery: OrganizationPageQuery = {
  pageNum: 1,
  pageSize: 10,
};

const initialForm: OrganizationMutationPayload = {
  name: "",
  code: "",
  type: "COMPANY",
  leader: "",
  phone: "",
  address: "",
  status: 1,
};

function getOrganizationTypeLabel(type: OrganizationType | undefined, t: (key: string, fallback?: string, variables?: Record<string, string | number>) => string) {
  const normalizedType = normalizeOrganizationType(type);
  if (normalizedType === "DEPARTMENT") {
    return t("organization.typeDepartment");
  }
  if (normalizedType === "TEAM") {
    return t("organization.typeTeam");
  }
  return t("organization.typeCompany");
}

function getOrganizationTypeColor(type: OrganizationType | undefined) {
  const normalizedType = normalizeOrganizationType(type);
  if (normalizedType === "DEPARTMENT") {
    return "gold";
  }
  if (normalizedType === "TEAM") {
    return "cyan";
  }
  return "processing";
}

function canContainChild(parentType: OrganizationType | undefined, childType: OrganizationType) {
  const allowedChildTypes = parentType ? organizationChildTypeMap[normalizeOrganizationType(parentType)] ?? [] : organizationTypeOrder;
  return allowedChildTypes.includes(childType);
}

function flattenTree(
  nodes: OrganizationTreeItem[],
  getLabel: (node: OrganizationTreeItem, level: number) => string,
  includeNode: (node: OrganizationTreeItem) => boolean,
  level = 0,
): Array<{ label: string; value: string }> {
  return nodes.flatMap((node) => {
    const children = flattenTree(node.children ?? [], getLabel, includeNode, level + 1);
    if (!includeNode(node)) {
      return children;
    }
    return [{ label: getLabel(node, level), value: node.id }, ...children];
  });
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

function findOrganizationTreeNode(nodes: OrganizationTreeItem[], id: string | null): OrganizationTreeItem | null {
  if (!id) {
    return null;
  }

  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const match = findOrganizationTreeNode(node.children ?? [], id);
    if (match) {
      return match;
    }
  }

  return null;
}

function collectDescendantIds(node: OrganizationTreeItem | null): Set<string> {
  const result = new Set<string>();

  const visit = (current: OrganizationTreeItem | null) => {
    if (!current) {
      return;
    }
    result.add(current.id);
    for (const child of current.children ?? []) {
      visit(child);
    }
  };

  visit(node);
  return result;
}

function collectDescendantTypes(node: OrganizationTreeItem | null): Set<OrganizationType> {
  const result = new Set<OrganizationType>();

  const visit = (current: OrganizationTreeItem | null) => {
    if (!current) {
      return;
    }
    for (const child of current.children ?? []) {
      if (child.type) {
        result.add(child.type);
      }
      visit(child);
    }
  };

  visit(node);
  return result;
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
  const [detailOpen, setDetailOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<OrganizationItem | null>(null);
  const currentType = Form.useWatch("type", drawerForm) ?? initialForm.type;
  const editingTreeNode = useMemo(() => findOrganizationTreeNode(tree, editing?.id ?? null), [editing?.id, tree]);
  const editingDescendantIds = useMemo(() => collectDescendantIds(editingTreeNode), [editingTreeNode]);
  const editingDescendantTypes = useMemo(() => collectDescendantTypes(editingTreeNode), [editingTreeNode]);

  const typeOptions = useMemo(
    () =>
      organizationTypeOrder
        .filter((type) => Array.from(editingDescendantTypes).every((descendantType) => canContainChild(type, descendantType)))
        .map((type) => ({ label: getOrganizationTypeLabel(type, t), value: type })),
    [editingDescendantTypes, t],
  );

  const allParentOptions = useMemo(
    () => flattenTree(tree, (node, level) => `${"- ".repeat(level)}${node.name} (${getOrganizationTypeLabel(node.type, t)})`, () => true),
    [t, tree],
  );

  const parentOptions = useMemo(
    () =>
      flattenTree(
        tree,
        (node, level) => `${"- ".repeat(level)}${node.name} (${getOrganizationTypeLabel(node.type, t)})`,
        (node) => !editingDescendantIds.has(node.id) && canContainChild(node.type, currentType),
      ),
    [currentType, editingDescendantIds, t, tree],
  );

  async function loadData(nextQuery: OrganizationPageQuery) {
    setLoading(true);
    setError(null);
    try {
      const [pageResult, treeResult] = await Promise.all([fetchOrganizationPage(nextQuery), fetchOrganizationTree()]);
      setRows(pageResult.data);
      setTotal(pageResult.total);
      setTree(treeResult);
      setSelected((current) => {
        if (!current) {
          return null;
        }
        return pageResult.data.find((item) => item.id === current.id) ?? findOrganization(treeResult, current.id);
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t("organization.loadFailed"));
      setRows([]);
      setTotal(0);
      setTree([]);
      setDetail(null);
      setDetailOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(target: OrganizationItem) {
    setDetailOpen(true);
    try {
      setDetail(await fetchOrganizationDetail(target.id));
    } catch {
      setDetail(target);
    }
  }

  useEffect(() => {
    loadData(query).catch(() => undefined);
  }, [query]);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const nextType = typeOptions.some((option) => option.value === currentType) ? currentType : typeOptions[0]?.value;
    if (nextType && nextType !== currentType) {
      drawerForm.setFieldValue("type", nextType);
      return;
    }

    const currentParentId = drawerForm.getFieldValue("parentId") as string | undefined;
    if (currentParentId && !parentOptions.some((option) => option.value === currentParentId)) {
      drawerForm.setFieldValue("parentId", undefined);
    }
  }, [currentType, drawerForm, drawerOpen, parentOptions, typeOptions]);

  const columns = useMemo(
    () => [
      { title: t("common.name"), dataIndex: "name" },
      { title: t("common.code"), dataIndex: "code" },
      {
        title: t("common.type"),
        render: (_: unknown, row: OrganizationItem) => <Tag color={getOrganizationTypeColor(row.type)}>{getOrganizationTypeLabel(row.type, t)}</Tag>,
      },
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
                    type: row.type ?? "COMPANY",
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
                    setDetailOpen(false);
                  }
                  await loadData(query);
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
    [drawerForm, query, selected?.id, t],
  );

  return (
    <NePage className="organization-page">
      <div className="shell-split-grid organization-page__content">
        <NePanel title={t("organization.tree")} className="shell-panel organization-page__tree-panel">
          <OrganizationTree
            className="organization-page__tree-surface"
            treeClassName="organization-page__tree"
            data={tree}
            selectedIds={selected ? [selected.id] : []}
            searchPlaceholder={t("permissionAssignment.searchOrganizations")}
            onSelectIdsChange={(ids) => {
              const key = ids[0];
              if (!key) {
                setSelected(null);
                setDetail(null);
                setDetailOpen(false);
                setQuery((current) => ({ ...current, parentId: undefined, pageNum: 1 }));
                return;
              }
              const next = findOrganization(tree, key);
              if (next) {
                setSelected(next);
                setDetail(null);
                setDetailOpen(false);
                setQuery((current) => ({ ...current, parentId: next.id, pageNum: 1 }));
              }
            }}
          />
        </NePanel>
        <div className="organization-page__main">
          <NeSearchPanel
            title={t("common.filters")}
            labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
            onReset={() => {
              filterForm.resetFields();
              setQuery((current) => ({ ...initialQuery, parentId: current.parentId }));
            }}
          >
            <Form
              form={filterForm}
              layout="inline"
              initialValues={initialQuery}
              onFinish={(values) => setQuery((current) => ({ ...current, ...values, parentId: current.parentId, pageNum: 1 }))}
            >
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
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  {t("common.search")}
                </Button>
              </Form.Item>
            </Form>
            {error ? <Typography.Paragraph type="danger" style={{ marginTop: 16, marginBottom: 0 }}>{error}</Typography.Paragraph> : null}
          </NeSearchPanel>
          <NeTablePanel
            className="organization-page__table-panel"
            toolbar={
              <NePermission code="platform:org:create">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditing(null);
                    const selectedType = normalizeOrganizationType(selected?.type);
                    const defaultParentId = selected && selectedType !== "TEAM" ? selected.id : undefined;
                    const defaultType = defaultParentId ? organizationChildTypeMap[selectedType][0] ?? initialForm.type : initialForm.type;
                    drawerForm.resetFields();
                    drawerForm.setFieldsValue({ ...initialForm, parentId: defaultParentId, type: defaultType });
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
              onRow={(record) => ({
                onClick: () => {
                  openDetail(record).catch(() => undefined);
                },
              })}
              pagination={false}
            />
          </NeTablePanel>
        </div>
      </div>
      <NeModal title={t("organization.detail")} open={detailOpen && Boolean(detail)} onClose={() => setDetailOpen(false)} width={640}>
        {detail ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t("common.name")}>{detail.name}</Descriptions.Item>
            <Descriptions.Item label={t("common.code")}>{detail.code}</Descriptions.Item>
            <Descriptions.Item label={t("common.type")}>{getOrganizationTypeLabel(detail.type, t)}</Descriptions.Item>
            <Descriptions.Item label={t("common.leader")}>{detail.leader ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.phone")}>{detail.phone ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.address")}>{detail.address ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.parent")}>{allParentOptions.find((option) => option.value === detail.parentId)?.label ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.status")}>{detail.status === 1 ? t("common.enabled") : t("common.disabled")}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </NeModal>
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
          layout="vertical"
          className="ne-modal-form-grid"
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
          <Form.Item name="name" label={t("common.name")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.name") }) }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label={t("common.code")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.code") }) }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label={t("common.type")} rules={[{ required: true, message: t("validation.selectField", undefined, { field: t("common.type") }) }]}>
            <Select options={typeOptions} />
          </Form.Item>
          <Form.Item name="leader" label={t("common.leader")}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label={t("common.phone")}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label={t("common.address")} className="ne-modal-form-grid__full">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="parentId" label={t("organization.parentOrg")}>
            <Select allowClear options={parentOptions} placeholder={parentOptions.length === 0 ? t("organization.noParentOptions") : undefined} />
          </Form.Item>
          <div className="ne-modal-form-grid__full">
            <Typography.Text type="secondary">{t("organization.typeHint")}</Typography.Text>
          </div>
          <Form.Item name="status" label={t("common.status")}>
            <Select options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} />
          </Form.Item>
        </Form>
      </NeModal>
    </NePage>
  );
}
