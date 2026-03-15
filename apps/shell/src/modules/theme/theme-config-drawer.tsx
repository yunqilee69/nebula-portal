import { BgColorsOutlined } from "@ant-design/icons";
import { Button, Divider, Drawer, Form, Input, Select, Space, Typography } from "antd";
import { useI18n } from "@platform/core";
import { useEffect, useMemo, useState } from "react";
import { saveFrontendTheme, switchFrontendTheme } from "../../api/frontend-api";
import { hydrateFrontendThemeCatalog } from "../frontend/frontend-bootstrap";
import { useFrontendStore } from "../frontend/frontend-store";
import { useThemeStore } from "./theme-store";

interface ThemeFormValues {
  themeCode: string;
  themeName: string;
  primaryColor: string;
  sidebarColor: string;
  headerColor: string;
  backgroundColor: string;
  textColor: string;
}

export function ThemeConfigDrawer() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [form] = Form.useForm<ThemeFormValues>();
  const { t } = useI18n();
  const themeCatalog = useFrontendStore((state) => state.themeCatalog);
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const applyTheme = useThemeStore((state) => state.applyTheme);
  const upsertTheme = useThemeStore((state) => state.upsertTheme);

  useEffect(() => {
    if (!open) {
      return;
    }
    hydrateFrontendThemeCatalog().catch(() => undefined);
  }, [open]);

  useEffect(() => {
    form.setFieldsValue({
      themeCode: `${currentTheme.themeCode}-copy`,
      themeName: `${currentTheme.themeName} Copy`,
      primaryColor: currentTheme.themeConfig.primaryColor ?? "#1f6feb",
      sidebarColor: currentTheme.themeConfig.sidebarColor ?? "#0f172a",
      headerColor: currentTheme.themeConfig.headerColor ?? "#ffffff",
      backgroundColor: currentTheme.themeConfig.backgroundColor ?? "#f8fafc",
      textColor: currentTheme.themeConfig.textColor ?? "#0f172a",
    });
  }, [currentTheme, form]);

  const themeOptions = useMemo(
    () => themeCatalog.themes.map((item) => ({ label: item.themeName, value: item.themeCode })),
    [themeCatalog.themes],
  );

  return (
    <>
      <Button shape="circle" icon={<BgColorsOutlined />} onClick={() => setOpen(true)} />
      <Drawer title={t("theme.title")} open={open} onClose={() => setOpen(false)} width={360}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Typography.Text strong>{t("theme.current")}</Typography.Text>
            <Select
              style={{ width: "100%", marginTop: 12 }}
              value={currentTheme.themeCode}
              options={themeOptions}
              loading={!themeOptions.length}
              onChange={async (value) => {
                setSwitching(true);
                try {
                  await switchFrontendTheme(value);
                  applyTheme(value);
                } finally {
                  setSwitching(false);
                }
              }}
            />
            {switching ? <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>{t("theme.switching")}</Typography.Paragraph> : null}
          </div>

          <Divider />

          <Form
            form={form}
            layout="vertical"
            onFinish={async (values) => {
              setSaving(true);
              try {
                const created = await saveFrontendTheme({
                  themeCode: values.themeCode,
                  themeName: values.themeName,
                  themeConfig: {
                    primaryColor: values.primaryColor,
                    sidebarColor: values.sidebarColor,
                    headerColor: values.headerColor,
                    backgroundColor: values.backgroundColor,
                    textColor: values.textColor,
                  },
                });
                upsertTheme(created);
                await hydrateFrontendThemeCatalog();
                await switchFrontendTheme(created.themeCode);
                applyTheme(created.themeCode);
              } finally {
                setSaving(false);
              }
            }}
          >
            <Typography.Text strong>{t("theme.createCustom")}</Typography.Text>
            <Form.Item name="themeCode" label={t("theme.code")} rules={[{ required: true, message: t("theme.codeRequired") }]}>
              <Input />
            </Form.Item>
            <Form.Item name="themeName" label={t("theme.name")} rules={[{ required: true, message: t("theme.nameRequired") }]}>
              <Input />
            </Form.Item>
            <Form.Item name="primaryColor" label={t("theme.primaryColor")}><Input type="color" /></Form.Item>
            <Form.Item name="sidebarColor" label={t("theme.sidebarColor")}><Input type="color" /></Form.Item>
            <Form.Item name="headerColor" label={t("theme.headerColor")}><Input type="color" /></Form.Item>
            <Form.Item name="backgroundColor" label={t("theme.backgroundColor")}><Input type="color" /></Form.Item>
            <Form.Item name="textColor" label={t("theme.textColor")}><Input type="color" /></Form.Item>
            <Button type="primary" htmlType="submit" block loading={saving}>{t("theme.saveTheme")}</Button>
          </Form>
        </Space>
      </Drawer>
    </>
  );
}
