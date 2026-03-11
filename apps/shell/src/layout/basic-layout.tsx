import { Alert, Layout } from "antd";
import { useI18n } from "@platform/core";
import type { ModuleLoadResult } from "@platform/core";
import { NeWorkspaceTabs } from "@platform/ui";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { CachedOutlet } from "./cached-outlet";
import { logoutSession } from "../api/auth-api";
import { useMenuStore } from "../modules/menu/menu-store";
import { useAuthStore } from "../modules/auth/auth-store";
import { useConfigStore } from "../modules/config/config-store";
import { useDictStore } from "../modules/dict/dict-store";
import { buildBreadcrumbItems, resolveRouteLabel } from "../modules/navigation/route-meta";
import { useNavigationStore } from "../modules/navigation/navigation-store";
import { useNotifyStore } from "../modules/notify/notify-store";

const { Sider, Header, Content } = Layout;

function buildRouteKey(pathname: string, search: string, hash: string) {
  return `${pathname}${search}${hash}`;
}

function resolveNextTabPath(tabs: { key: string; path: string }[], key: string) {
  const currentIndex = tabs.findIndex((item) => item.key === key);

  if (currentIndex < 0) {
    return "/";
  }

  return tabs[currentIndex + 1]?.path ?? tabs[currentIndex - 1]?.path ?? "/";
}

interface BasicLayoutProps {
  remoteStatuses: ModuleLoadResult[];
}

export function BasicLayout({ remoteStatuses }: BasicLayoutProps) {
  const { t } = useI18n();
  const menus = useMenuStore((state) => state.menus);
  const location = useLocation();
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const clearConfig = useConfigStore((state) => state.clear);
  const clearDict = useDictStore((state) => state.clear);
  const clearMenu = useMenuStore((state) => state.clear);
  const clearNotify = useNotifyStore((state) => state.clear);
  const tabs = useNavigationStore((state) => state.tabs);
  const activeKey = useNavigationStore((state) => state.activeKey);
  const openTab = useNavigationStore((state) => state.openTab);
  const closeTab = useNavigationStore((state) => state.closeTab);
  const closeOtherTabs = useNavigationStore((state) => state.closeOtherTabs);
  const refreshTab = useNavigationStore((state) => state.refreshTab);
  const clearNavigation = useNavigationStore((state) => state.clear);
  const setActiveKey = useNavigationStore((state) => state.setActiveKey);

  const failedModules = useMemo(
    () => remoteStatuses.filter((item) => item.status === "failed"),
    [remoteStatuses],
  );
  const routeKey = useMemo(() => buildRouteKey(location.pathname, location.search, location.hash), [location.hash, location.pathname, location.search]);
  const breadcrumbItems = useMemo(() => buildBreadcrumbItems(menus, location.pathname), [location.pathname, menus]);
  const currentLabel = useMemo(() => resolveRouteLabel(menus, location.pathname), [location.pathname, menus]);

  useEffect(() => {
    if (location.pathname === "/login") {
      return;
    }
    openTab({
      key: routeKey,
      path: routeKey,
      label: currentLabel,
      closable: routeKey !== "/",
    });
  }, [currentLabel, openTab, routeKey]);

  async function handleLogout() {
    try {
      await logoutSession();
    } catch {
    }
    clearSession();
    clearMenu();
    clearConfig();
    clearDict();
    clearNotify();
    clearNavigation();
    navigate("/login");
  }

  return (
    <Layout className="shell-layout">
      <Sider width={250} theme="light">
        <AppSidebar menus={menus} />
      </Sider>
      <Layout>
        <Header className="shell-header">
          <AppHeader breadcrumbItems={breadcrumbItems} onLogout={handleLogout} />
        </Header>
        <Content className="shell-content">
          <div className="shell-workspace-panel shell-panel">
            <div className="shell-tabs-surface">
              <NeWorkspaceTabs
                activeKey={activeKey}
                items={tabs}
                menuLabels={{
                  refresh: t("common.refresh"),
                  closeCurrent: t("layout.tab.closeCurrent"),
                  closeOthers: t("layout.tab.closeOthers"),
                }}
                onChange={(key) => {
                  setActiveKey(key);
                  if (routeKey !== key) {
                    navigate(key);
                  }
                }}
                onClose={(key) => {
                  closeTab(key);
                  if (routeKey === key) {
                    const next = resolveNextTabPath(tabs, key);
                    navigate(next);
                  }
                }}
                onCloseOthers={(key) => {
                  closeOtherTabs(key);
                  setActiveKey(key);
                  if (routeKey !== key) {
                    navigate(key);
                  }
                }}
                onRefresh={(key) => {
                  refreshTab(key);
                  setActiveKey(key);
                  if (routeKey !== key) {
                    navigate(key);
                  }
                }}
              />
            </div>
            <div className="shell-content-body">
              {failedModules.length > 0 ? (
                <Alert
                  type="warning"
                  showIcon
                  message={t("layout.remoteModulesFailed")}
                  description={failedModules.map((item) => `${item.id}: ${item.reason ?? t("layout.unknownReason")}`).join(" | ")}
                  className="shell-content-alert"
                />
              ) : null}
              <CachedOutlet />
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
