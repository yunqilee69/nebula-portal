import { Tabs, message } from "antd";
import { useI18n } from "@nebula/core";
import { NePage } from "@nebula/ui-web";
import { useEffect } from "react";
import { BasicInfoTab } from "./basic-info-tab";
import { OauthBindTab } from "./oauth-bind-tab";
import { LoginLogTab } from "./login-log-tab";
import { bindOAuth2Provider } from "../../../api/profile-api";

export function ProfilePage() {
  const { t } = useI18n();

  useEffect(() => {
    handleOAuthBindCallback();
  }, []);

  async function handleOAuthBindCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    const storedState = sessionStorage.getItem("oauth-bind-state");
    const storedProvider = sessionStorage.getItem("oauth-bind-provider");

    if (code && state && storedState && storedProvider) {
      window.history.replaceState({}, "", window.location.pathname);
      sessionStorage.removeItem("oauth-bind-state");
      sessionStorage.removeItem("oauth-bind-provider");

      if (state !== storedState) {
        message.error("绑定验证失败");
        return;
      }

      try {
        await bindOAuth2Provider({
          providerId: storedProvider,
          code,
          state,
        });
        message.success(t("user.oauth.bindSuccess"));
      } catch (error: unknown) {
        const err = error as { status?: number; message?: string };
        const errorCode = err.status;
        if (errorCode === 14004) {
          message.error(t("user.oauth.bindError.14004"));
        } else if (errorCode === 14005) {
          message.error(t("user.oauth.bindError.14005"));
        } else if (errorCode === 14006) {
          message.error(t("user.oauth.bindError.14006"));
        } else {
          message.error("绑定失败");
        }
      }
    }
  }

  const tabItems = [
    {
      key: "basic",
      label: t("user.profile.tab.basic"),
      children: <BasicInfoTab />,
    },
    {
      key: "oauth",
      label: t("user.profile.tab.oauth"),
      children: <OauthBindTab />,
    },
    {
      key: "loginLog",
      label: t("user.profile.tab.loginLog"),
      children: <LoginLogTab />,
    },
  ];

  return (
    <NePage>
      <h2 style={{ fontSize: 20, marginBottom: 24 }}>{t("user.profile.title")}</h2>
      <Tabs items={tabItems} />
    </NePage>
  );
}