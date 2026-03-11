import { ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import { useI18n } from "@platform/core";
import { useMemo } from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import "antd/dist/reset.css";
import "./styles.css";
import { useConfigStore } from "./modules/config/config-store";
import { ShellI18nProvider } from "./modules/i18n/shell-i18n-provider";
import { buildAntdTheme, useThemeBootstrap } from "./modules/theme/theme-config";

function RootApp() {
  const configValues = useConfigStore((state) => state.values);
  const theme = useThemeBootstrap(configValues);
  const antdTheme = useMemo(() => buildAntdTheme(theme), [theme]);
  const { locale } = useI18n();
  const antdLocale = locale === "en-US" ? enUS : zhCN;

  return (
    <ConfigProvider theme={antdTheme} locale={antdLocale}>
      <App />
    </ConfigProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <ShellI18nProvider>
    <RootApp />
  </ShellI18nProvider>,
);
