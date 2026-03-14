import { CheckOutlined } from "@ant-design/icons";
import { Button, Descriptions, Table, Tag, Typography } from "antd";
import type { NotificationItem } from "@platform/core";
import { NePermission, useI18n } from "@platform/core";
import { useEffect, useState } from "react";
import { fetchCurrentNotifications, markNotificationRead } from "../../../api/notify-api";
import { NeDetailDrawer, NePage, NeTablePanel } from "@platform/ui";
import { useNotifyStore } from "../../../modules/notify/notify-store";
import { useResourceStore } from "../../../modules/runtime/resource-store";

export function NotificationsPage() {
  const { t } = useI18n();
  const items = useNotifyStore((state) => state.items);
  const setItems = useNotifyStore((state) => state.setItems);
  const markRead = useNotifyStore((state) => state.markRead);
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const resource = useResourceStore((state) => state.resources.notifications);
  const start = useResourceStore((state) => state.start);
  const succeed = useResourceStore((state) => state.succeed);
  const fail = useResourceStore((state) => state.fail);

  async function loadNotifications() {
    start("notifications");
    try {
      const data = await fetchCurrentNotifications();
      setItems(data);
      succeed("notifications");
    } catch (error) {
      fail("notifications", error instanceof Error ? error.message : t("notifications.loadFailed"));
    }
  }

  useEffect(() => {
    loadNotifications().catch(() => undefined);
  }, []);

  return (
    <NePage>
      <NeTablePanel
        toolbar={
          <NePermission code="crm:customer:edit">
            <Button
              icon={<CheckOutlined />}
              onClick={async () => {
                await Promise.all(items.filter((item) => !item.read).map(async (item) => {
                  await markNotificationRead(item.id);
                  markRead(item.id);
                }));
              }}
            >
              {t("notifications.markAllRead")}
            </Button>
          </NePermission>
        }
        summary={t("common.recordCount", undefined, { count: items.length })}
      >
        {resource.error ? <Typography.Paragraph type="danger">{resource.error}</Typography.Paragraph> : null}
        <Table<NotificationItem>
          rowKey="id"
          loading={resource.loading}
          dataSource={items}
          pagination={false}
          onRow={(record) => ({ onClick: () => setSelected(record) })}
          columns={[
            {
              title: t("common.name"),
              dataIndex: "title",
            },
            {
              title: t("common.type"),
              render: (_: unknown, row: NotificationItem) => <Tag color={row.type === "error" ? "error" : row.type === "warning" ? "warning" : "processing"}>{row.type}</Tag>,
            },
            {
              title: t("common.createTime"),
              dataIndex: "createdAt",
              render: (value: string | undefined) => value ?? "-",
            },
            {
              title: t("common.status"),
              render: (_: unknown, row: NotificationItem) => row.read ? <Tag>{t("notifications.read")}</Tag> : <Tag color="processing">{t("notifications.unread")}</Tag>,
            },
            {
              title: t("common.actions"),
              render: (_: unknown, row: NotificationItem) =>
                row.read ? null : (
                  <NePermission code="crm:customer:edit">
                    <Button
                      type="link"
                      size="small"
                      onClick={async () => {
                        await markNotificationRead(row.id);
                        markRead(row.id);
                      }}
                    >
                      {t("notify.markRead")}
                    </Button>
                  </NePermission>
                ),
            },
          ]}
        />
      </NeTablePanel>
      <NeDetailDrawer title={t("notifications.detail")} open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t("common.name")}>{selected.title}</Descriptions.Item>
            <Descriptions.Item label={t("common.type")}>{selected.type}</Descriptions.Item>
            <Descriptions.Item label={t("common.status")}>{selected.read ? t("notifications.read") : t("notifications.unread")}</Descriptions.Item>
            <Descriptions.Item label={t("common.createTime")}>{selected.createdAt ?? "-"}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </NeDetailDrawer>
    </NePage>
  );
}
