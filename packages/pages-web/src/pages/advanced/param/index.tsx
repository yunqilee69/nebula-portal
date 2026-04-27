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
  Switch,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { SystemParamDataType, SystemParamItem, SystemParamMutationPayload, SystemParamPageQuery } from "@nebula/core";
import { useAppContext, useI18n } from "@nebula/core";
import { NePermission } from "@nebula/core";
import { useResourceStore } from "@nebula/core";
import { useEffect, useMemo, useState } from "react";
import { NeDetailDrawer, NeModal, NePage, NeSearch, NeTable } from "@nebula/ui-web";
import { fetchDictTypeList, toDictOptions } from "../../../api/dict-admin-api";
import { createSystemParam, deleteSystemParam, fetchSystemParamDetail, fetchSystemParamPage, updateSystemParam } from "../../../api/system-param-api";

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
  defaultValue?: string;
  optionCode?: string;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  validatorRegex?: string;
  validatorMessage?: string;
  renderEnabled?: boolean;
  placeholder?: string;
  moduleCode?: string;
  displayOrder?: number;
  sensitiveFlag?: boolean;
  builtinFlag?: boolean;
  editableFlag?: boolean;
  visibleFlag?: boolean;
}

const initialFormValues: SystemParamFormValues = {
  paramKey: "",
  paramName: "",
  description: "",
  dataType: "STRING",
  defaultValue: "",
  optionCode: "",
  minValue: undefined,
  maxValue: undefined,
  minLength: undefined,
  maxLength: undefined,
  validatorRegex: "",
  validatorMessage: "",
  renderEnabled: true,
  placeholder: "",
  moduleCode: "",
  displayOrder: 0,
  sensitiveFlag: false,
  builtinFlag: false,
  editableFlag: true,
  visibleFlag: true,
};

function isOptionDataType(value?: SystemParamDataType) {
  return value === "SINGLE" || value === "MULTIPLE";
}

function isNumericDataType(value?: SystemParamDataType) {
  return value === "INT" || value === "DOUBLE";
}

function isStringDataType(value?: SystemParamDataType) {
  return value === "STRING";
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
    defaultValue: item.defaultValue ?? "",
    optionCode: item.optionCode ?? "",
    minValue: item.minValue,
    maxValue: item.maxValue,
    minLength: item.minLength,
    maxLength: item.maxLength,
    validatorRegex: item.validatorRegex ?? "",
    validatorMessage: item.validatorMessage ?? "",
    renderEnabled: item.renderEnabled ?? true,
    placeholder: item.placeholder ?? "",
    moduleCode: item.moduleCode ?? "",
    displayOrder: item.displayOrder ?? 0,
    sensitiveFlag: item.sensitiveFlag ?? false,
    builtinFlag: item.builtinFlag ?? false,
    editableFlag: item.editableFlag ?? true,
    visibleFlag: item.visibleFlag ?? true,
  };
}

function normalizePayload(values: SystemParamFormValues): SystemParamMutationPayload {
  return {
    paramKey: values.paramKey.trim(),
    paramName: values.paramName.trim(),
    description: values.description?.trim() || undefined,
    dataType: values.dataType,
    defaultValue: values.defaultValue?.trim() || undefined,
    optionCode: isOptionDataType(values.dataType) ? values.optionCode?.trim() || undefined : undefined,
    minValue: isNumericDataType(values.dataType) ? values.minValue : undefined,
    maxValue: isNumericDataType(values.dataType) ? values.maxValue : undefined,
    minLength: isStringDataType(values.dataType) ? values.minLength : undefined,
    maxLength: isStringDataType(values.dataType) ? values.maxLength : undefined,
    validatorRegex: isStringDataType(values.dataType) ? values.validatorRegex?.trim() || undefined : undefined,
    validatorMessage: isStringDataType(values.dataType) ? values.validatorMessage?.trim() || undefined : undefined,
    renderEnabled: values.renderEnabled,
    placeholder: values.placeholder?.trim() || undefined,
    moduleCode: values.moduleCode?.trim() || undefined,
    displayOrder: values.displayOrder,
    sensitiveFlag: values.sensitiveFlag,
    builtinFlag: values.builtinFlag,
    editableFlag: values.editableFlag,
    visibleFlag: values.visibleFlag,
  };
}

