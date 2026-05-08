import { NotificationsRecordPage } from "../../pages/notifications/record";
import { NotificationsTemplatePage } from "../../pages/notifications/template";
import { NotificationsAnnouncementPage } from "../../pages/notifications/announcement";
import type { RouteComponentLoaderMap } from "@nebula/core";

export const notificationsRoutes: RouteComponentLoaderMap = {
  NotificationsRecordPage: {
    loader: async () => ({ default: NotificationsRecordPage }),
    meta: {
      nameKey: "platform.notifyRecordManagement.title",
      path: "/notify/record",
      icon: "BellOutlined",
      permission: "system:notify:view",
      sort: 600,
    },
  },
  NotificationsTemplatePage: {
    loader: async () => ({ default: NotificationsTemplatePage }),
    meta: {
      nameKey: "platform.notifyTemplateManagement.title",
      path: "/notify/template",
      icon: "FileTextOutlined",
      permission: "system:notify-template:view",
      sort: 700,
    },
  },
  NotificationsAnnouncementPage: {
    loader: async () => ({ default: NotificationsAnnouncementPage }),
    meta: {
      nameKey: "platform.notifications.title",
      path: "/notify/announcement",
      icon: "NotificationOutlined",
      permission: "system:announcement:view",
      sort: 800,
    },
  },
};