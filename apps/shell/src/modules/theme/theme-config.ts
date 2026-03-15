import { useEffect } from "react";
import type { ThemeConfig } from "antd";
import { applyThemeToDocument } from "./theme-runtime";
import type { ThemeSnapshot } from "./theme-store";
import { useThemeStore } from "./theme-store";

export function useThemeBootstrap() {
  const theme = useThemeStore((state) => state.currentTheme);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  return theme;
}

export function buildAntdTheme(theme: ThemeSnapshot): ThemeConfig {
  const primaryColor = theme.themeConfig.primaryColor ?? "#1f6feb";
  const backgroundColor = theme.themeConfig.backgroundColor ?? "#f8fafc";
  const textColor = theme.themeConfig.textColor ?? "#172b4d";

  return {
    token: {
      colorPrimary: primaryColor,
      colorBgLayout: backgroundColor,
      colorBgContainer: "#ffffff",
      colorBorder: "rgba(15, 23, 42, 0.12)",
      colorText: textColor,
      colorTextSecondary: "#6b7a90",
      borderRadius: 8,
      fontSize: 14,
      boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
    },
    components: {
      Layout: {
        headerBg: "transparent",
        siderBg: "transparent",
        bodyBg: "transparent",
      },
      Menu: {
        itemBorderRadius: 6,
        subMenuItemBorderRadius: 6,
        itemMarginInline: 0,
        itemMarginBlock: 4,
      },
      Card: {
        borderRadiusLG: 8,
        headerBg: "transparent",
      },
      Tabs: {
        borderRadius: 6,
      },
      Button: {
        borderRadius: 6,
        controlHeight: 34,
      },
      Drawer: {
        colorBgElevated: "#ffffff",
      },
    },
  };
}
