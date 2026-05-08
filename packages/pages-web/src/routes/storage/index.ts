import { StorageCenterPage } from "../../pages/storage/center";
import { StorageUploadTaskPage } from "../../pages/storage/upload-task";
import type { RouteComponentLoaderMap } from "@nebula/core";

export const storageRoutes: RouteComponentLoaderMap = {
  StorageCenterPage: {
    loader: async () => ({ default: StorageCenterPage }),
    meta: {
      nameKey: "platform.storage.title",
      path: "/storage/center",
      icon: "CloudOutlined",
      permission: "system:storage:view",
      sort: 1500,
    },
  },
  StorageUploadTaskPage: {
    loader: async () => ({ default: StorageUploadTaskPage }),
    meta: {
      nameKey: "storage.uploadPanel",
      path: "/storage/upload-task",
      icon: "UploadOutlined",
      permission: "system:storage:view",
      sort: 1510,
    },
  },
};