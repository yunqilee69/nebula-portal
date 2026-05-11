import { Tabs } from "antd";
import { useI18n } from "@nebula/core";
import { NePage } from "@nebula/ui-web";
import { BasicInfoTab } from "./basic-info-tab";
import { OauthBindTab } from "./oauth-bind-tab";
import { LoginLogTab } from "./login-log-tab";

export function ProfilePage() {
  const { t } = useI18n();

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
