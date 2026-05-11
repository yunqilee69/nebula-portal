import { GlobalOutlined } from "@ant-design/icons";
import { Button, Dropdown, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import { applyNebulaLocale, useFrontendStore, useI18n } from "@nebula/core";
import { useMemo } from "react";

export function LanguageDropdown() {
  const { t } = useI18n();
  const locale = useFrontendStore((state) => state.defaultPreference.localeTag);
  const localeOptions = useFrontendStore((state) => state.frontendConfig.localeOptions);

  const localeLabel = useMemo(() => {
    return t(`app.language.${locale}`);
  }, [locale, t]);

  const menuItems: MenuProps["items"] = useMemo(
    () =>
      localeOptions.map((item) => ({
        key: item,
        label: t(`app.language.${item}`),
        onClick: () => {
          applyNebulaLocale(item);
        },
      })),
    [localeOptions, t],
  );

  return (
    <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
      <Button type="text" className="language-dropdown">
        <Space size={4}>
          <GlobalOutlined />
          <Typography.Text style={{ fontSize: 14 }}>{localeLabel}</Typography.Text>
        </Space>
      </Button>
    </Dropdown>
  );
}