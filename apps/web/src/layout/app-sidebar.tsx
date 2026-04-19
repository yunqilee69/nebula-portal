import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Button, Menu } from "antd";
import { type MenuItem, useFrontendStore, useI18n } from "@nebula/core";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getMenuIcon } from "./icon-map";

interface AppSidebarProps {
  menus: MenuItem[];
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function toAntdItems(menus: MenuItem[]): MenuProps["items"] {
  return menus
    .filter((menu) => menu.type !== 3 && menu.visible !== 0)
    .sort((left, right) => (left.sort ?? 0) - (right.sort ?? 0))
    .map((menu) => ({
      key: String(menu.id),
      label: menu.name,
      icon: getMenuIcon(menu.icon),
      children: menu.children?.length ? toAntdItems(menu.children) : undefined,
    }));
}

function findMenuById(menus: MenuItem[], key: string): MenuItem | null {
  for (const menu of menus) {
    if (String(menu.id) === key) {
      return menu;
    }
    if (menu.children?.length) {
      const match = findMenuById(menu.children, key);
      if (match) {
        return match;
      }
    }
  }
  return null;
}

export function AppSidebar({ menus, collapsed, onToggleCollapse }: AppSidebarProps) {
  const { t } = useI18n();
  const projectName = useFrontendStore((state) => state.frontendConfig.projectName);
  const location = useLocation();
  const navigate = useNavigate();
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const items = useMemo(() => toAntdItems(menus), [menus]);
  const selectedKeys = useMemo(() => {
    const current = location.pathname;
    const stack: string[] = [];

    const visit = (nodes: MenuItem[], parents: string[]) => {
      for (const node of nodes) {
        const lineage = [...parents, String(node.id)];
        if (node.path === current) {
          stack.push(...lineage);
          return true;
        }
        if (node.children?.length && visit(node.children, lineage)) {
          return true;
        }
      }
      return false;
    };

    visit(menus, []);
    return stack;
  }, [location.pathname, menus]);
  const routeOpenKeys = useMemo(() => selectedKeys.slice(0, -1), [selectedKeys]);

  useEffect(() => {
    setOpenKeys(collapsed ? [] : routeOpenKeys);
  }, [collapsed, routeOpenKeys]);

  return (
    <aside className={`app-sidebar${collapsed ? " app-sidebar--collapsed" : ""}`}>
      <div className="app-sidebar__brand">
        <button
          type="button"
          className="app-sidebar__brand-mark app-sidebar__brand-trigger"
          onClick={collapsed ? onToggleCollapse : undefined}
          aria-label={collapsed ? "Expand sidebar" : undefined}
        >
          N
        </button>
        <div className="app-sidebar__brand-text">
          <div className="app-sidebar__brand-title">{projectName || t("app.title")}</div>
        </div>
        {collapsed ? null : (
          <Button
            type="text"
            size="small"
            className="app-sidebar__toggle"
            icon={<LeftOutlined />}
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
          />
        )}
      </div>
      <Menu
        mode="inline"
        className="app-sidebar__menu"
        inlineCollapsed={collapsed}
        inlineIndent={18}
        selectedKeys={selectedKeys.slice(-1)}
        openKeys={openKeys}
        onOpenChange={(keys) => setOpenKeys(keys as string[])}
        items={items}
        onClick={({ key }) => {
          const menu = findMenuById(menus, key);
          if (!menu) {
            return;
          }
          if (menu.linkType === 2 && menu.linkUrl) {
            window.open(menu.linkUrl, "_blank", "noopener,noreferrer");
            return;
          }
          if (menu.linkType === 3 && menu.linkUrl) {
            navigate(`/iframe?url=${encodeURIComponent(menu.linkUrl)}`);
            return;
          }
          if (menu.path) {
            navigate(menu.path);
          }
        }}
      />
    </aside>
  );
}