export function AdvancedParamPage() {
  const { t } = useI18n();
  const ctx = useAppContext();
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
  const [dictTypeOptions, setDictTypeOptions] = useState<Array<{ label: string; value: string }>>([]);
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

  const booleanOptions = useMemo(
    () => [
      { label: t("common.yes"), value: "true" },
      { label: t("common.no"), value: "false" },
    ],
    [t],
  );

  useEffect(() => {
    void fetchDictTypeList().then((types) => {
      setDictTypeOptions(toDictOptions(types));
    });
  }, []);

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

  const renderBooleanTag = (value?: boolean) => {
    if (value === undefined || value === null) return "-";
    return value ? (
      <Tag color="success">{t("common.yes")}</Tag>
    ) : (
      <Tag color="default">{t("common.no")}</Tag>
    );
  };

  const columns = useMemo(
    () => [
      { title: t("common.paramKey"), dataIndex: "paramKey", width: 200 },
      { title: t("common.name"), dataIndex: "paramName", width: 150, render: (value: string | undefined) => value ?? "-" },
      {
        title: t("common.type"),
        dataIndex: "dataType",
        width: 100,
        render: (value: SystemParamDataType | undefined) =>
          value ? <Tag color="processing">{resolveDataTypeLabel(value)}</Tag> : "-",
      },
      { title: t("common.moduleCode"), dataIndex: "moduleCode", width: 120, render: (value: string | undefined) => value ?? "-" },
      { title: t("common.displayOrder"), dataIndex: "displayOrder", width: 80, render: (value: number | undefined) => value ?? 0 },
      { title: t("common.sensitiveFlag"), dataIndex: "sensitiveFlag", width: 80, render: renderBooleanTag },
      { title: t("common.builtinFlag"), dataIndex: "builtinFlag", width: 80, render: renderBooleanTag },
      { title: t("common.editableFlag"), dataIndex: "editableFlag", width: 80, render: renderBooleanTag },
      { title: t("common.visibleFlag"), dataIndex: "visibleFlag", width: 80, render: renderBooleanTag },
      { title: t("common.updateTime"), dataIndex: "updateTime", width: 160, render: (value: string | undefined) => value ?? "-" },
      {
        title: t("common.actions"),
        width: 120,
        fixed: "right" as const,
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
    [query, selected?.id, t],
  );

  return (
    <NePage>
      <NeSearch
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
          <Form.Item name="moduleCode" label={t("common.moduleCode")}>
            <Input allowClear placeholder={t("common.code")} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              {t("common.search")}
            </Button>
          </Form.Item>
        </Form>
      </NeSearch>
      <NeTable
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
          scroll={{ x: 1200 }}
          onRow={(record) => ({
            onClick: () => {
              void openDetail(record);
            },
          })}
          pagination={false}
        />
      </NeTable>
      <NeDetailDrawer
        title={t("systemParams.detailTitle")}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelected(null);
        }}
      >
        {detailLoading ? (
          <Spin />
        ) : selected ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t("common.paramKey")}>{selected.paramKey}</Descriptions.Item>
            <Descriptions.Item label={t("common.name")}>{selected.paramName ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.description")}>{selected.description ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.type")}>{resolveDataTypeLabel(selected.dataType)}</Descriptions.Item>
            <Descriptions.Item label={t("common.defaultValue")}>{selected.defaultValue ?? "-"}</Descriptions.Item>
            {isOptionDataType(selected.dataType) && (
              <Descriptions.Item label={t("common.optionCode")}>
                {selected.optionCode ? (
                  <Space>
                    <span>{selected.optionCode}</span>
                    {ctx.dict.get(selected.optionCode).length > 0 && (
                      <Tag color="processing">{ctx.dict.get(selected.optionCode).length} 项</Tag>
                    )}
                  </Space>
                ) : "-"}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t("common.value")}>
              {selected.sensitiveFlag ? "******" : selected.paramValue ?? "-"}
            </Descriptions.Item>
            {isNumericDataType(selected.dataType) && (
              <>
                <Descriptions.Item label={t("common.minValue")}>
                  {selected.minValue !== undefined ? selected.minValue : "-"}
                </Descriptions.Item>
                <Descriptions.Item label={t("common.maxValue")}>
                  {selected.maxValue !== undefined ? selected.maxValue : "-"}
                </Descriptions.Item>
              </>
            )}
            {isStringDataType(selected.dataType) && (
              <>
                <Descriptions.Item label={t("common.minLength")}>
                  {selected.minLength !== undefined ? selected.minLength : "-"}
                </Descriptions.Item>
                <Descriptions.Item label={t("common.maxLength")}>
                  {selected.maxLength !== undefined ? selected.maxLength : "-"}
                </Descriptions.Item>
                <Descriptions.Item label={t("common.validatorRegex")}>
                  {selected.validatorRegex ?? "-"}
                </Descriptions.Item>
                <Descriptions.Item label={t("common.validatorMessage")}>
                  {selected.validatorMessage ?? "-"}
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label={t("common.placeholder")}>{selected.placeholder ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.moduleCode")}>{selected.moduleCode ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.displayOrder")}>{selected.displayOrder ?? 0}</Descriptions.Item>
            <Descriptions.Item label={t("common.renderEnabled")}>{renderBooleanTag(selected.renderEnabled)}</Descriptions.Item>
            <Descriptions.Item label={t("common.editableFlag")}>{renderBooleanTag(selected.editableFlag)}</Descriptions.Item>
            <Descriptions.Item label={t("common.visibleFlag")}>{renderBooleanTag(selected.visibleFlag)}</Descriptions.Item>
            <Descriptions.Item label={t("common.sensitiveFlag")}>{renderBooleanTag(selected.sensitiveFlag)}</Descriptions.Item>
            <Descriptions.Item label={t("common.builtinFlag")}>{renderBooleanTag(selected.builtinFlag)}</Descriptions.Item>
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
          <Form.Item name="defaultValue" label={t("common.defaultValue")}>
            <Input />
          </Form.Item>
          <Form.Item label={t("common.value")} extra={t("systemParams.valueHint")}>
            <Input value={editing?.paramValue ?? ""} readOnly placeholder="-" />
          </Form.Item>
          {isOptionDataType(currentDataType) ? (
            <Form.Item
              name="optionCode"
              label={t("common.optionCode")}
              extra={t("systemParams.optionCodeHint")}
              className="ne-modal-form-grid__full"
            >
              <Select allowClear showSearch options={dictTypeOptions} placeholder={t("common.code")} />
            </Form.Item>
          ) : null}
          {isNumericDataType(currentDataType) ? (
            <>
              <Form.Item name="minValue" label={t("common.minValue")} extra={t("systemParams.numericValidationHint")}>
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item name="maxValue" label={t("common.maxValue")}>
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </>
          ) : null}
          {isStringDataType(currentDataType) ? (
            <>
              <Form.Item name="minLength" label={t("common.minLength")} extra={t("systemParams.stringValidationHint")}>
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
              <Form.Item name="maxLength" label={t("common.maxLength")}>
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
              <Form.Item
                name="validatorRegex"
                label={t("common.validatorRegex")}
                extra={t("systemParams.validatorHint")}
                className="ne-modal-form-grid__full"
              >
                <Input placeholder="例如: ^[a-zA-Z0-9]+$" />
              </Form.Item>
              <Form.Item name="validatorMessage" label={t("common.validatorMessage")}>
                <Input placeholder="例如: 请输入字母和数字" />
              </Form.Item>
            </>
          ) : null}
          <Form.Item name="placeholder" label={t("common.placeholder")}>
            <Input />
          </Form.Item>
          <Form.Item name="moduleCode" label={t("common.moduleCode")}>
            <Input placeholder="例如: frontend, auth, storage" />
          </Form.Item>
          <Form.Item name="displayOrder" label={t("common.displayOrder")}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="renderEnabled" label={t("common.renderEnabled")} valuePropName="checked" extra={t("systemParams.renderEnabledHint")}>
            <Switch />
          </Form.Item>
          <Form.Item name="editableFlag" label={t("common.editableFlag")} valuePropName="checked" extra={t("systemParams.editableFlagHint")}>
            <Switch />
          </Form.Item>
          <Form.Item name="visibleFlag" label={t("common.visibleFlag")} valuePropName="checked" extra={t("systemParams.visibleFlagHint")}>
            <Switch />
          </Form.Item>
          <Form.Item name="sensitiveFlag" label={t("common.sensitiveFlag")} valuePropName="checked" extra={t("systemParams.sensitiveFlagHint")}>
            <Switch />
          </Form.Item>
          <Form.Item name="builtinFlag" label={t("common.builtinFlag")} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </NeModal>
    </NePage>
  );
}