import { AdvancedDictPage } from "../../pages/advanced/dict";
import { AdvancedParamPage } from "../../pages/advanced/param";
import { AdvancedParamConfigPage } from "../../pages/advanced/param-config";
import { AdvancedConfigPage } from "../../pages/advanced/config";
import { AdvancedCachePage } from "../../pages/advanced/cache";
import type { RouteComponentLoaderMap } from "@nebula/core";

export const advancedRoutes: RouteComponentLoaderMap = {
  AdvancedDictPage: {
    loader: async () => ({ default: AdvancedDictPage }),
    meta: {
      nameKey: "platform.dictManagement.title",
      path: "/system/dict",
      icon: "BookOutlined",
      permission: "system:dict:view",
      sort: 900,
    },
  },
  AdvancedParamPage: {
    loader: async () => ({ default: AdvancedParamPage }),
    meta: {
      nameKey: "platform.systemParams.title",
      path: "/system/param",
      icon: "SettingOutlined",
      permission: "system:param:view",
      sort: 1000,
    },
  },
  AdvancedParamConfigPage: {
    loader: async () => ({ default: AdvancedParamConfigPage }),
    meta: {
      nameKey: "platform.paramConfig.title",
      path: "/system/param-config",
      icon: "ToolOutlined",
      permission: "system:param:view",
      sort: 1010,
    },
  },
  AdvancedConfigPage: {
    loader: async () => ({ default: AdvancedConfigPage }),
    meta: {
      nameKey: "platform.frontendSettings.title",
      path: "/system/config",
      icon: "ControlOutlined",
      permission: "system:config:view",
      sort: 1100,
    },
  },
  AdvancedCachePage: {
    loader: async () => ({ default: AdvancedCachePage }),
    meta: {
      nameKey: "platform.frontendCache.title",
      path: "/system/cache",
      icon: "DatabaseOutlined",
      permission: "system:cache:view",
      sort: 1400,
    },
  },
};