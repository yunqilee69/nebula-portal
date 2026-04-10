import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type {
  SystemParamDataType,
  SystemParamItem,
  SystemParamMutationPayload,
  SystemParamPageQuery,
} from "@nebula/core";
import { NePermission, useI18n, useResourceStore } from "@nebula/core";
import { useEffect, useMemo, useState } from "react";
import {
  createSystemParam,
  deleteSystemParam,
  fetchSystemParamDetail,
  fetchSystemParamPage,
  updateSystemParam,
} from "@/api/system-param-api";
import { NeDetailDrawer, NeModal, NePage, NeSearchPanel, NeTablePanel } from "@nebula/ui-web";

const initialQuery: SystemParamPageQuery = {
  pageNum: 1,
  pageSize: 10,
  orderName: "updateTime",
  orderType: "desc",
};

interface SystemParamFormValues {
  paramKey: string;
  paramName: string;
  description?: string;
  dataType: SystemParamDataType;
  options?: string[];
  minValue?: number;
  maxValue?: number;
}

const initialFormValues: SystemParamFormValues = {
  paramKey: "",
  paramName: "",
  description: "",
  dataType: "STRING",
  options: [],
  minValue: undefined,
  maxValue: undefined,
};

function isOptionDataType(value?: SystemParamDataType) {
  return value === "SINGLE" || value === "MULTIPLE";
}

function isNumericDataType(value?: SystemParamDataType) {
  return value === "INT" || value === "DOUBLE";
}

function normalizeFormValues(item?: SystemParamItem | null): SystemParamFormValues {
  if (!item) {
    return initialFormValues;
  }
  return {
    paramKey: item.paramKey,
    paramName: item.paramName ?? "",
    description: item.description ?? "",
    dataType: item.dataType ?? "STRING",
    options: item.options ?? [],
    minValue: item.minValue,
    maxValue: item.maxValue,
  };
}

function normalizePayload(values: SystemParamFormValues): SystemParamMutationPayload {
  const options = isOptionDataType(values.dataType)
    ? (values.options ?? []).map((item) => item.trim()).filter(Boolean)
    : undefined;

  return {
    paramKey: values.paramKey.trim(),
    paramName: values.paramName.trim(),
    description: values.description?.trim() || undefined,
    dataType: values.dataType,
    options: options && options.length > 0 ? options : undefined,
    minValue: isNumericDataType(values.dataType) ? values.minValue : undefined,
    maxValue: isNumericDataType(values.dataType) ? values.maxValue : undefined,
  };
}

