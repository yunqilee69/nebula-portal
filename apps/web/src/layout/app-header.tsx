import { LogoutOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Space, Typography, message } from "antd";
import type { MenuProps } from "antd";
import { type NeBreadcrumbItem, useAuthStore, useFrontendStore, useI18n } from "@nebula/core";
import { NeBreadcrumbs, NeNotificationPanel } from "@nebula/ui-web";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageDropdown } from "../components/language-dropdown";
import { normalizeApiError, switchFrontendTheme } from "@nebula/pages-web";
import { useThemeStore } from "@nebula/tokens";

interface AppHeaderProps {
  breadcrumbItems: NeBreadcrumbItem[];
  onLogout: () => void;
}

export function AppHeader({ breadcrumbItems, onLogout }: AppHeaderProps) {
  const session = useAuthStore((state) => state.session);
  const { t } = useI18n();
  const navigate = useNavigate();
  const themeCatalog = useFrontendStore((state) => state.themeCatalog);
  const setDefaultPreference = useFrontendStore((state) => state.setDefaultPreference);
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const applyTheme = useThemeStore((state) => state.applyTheme);

  const themeOptions = useMemo(
    () => themeCatalog.themes.map((item) => ({ label: item.themeName, value: item.themeCode })),
    [themeCatalog.themes],
  );

  const menuItems: MenuProps["items"] = useMemo(
    () => [
      {
        key: "profile",
        label: t("user.menu.profile"),
        icon: <UserOutlined />,
        onClick: () => navigate("/user/profile"),
      },
      {
        key: "theme",
        label: t("user.menu.theme"),
        icon: <SettingOutlined />,
        children: themeOptions.map((opt) => ({
          key: opt.value,
          label: opt.label,
          onClick: async () => {
            try {
              const preference = await switchFrontendTheme(opt.value);
              setDefaultPreference({ themeCode: preference.themeCode });
            } catch (error) {
              message.warning(t("theme.switchFallback", undefined, { reason: normalizeApiError(error).message }));
            }
            applyTheme(opt.value);
          },
        })),
      },
      { type: "divider" },
      {
        key: "logout",
        label: t("app.logout"),
        icon: <LogoutOutlined />,
        onClick: onLogout,
      },
    ],
    [onLogout, t, themeOptions, navigate, setDefaultPreference, applyTheme],
  );

  return (
    <header className="app-header">
      <div className="app-header__main">
        <NeBreadcrumbs items={breadcrumbItems} />
      </div>
      <Space size="middle" className="app-header__actions">
        <LanguageDropdown />
        <NeNotificationPanel />
        <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
          <Space className="app-header__profile" role="button" tabIndex={0} style={{ cursor: "pointer" }}>
            <Avatar src={session?.user.avatar}>{session?.user.username?.slice(0, 1).toUpperCase() ?? "G"}</Avatar>
            <Typography.Text>{session?.user.username ?? t("app.guest")}</Typography.Text>
          </Space>
        </Dropdown>
      </Space>
    </header>
  );
}
