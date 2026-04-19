import { ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import { NebulaI18nProvider, useI18n } from "@nebula/core/i18n";
import { useMemo } from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import "antd/dist/reset.css";
import "./styles.css";
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
  <NebulaI18nProvider>
    <RootApp />
  </NebulaI18nProvider>,
);
