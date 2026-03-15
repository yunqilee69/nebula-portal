import { LogoutOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Select, Space, Typography } from "antd";
import { useI18n } from "@platform/core";
import type { NeBreadcrumbItem } from "@platform/ui";
import { NeBreadcrumbs } from "@platform/ui";
import { useMemo } from "react";
import { useAuthStore } from "../modules/auth/auth-store";
import { useFrontendStore } from "../modules/frontend/frontend-store";
import { NotificationPanel } from "../modules/notify/notification-panel";
import { ThemeConfigDrawer } from "../modules/theme/theme-config-drawer";

interface AppHeaderProps {
  breadcrumbItems: NeBreadcrumbItem[];
  onLogout: () => void;
}

export function AppHeader({ breadcrumbItems, onLogout }: AppHeaderProps) {
  const session = useAuthStore((state) => state.session);
  const { locale, setLocale, t } = useI18n();
  const localeOptions = useFrontendStore((state) => state.frontendConfig.localeOptions);

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
        <Select
          className="app-header__locale"
          size="small"
          style={{ width: 120 }}
          value={locale}
          options={localeOptions.map((item) => ({ label: t(`app.language.${item}`), value: item }))}
          onChange={(value) => setLocale(value)}
        />
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
