import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Pagination, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import type { DictItemItem, DictItemMutationPayload } from "@nebula/core";
import { useI18n } from "@nebula/core";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  createDictItem,
  deleteDictItem,
  fetchDictItemPage,
  updateDictItem,
} from "../../../api/dict-admin-api";
import { NeModal, NePage, NePanel, NeSearchPanel, NeTable } from "@nebula/ui-web";

const initialItemQuery = { pageNum: 1, pageSize: 10, orderName: "sort", orderType: "asc" };

const initialItemForm: DictItemMutationPayload = {
  dictCode: "",
  parentId: undefined,
  name: "",
  itemValue: "",
  sort: 0,
  status: 1,
  defaultFlag: false,
  tagColor: "",
  extraJson: "",
  remark: "",
};

function flattenDictItems(
  nodes: DictItemItem[],
  getLabel: (node: DictItemItem, level: number) => string,
  includeNode: (node: DictItemItem) => boolean,
  level = 0,
): Array<{ label: string; value: string }> {
  return nodes.flatMap((node) => {
    const children = flattenDictItems(node.children ?? [], getLabel, includeNode, level + 1);
    if (!includeNode(node)) {
      return children;
    }
    return [{ label: getLabel(node, level), value: node.id }, ...children];
  });
}

function collectDescendantIds(node: DictItemItem | null): Set<string> {
  const result = new Set<string>();
  const visit = (current: DictItemItem | null) => {
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

function findDictItem(nodes: DictItemItem[], id: string | null): DictItemItem | null {
  if (!id) {
    return null;
  }
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const match = findDictItem(node.children ?? [], id);
    if (match) {
      return match;
    }
  }
  return null;
}

function countDictItems(nodes: DictItemItem[]): number {
  return nodes.reduce((total, node) => total + 1 + countDictItems(node.children ?? []), 0);
}

function buildDictItemTree(nodes: DictItemItem[]): DictItemItem[] {
  const nodeMap = new Map<string, DictItemItem>();
  const roots: DictItemItem[] = [];

  nodes.forEach((node) => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  nodeMap.forEach((node) => {
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.children = [...(parent.children ?? []), node];
        return;
      }
    }
    roots.push(node);
  });

  return roots;
}

function filterDictItems(nodes: DictItemItem[], keyword: string): DictItemItem[] {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return nodes;
  }

  return nodes.flatMap((node): DictItemItem[] => {
    const children: DictItemItem[] = filterDictItems(node.children ?? [], keyword);
    const matched = [node.name, node.itemValue, node.path ?? ""].some((value) => value.toLowerCase().includes(normalizedKeyword));
    if (!matched && children.length === 0) {
      return [];
    }
    return [{ ...node, children }];
  });
}

function inferTreeEnabled(items: DictItemItem[]) {
  return items.some((item) => Boolean(item.parentId));
}

