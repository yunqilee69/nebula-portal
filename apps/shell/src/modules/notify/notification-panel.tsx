import { BellOutlined } from "@ant-design/icons";
import { Badge, Button, Empty, Flex, List, Space, Tabs, Tag, Typography } from "antd";
import type { NotificationItem } from "@platform/core";
import { useI18n } from "@platform/core";
import { NeModal } from "@platform/ui";
import { useMemo, useState } from "react";
import { markNotificationRead } from "../../api/notify-api";
import { useResourceStore } from "../runtime/resource-store";
import { useNotifyStore } from "./notify-store";

const PANEL_WIDTH = 760;

function belongsToAnnouncement(item: NotificationItem) {
  return item.category === "announcement";
}

function belongsToNotification(item: NotificationItem) {
  return !belongsToAnnouncement(item);
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const items = useNotifyStore((state) => state.items);
  const markRead = useNotifyStore((state) => state.markRead);
  const markReadMany = useNotifyStore((state) => state.markReadMany);
  const resource = useResourceStore((state) => state.resources.notifications);

  const categorizedItems = useMemo(
    () => ({
      notification: items.filter((item) => belongsToNotification(item)),
      announcement: items.filter((item) => belongsToAnnouncement(item)),
    }),
    [items],
  );

  const unreadCount = items.filter((item) => !item.read).length;
  const categoryUnreadCount = {
    notification: categorizedItems.notification.filter((item) => !item.read).length,
    announcement: categorizedItems.announcement.filter((item) => !item.read).length,
  };

  async function handleMarkRead(itemId: string) {
    await markNotificationRead(itemId);
    markRead(itemId);
  }

  async function handleMarkAllRead(category: NotificationItem["category"]) {
    const pendingItems = items.filter(
      (item) => !item.read && item.actionable !== false && (category === "announcement" ? belongsToAnnouncement(item) : belongsToNotification(item)),
    );

    const results = await Promise.allSettled(
      pendingItems.map(async (item) => {
        await markNotificationRead(item.id);
        return item.id;
      }),
    );

    const successIds = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
    if (successIds.length) {
      markReadMany(successIds);
    }
  }

  function renderList(category: NotificationItem["category"]) {
    const dataSource = category === "announcement" ? categorizedItems.announcement : categorizedItems.notification;

    if (!dataSource.length) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t(category === "announcement" ? "notify.announcementEmpty" : "notify.empty")} />;
    }

    return (
      <List
        dataSource={dataSource}
        className="notification-panel__list"
        renderItem={(item) => (
          <List.Item
            className="notification-panel__item"
            actions={
              item.read
                ? undefined
                : [
                    <Button
                      key={`read-${item.id}`}
                      type="link"
                      size="small"
                      onClick={async () => {
                        await handleMarkRead(item.id);
                      }}
                    >
                      {t("notify.markRead")}
                    </Button>,
                  ]
            }
          >
            <List.Item.Meta
              title={
                <Space size={8} wrap>
                  <Typography.Text>{item.title}</Typography.Text>
                  {!item.read ? <Tag color="processing">{t("notify.new")}</Tag> : null}
                  {item.type === "warning" ? <Tag color="warning">{t("notify.level.warning")}</Tag> : null}
                  {item.type === "error" ? <Tag color="error">{t("notify.level.error")}</Tag> : null}
                  {item.category === "unknown" ? <Tag>{t("notify.category.unknown")}</Tag> : null}
                </Space>
              }
              description={
                <Space direction="vertical" size={4}>
                  {item.content ? (
                    <Typography.Paragraph className="notification-panel__content" ellipsis={{ rows: 2, expandable: false }}>
                      {item.content}
                    </Typography.Paragraph>
                  ) : null}
                  <Typography.Text type="secondary">{item.createdAt ?? ""}</Typography.Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    );
  }

  const content = (
    <div className="notification-panel">
      {resource.error ? <Typography.Paragraph type="danger">{resource.error}</Typography.Paragraph> : null}
      <Tabs
        className="notification-panel__tabs"
        items={[
          {
            key: "notification",
            label: t("notify.category.notification", undefined, { count: categoryUnreadCount.notification }),
            children: (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Flex justify="flex-end">
                  <Button
                    type="link"
                    size="small"
                    disabled={categoryUnreadCount.notification === 0 || !categorizedItems.notification.some((item) => !item.read && item.actionable !== false)}
                    onClick={async () => {
                      await handleMarkAllRead("notification");
                    }}
                  >
                    {t("notifications.markAllRead")}
                  </Button>
                </Flex>
                {renderList("notification")}
              </Space>
            ),
          },
          {
            key: "announcement",
            label: t("notify.category.announcement", undefined, { count: categoryUnreadCount.announcement }),
            children: (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Flex justify="flex-end">
                  <Button
                    type="link"
                    size="small"
                    disabled={categoryUnreadCount.announcement === 0 || !categorizedItems.announcement.some((item) => !item.read && item.actionable !== false)}
                    onClick={async () => {
                      await handleMarkAllRead("announcement");
                    }}
                  >
                    {t("notifications.markAllRead")}
                  </Button>
                </Flex>
                {renderList("announcement")}
              </Space>
            ),
          },
        ]}
      />
    </div>
  );

  return (
    <>
      <Badge count={unreadCount} size="small">
        <Button shape="circle" icon={<BellOutlined />} className="notification-panel__trigger" onClick={() => setOpen(true)} />
      </Badge>
      <NeModal
        title={t("notify.panelTitle")}
        icon={<BellOutlined />}
        open={open}
        onClose={() => setOpen(false)}
        width={PANEL_WIDTH}
        bodyHeight={550}
        className="notification-panel__modal"
      >
        {content}
      </NeModal>
    </>
  );
}
