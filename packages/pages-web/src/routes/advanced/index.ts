import { AdvancedDictPage } from "../../pages/advanced/dict";
import { AdvancedDictItemsPage } from "../../pages/advanced/dict/items-page";
import { AdvancedParamPage } from "../../pages/advanced/param";
import { AdvancedConfigPage } from "../../pages/advanced/config";
import { AdvancedOAuth2ClientPage } from "../../pages/advanced/oauth2/client";
import { AdvancedOAuth2AccountPage } from "../../pages/advanced/oauth2/account";
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
  AdvancedDictItemsPage: {
    loader: async () => ({ default: AdvancedDictItemsPage }),
    meta: {
      nameKey: "dict.itemsManagementTitle",
      path: "/system/dict-items",
      icon: "UnorderedListOutlined",
      permission: "system:dict:view",
      sort: 910,
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
  AdvancedOAuth2ClientPage: {
    loader: async () => ({ default: AdvancedOAuth2ClientPage }),
    meta: {
      nameKey: "platform.oauth2ClientManagement.title",
      path: "/system/oauth2/client",
      icon: "ApiOutlined",
      permission: "system:oauth2-client:view",
      sort: 1200,
    },
  },
  AdvancedOAuth2AccountPage: {
    loader: async () => ({ default: AdvancedOAuth2AccountPage }),
    meta: {
      nameKey: "platform.oauth2AccountManagement.title",
      path: "/system/oauth2/account",
      icon: "LinkOutlined",
      permission: "system:oauth2-account:view",
      sort: 1300,
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