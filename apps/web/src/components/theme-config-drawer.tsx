import { BgColorsOutlined, GlobalOutlined, LayoutOutlined, MenuOutlined, SettingOutlined } from "@ant-design/icons";
import { Button, Drawer, Select, Space, Typography, message } from "antd";
import { applyNebulaLocale, hydrateFrontendThemeCatalog, useFrontendStore, useI18n } from "@nebula/core";
import { useThemeStore } from "@nebula/tokens";
import { useEffect, useMemo, useState } from "react";
import { normalizeApiError, switchFrontendLayout, switchFrontendTheme, fetchFrontendThemes } from "@nebula/pages-web";

export function ThemeConfigDrawer() {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [switchingLocale, setSwitchingLocale] = useState(false);
  const [switchingLayout, setSwitchingLayout] = useState(false);
  const { t } = useI18n();
  const locale = useFrontendStore((state) => state.defaultPreference.localeTag);
  const defaultPreference = useFrontendStore((state) => state.defaultPreference);
  const localeOptions = useFrontendStore((state) => state.frontendConfig.localeOptions);
  const themeCatalog = useFrontendStore((state) => state.themeCatalog);
  const setDefaultPreference = useFrontendStore((state) => state.setDefaultPreference);
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const applyTheme = useThemeStore((state) => state.applyTheme);

  useEffect(() => {
    fetchFrontendThemes()
      .then((catalog) => {
        hydrateFrontendThemeCatalog(catalog);
      })
      .catch(() => undefined);
  }, []);

  const themeOptions = useMemo(
    () => themeCatalog.themes.map((item) => ({ label: item.themeName, value: item.themeCode })),
    [themeCatalog.themes],
  );

  const localeSelectOptions = useMemo(
    () => localeOptions.map((item) => ({ label: t(`app.language.${item}`), value: item })),
    [localeOptions, t],
  );

  const navigationLayoutOptions = useMemo(
    () => [
      { label: t("frontend.layout.side"), value: "side" },
      { label: t("frontend.layout.top"), value: "top" },
      { label: t("frontend.layout.mix"), value: "mix" },
    ],
    [t],
  );

  const sidebarLayoutOptions = useMemo(
    () => [
      { label: t("frontend.sidebarLayout.classic"), value: "classic" },
      { label: t("frontend.sidebarLayout.grouped"), value: "grouped" },
    ],
    [t],
  );

  return (
    <>
      <Button
        shape="circle"
        type="text"
        className="app-header__preferences-trigger"
        icon={<SettingOutlined />}
        aria-label={t("theme.title")}
        onClick={() => setOpen(true)}
      />
      <Drawer title={t("theme.title")} placement="right" width={360} open={open} onClose={() => setOpen(false)}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Typography.Text strong>{t("theme.current")}</Typography.Text>
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 12 }}>
              {t("theme.drawerHint")}
            </Typography.Paragraph>
            <Space.Compact block>
              <Button icon={<BgColorsOutlined />} disabled />
              <Select
                value={currentTheme.themeCode}
                options={themeOptions}
                loading={!themeOptions.length}
                onChange={async (value) => {
                  setSwitching(true);
                  try {
                    try {
                      const preference = await switchFrontendTheme(value);
                      setDefaultPreference({ themeCode: preference.themeCode });
                    } catch (error) {
                      message.warning(t("theme.switchFallback", undefined, { reason: normalizeApiError(error).message }));
                    }
                    applyTheme(value);
                  } finally {
                    setSwitching(false);
                  }
                }}
              />
            </Space.Compact>
            {switching ? <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>{t("theme.switching")}</Typography.Paragraph> : null}
          </div>

          <div>
            <Typography.Text strong>{t("app.language")}</Typography.Text>
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 12 }}>
              {t("theme.localeHint")}
            </Typography.Paragraph>
            <Space.Compact block>
              <Button icon={<GlobalOutlined />} disabled />
              <Select
                value={locale}
                options={localeSelectOptions}
                disabled={switchingLocale}
                onChange={async (value) => {
                  setSwitchingLocale(true);
                  try {
                    await applyNebulaLocale(value);
                  } catch (error) {
                    message.warning(t("theme.localeSwitchFallback", undefined, { reason: normalizeApiError(error).message }));
                  } finally {
                    setSwitchingLocale(false);
                  }
                }}
              />
            </Space.Compact>
            {switchingLocale ? <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>{t("theme.localeSwitching")}</Typography.Paragraph> : null}
          </div>

          <div>
            <Typography.Text strong>{t("frontend.navigationLayoutCode")}</Typography.Text>
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 12 }}>
              {t("theme.layoutHint")}
            </Typography.Paragraph>
            <Space.Compact block>
              <Button icon={<LayoutOutlined />} disabled />
              <Select
                value={defaultPreference.navigationLayoutCode}
                options={navigationLayoutOptions}
                disabled={switchingLayout}
                onChange={async (value) => {
                  setSwitchingLayout(true);
                  try {
                    const payload = await switchFrontendLayout({
                      navigationLayoutCode: value,
                      sidebarLayoutCode: defaultPreference.sidebarLayoutCode ?? "classic",
                    });
                    setDefaultPreference(payload);
                    message.info(t("theme.layoutPending"));
                  } catch (error) {
                    message.warning(t("theme.layoutSwitchFallback", undefined, { reason: normalizeApiError(error).message }));
                  } finally {
                    setSwitchingLayout(false);
                  }
                }}
              />
            </Space.Compact>
          </div>

          <div>
            <Typography.Text strong>{t("frontend.sidebarLayoutCode")}</Typography.Text>
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 12 }}>
              {t("theme.sidebarHint")}
            </Typography.Paragraph>
            <Space.Compact block>
              <Button icon={<MenuOutlined />} disabled />
              <Select
                value={defaultPreference.sidebarLayoutCode}
                options={sidebarLayoutOptions}
                disabled={switchingLayout}
                onChange={async (value) => {
                  setSwitchingLayout(true);
                  try {
                    const payload = await switchFrontendLayout({
                      navigationLayoutCode: defaultPreference.navigationLayoutCode ?? "side",
                      sidebarLayoutCode: value,
                    });
                    setDefaultPreference(payload);
                    message.info(t("theme.layoutPending"));
                  } catch (error) {
                    message.warning(t("theme.layoutSwitchFallback", undefined, { reason: normalizeApiError(error).message }));
                  } finally {
                    setSwitchingLayout(false);
                  }
                }}
              />
            </Space.Compact>
            {switchingLayout ? <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>{t("theme.layoutSwitching")}</Typography.Paragraph> : null}
          </div>
        </Space>
      </Drawer>
    </>
  );
}
