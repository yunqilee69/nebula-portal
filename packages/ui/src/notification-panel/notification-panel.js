import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { BellOutlined } from "@ant-design/icons";
import { Badge, Button, Empty, Flex, List, Space, Tabs, Tag, Typography } from "antd";
import { useI18n } from "@nebula/core";
import { NeModal } from "@nebula/ui-web";
import { useMemo, useState } from "react";
import { useNotifyStore } from "@nebula/core";
import { useResourceStore } from "@nebula/core";
const PANEL_WIDTH = 760;
function belongsToAnnouncement(item) {
    return item.category === "announcement";
}
function belongsToNotification(item) {
    return !belongsToAnnouncement(item);
}
export function NotificationPanel({ onMarkRead }) {
    const [open, setOpen] = useState(false);
    const { t } = useI18n();
    const items = useNotifyStore((state) => state.items);
    const markRead = useNotifyStore((state) => state.markRead);
    const markReadMany = useNotifyStore((state) => state.markReadMany);
    const resource = useResourceStore((state) => state.resources.notifications);
    const categorizedItems = useMemo(() => ({
        notification: items.filter((item) => belongsToNotification(item)),
        announcement: items.filter((item) => belongsToAnnouncement(item)),
    }), [items]);
    const unreadCount = items.filter((item) => !item.read).length;
    const categoryUnreadCount = {
        notification: categorizedItems.notification.filter((item) => !item.read).length,
        announcement: categorizedItems.announcement.filter((item) => !item.read).length,
    };
    async function handleMarkRead(itemId) {
        if (onMarkRead) {
            await onMarkRead(itemId);
        }
        markRead(itemId);
    }
    async function handleMarkAllRead(category) {
        const pendingItems = items.filter((item) => !item.read && item.actionable !== false && (category === "announcement" ? belongsToAnnouncement(item) : belongsToNotification(item)));
        const results = await Promise.allSettled(pendingItems.map(async (item) => {
            if (onMarkRead) {
                await onMarkRead(item.id);
            }
            return item.id;
        }));
        const successIds = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
        if (successIds.length) {
            markReadMany(successIds);
        }
    }
    function renderList(category) {
        const dataSource = category === "announcement" ? categorizedItems.announcement : categorizedItems.notification;
        if (!dataSource.length) {
            return _jsx(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE, description: t(category === "announcement" ? "notify.announcementEmpty" : "notify.empty") });
        }
        return (_jsx(List, { dataSource: dataSource, className: "notification-panel__list", renderItem: (item) => (_jsx(List.Item, { className: "notification-panel__item", actions: item.read
                    ? undefined
                    : [
                        _jsx(Button, { type: "link", size: "small", onClick: async () => {
                                await handleMarkRead(item.id);
                            }, children: t("notify.markRead") }, `read-${item.id}`),
                    ], children: _jsx(List.Item.Meta, { title: _jsxs(Space, { size: 8, wrap: true, children: [_jsx(Typography.Text, { children: item.title }), !item.read ? _jsx(Tag, { color: "processing", children: t("notify.new") }) : null, item.type === "warning" ? _jsx(Tag, { color: "warning", children: t("notify.level.warning") }) : null, item.type === "error" ? _jsx(Tag, { color: "error", children: t("notify.level.error") }) : null, item.category === "unknown" ? _jsx(Tag, { children: t("notify.category.unknown") }) : null] }), description: _jsxs(Space, { direction: "vertical", size: 4, children: [item.content ? (_jsx(Typography.Paragraph, { className: "notification-panel__content", ellipsis: { rows: 2, expandable: false }, children: item.content })) : null, _jsx(Typography.Text, { type: "secondary", children: item.createdAt ?? "" })] }) }) })) }));
    }
    const content = (_jsxs("div", { className: "notification-panel", children: [resource.error ? _jsx(Typography.Paragraph, { type: "danger", children: resource.error }) : null, _jsx(Tabs, { className: "notification-panel__tabs", items: [
                    {
                        key: "notification",
                        label: t("notify.category.notification", undefined, { count: categoryUnreadCount.notification }),
                        children: (_jsxs(Space, { direction: "vertical", size: 12, style: { width: "100%" }, children: [_jsx(Flex, { justify: "flex-end", children: _jsx(Button, { type: "link", size: "small", disabled: categoryUnreadCount.notification === 0 || !categorizedItems.notification.some((item) => !item.read && item.actionable !== false), onClick: async () => {
                                            await handleMarkAllRead("notification");
                                        }, children: t("notifications.markAllRead") }) }), renderList("notification")] })),
                    },
                    {
                        key: "announcement",
                        label: t("notify.category.announcement", undefined, { count: categoryUnreadCount.announcement }),
                        children: (_jsxs(Space, { direction: "vertical", size: 12, style: { width: "100%" }, children: [_jsx(Flex, { justify: "flex-end", children: _jsx(Button, { type: "link", size: "small", disabled: categoryUnreadCount.announcement === 0 || !categorizedItems.announcement.some((item) => !item.read && item.actionable !== false), onClick: async () => {
                                            await handleMarkAllRead("announcement");
                                        }, children: t("notifications.markAllRead") }) }), renderList("announcement")] })),
                    },
                ] })] }));
    return (_jsxs(_Fragment, { children: [_jsx(Badge, { count: unreadCount, size: "small", children: _jsx(Button, { shape: "circle", icon: _jsx(BellOutlined, {}), className: "notification-panel__trigger", onClick: () => setOpen(true) }) }), _jsx(NeModal, { title: t("notify.panelTitle"), icon: _jsx(BellOutlined, {}), open: open, onClose: () => setOpen(false), width: PANEL_WIDTH, bodyHeight: 550, className: "notification-panel__modal", children: content })] }));
}
