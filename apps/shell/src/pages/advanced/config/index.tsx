import { ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Select, Space, Tag, Typography } from "antd";
import { useI18n } from "@platform/core";
import { useEffect, useMemo, useState } from "react";
import type { SaveFrontendConfigPayload } from "@/api/frontend-api";
import { fetchFrontendConfig, saveFrontendConfig } from "@/api/frontend-api";
import { hydrateFrontendThemeCatalog } from "@/modules/frontend/frontend-bootstrap";
import { useFrontendStore } from "@/modules/frontend/frontend-store";
import { NePage } from "@platform/ui";

interface FrontendConfigFormValues {
  projectName: string;
  layoutMode: "side" | "top" | "mix";
  defaultThemeCode: string;
  defaultLocale: "zh-CN" | "en-US";
  localeOptions: Array<"zh-CN" | "en-US">;
}

interface FrontendSettingsFormProps {
  embedded?: boolean;
}

export function FrontendSettingsForm({ embedded = false }: FrontendSettingsFormProps) {
  const { t } = useI18n();
  const [form] = Form.useForm<FrontendConfigFormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const frontendConfig = useFrontendStore((state) => state.frontendConfig);
  const setFrontendConfig = useFrontendStore((state) => state.setFrontendConfig);
  const themeCatalog = useFrontendStore((state) => state.themeCatalog);

  const themeOptions = useMemo(
    () => themeCatalog.themes.map((item) => ({ label: item.themeName, value: item.themeCode })),
    [themeCatalog.themes],
  );

  async function loadConfig() {
    setLoading(true);
    try {
      const payload = await fetchFrontendConfig();
      setFrontendConfig(payload);
      form.setFieldsValue(payload);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    form.setFieldsValue(frontendConfig);
  }, [form, frontendConfig]);

  useEffect(() => {
    void loadConfig();
    hydrateFrontendThemeCatalog().catch(() => undefined);
  }, []);

  const content = (
    <Card
      title={t("platform.frontendSettings.title")}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void loadConfig()} loading={loading}>
            {t("common.refresh")}
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">{t("platform.frontendSettings.subtitle")}</Typography.Paragraph>
      <Form
        form={form}
        layout="vertical"
        initialValues={frontendConfig}
        onFinish={async (values) => {
          setSaving(true);
          try {
            const payload = await saveFrontendConfig(values as SaveFrontendConfigPayload);
            setFrontendConfig(payload);
            document.title = payload.projectName;
            form.setFieldsValue(payload);
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form.Item name="projectName" label={t("frontend.projectName")} rules={[{ required: true, message: t("frontend.validation.projectName") }]}>
          <Input />
        </Form.Item>
        <Form.Item name="layoutMode" label={t("frontend.layoutMode")} rules={[{ required: true, message: t("frontend.validation.layoutMode") }]}>
          <Select
            options={[
              { label: t("frontend.layout.side"), value: "side" },
              { label: t("frontend.layout.top"), value: "top" },
              { label: t("frontend.layout.mix"), value: "mix" },
            ]}
          />
        </Form.Item>
        <Form.Item name="defaultThemeCode" label={t("frontend.defaultTheme")} rules={[{ required: true, message: t("frontend.validation.defaultTheme") }]}>
          <Select options={themeOptions} />
        </Form.Item>
        <Form.Item name="defaultLocale" label={t("frontend.defaultLocale")} rules={[{ required: true, message: t("frontend.validation.defaultLocale") }]}>
          <Select
            options={[
              { label: t("app.language.zh-CN"), value: "zh-CN" },
              { label: t("app.language.en-US"), value: "en-US" },
            ]}
          />
        </Form.Item>
        <Form.Item name="localeOptions" label={t("frontend.localeOptions")} rules={[{ required: true, message: t("frontend.validation.localeOptions") }]}>
          <Select
            mode="multiple"
            options={[
              { label: t("app.language.zh-CN"), value: "zh-CN" },
              { label: t("app.language.en-US"), value: "en-US" },
            ]}
          />
        </Form.Item>
        <Space direction="vertical" size="small" style={{ marginBottom: 24 }}>
          <Typography.Text strong>{t("frontend.availableThemes")}</Typography.Text>
          <Space wrap>
            {themeCatalog.themes.map((item) => (
              <Tag key={item.themeCode} color={item.builtinFlag ? "blue" : "default"}>
                {item.themeName}
              </Tag>
            ))}
          </Space>
        </Space>
        <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>
          {t("common.save")}
        </Button>
      </Form>
    </Card>
  );

  if (embedded) {
    return content;
  }

  return <NePage>{content}</NePage>;
}

export function AdvancedConfigPage() {
  return <FrontendSettingsForm />;
}
