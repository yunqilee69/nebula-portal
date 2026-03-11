import { BellOutlined } from "@ant-design/icons";
import { Badge, Button, Empty, List, Popover, Space, Tag, Typography } from "antd";
import { useI18n } from "@platform/core";
import { useState } from "react";
import { markNotificationRead } from "../../api/notify-api";
import { useNotifyStore } from "./notify-store";

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const items = useNotifyStore((state) => state.items);
  const unreadCount = items.filter((item) => !item.read).length;
  const markRead = useNotifyStore((state) => state.markRead);

  const content = items.length ? (
    <List
      dataSource={items}
      style={{ width: 320 }}
      renderItem={(item) => (
        <List.Item
          actions={
            item.read
              ? undefined
              : [
                  <Button
                    key={`read-${item.id}`}
                    type="link"
                    size="small"
                    onClick={async () => {
                      await markNotificationRead(item.id);
                      markRead(item.id);
                    }}
                  >
                    {t("notify.markRead")}
                  </Button>,
                ]
          }
        >
          <List.Item.Meta
            title={
              <Space>
                <Typography.Text>{item.title}</Typography.Text>
                {!item.read ? <Tag color="processing">{t("notify.new")}</Tag> : null}
              </Space>
            }
            description={item.createdAt ?? ""}
          />
        </List.Item>
      )}
    />
  ) : (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("notify.empty")} />
  );

  return (
    <Popover open={open} onOpenChange={setOpen} trigger="click" placement="bottomRight" content={content}>
      <Badge count={unreadCount} size="small">
        <Button shape="circle" icon={<BellOutlined />} />
      </Badge>
    </Popover>
  );
}
