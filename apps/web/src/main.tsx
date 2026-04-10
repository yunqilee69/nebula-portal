import { ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import { useI18n } from "@nebula/core";
import { useMemo } from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import "antd/dist/reset.css";
import "./styles.css";
import { ShellI18nProvider } from "@nebula/i18n";
import { buildAntdTheme, useThemeBootstrap } from "@nebula/tokens";
import { builtinThemeCatalog, useThemeStore } from "@nebula/tokens";

function RootApp() {
  const theme = useThemeBootstrap();
  const antdTheme = useMemo(() => buildAntdTheme(theme), [theme]);
  const { locale } = useI18n();
  const antdLocale = locale === "en-US" ? enUS : zhCN;

  return (
    <ConfigProvider theme={antdTheme} locale={antdLocale}>
      <App />
    </ConfigProvider>
  );
}

useThemeStore.getState().hydrate("nebula-light", builtinThemeCatalog.themes);

createRoot(document.getElementById("root")!).render(
  <ShellI18nProvider>
    <RootApp />
  </ShellI18nProvider>,
);
