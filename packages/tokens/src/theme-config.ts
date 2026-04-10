import { useEffect } from "react";
import { theme as antdTheme } from "antd";
import type { ThemeConfig } from "antd";
import { applyThemeToDocument } from "./theme-runtime";
import type { ThemeSnapshot } from "./theme-store";
import { useThemeStore } from "./theme-store";
import { resolveThemeColor, resolveThemeNumber } from "./tokens";

export function useThemeBootstrap() {
  const theme = useThemeStore((state) => state.currentTheme);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  return theme;
}

export function buildAntdTheme(theme: ThemeSnapshot): ThemeConfig {
  const primaryColor = resolveThemeColor(theme.themeConfig, "primaryColor");
  const secondaryColor = resolveThemeColor(theme.themeConfig, "secondaryColor");
  const successColor = resolveThemeColor(theme.themeConfig, "successColor");
  const warningColor = resolveThemeColor(theme.themeConfig, "warningColor");
  const errorColor = resolveThemeColor(theme.themeConfig, "errorColor");
  const headerColor = resolveThemeColor(theme.themeConfig, "headerColor");
  const surfaceColor = resolveThemeColor(theme.themeConfig, "surfaceColor");
  const backgroundColor = resolveThemeColor(theme.themeConfig, "backgroundColor");
  const textColor = resolveThemeColor(theme.themeConfig, "textColor");
  const textSecondaryColor = resolveThemeColor(theme.themeConfig, "textSecondaryColor");
  const borderColor = resolveThemeColor(theme.themeConfig, "borderColor");
  const borderRadius = resolveThemeNumber(theme.themeConfig, "borderRadius");
  const fontSize = resolveThemeNumber(theme.themeConfig, "fontSize");
  const controlHeight = resolveThemeNumber(theme.themeConfig, "controlHeight");
  const compactRadius = Math.max(borderRadius - 2, 4);

  return {
    cssVar: { key: theme.themeCode },
    algorithm: [antdTheme.defaultAlgorithm],
    token: {
      colorPrimary: primaryColor,
      colorInfo: secondaryColor,
      colorSuccess: successColor,
      colorWarning: warningColor,
      colorError: errorColor,
      colorBgLayout: backgroundColor,
      colorBgContainer: surfaceColor,
      colorBorder: borderColor,
      colorText: textColor,
      colorTextSecondary: textSecondaryColor,
      borderRadius,
      fontSize,
      controlHeight,
      boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
    },
    components: {
      Layout: {
        headerBg: "transparent",
        siderBg: "transparent",
        bodyBg: "transparent",
      },
      Menu: {
        itemBorderRadius: compactRadius,
        subMenuItemBorderRadius: compactRadius,
        itemMarginInline: 0,
        itemMarginBlock: 4,
      },
      Card: {
        borderRadiusLG: borderRadius,
        headerBg: "transparent",
      },
      Tabs: {
        borderRadius: compactRadius,
      },
      Button: {
        borderRadius: compactRadius,
        controlHeight,
      },
      Drawer: {
        colorBgElevated: headerColor,
      },
    },
  };
}
