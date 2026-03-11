import { BgColorsOutlined } from "@ant-design/icons";
import { Button, Divider, Drawer, Flex, Input, Segmented, Slider, Space, Switch, Typography } from "antd";
import { useI18n } from "@platform/core";
import { useState } from "react";
import { useThemeStore, themePresets, type ThemeMode } from "./theme-store";

export function ThemeConfigDrawer() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const mode = useThemeStore((state) => state.mode);
  const primaryColor = useThemeStore((state) => state.primaryColor);
  const radius = useThemeStore((state) => state.radius);
  const compact = useThemeStore((state) => state.compact);
  const updateTheme = useThemeStore((state) => state.updateTheme);

  return (
    <>
      <Button shape="circle" icon={<BgColorsOutlined />} onClick={() => setOpen(true)} />
      <Drawer title={t("theme.title")} open={open} onClose={() => setOpen(false)} width={360}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Typography.Text strong>{t("theme.preset")}</Typography.Text>
            <Segmented
              block
              style={{ marginTop: 12 }}
              value={mode}
              options={Object.keys(themePresets).map((mode) => ({
                label: mode,
                value: mode,
              }))}
              onChange={(value) => updateTheme({ mode: value as ThemeMode })}
            />
          </div>

          <div>
            <Typography.Text strong>{t("theme.primaryColor")}</Typography.Text>
            <Flex gap={12} align="center" style={{ marginTop: 12 }}>
              <Input type="color" value={primaryColor} onChange={(event) => updateTheme({ primaryColor: event.target.value })} />
              <Input value={primaryColor} onChange={(event) => updateTheme({ primaryColor: event.target.value })} />
            </Flex>
          </div>

          <div>
            <Typography.Text strong>{t("theme.radius")}</Typography.Text>
            <Slider min={8} max={28} value={radius} onChange={(value) => updateTheme({ radius: value })} />
          </div>

          <div>
            <Typography.Text strong>{t("theme.compact")}</Typography.Text>
            <Flex justify="space-between" align="center" style={{ marginTop: 12 }}>
              <Typography.Text type="secondary">{t("theme.compactHelp")}</Typography.Text>
              <Switch checked={compact} onChange={(checked) => updateTheme({ compact: checked })} />
            </Flex>
          </div>

          <Divider />

          <Button
            block
            onClick={() => {
              const preset = themePresets[mode];
              updateTheme(preset);
            }}
          >
            {t("theme.resetPreset")}
          </Button>
        </Space>
      </Drawer>
    </>
  );
}
