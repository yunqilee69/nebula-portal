import { LogoutOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Space, Typography } from "antd";
import { useI18n } from "@platform/core";
import type { NeBreadcrumbItem } from "@platform/ui";
import { NeBreadcrumbs } from "@platform/ui";
import { useMemo } from "react";
import { useAuthStore } from "../modules/auth/auth-store";
import { NotificationPanel } from "../modules/notify/notification-panel";
import { ThemeConfigDrawer } from "../modules/theme/theme-config-drawer";

interface AppHeaderProps {
  breadcrumbItems: NeBreadcrumbItem[];
  onLogout: () => void;
}

export function AppHeader({ breadcrumbItems, onLogout }: AppHeaderProps) {
  const session = useAuthStore((state) => state.session);
  const { t } = useI18n();

  const menuItems = useMemo(
    () => [
      {
        key: "logout",
        label: t("app.logout"),
        icon: <LogoutOutlined />,
        onClick: onLogout,
      },
    ],
    [onLogout, t],
  );

  return (
    <header className="app-header">
      <div className="app-header__main">
        <NeBreadcrumbs items={breadcrumbItems} />
      </div>
      <Space size="middle" className="app-header__actions">
        <ThemeConfigDrawer />
        <NotificationPanel />
        <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
          <Space className="app-header__profile">
            <Avatar src={session?.user.avatar}>{session?.user.username?.slice(0, 1).toUpperCase() ?? "G"}</Avatar>
            <Typography.Text>{session?.user.username ?? t("app.guest")}</Typography.Text>
          </Space>
        </Dropdown>
      </Space>
    </header>
  );
}