export function AdvancedParamPage() {
  const { t } = useI18n();
  const [form] = Form.useForm<SystemParamPageQuery>();
  const [drawerForm] = Form.useForm<SystemParamFormValues>();
  const [query, setQuery] = useState<SystemParamPageQuery>(initialQuery);
  const [rows, setRows] = useState<SystemParamItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<SystemParamItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editing, setEditing] = useState<SystemParamItem | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const resource = useResourceStore((state) => state.resources.systemParams);
  const start = useResourceStore((state) => state.start);
  const succeed = useResourceStore((state) => state.succeed);
  const fail = useResourceStore((state) => state.fail);
  const currentDataType = Form.useWatch("dataType", drawerForm) ?? initialFormValues.dataType;

  const dataTypeOptions = useMemo(
    () => [
      { label: t("common.dataTypeString"), value: "STRING" },
      { label: t("common.dataTypeInteger"), value: "INT" },
      { label: t("common.dataTypeDouble"), value: "DOUBLE" },
      { label: t("common.dataTypeBoolean"), value: "BOOLEAN" },
      { label: t("common.dataTypeSingle"), value: "SINGLE" },
      { label: t("common.dataTypeMultiple"), value: "MULTIPLE" },
    ],
    [t],
  );

  const resolveDataTypeLabel = (value?: SystemParamDataType) => {
    switch (value) {
      case "INT":
        return t("common.dataTypeInteger");
      case "DOUBLE":
        return t("common.dataTypeDouble");
      case "BOOLEAN":
        return t("common.dataTypeBoolean");
      case "SINGLE":
        return t("common.dataTypeSingle");
      case "MULTIPLE":
        return t("common.dataTypeMultiple");
      case "STRING":
        return t("common.dataTypeString");
      default:
        return value ?? "-";
    }
  };

  async function loadPage(nextQuery: SystemParamPageQuery) {
    start("systemParams");
    try {
      const result = await fetchSystemParamPage(nextQuery);
      setRows(result.data);
      setTotal(result.total);
      succeed("systemParams");
    } catch (error) {
      fail("systemParams", error instanceof Error ? error.message : t("systemParams.loadFailed"));
    }
  }

  useEffect(() => {
    void loadPage(query);
  }, [query]);

  async function openDetail(row: SystemParamItem) {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const detail = await fetchSystemParamDetail(String(row.id));
      setSelected(detail ?? row);
    } finally {
      setDetailLoading(false);
    }
  }

  async function openEditor(row?: SystemParamItem) {
    setEditorLoading(true);
    try {
      if (row) {
        const detail = await fetchSystemParamDetail(String(row.id));
        const nextEditing = detail ?? row;
        setEditing(nextEditing);
        drawerForm.setFieldsValue(normalizeFormValues(nextEditing));
      } else {
        setEditing(null);
        drawerForm.setFieldsValue(initialFormValues);
      }
      setEditorOpen(true);
    } finally {
      setEditorLoading(false);
    }
  }

  const columns = useMemo(
    () => [
      { title: t("common.paramKey"), dataIndex: "paramKey" },
      { title: t("common.name"), dataIndex: "paramName", render: (value: string | undefined) => value ?? "-" },
      {
        title: t("common.type"),
        dataIndex: "dataType",
        render: (value: SystemParamDataType | undefined) =>
          value ? <Tag color="processing">{resolveDataTypeLabel(value)}</Tag> : "-",
      },
      { title: t("common.description"), dataIndex: "description", render: (value: string | undefined) => value ?? "-" },
      { title: t("common.updateTime"), dataIndex: "updateTime", render: (value: string | undefined) => value ?? "-" },
      {
        title: t("common.actions"),
        render: (_: unknown, row: SystemParamItem) => (
          <Space>
            <NePermission code="crm:customer:edit">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  void openEditor(row);
                }}
              >
                {t("common.edit")}
              </Button>
            </NePermission>
            <NePermission code="crm:customer:export">
              <Popconfirm
                title={t("common.confirmDelete")}
                onConfirm={async () => {
                  await deleteSystemParam(String(row.id));
                  if (selected?.id === row.id) {
                    setSelected(null);
                    setDetailOpen(false);
                  }
                  await loadPage(query);
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
    [query, resolveDataTypeLabel, selected?.id, t],
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
        <Form
          form={form}
          layout="inline"
          initialValues={initialQuery}
          onFinish={(values) => setQuery((current) => ({ ...current, ...values, pageNum: 1 }))}
        >
          <Form.Item name="paramKey" label={t("common.paramKey")}>
            <Input allowClear placeholder={t("common.paramKeyExample")} />
          </Form.Item>
          <Form.Item name="paramName" label={t("common.name")}>
            <Input allowClear placeholder={t("common.primaryColorExample")} />
          </Form.Item>
          <Form.Item name="dataType" label={t("common.type")}>
            <Select allowClear style={{ width: 180 }} options={dataTypeOptions} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              {t("common.search")}
            </Button>
          </Form.Item>
        </Form>
      </NeSearchPanel>
      <NeTablePanel
        toolbar={
          <Space>
            <NePermission code="crm:customer:create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  void openEditor();
                }}
              >
                {t("systemParams.createParam")}
              </Button>
            </NePermission>
            <NePermission code="crm:customer:export">
              <Button>{t("common.exportSnapshot")}</Button>
            </NePermission>
          </Space>
        }
        summary={t("common.recordCount", undefined, { count: total })}
        pagination={
          <Pagination
            align="end"
            current={query.pageNum}
            pageSize={query.pageSize}
            total={total}
            onChange={(pageNum, pageSize) => setQuery((current) => ({ ...current, pageNum, pageSize }))}
          />
        }
      >
        <Table<SystemParamItem>
          rowKey="id"
          loading={resource.loading}
          dataSource={rows}
          columns={columns}
          onRow={(record) => ({
            onClick: () => {
              void openDetail(record);
            },
          })}
          pagination={false}
        />
      </NeTablePanel>
      <NeDetailDrawer title={t("systemParams.detailTitle")} open={detailOpen} onClose={() => {
        setDetailOpen(false);
        setSelected(null);
      }}>
        {detailLoading ? (
          <Spin />
        ) : selected ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t("common.paramKey")}>{selected.paramKey}</Descriptions.Item>
            <Descriptions.Item label={t("common.name")}>{selected.paramName ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.description")}>{selected.description ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.type")}>{resolveDataTypeLabel(selected.dataType)}</Descriptions.Item>
            <Descriptions.Item label={t("common.value")}>{selected.paramValue ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.options")}>
              {selected.options && selected.options.length > 0 ? selected.options.join(", ") : "-"}
            </Descriptions.Item>
            <Descriptions.Item label={t("common.minValue")}>
              {selected.minValue !== undefined ? selected.minValue : "-"}
            </Descriptions.Item>
            <Descriptions.Item label={t("common.maxValue")}>
              {selected.maxValue !== undefined ? selected.maxValue : "-"}
            </Descriptions.Item>
            <Descriptions.Item label={t("common.createTime")}>{selected.createTime ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.updateTime")}>{selected.updateTime ?? "-"}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </NeDetailDrawer>
      <NeModal
        title={editing ? t("systemParams.editParam") : t("systemParams.createParam")}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        width={720}
        confirmText={t("common.save")}
        cancelText={t("common.cancel")}
        onConfirm={() => drawerForm.submit()}
        confirmLoading={submitting || editorLoading}
      >
        <Form
          form={drawerForm}
          layout="vertical"
          className="ne-modal-form-grid"
          initialValues={initialFormValues}
          onFinish={async (values) => {
            setSubmitting(true);
            try {
              const payload = normalizePayload(values);
              if (editing) {
                await updateSystemParam(String(editing.id), payload);
              } else {
                await createSystemParam(payload);
              }
              setEditorOpen(false);
              await loadPage(query);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form.Item
            name="paramKey"
            label={t("common.paramKey")}
            rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.paramKey") }) }]}
          >
            <Input disabled={Boolean(editing)} />
          </Form.Item>
          <Form.Item
            name="paramName"
            label={t("common.name")}
            rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.name") }) }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t("common.description")} className="ne-modal-form-grid__full">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="dataType"
            label={t("common.type")}
            rules={[{ required: true, message: t("validation.selectField", undefined, { field: t("common.type") }) }]}
          >
            <Select options={dataTypeOptions} />
          </Form.Item>
          <Form.Item label={t("common.value")} extra={t("systemParams.valueHint")}>
            <Input value={editing?.paramValue ?? ""} readOnly placeholder="-" />
          </Form.Item>
          {isOptionDataType(currentDataType) ? (
            <Form.List name="options">
              {(fields, { add, remove }) => (
                <Form.Item label={t("common.options")} className="ne-modal-form-grid__full">
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    {fields.map((field, index) => (
                      <Space key={field.key} align="start" style={{ width: "100%" }}>
                        <Form.Item
                          {...field}
                          style={{ flex: 1, marginBottom: 0 }}
                          rules={[
                            {
                              required: true,
                              whitespace: true,
                              message: t("validation.enterField", undefined, { field: `${t("common.options")} ${index + 1}` }),
                            },
                          ]}
                        >
                          <Input placeholder={`${t("common.options")} ${index + 1}`} />
                        </Form.Item>
                        <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                      </Space>
                    ))}
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add("")}> 
                      {t("systemParams.addOption")}
                    </Button>
                    <Typography.Text type="secondary">{t("systemParams.optionsHint")}</Typography.Text>
                  </Space>
                </Form.Item>
              )}
            </Form.List>
          ) : null}
          {isNumericDataType(currentDataType) ? (
            <>
              <Form.Item name="minValue" label={t("common.minValue")}>
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item name="maxValue" label={t("common.maxValue")}>
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </>
          ) : null}
        </Form>
      </NeModal>
    </NePage>
  );
}
