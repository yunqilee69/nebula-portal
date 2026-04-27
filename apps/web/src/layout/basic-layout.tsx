import { Layout } from "antd";
import {
  buildBreadcrumbItems,
  resolveRouteLabel,
  useAuthStore,
  useConfigStore,
  useDictStore,
  useI18n,
  useMenuStore,
  useNavigationStore,
  useNotifyStore,
} from "@nebula/core";
import { NeWorkspaceTabs } from "@nebula/ui-web";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { CachedOutlet } from "./cached-outlet";
import { logoutSession } from "@nebula/pages-web";

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
  routesReady?: boolean;
}

export function BasicLayout({ routesReady = false }: BasicLayoutProps) {
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
  const renameTab = useNavigationStore((state) => state.renameTab);
  const clearNavigation = useNavigationStore((state) => state.clear);
  const setActiveKey = useNavigationStore((state) => state.setActiveKey);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
      <Layout className="nebula-layout">

      <Sider
        width={250}
        collapsedWidth={76}
        collapsed={sidebarCollapsed}
        trigger={null}
        theme="light"
        className="nebula-sider"
      >
        <AppSidebar
          menus={menus}
          collapsed={sidebarCollapsed}
          routesReady={routesReady}
          onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
        />
      </Sider>
      <Layout>
        <Header className="nebula-header">
          <AppHeader breadcrumbItems={breadcrumbItems} onLogout={handleLogout} />
        </Header>
        <Content className="nebula-content">
          <div className="nebula-workspace-panel">
            <div className="nebula-tabs-surface">
              <NeWorkspaceTabs
                activeKey={activeKey}
                items={tabs}
                menuLabels={{
                  refresh: t("common.refresh"),
                  rename: t("layout.tab.rename"),
                  closeCurrent: t("layout.tab.closeCurrent"),
                  closeOthers: t("layout.tab.closeOthers"),
                  renameDialogTitle: t("layout.tab.renameDialogTitle"),
                  renameInputPlaceholder: t("layout.tab.renameInputPlaceholder"),
                  renameConfirm: t("layout.tab.renameConfirm"),
                  renameCancel: t("layout.tab.renameCancel"),
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
                onRename={(key, label) => {
                  renameTab(key, label);
                  setActiveKey(key);
                  if (routeKey !== key) {
                    navigate(key);
                  }
                }}
              />
            </div>
            <div className="nebula-content-body">
              <CachedOutlet />
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
