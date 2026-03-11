import { useEffect } from "react";
import type { ThemeConfig } from "antd";
import { applyThemeToDocument } from "./theme-runtime";
import type { ThemeStateSnapshot } from "./theme-store";
import { useThemeStore } from "./theme-store";

export function useThemeBootstrap(configValues: Record<string, string | number | boolean | null>) {
  const hydrated = useThemeStore((state) => state.hydrated);
  const hydrate = useThemeStore((state) => state.hydrate);
  const updateTheme = useThemeStore((state) => state.updateTheme);
  const mode = useThemeStore((state) => state.mode);
  const primaryColor = useThemeStore((state) => state.primaryColor);
  const radius = useThemeStore((state) => state.radius);
  const compact = useThemeStore((state) => state.compact);

  const theme: ThemeStateSnapshot = {
    mode,
    primaryColor,
    radius,
    compact,
  };

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrate, hydrated]);

  useEffect(() => {
    const patch: Parameters<typeof updateTheme>[0] = {};
    if (typeof configValues["theme.primaryColor"] === "string") {
      patch.primaryColor = configValues["theme.primaryColor"] as string;
    }
    if (typeof configValues["theme.radius"] === "number") {
      patch.radius = configValues["theme.radius"] as number;
    }
    if (typeof configValues["theme.mode"] === "string") {
      patch.mode = configValues["theme.mode"] as "mist" | "sand" | "graphite";
    }
    if (Object.keys(patch).length > 0) {
      updateTheme(patch);
    }
  }, [configValues, updateTheme]);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  return theme;
}

export function buildAntdTheme(theme: ThemeStateSnapshot): ThemeConfig {
  return {
    token: {
      colorPrimary: theme.primaryColor,
      colorBgLayout: "#eef3f8",
      colorBgContainer: "#ffffff",
      colorBorder: "rgba(15, 23, 42, 0.12)",
      colorText: "#172b4d",
      colorTextSecondary: "#6b7a90",
      borderRadius: Math.min(theme.radius, 10),
      fontSize: theme.compact ? 13 : 14,
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
        controlHeight: theme.compact ? 30 : 34,
      },
      Drawer: {
        colorBgElevated: "#ffffff",
      },
    },
  };
}
