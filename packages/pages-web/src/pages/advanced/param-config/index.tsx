import { SaveOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  Tooltip,
} from "antd";
import type { SystemParamBatchUpdateItem, SystemParamDataType, SystemParamItem } from "@nebula/core";
import { useAppContext, useDictStore, useI18n } from "@nebula/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { NePage } from "@nebula/ui-web";
import {
  batchUpdateParamValues,
  getSystemParamModulesFromDict,
  fetchSystemParamsByModule,
} from "../../../api/system-param-api";

const PARAM_MODULE_DICT_CODE = "param_module";

interface ParamConfigFormValue {
  [paramKey: string]: string | number | boolean | string[] | undefined;
}

function isOptionDataType(value?: SystemParamDataType) {
  return value === "SINGLE" || value === "MULTIPLE";
}

function isNumericDataType(value?: SystemParamDataType) {
  return value === "INT" || value === "DOUBLE";
}

function isStringDataType(value?: SystemParamDataType) {
  return value === "STRING";
}

function isBooleanDataType(value?: SystemParamDataType) {
  return value === "BOOLEAN";
}

function normalizeParamValue(param: SystemParamItem): string | number | boolean | string[] | undefined {
  if (param.paramValue === undefined || param.paramValue === null) {
    return param.defaultValue ?? undefined;
  }

  if (isBooleanDataType(param.dataType)) {
    return param.paramValue === "true";
  }

  if (isNumericDataType(param.dataType)) {
    const num = param.dataType === "INT" ? parseInt(param.paramValue, 10) : parseFloat(param.paramValue);
    return isNaN(num) ? undefined : num;
  }

  if (param.dataType === "MULTIPLE") {
    return param.paramValue ? param.paramValue.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }

  return param.paramValue;
}

function serializeParamValue(value: unknown, dataType?: SystemParamDataType): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (isBooleanDataType(dataType)) {
    return value ? "true" : "false";
  }

  if (Array.isArray(value)) {
    return value.join(",");
  }

  return String(value);
}

