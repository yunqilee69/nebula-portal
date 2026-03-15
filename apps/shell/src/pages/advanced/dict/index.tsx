import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, Input, InputNumber, Pagination, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import type { DictItemItem, DictItemMutationPayload, DictTypeItem, DictTypeMutationPayload } from "@platform/core";
import { useI18n } from "@platform/core";
import { useEffect, useMemo, useState } from "react";
import {
  createDictItem,
  createDictType,
  deleteDictItem,
  deleteDictType,
  fetchDictItemPage,
  fetchDictTypePage,
  updateDictItem,
  updateDictType,
} from "@/api/dict-admin-api";
import { NeModal, NePage, NePanel, NeSearchPanel, NeTablePanel } from "@platform/ui";

const initialTypeQuery = { pageNum: 1, pageSize: 10, orderName: "updateTime", orderType: "desc" };
const initialItemQuery = { pageNum: 1, pageSize: 10, orderName: "sort", orderType: "asc" };

const initialTypeForm: DictTypeMutationPayload = {
  typeCode: "",
  typeName: "",
  status: 1,
  remark: "",
};

const initialItemForm: DictItemMutationPayload = {
  typeCode: "",
  itemCode: "",
  itemLabel: "",
  itemValue: "",
  sort: 0,
  status: 1,
  isDefault: 0,
  tagColor: "",
  extraJson: "",
  remark: "",
};

