import { Col, List, Row, Space, Statistic, Typography } from "antd";
import { getRegisteredModules, platformPageDefinitions, useI18n } from "@platform/core";
import { NeNavCards, NePage, NePanel, NeStatusTag } from "@platform/ui";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../modules/auth/auth-store";
import { useConfigStore } from "../modules/config/config-store";
import { useMenuStore } from "../modules/menu/menu-store";
import { useNotifyStore } from "../modules/notify/notify-store";

export function DashboardPage() {
  const { t } = useI18n();
  const session = useAuthStore((state) => state.session);
  const menus = useMenuStore((state) => state.menus);
  const configValues = useConfigStore((state) => state.values);
  const notifications = useNotifyStore((state) => state.items);
  const modules = useMemo(() => getRegisteredModules(), []);
  const navigate = useNavigate();
  const uploadSize = configValues.upload_max_size ?? "-";

  return (
    <NePage>
      <Row className="shell-metric-grid" gutter={[16, 16]}>
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
            <NeNavCards items={platformPageDefinitions.map((page) => ({ key: page.id, title: t(page.titleKey ?? "", page.title), description: t(page.descriptionKey ?? "", page.description), onClick: () => navigate(page.path) }))} />
          </NePanel>
        </Col>
        <Col span={24}>
          <NePanel title={t("dashboard.shellParams")}>
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
