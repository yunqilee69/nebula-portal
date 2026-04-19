import { Col, List, Row, Space, Statistic, Typography } from "antd";
import { getRegisteredModules, useI18n } from "@nebula/core";
import type { MenuItem } from "@nebula/core";
import { NeNavCards, NePage, NePanel, NeStatusTag } from "@nebula/ui-web";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@nebula/core";
import { useConfigStore } from "@nebula/core";
import { useMenuStore } from "@nebula/core";
import { useNotifyStore } from "@nebula/core";

interface MenuCardItem {
  key: string;
  title: string;
  description: string;
  path: string;
}

function collectMenuCards(menus: MenuItem[]): MenuCardItem[] {
  return menus.flatMap((menu) => {
    if (menu.visible === 0 || menu.type === 3) {
      return [];
    }
    const children: MenuCardItem[] = menu.children?.length ? collectMenuCards(menu.children) : [];
    if (menu.type === 2 && menu.path && menu.path !== "/") {
      return [{ key: String(menu.id), title: menu.name, description: menu.path, path: menu.path }, ...children];
    }
    return children;
  });
}

export function DashboardPage() {
  const { t } = useI18n();
  const session = useAuthStore((state) => state.session);
  const menus = useMenuStore((state) => state.menus);
  const configValues = useConfigStore((state) => state.values);
  const notifications = useNotifyStore((state) => state.items);
  const modules = useMemo(() => getRegisteredModules(), []);
  const navigate = useNavigate();
  const uploadSize = configValues.upload_max_size ?? "-";
  const menuCards = useMemo(() => collectMenuCards(menus), [menus]);

  return (
    <NePage>
      <Row className="nebula-metric-grid" gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <NePanel title={t("dashboard.menuCount")}>
            <Statistic value={menus.length} suffix={t("dashboard.topLevel")} />
          </NePanel>
        </Col>
        <Col xs={24} md={8}>
          <NePanel title={t("dashboard.moduleCount")}>
            <Statistic value={modules.length} suffix={t("dashboard.registered")} />
          </NePanel>
        </Col>
        <Col xs={24} md={8}>
          <NePanel title={t("dashboard.unreadNotifications")}>
            <Statistic value={notifications.filter((item) => !item.read).length} suffix={t("dashboard.items")} />
          </NePanel>
        </Col>
        <Col xs={24} xl={12}>
          <NePanel title={t("dashboard.currentSession")} extra={<Space><NeStatusTag tone="processing" label={session ? t("dashboard.authenticated") : t("dashboard.guest")} /></Space>}>
            <List
              dataSource={[
                t("dashboard.user", undefined, { value: session?.user.username ?? "-" }),
                t("dashboard.roles", undefined, { value: session?.user.roles.join(", ") || "-" }),
                t("dashboard.permissionCount", undefined, { value: session?.permissions.length ?? 0 }),
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </NePanel>
        </Col>
        <Col xs={24} xl={12}>
          <NePanel title={t("dashboard.registeredModules")}>
            <List
              dataSource={modules}
              renderItem={(item) => (
                <List.Item>
                  <Typography.Text>{`${item.name} (${item.id}) v${item.version}`}</Typography.Text>
                </List.Item>
              )}
            />
          </NePanel>
        </Col>
        <Col span={24}>
          <NePanel title={t("dashboard.platformNavigation")}>
            <NeNavCards items={menuCards.map((item: MenuCardItem) => ({ key: item.key, title: item.title, description: item.description, onClick: () => navigate(item.path) }))} />
          </NePanel>
        </Col>
        <Col span={24}>
          <NePanel title={t("dashboard.nebulaParams")}>
            <List
              dataSource={[
                t("dashboard.uploadLimit", undefined, { value: String(uploadSize) }),
                t("dashboard.primaryTheme", undefined, { value: String(configValues["theme.primaryColor"] ?? "local") }),
                t("dashboard.themeMode", undefined, { value: String(configValues["theme.mode"] ?? "local") }),
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </NePanel>
        </Col>
        <Col span={24}>
          <NePanel title={t("dashboard.recentNotifications")}>
            <List
              locale={{ emptyText: t("notify.empty") }}
              dataSource={notifications.slice(0, 5)}
              renderItem={(item) => (
                <List.Item>
                  <Space direction="vertical" size={2}>
                    <Typography.Text>{item.title}</Typography.Text>
                    <Typography.Text type="secondary">{item.createdAt ?? ""}</Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          </NePanel>
        </Col>
      </Row>
    </NePage>
  );
}