export function AdvancedDictPage() {
  const { t } = useI18n();
  const [typeFilterForm] = Form.useForm<typeof initialTypeQuery>();
  const [itemFilterForm] = Form.useForm<typeof initialItemQuery & { itemCode?: string; itemLabel?: string }>();
  const [typeDrawerForm] = Form.useForm<DictTypeMutationPayload>();
  const [itemDrawerForm] = Form.useForm<DictItemMutationPayload>();
  const [typeQuery, setTypeQuery] = useState(initialTypeQuery);
  const [itemQuery, setItemQuery] = useState(initialItemQuery);
  const [types, setTypes] = useState<DictTypeItem[]>([]);
  const [items, setItems] = useState<DictItemItem[]>([]);
  const [selectedType, setSelectedType] = useState<DictTypeItem | null>(null);
  const [typeTotal, setTypeTotal] = useState(0);
  const [itemTotal, setItemTotal] = useState(0);
  const [typeLoading, setTypeLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);
  const [typeSubmitting, setTypeSubmitting] = useState(false);
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [typeDrawerOpen, setTypeDrawerOpen] = useState(false);
  const [itemDrawerOpen, setItemDrawerOpen] = useState(false);
  const [editingType, setEditingType] = useState<DictTypeItem | null>(null);
  const [editingItem, setEditingItem] = useState<DictItemItem | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);

  async function loadTypes(nextQuery = typeQuery) {
    setTypeLoading(true);
    setTypeError(null);
    try {
      const result = await fetchDictTypePage(nextQuery);
      setTypes(result.data);
      setTypeTotal(result.total);
      setSelectedType((current) => current ?? result.data[0] ?? null);
    } catch (error) {
      setTypeError(error instanceof Error ? error.message : t("dict.loadTypesFailed"));
      setTypes([]);
      setTypeTotal(0);
      setSelectedType(null);
    } finally {
      setTypeLoading(false);
    }
  }

  async function loadItems(nextQuery = itemQuery, typeCode = selectedType?.typeCode) {
    if (!typeCode) {
      setItems([]);
      setItemTotal(0);
      return;
    }
    setItemLoading(true);
    setItemError(null);
    try {
      const result = await fetchDictItemPage({ ...nextQuery, typeCode });
      setItems(result.data);
      setItemTotal(result.total);
    } catch (error) {
      setItemError(error instanceof Error ? error.message : t("dict.loadItemsFailed"));
      setItems([]);
      setItemTotal(0);
    } finally {
      setItemLoading(false);
    }
  }

  useEffect(() => {
    loadTypes(typeQuery).catch(() => undefined);
  }, [typeQuery]);

  useEffect(() => {
    loadItems(itemQuery, selectedType?.typeCode).catch(() => undefined);
  }, [itemQuery, selectedType?.typeCode]);

  const typeColumns = useMemo(
    () => [
      { title: t("common.code"), dataIndex: "typeCode" },
      { title: t("common.name"), dataIndex: "typeName" },
      { title: t("common.status"), render: (_: unknown, row: DictTypeItem) => (row.status === 1 ? <Tag color="success">{t("common.enabled")}</Tag> : <Tag color="error">{t("common.disabled")}</Tag>) },
      {
        title: t("common.actions"),
        render: (_: unknown, row: DictTypeItem) => (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                setEditingType(row);
                typeDrawerForm.setFieldsValue({
                  typeCode: row.typeCode,
                  typeName: row.typeName,
                  status: row.status ?? 1,
                  remark: row.remark ?? "",
                });
                setTypeDrawerOpen(true);
              }}
            >
              {t("common.edit")}
            </Button>
            <Popconfirm
              title={t("common.confirmDelete")}
              onConfirm={async (event) => {
                event?.stopPropagation();
                await deleteDictType(row.id);
                if (selectedType?.id === row.id) {
                  setSelectedType(null);
                }
                await loadTypes(typeQuery);
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
    [selectedType?.id, t, typeDrawerForm, typeQuery],
  );

  const itemColumns = useMemo(
    () => [
      { title: t("common.itemCode"), dataIndex: "itemCode" },
      { title: t("common.label"), dataIndex: "itemLabel" },
      { title: t("common.value"), dataIndex: "itemValue" },
      { title: t("common.sort"), dataIndex: "sort" },
      { title: t("common.default"), render: (_: unknown, row: DictItemItem) => (row.isDefault === 1 ? <Tag color="gold">{t("common.yes")}</Tag> : <Tag>{t("common.no")}</Tag>) },
      { title: t("common.status"), render: (_: unknown, row: DictItemItem) => (row.status === 1 ? <Tag color="success">{t("common.enabled")}</Tag> : <Tag color="error">{t("common.disabled")}</Tag>) },
      {
        title: t("common.actions"),
        render: (_: unknown, row: DictItemItem) => (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                setEditingItem(row);
                itemDrawerForm.setFieldsValue({
                  typeCode: row.typeCode,
                  itemCode: row.itemCode,
                  itemLabel: row.itemLabel,
                  itemValue: row.itemValue,
                  sort: row.sort ?? 0,
                  status: row.status ?? 1,
                  isDefault: row.isDefault ?? 0,
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
              title={t("common.confirmDelete")}
              onConfirm={async (event) => {
                event?.stopPropagation();
                await deleteDictItem(row.id);
                await loadItems(itemQuery, selectedType?.typeCode);
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
    [itemDrawerForm, itemQuery, selectedType?.typeCode, t],
  );

  return (
    <NePage>
      <NePanel title={t("dict.typeOverview")}>
        {selectedType ? (
          <Descriptions column={3} size="small" bordered>
            <Descriptions.Item label={t("common.name")}>{selectedType.typeName}</Descriptions.Item>
            <Descriptions.Item label={t("common.code")}>{selectedType.typeCode}</Descriptions.Item>
            <Descriptions.Item label={t("common.status")}>{selectedType.status === 1 ? t("common.enabled") : t("common.disabled")}</Descriptions.Item>
            <Descriptions.Item label={t("dict.selectedTypeRemark")} span={3}>
              {selectedType.remark ?? t("dict.noRemark")}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Typography.Text type="secondary">{t("dict.typeSelectHint")}</Typography.Text>
        )}
      </NePanel>

      <div className="shell-split-grid">
        <div>
          <NeSearchPanel
            title={t("dict.typeFilter")}
            labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
            onReset={() => {
              typeFilterForm.resetFields();
              setTypeQuery(initialTypeQuery);
            }}
          >
            <Form form={typeFilterForm} layout="inline" initialValues={initialTypeQuery} onFinish={(values) => setTypeQuery((current) => ({ ...current, ...values, pageNum: 1 }))}>
              <Form.Item name="typeCode" label={t("common.code")}><Input allowClear /></Form.Item>
              <Form.Item name="typeName" label={t("common.name")}><Input allowClear /></Form.Item>
              <Form.Item name="status" label={t("common.status")}><Select allowClear style={{ width: 140 }} options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item>
              <Form.Item><Button type="primary" htmlType="submit" icon={<SearchOutlined />}>{t("common.search")}</Button></Form.Item>
            </Form>
            {typeError ? <Typography.Paragraph type="danger" style={{ marginTop: 16, marginBottom: 0 }}>{typeError}</Typography.Paragraph> : null}
          </NeSearchPanel>
          <NeTablePanel
            toolbar={<Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setEditingType(null);
              typeDrawerForm.setFieldsValue(initialTypeForm);
              setTypeDrawerOpen(true);
            }}>{t("dict.createType")}</Button>}
            summary={t("common.recordCount", undefined, { count: typeTotal })}
            pagination={<Pagination align="end" current={typeQuery.pageNum} pageSize={typeQuery.pageSize} total={typeTotal} onChange={(pageNum, pageSize) => setTypeQuery((current) => ({ ...current, pageNum, pageSize }))} />}
          >
            <Table<DictTypeItem> rowKey="id" loading={typeLoading} dataSource={types} columns={typeColumns} pagination={false} onRow={(record) => ({ onClick: () => setSelectedType(record) })} />
          </NeTablePanel>
        </div>

        <div>
          <NeSearchPanel
            title={t("dict.itemFilter")}
            labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
            onReset={() => {
              itemFilterForm.resetFields();
              setItemQuery(initialItemQuery);
            }}
          >
            <Form form={itemFilterForm} layout="inline" initialValues={initialItemQuery} onFinish={(values) => setItemQuery((current) => ({ ...current, ...values, pageNum: 1 }))}>
              <Form.Item name="itemCode" label={t("common.itemCode")}><Input allowClear /></Form.Item>
              <Form.Item name="itemLabel" label={t("common.itemLabel")}><Input allowClear /></Form.Item>
              <Form.Item name="status" label={t("common.status")}><Select allowClear style={{ width: 140 }} options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item>
              <Form.Item><Button type="primary" htmlType="submit" icon={<SearchOutlined />}>{t("common.search")}</Button></Form.Item>
            </Form>
            {itemError ? <Typography.Paragraph type="danger" style={{ marginTop: 16, marginBottom: 0 }}>{itemError}</Typography.Paragraph> : null}
          </NeSearchPanel>
          <NeTablePanel
            toolbar={<Button type="primary" icon={<PlusOutlined />} disabled={!selectedType} onClick={() => {
              setEditingItem(null);
              itemDrawerForm.setFieldsValue({ ...initialItemForm, typeCode: selectedType?.typeCode ?? "" });
              setItemDrawerOpen(true);
            }}>{t("dict.createItem")}</Button>}
            summary={t("common.recordCount", undefined, { count: itemTotal })}
            pagination={<Pagination align="end" current={itemQuery.pageNum} pageSize={itemQuery.pageSize} total={itemTotal} onChange={(pageNum, pageSize) => setItemQuery((current) => ({ ...current, pageNum, pageSize }))} />}
          >
            <Table<DictItemItem> rowKey="id" loading={itemLoading} dataSource={items} columns={itemColumns} pagination={false} />
          </NeTablePanel>
        </div>
      </div>

      <NeModal title={editingType ? t("dict.editType") : t("dict.createType")} open={typeDrawerOpen} onClose={() => setTypeDrawerOpen(false)} width={720} confirmText={t("common.save")} cancelText={t("common.cancel")} onConfirm={() => typeDrawerForm.submit()} confirmLoading={typeSubmitting}>
        <Form form={typeDrawerForm} layout="vertical" className="ne-modal-form-grid" initialValues={initialTypeForm} onFinish={async (values) => {
          setTypeSubmitting(true);
          try {
            if (editingType) {
              await updateDictType(editingType.id, values);
            } else {
              await createDictType(values);
            }
            setTypeDrawerOpen(false);
            await loadTypes(typeQuery);
          } finally {
            setTypeSubmitting(false);
          }
        }}>
          <Form.Item name="typeCode" label={t("common.code")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.code") }) }]}><Input disabled={Boolean(editingType)} /></Form.Item>
          <Form.Item name="typeName" label={t("common.name")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.name") }) }]}><Input /></Form.Item>
          <Form.Item name="status" label={t("common.status")}><Select options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item>
          <Form.Item name="remark" label={t("common.remark")} className="ne-modal-form-grid__full"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </NeModal>

      <NeModal title={editingItem ? t("dict.editItem") : t("dict.createItem")} open={itemDrawerOpen} onClose={() => setItemDrawerOpen(false)} width={720} confirmText={t("common.save")} cancelText={t("common.cancel")} onConfirm={() => itemDrawerForm.submit()} confirmLoading={itemSubmitting}>
        <Form form={itemDrawerForm} layout="vertical" className="ne-modal-form-grid" initialValues={initialItemForm} onFinish={async (values) => {
          setItemSubmitting(true);
          try {
            if (editingItem) {
              await updateDictItem(editingItem.id, values);
            } else {
              await createDictItem(values);
            }
            setItemDrawerOpen(false);
            await loadItems(itemQuery, selectedType?.typeCode);
          } finally {
            setItemSubmitting(false);
          }
        }}>
          <Form.Item name="typeCode" label={t("common.code")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.code") }) }]}><Input disabled={Boolean(selectedType)} /></Form.Item>
          <Form.Item name="itemCode" label={t("common.itemCode")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.itemCode") }) }]}><Input disabled={Boolean(editingItem)} /></Form.Item>
          <Form.Item name="itemLabel" label={t("common.itemLabel")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.itemLabel") }) }]}><Input /></Form.Item>
          <Form.Item name="itemValue" label={t("common.itemValue")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.itemValue") }) }]}><Input /></Form.Item>
          <Form.Item name="sort" label={t("common.sort")}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="isDefault" label={t("dict.isDefault")}><Select options={[{ label: t("common.no"), value: 0 }, { label: t("common.yes"), value: 1 }]} /></Form.Item>
          <Form.Item name="tagColor" label={t("common.tagColor")}><Input /></Form.Item>
          <Form.Item name="extraJson" label={t("common.extJson")} className="ne-modal-form-grid__full"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="status" label={t("common.status")}><Select options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item>
          <Form.Item name="remark" label={t("common.remark")} className="ne-modal-form-grid__full"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </NeModal>
    </NePage>
  );
}