export function AdvancedDictItemsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const dictCode = params.get("dictCode") ?? "";
  const dictName = params.get("dictName") ?? dictCode;
  const [itemFilterForm] = Form.useForm<typeof initialItemQuery & { name?: string }>();
  const [itemDrawerForm] = Form.useForm<DictItemMutationPayload>();
  const [itemQuery, setItemQuery] = useState(initialItemQuery);
  const [items, setItems] = useState<DictItemItem[]>([]);
  const [treeItems, setTreeItems] = useState<DictItemItem[]>([]);
  const [itemTotal, setItemTotal] = useState(0);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [itemDrawerOpen, setItemDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DictItemItem | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);
  const [treeEnabled, setTreeEnabled] = useState(false);
  const itemNameKeyword = Form.useWatch("name", itemFilterForm) ?? "";
  const editingTreeNode = useMemo(() => findDictItem(treeItems, editingItem?.id ?? null), [editingItem?.id, treeItems]);
  const editingDescendantIds = useMemo(() => collectDescendantIds(editingTreeNode), [editingTreeNode]);

  async function loadItems(nextQuery = itemQuery) {
    if (!dictCode) {
      setItems([]);
      setTreeItems([]);
      setItemTotal(0);
      return;
    }

    setItemLoading(true);
    setItemError(null);
    try {
      const pageSize = treeEnabled ? 1000 : nextQuery.pageSize;
      const pageNum = treeEnabled ? 1 : nextQuery.pageNum;
      const result = await fetchDictItemPage({ ...nextQuery, dictCode, pageNum, pageSize });
      const nextItems = result.data;
      const inferredTreeEnabled = inferTreeEnabled(nextItems);
      setTreeEnabled(inferredTreeEnabled);

      if (inferredTreeEnabled) {
        const nextTreeItems = buildDictItemTree(nextItems);
        setTreeItems(nextTreeItems);
        setItems(nextItems);
        setItemTotal(countDictItems(nextTreeItems));
        return;
      }

      setItems(nextItems);
      setTreeItems([]);
      setItemTotal(result.total);
    } catch (error) {
      setItemError(error instanceof Error ? error.message : t("dict.loadItemsFailed"));
      setItems([]);
      setTreeItems([]);
      setItemTotal(0);
    } finally {
      setItemLoading(false);
    }
  }

  useEffect(() => {
    loadItems(itemQuery).catch(() => undefined);
  }, [dictCode, itemQuery]);

  const filteredTreeItems = useMemo(() => {
    if (!itemNameKeyword.trim()) {
      return treeItems;
    }
    return filterDictItems(treeItems, itemNameKeyword);
  }, [itemNameKeyword, treeItems]);

  const parentOptions = useMemo(
    () =>
      flattenDictItems(
        treeItems,
        (node, level) => `${"- ".repeat(level)}${node.name}`,
        (node) => !editingDescendantIds.has(node.id),
      ),
    [editingDescendantIds, treeItems],
  );

  const itemColumns = useMemo(
    () => [
      { title: t("common.name"), dataIndex: "name" },
      { title: t("common.value"), dataIndex: "itemValue" },
      { title: t("common.sort"), dataIndex: "sort" },
      {
        title: t("dict.path"),
        dataIndex: "path",
        render: (value: string | undefined) => value || "-",
      },
      {
        title: t("common.default"),
        render: (_: unknown, row: DictItemItem) =>
          row.defaultFlag ? <Tag color="gold">{t("common.yes")}</Tag> : <Tag>{t("common.no")}</Tag>,
      },
      {
        title: t("common.status"),
        render: (_: unknown, row: DictItemItem) =>
          row.status === 1 ? <Tag color="success">{t("common.enabled")}</Tag> : <Tag color="error">{t("common.disabled")}</Tag>,
      },
      {
        title: t("common.actions"),
        render: (_: unknown, row: DictItemItem) => (
          <Space wrap>
            {treeEnabled ? (
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingItem(null);
                  itemDrawerForm.setFieldsValue({
                    ...initialItemForm,
                    dictCode: row.dictCode,
                    parentId: row.id,
                  });
                  setItemDrawerOpen(true);
                }}
              >
                {t("dict.addChild")}
              </Button>
            ) : null}
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingItem(row);
                itemDrawerForm.setFieldsValue({
                  dictCode: row.dictCode,
                  parentId: row.parentId,
                  name: row.name,
                  itemValue: row.itemValue,
                  sort: row.sort ?? 0,
                  status: row.status ?? 1,
                  defaultFlag: row.defaultFlag ?? false,
                  tagColor: row.tagColor ?? "",
                  extraJson: row.extraJson ?? "",
                  remark: row.remark ?? "",
                });
                setItemDrawerOpen(true);
              }}
            >
              {t("common.edit")}
            </Button>
            <Popconfirm
              title={treeEnabled ? t("dict.deleteNodeConfirm") : t("common.confirmDelete")}
              onConfirm={async () => {
                await deleteDictItem(row.id);
                await loadItems(itemQuery);
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
    [itemDrawerForm, itemQuery, t, treeEnabled, treeItems],
  );

  return (
    <NePage>
      <NePanel title={t("dict.manageItemsPanelTitle", undefined, { name: dictName || dictCode || t("common.name") })}>
        <Space direction="vertical" size={4}>
          <Typography.Text strong>{dictName || dictCode}</Typography.Text>
          <Typography.Text type="secondary">{dictCode || t("dict.missingDictCode")}</Typography.Text>
        </Space>
      </NePanel>

      <NeSearchPanel
        title={treeEnabled ? t("dict.treeItemFilter") : t("dict.itemFilter")}
        labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
        onReset={() => {
          itemFilterForm.resetFields();
          setItemQuery(initialItemQuery);
        }}
      >
        <Form form={itemFilterForm} layout="inline" initialValues={initialItemQuery} onFinish={(values) => setItemQuery((current) => ({ ...current, ...values, pageNum: 1 }))}>
          <Form.Item name="name" label={t("common.name")}><Input allowClear /></Form.Item>
          {!treeEnabled ? <Form.Item name="status" label={t("common.status")}><Select allowClear style={{ width: 140 }} options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item> : null}
          <Form.Item><Button type="primary" htmlType="submit" icon={<SearchOutlined />}>{t("common.search")}</Button></Form.Item>
        </Form>
        {treeEnabled ? <Typography.Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>{t("dict.treeModeHint")}</Typography.Paragraph> : null}
        {itemError ? <Typography.Paragraph type="danger" style={{ marginTop: 16, marginBottom: 0 }}>{itemError}</Typography.Paragraph> : null}
      </NeSearchPanel>

      <NeTable
        toolbar={<Space wrap>
          <Button onClick={() => navigate(-1)}>{t("common.back")}</Button>
          <Button type="primary" icon={<PlusOutlined />} disabled={!dictCode} onClick={() => {
            setEditingItem(null);
            itemDrawerForm.setFieldsValue({ ...initialItemForm, dictCode, parentId: undefined });
            setItemDrawerOpen(true);
          }}>{treeEnabled ? t("dict.createRootItem") : t("dict.createItem")}</Button>
        </Space>}
        summary={treeEnabled ? t("dict.treeRecordCount", undefined, { count: itemTotal }) : t("common.recordCount", undefined, { count: itemTotal })}
        pagination={treeEnabled ? undefined : <Pagination align="end" current={itemQuery.pageNum} pageSize={itemQuery.pageSize} total={itemTotal} onChange={(pageNum, pageSize) => setItemQuery((current) => ({ ...current, pageNum, pageSize }))} />}
      >
        <Table<DictItemItem>
          rowKey="id"
          loading={itemLoading}
          dataSource={treeEnabled ? filteredTreeItems : items}
          columns={itemColumns}
          pagination={false}
          expandable={treeEnabled ? { defaultExpandAllRows: true } : undefined}
        />
      </NeTable>

      <NeModal title={editingItem ? t("dict.editItem") : (treeEnabled ? t("dict.createTreeItem") : t("dict.createItem"))} open={itemDrawerOpen} onClose={() => setItemDrawerOpen(false)} width={720} confirmText={t("common.save")} cancelText={t("common.cancel")} onConfirm={() => itemDrawerForm.submit()} confirmLoading={itemSubmitting}>
        <Form form={itemDrawerForm} layout="vertical" className="ne-modal-form-grid" initialValues={initialItemForm} onFinish={async (values) => {
          setItemSubmitting(true);
          try {
            if (editingItem) {
              await updateDictItem(editingItem.id, values);
            } else {
              await createDictItem(values);
            }
            setItemDrawerOpen(false);
            await loadItems(itemQuery);
          } finally {
            setItemSubmitting(false);
          }
        }}>
          <Form.Item name="dictCode" label={t("common.code")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.code") }) }]}><Input disabled /></Form.Item>
          {treeEnabled ? (
            <Form.Item name="parentId" label={t("common.parent")}>
              <Select allowClear options={parentOptions} placeholder={t("dict.rootItemHint")} showSearch optionFilterProp="label" />
            </Form.Item>
          ) : null}
          <Form.Item name="name" label={t("common.name")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.name") }) }]}><Input /></Form.Item>
          <Form.Item name="itemValue" label={t("common.itemValue")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.itemValue") }) }]}><Input /></Form.Item>
          <Form.Item name="sort" label={t("common.sort")}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="defaultFlag" label={t("dict.isDefault")}><Select options={[{ label: t("common.no"), value: false }, { label: t("common.yes"), value: true }]} /></Form.Item>
          <Form.Item name="tagColor" label={t("common.tagColor")}><Input /></Form.Item>
          <Form.Item name="extraJson" label={t("common.extJson")} className="ne-modal-form-grid__full"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="status" label={t("common.status")}><Select options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item>
          <Form.Item name="remark" label={t("common.remark")} className="ne-modal-form-grid__full"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </NeModal>
    </NePage>
  );
}