export function AdvancedParamConfigPage() {
  const { t } = useI18n();
  const ctx = useAppContext();
  const dictRecords = useDictStore((state) => state.records);
  const [modules, setModules] = useState<string[]>([]);
  const [activeModule, setActiveModule] = useState<string>("");
  const [params, setParams] = useState<SystemParamItem[]>([]);
  const [loadingParams, setLoadingParams] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<ParamConfigFormValue>();
  const requestIdRef = useRef(0);

  useEffect(() => {
    const moduleList = getSystemParamModulesFromDict(dictRecords);
    setModules(moduleList);
    if (moduleList.length > 0) {
      setActiveModule(moduleList[0]);
    }
  }, [dictRecords]);

  useEffect(() => {
    if (!activeModule) {
      setParams([]);
      form.resetFields();
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    form.resetFields();
    setLoadingParams(true);
    fetchSystemParamsByModule(activeModule)
      .then((result) => {
        if (currentRequestId !== requestIdRef.current) {
          return;
        }
        const editableParams = result.filter((p) => p.editableFlag !== false && p.renderEnabled !== false);
        setParams(editableParams);
        const initialValues: ParamConfigFormValue = {};
        for (const param of editableParams) {
          initialValues[param.paramKey] = normalizeParamValue(param);
        }
        form.setFieldsValue(initialValues);
      })
      .finally(() => {
        if (currentRequestId === requestIdRef.current) {
          setLoadingParams(false);
        }
      });
  }, [activeModule, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const items: SystemParamBatchUpdateItem[] = params.map((param) => ({
        paramKey: param.paramKey,
        paramValue: serializeParamValue(values[param.paramKey], param.dataType),
      }));

      setSaving(true);
      const result = await batchUpdateParamValues(items);

      if (result.failCount === 0) {
        message.success(t("paramConfig.saveSuccess", undefined, { count: result.successCount }));
      } else {
        const failedItems = result.results.filter((r) => !r.success);
        message.warning(
          t("paramConfig.savePartial", undefined, {
            success: result.successCount,
            fail: result.failCount,
            failedKeys: failedItems.map((f) => f.paramKey).join(", "),
          })
        );
      }
    } catch (error) {
      message.error(t("paramConfig.saveFailed"));
    } finally {
      setSaving(false);
    };
  };

  const renderParamField = (param: SystemParamItem) => {
    const isDisabled = param.editableFlag === false;
    const fieldLabel = (
      <Space>
        <span>{param.paramName ?? param.paramKey}</span>
        {param.sensitiveFlag && (
          <Tooltip title={t("paramConfig.sensitiveHint")}>
            <span style={{ color: "#faad14" }}>🔒</span>
          </Tooltip>
        )}
        {isDisabled && (
          <Tooltip title={t("paramConfig.editableDisabledHint")}>
            <span style={{ color: "#999" }}>🔒</span>
          </Tooltip>
        )}
      </Space>
    );

    const extraProps = {
      placeholder: param.placeholder,
      disabled: isDisabled,
    };

    if (isBooleanDataType(param.dataType)) {
      return (
        <Form.Item
          key={param.paramKey}
          name={param.paramKey}
          label={fieldLabel}
          valuePropName="checked"
          extra={param.description}
        >
          <Switch disabled={isDisabled} />
        </Form.Item>
      );
    }

    if (isNumericDataType(param.dataType)) {
      return (
        <Form.Item
          key={param.paramKey}
          name={param.paramKey}
          label={fieldLabel}
          extra={param.description}
          rules={[
            {
              validator: (_, value) => {
                if (value === undefined || value === null || value === "") {
                  return Promise.resolve();
                }
                const num = Number(value);
                if (param.minValue !== undefined && num < param.minValue) {
                  return Promise.reject(new Error(t("paramConfig.minValueError", undefined, { min: param.minValue })));
                }
                if (param.maxValue !== undefined && num > param.maxValue) {
                  return Promise.reject(new Error(t("paramConfig.maxValueError", undefined, { max: param.maxValue })));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={param.minValue}
            max={param.maxValue}
            precision={param.dataType === "DOUBLE" ? 6 : 0}
            {...extraProps}
          />
        </Form.Item>
      );
    }

    if (param.dataType === "SINGLE" && param.optionCode) {
      const dictOptions = ctx.dict.get(param.optionCode);
      return (
        <Form.Item
          key={param.paramKey}
          name={param.paramKey}
          label={fieldLabel}
          extra={param.description}
        >
          <Select allowClear options={dictOptions} {...extraProps} />
        </Form.Item>
      );
    }

    if (param.dataType === "MULTIPLE" && param.optionCode) {
      const dictOptions = ctx.dict.get(param.optionCode);
      return (
        <Form.Item
          key={param.paramKey}
          name={param.paramKey}
          label={fieldLabel}
          extra={param.description}
        >
          <Select
            mode="multiple"
            allowClear
            options={dictOptions}
            tokenSeparators={[","]}
            {...extraProps}
          />
        </Form.Item>
      );
    }

    return (
      <Form.Item
        key={param.paramKey}
        name={param.paramKey}
        label={fieldLabel}
        extra={param.description}
        rules={[
          {
            validator: (_, value) => {
              if (value === undefined || value === null || value === "") {
                return Promise.resolve();
              }
              const str = String(value);
              if (param.minLength !== undefined && str.length < param.minLength) {
                return Promise.reject(new Error(t("paramConfig.minLengthError", undefined, { min: param.minLength })));
              }
              if (param.maxLength !== undefined && str.length > param.maxLength) {
                return Promise.reject(new Error(t("paramConfig.maxLengthError", undefined, { max: param.maxLength })));
              }
              if (param.validatorRegex) {
                const regex = new RegExp(param.validatorRegex);
                if (!regex.test(str)) {
                  return Promise.reject(new Error(param.validatorMessage ?? t("paramConfig.regexError")));
                }
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        {param.sensitiveFlag ? (
          <Input.Password {...extraProps} />
        ) : (
          <Input {...extraProps} />
        )}
      </Form.Item>
    );
  };

  const tabItems = useMemo(
    () =>
      modules.map((moduleCode) => ({
        key: moduleCode,
        label: moduleCode,
        children: (
          <Spin spinning={loadingParams}>
            {params.length === 0 ? (
              <Alert type="info" message={t("paramConfig.noParamsInModule")} showIcon />
            ) : (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={{}}
              >
                {params.map(renderParamField)}
              </Form>
            )}
          </Spin>
        ),
      })),
    [modules, loadingParams, params, form, ctx.dict]
  );

  if (modules.length === 0) {
    return (
      <NePage>
        <Card>
          <Alert type="warning" message={t("paramConfig.noModules")} showIcon />
        </Card>
      </NePage>
    );
  }

  return (
    <NePage>
      <Card
        title={t("paramConfig.title")}
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => form.submit()}
            disabled={params.length === 0}
          >
            {t("common.save")}
          </Button>
        }
      >
        <Tabs
          activeKey={activeModule}
          onChange={(key) => setActiveModule(key)}
          items={tabItems}
        />
      </Card>
    </NePage>
  );
}